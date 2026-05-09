const express = require('express');
const router  = express.Router();
const { Resend } = require('resend');

router.post('/', async (req, res) => {
  const { from_name, from_email, from_phone, subject, message } = req.body;

  if (!from_name || !from_email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(from_email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from:    'Portfolio Contact <onboarding@resend.dev>',
      to:      [process.env.GMAIL_USER],
      replyTo: from_email,
      subject: `[Portfolio] ${subject} — from ${from_name}`,
      html: `
        <h2 style="font-family:sans-serif;color:#1a1a1a">New message from your portfolio</h2>
        <table style="font-family:sans-serif;font-size:15px;border-collapse:collapse;width:100%;max-width:520px">
          <tr><td style="padding:8px 12px;font-weight:bold;color:#555;width:110px">Name</td><td style="padding:8px 12px">${from_name}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px 12px;font-weight:bold;color:#555">Email</td><td style="padding:8px 12px"><a href="mailto:${from_email}">${from_email}</a></td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;color:#555">Phone</td><td style="padding:8px 12px">${from_phone || 'Not provided'}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px 12px;font-weight:bold;color:#555">Topic</td><td style="padding:8px 12px">${subject}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;color:#555;vertical-align:top">Message</td><td style="padding:8px 12px;white-space:pre-wrap">${message}</td></tr>
        </table>
        <p style="font-family:sans-serif;font-size:13px;color:#888;margin-top:20px">Reply directly to this email to reach ${from_name}.</p>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({ error: 'Failed to send email. Please try again.', debug: err.message });
  }
});

module.exports = router;
