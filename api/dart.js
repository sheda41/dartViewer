export default async function handler(req, res) {
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { endpoint, ...params } = req.query;
  if (!endpoint) { res.status(400).json({ error: 'endpoint required' }); return; }

  const DART_API_KEY = '6674f9aa0d9358b2693ab0dd6131773721c26a63';
  const base = 'https://opendart.fss.or.kr/api';

  const url = new URL(base + '/' + endpoint);
  url.searchParams.set('crtfc_key', DART_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  try {
    const dartRes = await fetch(url.toString());
    const contentType = dartRes.headers.get('content-type') || '';

    if (contentType.includes('application/zip') || contentType.includes('octet-stream')) {
      // ZIP 파일 (corpCode.xml)
      const buf = await dartRes.arrayBuffer();
      res.setHeader('Content-Type', 'application/zip');
      res.send(Buffer.from(buf));
    } else {
      const data = await dartRes.json();
      res.status(200).json(data);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}