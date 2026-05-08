const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

let _client = null;
function getClient() {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
}

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '../prompts/system-prompt.txt'),
  'utf-8'
);

const LEAD_PREFIX = 'LEAD_CAPTURED:';

function extractLead(text) {
  const idx = text.indexOf(LEAD_PREFIX);
  if (idx === -1) return null;
  try {
    const jsonStr = text.slice(idx + LEAD_PREFIX.length).trim();
    const lead = JSON.parse(jsonStr);
    if (lead.type === 'LEAD_CAPTURED') return lead;
  } catch (_) {}
  return null;
}

function cleanResponse(text) {
  const idx = text.indexOf(LEAD_PREFIX);
  return idx === -1 ? text : text.slice(0, idx).trim();
}

async function chat(messages) {
  const response = await getClient().chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    max_tokens: 600,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ]
  });

  const raw = response.choices[0].message.content;
  const lead = extractLead(raw);
  const text = cleanResponse(raw);

  return { text, lead };
}

module.exports = { chat };
