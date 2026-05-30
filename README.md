# 🤖 Smart Code Review Platform

An AI-powered code review CI/CD bot that automatically analyzes GitHub Pull Requests and posts detailed review comments.

🚀 **Live Demo:** https://smart-code-review-platform-kappa.vercel.app

---

## ✨ Features

- **GitHub App** — registers as a real GitHub App, listens to PR webhooks
- **AI Code Review** — analyzes PR diffs using Groq LLaMA 3.3 70B
- **PR Comments** — posts formatted review comments directly on PRs
- **Check Status** — shows pass/fail status on each PR
- **Redis + BullMQ** — async job queue with automatic retries
- **GitHub Action** — one-line workflow integration for any repo
- **Dashboard** — PR history, score trends, queue stats
- **Email Notifications** — review summary via Nodemailer
- **Slack Notifications** — instant alerts to your Slack channel
- **Docker** — fully containerized with Docker Compose
- **Dark/Light Mode** — polished React frontend

---

## 🏗️ Architecture
GitHub PR → Railway Backend → Redis Queue → Railway Worker
↓
Groq AI Analysis
↓
PR Comment + Check Status + Notifications

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Recharts, html2canvas |
| Backend | Node.js, Express |
| AI | Groq LLaMA 3.3 70B |
| Queue | Redis + BullMQ |
| Auth | GitHub App |
| Deploy | Railway (backend), Vercel (frontend) |
| CI/CD | GitHub Actions |
| Notifications | Nodemailer, Slack Webhooks |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop
- GitHub App credentials
- Groq API key

### Local Development

```bash
# Clone the repo
git clone https://github.com/mehulkumar06/smart-code-review-platform.git
cd smart-code-review-platform

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values

# Start with Docker Compose
docker-compose up --build

## 🔌 Install on Your Repo

[![Install App](https://img.shields.io/badge/Install-GitHub%20App-0d9488?style=for-the-badge&logo=github)](https://github.com/apps/YOUR-APP-SLUG/installations/new)

```

### Environment Variables

```env
GITHUB_APP_ID=
GITHUB_APP_NAME=
GITHUB_WEBHOOK_SECRET=
GITHUB_PRIVATE_KEY=
GITHUB_TOKEN=
GROQ_API_KEY=
REDIS_URL=
EMAIL_USER=
EMAIL_PASS=
EMAIL_TO=
SLACK_WEBHOOK_URL=
```

---

## 📊 Dashboard

The dashboard shows:
- Total PR reviews, pass rate, average score
- Queue status (waiting, active, completed, failed)
- Score trend chart over time
- Full PR review history table

---

## 🔧 GitHub Action Usage

Add to any repo's `.github/workflows/review.yml`:

```yaml
- uses: mehulkumar06/smart-code-review-platform@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    min-score: '60'
    fail-on-issues: 'true'
```

---

## 📁 Project Structure
smart-code-review-platform/
├── action/              # GitHub Action
├── backend/
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/      # API routes
│   │   └── services/    # Business logic
│   ├── Dockerfile
│   └── railway.toml
├── frontend/
│   └── src/
│       ├── App.js       # Main app
│       ├── Dashboard.js # Dashboard page
│       └── Login.js     # Login page
└── docker-compose.yml

---

## 👨‍💻 Built by

**Mehul Kumar** — [GitHub](https://github.com/mehulkumar06)

Then push:
bashgit add README.md
git commit -m "docs: update README with full project documentation"
git push origin main