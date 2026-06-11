const https = require('https');
const zlib = require('zlib');

// ── 리다이렉트 따라가며 raw buffer 반환 ──
function fetchBuffer(urlStr, headers, redirects) {
  redirects = redirects || 0;
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('리다이렉트 초과'));
    const opts = {
      headers: headers || {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*',
      }
    };
    https.get(urlStr, opts, (res) => {
      if ([301,302,303,307].includes(res.statusCode) && res.headers.location) {
        let loc = res.headers.location;
        if (!loc.startsWith('http')) loc = 'https://opendart.fss.or.kr' + loc;
        if (loc === urlStr) return reject(new Error('리다이렉트 루프'));
        res.resume();
        return resolve(fetchBuffer(loc, headers, redirects + 1));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks), headers: res.headers }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── ZIP에서 첫 파일 추출 ──
function unzip(buffer) {
  let i = 0;
  while (i < buffer.length - 30) {
    if (buffer[i]===0x50 && buffer[i+1]===0x4b && buffer[i+2]===0x03 && buffer[i+3]===0x04) {
      const comp   = buffer.readUInt16LE(i + 8);
      const csz    = buffer.readUInt32LE(i + 18);
      const fnLen  = buffer.readUInt16LE(i + 26);
      const exLen  = buffer.readUInt16LE(i + 28);
      const start  = i + 30 + fnLen + exLen;
      const data   = buffer.slice(start, start + csz);
      if (comp === 0) return data.toString('utf-8');
      if (comp === 8) return zlib.inflateRawSync(data).toString('utf-8');
      throw new Error('미지원 압축: ' + comp);
    }
    i++;
  }
  throw new Error('ZIP 헤더 없음');
}

// ── XML 파싱 ──
function parseXml(xml) {
  const corps = [];
  const re = /<list>([\s\S]*?)<\/list>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const g = t => { const r = b.match(new RegExp('<'+t+'>([^<]*)</'+t+'>')); return r ? r[1].trim() : ''; };
    const corp_code = g('corp_code');
    if (corp_code) corps.push({ corp_code, corp_name: g('corp_name'), stock_code: g('stock_code') });
  }
  return corps;
}

// ── 서버 내 메모리 캐시 (재배포 전까지 유지) ──
let corpCache = null;
let corpCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6시간

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { endpoint, ...params } = req.query;
  if (!endpoint) { res.status(400).json({ error: 'endpoint required' }); return; }

  const KEY = '6674f9aa0d9358b2693ab0dd6131773721c26a63';

  // ── 기업 전체 목록 (corpCode.xml) ──
  if (endpoint === 'corpCode.xml') {
    try {
      const now = Date.now();
      if (corpCache && (now - corpCacheTime) < CACHE_TTL) {
        res.status(200).json({ status: '000', total_count: corpCache.length, list: corpCache });
        return;
      }
      const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${KEY}`;
      const { buffer, headers } = await fetchBuffer(url);
      const ct = headers['content-type'] || '';
      let list;
      if (ct.includes('zip') || ct.includes('octet') || buffer[0] === 0x50) {
        const xml = unzip(buffer);
        list = parseXml(xml);
      } else {
        // 혹시 JSON으로 오면
        list = JSON.parse(buffer.toString('utf-8')).list || [];
      }
      corpCache = list;
      corpCacheTime = now;
      res.status(200).json({ status: '000', total_count: list.length, list });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  // ── 일반 JSON API ──
  const qs = new URLSearchParams({ crtfc_key: KEY });
  for (const [k,v] of Object.entries(params)) if (v) qs.set(k, v);
  const dartUrl = 'https://opendart.fss.or.kr/api/' + endpoint + '?' + qs.toString();

  try {
    const { buffer } = await fetchBuffer(dartUrl);
    const body = buffer.toString('utf-8');
    const data = JSON.parse(body);
    if (data.status && data.status !== '000' && data.status !== '013') {
      res.status(400).json({ error: data.message || '조회 실패', dart_status: data.status });
      return;
    }
    if (data.status === '013') {
      res.status(200).json({ status: '000', list: [] });
      return;
    }
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};