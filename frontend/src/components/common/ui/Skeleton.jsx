import React from 'react';

// Base skeleton with optional explicit width/height for exact matching
export function Skeleton({ className = '', width, height, rounded = 'rounded' }) {
  const style = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };
  return <div className={`animate-pulse bg-white/10 ${rounded} ${className}`} style={style} />;
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-white/10 rounded h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = 64, className = '' }) {
  return (
    <div
      className={`animate-pulse bg-white/10 rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// Matches Albums track row layout exactly (grid-based)
export function TrackRowSkeleton() {
  return (
    <div className="grid grid-cols-12 items-center py-2 px-2 rounded-md glass-light animate-pulse">
      <div className="col-span-1 text-center">
        <div className="mx-auto h-5 w-5 bg-white/10 rounded" />
      </div>
      <div className="col-span-11 md:col-span-5 pl-2 md:pl-0 pr-2">
        <div className="h-4 w-11/12 bg-white/10 rounded" />
      </div>
      <div className="hidden md:block col-span-4">
        <div className="h-4 w-3/4 bg-white/10 rounded" />
      </div>
      <div className="hidden md:flex col-span-1 justify-center">
        <div className="h-4 w-10 bg-white/10 rounded" />
      </div>
      <div className="hidden md:flex col-span-1 justify-center">
        <div className="h-5 w-5 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}

// Matches Search page song row (flex-based card row)
export function SongRowSkeleton() {
  return (
    <div className="flex items-center mb-3 border border-muted p-2 rounded glass-light animate-pulse">
      <div className="w-12 h-12 flex-shrink-0 rounded bg-white/10" />
      <div className="ml-3 flex-grow min-w-0">
        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
      </div>
      <div className="ml-2 h-8 w-8 rounded-full bg-white/10" />
    </div>
  );
}

export function CardSkeleton({ aspect = 'square' }) {
  const heightClass = aspect === 'square' ? 'h-32 sm:h-40 md:h-48' : 'h-48';
  return (
    <div className="flex-shrink-0 w-32 sm:w-40 md:w-48">
      <div className={`w-full ${heightClass} bg-white/10 rounded-lg animate-pulse`} />
      <div className="mt-2 space-y-1">
        <div className="h-3 bg-white/10 rounded w-5/6" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
      </div>
    </div>
  );
}
