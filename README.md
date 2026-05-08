# Harshith AI Agent — Full Stack Portfolio System

A production-grade AI-powered portfolio with a lead qualification chatbot, contact form, Supabase database, and n8n automation — all running for free.

---

## 🗂️ Project Structure

```
D:\harshith\
├── portfolio.html                        ← Your entire frontend (single file)
└── harshith-agent\
    ├── frontend\
    │   └── widget.js                     ← Chat widget (injected into portfolio.html)
    └── backend\
        ├── server.js                     ← Express entry point
        ├── .env                          ← Secret keys (never commit this)
        ├── .env.example                  ← Template for env vars
        ├── render.yaml                   ← Render deployment config
        ├── routes\
        │   ├── chat.js                   ← POST /api/chat — AI conversation
        │   ├── contact.js                ← POST /api/contact — contact form emails
        │   └── lead.js                   ← POST /api/lead — manual lead saving
        ├── services\
        │   ├── claude.js                 ← Groq AI client + lead detection
        │   ├── supabase.js               ← Database client (leads, conversations)
        │   └── n8n.js                    ← Webhook triggers for n8n workflows
        └── prompts\
            └── system-prompt.txt         ← AI personality + knowledge base
```

---

## 🧠 How It Works

### 1. Chat Widget
- A floating purple chat bubble appears on your portfolio (bottom-right)
- Built in `frontend/widget.js` — all CSS is inlined, no external files needed
- When a visitor opens it, the AI greets them and starts a conversation
- Widget sends messages to your backend at `POST /api/chat`

### 2. AI Lead Qualification
The AI has two jobs defined in `prompts/system-prompt.txt`:

**Job 1 — Qualify leads:**
- Asks visitors what project they have in mind
- Asks about timeline and budget
- Scores them internally: HOT / WARM / COLD
- Collects their name + email
- Outputs a hidden JSON block at the end of its message:
  ```
  LEAD_CAPTURED:{"type":"LEAD_CAPTURED","score":"HOT","name":"...","email":"..."}
  ```

**Job 2 — Answer FAQs:**
- Knows your services, pricing, projects, background
- Only answers from the knowledge base in the system prompt

### 3. Lead Detection (backend)
In `services/claude.js`:
- The AI response is scanned for `LEAD_CAPTURED:` prefix
- The JSON after it is extracted and parsed
- The visible message shown to the user has the JSON stripped out
- The lead data is passed back to the chat route

### 4. What Happens When a Lead is Captured
In `routes/chat.js`, after a lead is detected:
1. **Saved to Supabase** — stored in the `leads` table permanently
2. **Email sent to you** — via Gmail/nodemailer with name, email, project, budget, timeline, score
3. **n8n webhook triggered** — HOT leads → HOT workflow, WARM leads → WARM workflow

### 5. Contact Form
- The form in `portfolio.html` sends a `POST` to `/api/contact`
- `routes/contact.js` sends an email to your Gmail with all form fields
- Fields: Name, Email, Phone (optional), Topic, Message

---

## 🔌 Services Used

| Service | What it does | Free limit |
|---|---|---|
| **Groq** | Powers the AI (Llama 3.3-70b) | 14,400 req/day |
| **Supabase** | Stores leads + conversations | 500MB, pauses after 7 days inactivity |
| **n8n Cloud** | HOT/WARM lead automation workflows | 1,000 executions/month |
| **Netlify** | Hosts the portfolio frontend | 100GB bandwidth/month |
| **Render** | Hosts the Node.js backend | 750 hrs/month, sleeps after 15 min |
| **Gmail SMTP** | Sends contact + lead emails | Free at portfolio scale |

---

## 🗄️ Database Tables (Supabase)

### `leads`
| Column | Type | Description |
|---|---|---|
| id | uuid | Auto-generated primary key |
| name | text | Lead's name |
| email | text | Lead's email |
| project | text | What they want to build |
| budget | text | Their budget range |
| timeline | text | Their timeline |
| score | text | HOT / WARM / COLD |
| created_at | timestamptz | When they were captured |

### `conversations`
| Column | Type | Description |
|---|---|---|
| id | uuid | Auto-generated primary key |
| session_id | text | Unique ID per browser session |
| role | text | "user" or "assistant" |
| content | text | Message content |
| lead_id | uuid | Links to leads table if a lead was captured |
| created_at | timestamptz | Message timestamp |

### `escalations`
Stores messages where the AI didn't know the answer and asked for the visitor's email.

---

## 🔁 n8n Workflows

### HOT Lead Notifier
- **Webhook URL:** `https://blankuser.app.n8n.cloud/webhook/hot-lead`
- **Triggered when:** A HOT lead is captured (clear project + budget + short timeline)
- **Flow:** Webhook → Format lead data → Send email via SMTP

### WARM Lead Notifier
- **Webhook URL:** `https://blankuser.app.n8n.cloud/webhook/warm-lead`
- **Triggered when:** A WARM lead is captured (interested but vague on details)
- **Flow:** Webhook → Format lead data → Send email via SMTP

---

## 🌍 Live URLs

| | URL |
|---|---|
| Portfolio | https://harshithbhosale.netlify.app |
| Backend API | https://harshith-agent-backend.onrender.com |
| Backend health check | https://harshith-agent-backend.onrender.com/health |
| GitHub (backend) | https://github.com/BLANK2004/harshith-agent-backend |
| Supabase dashboard | https://supabase.com/dashboard/project/rmlfqrpjycxdnkholnmb |
| n8n dashboard | https://blankuser.app.n8n.cloud |

---

## 🔐 Environment Variables (.env)

```env
# AI
GROQ_API_KEY=...              # From console.groq.com
GROQ_MODEL=llama-3.3-70b-versatile

# Server
PORT=3001
NODE_ENV=development
ALLOWED_ORIGIN=https://harshithbhosale.netlify.app

# Email
GMAIL_USER=harshithbhosale2004@gmail.com
GMAIL_APP_PASSWORD=...        # Gmail App Password (not your real password)

# Supabase
SUPABASE_URL=https://rmlfqrpjycxdnkholnmb.supabase.co
SUPABASE_KEY=...              # Anon key from Supabase dashboard

# n8n
N8N_HOT_LEAD_WEBHOOK=https://blankuser.app.n8n.cloud/webhook/hot-lead
N8N_WARM_LEAD_WEBHOOK=https://blankuser.app.n8n.cloud/webhook/warm-lead
```

---

## 🚀 Running Locally

```bash
cd D:\harshith\harshith-agent\backend
node server.js
```

Backend runs on `http://localhost:3001`

Open `D:\harshith\portfolio.html` in your browser — the chat widget and contact form will talk to localhost.

---

## 🔄 Deploying Updates

### Update the portfolio (frontend):
```bash
cd D:\harshith\netlify-deploy
# Copy updated portfolio.html as index.html
copy ..\portfolio.html index.html
netlify deploy --dir . --site 634b7a7b-5e3b-4e43-aa2b-bccbc387f303 --prod --auth YOUR_NETLIFY_TOKEN
```

### Update the backend:
```bash
cd D:\harshith\harshith-agent\backend
git add .
git commit -m "your change"
git push
# Render auto-deploys on every push to main
```

---

## 📬 How to Check Your Leads

1. **Email** — you get an email the moment someone is qualified
2. **Supabase** → [Table Editor](https://supabase.com/dashboard/project/rmlfqrpjycxdnkholnmb) → `leads` table
3. **n8n** → [Executions](https://blankuser.app.n8n.cloud) → see every webhook that fired

---

## ⚠️ Things to Watch

- **Supabase** pauses after 7 days of no traffic — log in weekly or it'll auto-resume on next visit
- **Render** sleeps after 15 min of inactivity — first visitor after idle gets a ~30s delay
- **is-a.dev domain** (harshithbhosale.is-a.dev) — PR #37780 is pending maintainer approval
- When approved, update `ALLOWED_ORIGIN` in Render env vars to include the new domain
