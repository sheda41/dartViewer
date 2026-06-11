const https = require('https');

function fetchJson(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(Buffer.concat(chunks).toString('utf-8')) });
        } catch(e) { reject(new Error('JSON 파싱 실패: ' + e.message)); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { endpoint, ...params } = req.query;
  if (!endpoint) { res.status(400).json({ error: 'endpoint required' }); return; }

  const DART_KEY = '6674f9aa0d9358b2693ab0dd6131773721c26a63';
  const qs = new URLSearchParams({ crtfc_key: DART_KEY });
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const dartUrl = 'https://opendart.fss.or.kr/api/' + endpoint + '?' + qs.toString();

  try {
    const { status, data } = await fetchJson(dartUrl);
    if (status !== 200) { res.status(502).json({ error: 'DART ' + status }); return; }
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};