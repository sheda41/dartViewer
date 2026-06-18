const https = require('https');

function postJson(urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = https.request(urlStr, opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8'))); }
        catch(e) { reject(new Error('파싱 실패')); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Vercel body 파싱 헬퍼
function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) { resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body); return; }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8'))); }
      catch(e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  let body;
  try { body = await parseBody(req); } catch(e) { res.status(400).json({ error: 'body 파싱 실패' }); return; }

  const { title, description, corp, date, link } = body;
  if (!title) { res.status(400).json({ error: 'title required' }); return; }

  const ANTHROPIC_KEY = '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';

  const prompt = `다음 뉴스 기사를 분석해서 사내 보고서 형식으로 요약해주세요.

회사명: ${corp}
기사 제목: ${title}
기사 요약: ${description}
날짜: ${date}

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "main_content": "기사의 핵심 내용을 3~5문장으로 요약. 육하원칙 기반으로 명확하게.",
  "implications": "이 뉴스가 ${corp} 및 업계에 미치는 시사점 2~3문장.",
  "terms": [
    {"term": "약어 또는 어려운 단어", "explanation": "풀네임 또는 쉬운 설명"}
  ]
}

terms는 기사에 등장하는 영어 약어, 전문용어만 포함하고 없으면 빈 배열로.`;

  try {
    const data = await postJson('https://api.anthropic.com/v1/messages', {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    }, {
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    if (data.error) throw new Error(data.error.message || 'Anthropic 오류');
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('응답 파싱 실패: ' + text.slice(0, 100));

    const result = JSON.parse(jsonMatch[0]);
    res.status(200).json(result);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};

  const ANTHROPIC_KEY = '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';

  const prompt = `다음 뉴스 기사를 분석해서 사내 보고서 형식으로 요약해주세요.

회사명: ${corp}
기사 제목: ${title}
기사 요약: ${description}
날짜: ${date}

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "main_content": "기사의 핵심 내용을 3~5문장으로 요약. 육하원칙 기반으로 명확하게.",
  "implications": "이 뉴스가 ${corp} 및 업계에 미치는 시사점 2~3문장.",
  "terms": [
    {"term": "약어 또는 어려운 단어", "explanation": "풀네임 또는 쉬운 설명"},
    {"term": "약어 또는 어려운 단어", "explanation": "풀네임 또는 쉬운 설명"}
  ]
}

terms는 기사에 등장하는 영어 약어, 전문용어만 포함하고 없으면 빈 배열로.`;

  try {
    const data = await postJson('https://api.anthropic.com/v1/messages', {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    }, {
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('응답 파싱 실패');

    const result = JSON.parse(jsonMatch[0]);
    res.status(200).json(result);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};