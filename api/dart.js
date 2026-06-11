// CommonJS 방식 (Vercel 기본값)
const https = require('https');
const zlib = require('zlib');

function fetchBuffer(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks), headers: res.headers }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractZip(buffer) {
  let offset = 0;
  while (offset < buffer.length - 30) {
    if (buffer[offset]===0x50 && buffer[offset+1]===0x4b && buffer[offset+2]===0x03 && buffer[offset+3]===0x04) {
      const compression = buffer.readUInt16LE(offset + 8);
      const compSize    = buffer.readUInt32LE(offset + 18);
      const fnLen       = buffer.readUInt16LE(offset + 26);
      const exLen       = buffer.readUInt16LE(offset + 28);
      const dataStart   = offset + 30 + fnLen + exLen;
      const compressed  = buffer.slice(dataStart, dataStart + compSize);
      if (compression === 0) return compressed.toString('utf-8');
      if (compression === 8) return zlib.inflateRawSync(compressed).toString('utf-8');
      throw new Error('지원하지 않는 압축: ' + compression);
    }
    offset++;
  }
  throw new Error('ZIP 헤더 없음');
}

function parseCorpXml(xml) {
  const corps = [];
  const re = /<list>([\s\S]*?)<\/list>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const g = (t) => { const r = b.match(new RegExp('<'+t+'>([^<]*)<\/'+t+'>')); return r ? r[1].trim() : ''; };
    const corp_code = g('corp_code');
    if (corp_code) corps.push({ corp_code, corp_name: g('corp_name'), stock_code: g('stock_code') });
  }
  return corps;
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
    const { status, buffer, headers } = await fetchBuffer(dartUrl);
    if (status !== 200) { res.status(502).json({ error: 'DART ' + status, url: dartUrl }); return; }

    const ct = headers['content-type'] || '';
    const isZip = ct.includes('zip') || ct.includes('octet') || endpoint.includes('corpCode');

    if (isZip) {
      const xml  = extractZip(buffer);
      const list = parseCorpXml(xml);
      res.status(200).json({ status: '000', total_count: list.length, list });
    } else {
      res.status(200).json(JSON.parse(buffer.toString('utf-8')));
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};