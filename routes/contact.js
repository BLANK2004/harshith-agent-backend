const express  = require('express');
const router   = express.Router();
const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

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
    const transporter = getTransporter();
    await transporter.sendMail({
      from:     `"${from_name}" <${process.env.GMAIL_USER}>`,
      replyTo:  from_email,
      to:       process.env.GMAIL_USER,
      subject:  `[Portfolio] ${subject} — from ${from_name}`,
      text:
`New message from your portfolio website.

Name:    ${from_name}
Email:   ${from_email}
Phone:   ${from_phone || 'Not provided'}
Topic:   ${subject}

Message:
${message}

---
Reply directly to this email to respond.`
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({ error: 'Failed to send email. Please try again.', debug: err.message });
  }
});

module.exports = router;
