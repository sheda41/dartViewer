const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  // body 파싱
  const body = req.body || {};
  const { title = '', description = '', corp = '', date = '', link = '' } = body;

  if (!title) { res.status(400).json({ error: 'title required' }); return; }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  const prompt = `다음 뉴스를 JSON으로 요약하세요.
회사: ${corp}, 제목: ${title}, 내용: ${description}

JSON만 출력:
{"main_content":"핵심내용 3~5문장","implications":"시사점 2~3문장","terms":[{"term":"약어","explanation":"설명"}]}

terms는 영어약어/전문용어만, 없으면 빈배열.`;

  const payload = JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
      };

      const req2 = https.request(options, (res2) => {
        let data = '';
        res2.on('data', chunk => { data += chunk; });
        res2.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(new Error('파싱실패: ' + data.slice(0, 200))); }
        });
      });
      req2.on('error', reject);
      req2.write(payload);
      req2.end();
    });

    if (result.error) throw new Error(JSON.stringify(result.error));

    const text = result.content?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON없음: ' + text.slice(0, 200));

    res.status(200).json(JSON.parse(match[0]));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};