const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const n8n = require('../services/n8n');

router.post('/', async (req, res) => {
  try {
    const { name, email, project, budget, timeline, score } = req.body;
    if (!name || !email || !score) return res.status(400).json({ error: 'name, email, and score are required.' });

    const leadData = { name, email, project, budget, timeline, score, timestamp: new Date().toISOString() };
    const leadId = await supabase.saveLead(leadData);

    if (score === 'HOT') await n8n.triggerHotLead(leadData);
    else if (score === 'WARM') await n8n.triggerWarmLead(leadData);

    res.json({ success: true, leadId });
  } catch (err) {
    console.error('Lead route error:', err);
    res.status(500).json({ error: 'Failed to process lead.' });
  }
});

module.exports = router;
