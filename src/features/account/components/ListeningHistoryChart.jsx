import React, { useEffect, useMemo, useState } from 'react';
import { spotifyService } from '../../../services/spotifyServices';

function formatDateLabel(date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`; // MM/DD
}

export default function ListeningHistoryChart() {
  const [dataPoints, setDataPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ranges = useMemo(() => ([
    { label: 'Week', days: 7 },
    { label: 'Past 2 Weeks', days: 14 },
    { label: 'Month', days: 30 },
  ]), []);
  const [selectedRangeDays, setSelectedRangeDays] = useState(14);

  useEffect(() => {
    const fetchHistory = async (daysRange) => {
      try {
        setLoading(true);
        setError(null);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const afterMs = now.getTime() - (daysRange * 24 * 60 * 60 * 1000);

        // Fetch initial window using 'after'
        let allItems = [];
        let params = { limit: 50, after: afterMs };
        const res = await spotifyService.apiRequest('/me/player/recently-played', { params });
        const initialItems = res?.items || [];
        allItems = initialItems.slice();

        // If we need more coverage (especially for month), page backwards using 'before'
        let loops = 0;
        while (allItems.length && loops < 3) { // cap to avoid rate limits
          const lastPlayed = allItems[allItems.length - 1]?.played_at;
          if (!lastPlayed) break;
          const lastMs = new Date(lastPlayed).getTime();
          if (lastMs <= afterMs) break; // we've covered the range

          const nextRes = await spotifyService.apiRequest('/me/player/recently-played', {
            params: { limit: 50, before: lastMs }
          });
          const nextItems = nextRes?.items || [];
          if (!nextItems.length) break;
          allItems = allItems.concat(nextItems);
          loops += 1;
        }

        // Collect unique track IDs for audio features
        const trackIds = Array.from(new Set(allItems
          .map(i => i?.track?.id)
          .filter(Boolean)));

        // Fetch audio features in batches (max 100 per request)
        const featuresById = new Map();
        for (let i = 0; i < trackIds.length; i += 100) {
          const batch = trackIds.slice(i, i + 100);
          try {
            const batchRes = await spotifyService.getMultipleAudioFeatures(batch);
            const feats = batchRes?.audio_features || batchRes?.audioFeatures || batchRes; // handle possible shapes
            (feats || []).forEach(f => {
              if (f && f.id) featuresById.set(f.id, f);
            });
          } catch (e) {
            // Skip batch on error to avoid breaking the whole chart
            console.warn('Audio features batch failed', e);
          }
        }

        // Compute mood index per play and bucket average per day
        const sums = new Map();
        const counts = new Map();
        allItems.forEach(item => {
          const trackId = item?.track?.id;
          const f = trackId ? featuresById.get(trackId) : null;
          // Mood Index: average of valence & energy (0..1). Fallback to valence.
          const valence = f?.valence;
          const energy = f?.energy;
          const moodIndex = (typeof valence === 'number' && typeof energy === 'number')
            ? (valence + energy) / 2
            : (typeof valence === 'number' ? valence : null);
          if (moodIndex == null) return;

          const day = new Date(item.played_at);
          day.setHours(0, 0, 0, 0);
          const key = day.toISOString();
          sums.set(key, (sums.get(key) || 0) + moodIndex);
          counts.set(key, (counts.get(key) || 0) + 1);
        });

        // Build range array based on selectedRangeDays
        const days = [];
        for (let i = daysRange - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = d.toISOString();
          const sum = sums.get(key) || 0;
          const cnt = counts.get(key) || 0;
          const avgMood = cnt > 0 ? sum / cnt : 0;
          days.push({ date: key, value: avgMood });
        }

        setDataPoints(days);
      } catch (e) {
        setError(e?.message || 'Failed to load listening history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory(selectedRangeDays);
  }, [selectedRangeDays]);

  const chart = useMemo(() => {
    if (!dataPoints.length) return null;

    const width = 800; // intrinsic SVG width
    const height = 240;
    const padding = { left: 40, right: 16, top: 16, bottom: 40 };

    const xCount = dataPoints.length;
    const xStep = (width - padding.left - padding.right) / Math.max(1, xCount - 1);
    const maxY = 1; // mood index range 0..1

    const yScale = (value) => {
      const range = height - padding.top - padding.bottom;
      // invert for SVG (y=0 at top)
      return padding.top + (range * (1 - value / maxY));
    };

    const points = dataPoints.map((d, i) => ({
      x: padding.left + i * xStep,
      y: yScale(d.value),
      label: formatDateLabel(d.date),
      value: d.value,
    }));

    // Build a smoothed cubic Bezier path
    let path = '';
    points.forEach((p, i) => {
      if (i === 0) {
        path += `M ${p.x} ${p.y}`;
      } else {
        const prev = points[i - 1];
        const dx = (p.x - prev.x) / 2;
        const cp1x = prev.x + dx;
        const cp1y = prev.y;
        const cp2x = p.x - dx;
        const cp2y = p.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
      }
    });

    // X axis labels: show every third to avoid clutter
    const labelStep = selectedRangeDays <= 7 ? 1 : (selectedRangeDays <= 14 ? 2 : 5);
    const xLabels = points.map((p, i) => (
      <text key={i} x={p.x} y={height - padding.bottom + 20} className="text-[10px] fill-muted" textAnchor="middle">
        {i % labelStep === 0 ? p.label : ''}
      </text>
    ));

    // Y axis labels: 0 .. maxY
    const yTicks = [];
    const tickValues = [0, 0.25, 0.5, 0.75, 1];
    tickValues.forEach((val, i) => {
      const y = yScale(val);
      yTicks.push(
        <g key={i}>
          <line x1={padding.left - 4} x2={width - padding.right} y1={y} y2={y} className="stroke-primary-light/40" />
          <text x={padding.left - 8} y={y + 3} className="text-[10px] fill-muted" textAnchor="end">{val.toFixed(2)}</text>
        </g>
      );
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
        {/* Axes */}
        <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} className="stroke-primary-light" />
        <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} className="stroke-primary-light" />

        {/* Grid + Y labels */}
        {yTicks}

        {/* Line path */}
        <path d={path} className="stroke-accent fill-none" strokeWidth="2" />

        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} className="fill-accent" />
        ))}

        {/* X labels */}
        {xLabels}
      </svg>
    );
  }, [dataPoints]);

  if (loading) {
    return (
      <div className="glass border border-white/10 rounded-xl p-6 flex items-center justify-center shadow-lg">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-muted">Loading listening history…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/30 rounded-xl p-4">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-primary/30 border border-primary-light/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Your Mood Trend</h3>
        <div className="flex items-center gap-2">
          {ranges.map(r => (
            <button
              key={r.days}
              onClick={() => setSelectedRangeDays(r.days)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
                selectedRangeDays === r.days
                  ? 'bg-accent text-primary border-accent'
                  : 'bg-primary-light/40 text-muted border-primary-light hover:bg-primary-light/60'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted mb-2">Average mood index (valence & energy) · {selectedRangeDays} days</p>
      {chart}
    </div>
  );
}
