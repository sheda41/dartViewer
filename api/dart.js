const https = require('https');

function fetchRaw(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString('utf-8')
      }));
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
    const { status, headers, body } = await fetchRaw(dartUrl);

    // 진단용: 상태/헤더/본문 앞부분 노출
    if (status !== 200) {
      res.status(502).json({ error: 'DART HTTP ' + status, dartUrl, body: body.slice(0, 500) });
      return;
    }

    // JSON 파싱 시도
    try {
      const data = JSON.parse(body);
      res.status(200).json(data);
    } catch(e) {
      // 파싱 실패 시 원문 노출 (진단용)
      res.status(500).json({
        error: 'JSON 파싱 실패',
        contentType: headers['content-type'],
        bodyPreview: body.slice(0, 500),
        dartUrl
      });
    }
  } catch(e) {
    res.status(500).json({ error: e.message, dartUrl });
  }
};