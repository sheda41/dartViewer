import zlib from 'zlib';
import { promisify } from 'util';

const inflate = promisify(zlib.inflateRaw);

// ZIP 파일에서 첫 번째 파일 추출 (Node 내장, 의존성 없음)
async function extractFirstFileFromZip(buffer) {
  const buf = Buffer.from(buffer);
  let offset = 0;

  while (offset < buf.length - 4) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break; // Local file header signature

    const compression = buf.readUInt16LE(offset + 8);
    const compressedSize = buf.readUInt32LE(offset + 18);
    const fileNameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const dataOffset = offset + 30 + fileNameLen + extraLen;

    const compressed = buf.slice(dataOffset, dataOffset + compressedSize);

    if (compression === 0) {
      return compressed.toString('utf-8');
    } else if (compression === 8) {
      const decompressed = await inflate(compressed);
      return decompressed.toString('utf-8');
    }
    offset = dataOffset + compressedSize;
  }
  throw new Error('ZIP 파일 파싱 실패');
}

// XML에서 기업 목록 파싱
function parseCorpXml(xml) {
  const corps = [];
  const regex = /<list>([\s\S]*?)<\/list>/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    const block = m[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}>([^<]*)<\\/${tag}>`);
      const match = r.exec(block);
      return match ? match[1].trim() : '';
    };
    const corp_code = get('corp_code');
    const corp_name = get('corp_name');
    const stock_code = get('stock_code');
    if (corp_code) corps.push({ corp_code, corp_name, stock_code });
  }
  return corps;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { endpoint, ...params } = req.query;
  if (!endpoint) { res.status(400).json({ error: 'endpoint required' }); return; }

  const DART_KEY = '6674f9aa0d9358b2693ab0dd6131773721c26a63';
  const url = new URL('https://opendart.fss.or.kr/api/' + endpoint);
  url.searchParams.set('crtfc_key', DART_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  try {
    const dartRes = await fetch(url.toString());
    if (!dartRes.ok) {
      res.status(dartRes.status).json({ error: 'DART 오류: ' + dartRes.status });
      return;
    }

    const contentType = dartRes.headers.get('content-type') || '';
    const isZip = contentType.includes('zip') || contentType.includes('octet-stream') || endpoint.includes('corpCode');

    if (isZip) {
      const arrayBuf = await dartRes.arrayBuffer();
      const xml = await extractFirstFileFromZip(arrayBuf);
      const list = parseCorpXml(xml);
      res.status(200).json({ status: '000', total_count: list.length, list });
    } else {
      const data = await dartRes.json();
      res.status(200).json(data);
    }
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}