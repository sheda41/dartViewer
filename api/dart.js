const https = require('https');

function fetchJson(urlStr, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) { reject(new Error('리다이렉트 초과')); return; }
    https.get(urlStr, (res) => {
      // 302/301 리다이렉트 처리
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303) && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : 'https://opendart.fss.or.kr' + res.headers.location;
        resolve(fetchJson(next, redirectCount + 1));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch(e) { reject(new Error('JSON 파싱 실패: ' + body.slice(0, 200))); }
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
    const { data } = await fetchJson(dartUrl);
    if (data.status && data.status !== '000') {
      res.status(400).json({ error: data.message || '조회 실패', dart_status: data.status });
      return;
    }
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};