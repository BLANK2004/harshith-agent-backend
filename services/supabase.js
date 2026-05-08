const { createClient } = require('@supabase/supabase-js');

let db = null;

function getClient() {
  if (!db) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) return null;
    db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  }
  return db;
}

async function logMessage(sessionId, role, content, leadId = null) {
  const client = getClient();
  if (!client) return;
  try {
    await client.from('conversations').insert({ session_id: sessionId, role, content, lead_id: leadId });
  } catch (err) {
    console.error('Supabase logMessage error:', err.message);
  }
}

async function saveLead(leadData) {
  const client = getClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('leads')
      .insert({
        name: leadData.name,
        email: leadData.email,
        project: leadData.project,
        budget: leadData.budget,
        timeline: leadData.timeline,
        score: leadData.score
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('Supabase saveLead error:', err.message);
    return null;
  }
}

async function logEscalation(sessionId, question, visitorEmail = null) {
  const client = getClient();
  if (!client) return;
  try {
    await client.from('escalations').insert({ session_id: sessionId, question, visitor_email: visitorEmail });
  } catch (err) {
    console.error('Supabase logEscalation error:', err.message);
  }
}

module.exports = { logMessage, saveLead, logEscalation };
