const isValidDeezerUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'api.deezer.com';
  } catch {
    return false;
  }
};

export default async function handler(req, res) {
  const url = req.query?.url;

  if (!url || !isValidDeezerUrl(url)) {
    res.status(400).json({ error: 'Invalid Deezer URL' });
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const text = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).send(text || '{}');
  } catch {
    res.status(500).json({ error: 'Deezer proxy failed' });
  }
}
