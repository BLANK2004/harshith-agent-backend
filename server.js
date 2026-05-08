require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const chatRoutes    = require('./routes/chat');
const leadRoutes    = require('./routes/lead');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    process.env.ALLOWED_ORIGIN || 'https://harshithbhosale.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'null' // for local file:// testing
  ],
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => req.headers['x-session-id'] || req.ip,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/chat', limiter);

app.use('/api/chat', chatRoutes);
app.use('/api/lead', leadRoutes);
app.use('/api/contact', contactRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Harshith Agent backend running on port ${PORT}`);
});
