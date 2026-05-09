const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Resend } = require('resend');
const claude = require('../services/claude');
const supabase = require('../services/supabase');
const n8n = require('../services/n8n');

async function emailLeadAlert(lead) {
  if (!process.env.RESEND_API_KEY || !process.env.GMAIL_USER) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const scoreEmoji = lead.score === 'HOT' ? '🔥' : lead.score === 'WARM' ? '🌡️' : '❄️';
    const scoreColor = lead.score === 'HOT' ? '#e53e3e' : lead.score === 'WARM' ? '#d97706' : '#3182ce';
    await resend.emails.send({
      from:    'Harshith Agent <onboarding@resend.dev>',
      to:      [process.env.GMAIL_USER],
      replyTo: lead.email,
      subject: `${scoreEmoji} ${lead.score} LEAD: ${lead.name} — ${lead.project}`,
      html: `
        <h2 style="color:${scoreColor}">${scoreEmoji} ${lead.score} Lead from Portfolio Chat</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:6px 12px;font-weight:bold">Name</td><td style="padding:6px 12px">${lead.name}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold">Email</td><td style="padding:6px 12px"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold">Project</td><td style="padding:6px 12px">${lead.project}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold">Budget</td><td style="padding:6px 12px">${lead.budget}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold">Timeline</td><td style="padding:6px 12px">${lead.timeline}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold">Score</td><td style="padding:6px 12px;color:${scoreColor}"><strong>${lead.score} ${scoreEmoji}</strong></td></tr>
        </table>
        <br><p style="font-family:sans-serif">Reply directly to this email to reach ${lead.name}.</p>
      `
    });
  } catch (err) {
    console.error('Lead email alert error:', err.message);
  }
}

function sanitize(str) {
  return String(str || '').replace(/<[^>]*>/g, '').trim().slice(0, 2000);
}

router.post('/', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || uuidv4();
    const userMessage = sanitize(req.body.message);
    const rawHistory = Array.isArray(req.body.history) ? req.body.history : [];

    if (!userMessage) return res.status(400).json({ error: 'Message is required.' });

    const messages = [
      ...rawHistory.slice(-20).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: sanitize(m.content)
      })),
      { role: 'user', content: userMessage }
    ];

    await supabase.logMessage(sessionId, 'user', userMessage);

    const { text, lead } = await claude.chat(messages);

    await supabase.logMessage(sessionId, 'assistant', text);

    let leadId = null;
    if (lead) {
      lead.timestamp = new Date().toISOString();
      leadId = await supabase.saveLead(lead);
      await emailLeadAlert(lead);
      if (lead.score === 'HOT') await n8n.triggerHotLead(lead);
      else if (lead.score === 'WARM') await n8n.triggerWarmLead(lead);
    }

    res.json({ response: text, leadDetected: !!lead, leadData: lead || null, sessionId });
  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
