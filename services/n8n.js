async function post(url, data) {
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error(`n8n webhook failed (${url}):`, err.message);
  }
}

async function triggerHotLead(leadData) {
  await post(process.env.N8N_HOT_LEAD_WEBHOOK, leadData);
}

async function triggerWarmLead(leadData) {
  await post(process.env.N8N_WARM_LEAD_WEBHOOK, leadData);
}

async function triggerSupportEscalation(data) {
  await post(process.env.N8N_SUPPORT_ESCALATION_WEBHOOK, data);
}

module.exports = { triggerHotLead, triggerWarmLead, triggerSupportEscalation };
