# 🇱🇷 FutureLib — Digital Transformation of Liberia

**National Digital Ecosystem Platform** — built for citizens, youth, startups, educators, businesses, and government agencies of Liberia.

---

## Overview

FutureLib is a unified government-orchestrated digital platform enabling Liberians to:
- 📚 **Learn** digital skills with government-certified courses
- 🚀 **Build** and register startups in the national innovation ecosystem
- 🏛️ **Access** government services digitally (licenses, permits, IDs, and more)
- 💼 **Find** jobs with AI-powered matching
- 💰 **Apply** for government grants and startup funding
- 🛡️ **Stay safe** with national cybersecurity resources

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python · FastAPI · Beanie ODM |
| **Database** | MongoDB |
| **Cache** | Redis |
| **Frontend** | React 18 · Redux Toolkit · React Router |
| **Auth** | JWT (access + refresh) · MFA (TOTP) |
| **Infrastructure** | Docker · Docker Compose |
| **AI** | OpenAI API (Phase 3) |

---

## Architecture

```
FutureLib/
├── backend/                  # FastAPI Python backend
│   └── app/
│       ├── main.py           # FastAPI entry point
│       ├── config.py         # Settings (pydantic-settings)
│       ├── database.py       # MongoDB + Beanie init
│       ├── models/           # Beanie document models
│       │   ├── user.py       # User model (5 roles)
│       │   ├── course.py     # Courses, Lessons, Enrollments
│       │   ├── startup.py    # Startups, Funding Applications
│       │   ├── government.py # Gov Services + Applications
│       │   ├── job.py        # Jobs + Applications
│       │   ├── grant.py      # Grants + Grant Applications
│       │   └── notification.py
│       ├── schemas/          # Pydantic request/response schemas
│       ├── routers/          # API route handlers
│       │   ├── auth.py       # Register, Login, MFA, Refresh
│       │   ├── users.py      # User profile management
│       │   ├── learning.py   # Courses, Enrollments, Reviews
│       │   ├── startups.py   # Startup registration + Funding
│       │   ├── government.py # Gov services + Applications
│       │   └── jobs.py       # Job listings + Applications
│       ├── middleware/        # JWT auth middleware
│       ├── services/          # Email service
│       └── utils/             # Security (JWT, hashing)
├── frontend/                  # React 18 SPA
│   └── src/
│       ├── App.js            # Routes
│       ├── store/            # Redux Toolkit store
│       ├── services/         # Axios API client
│       ├── components/       # Shared UI (Navbar, Footer)
│       └── pages/
│           ├── Landing.js
│           ├── auth/         # Login, Register, ForgotPassword
│           ├── dashboard/    # Citizen + Official dashboards
│           ├── learning/     # Course catalog + Course detail
│           ├── government/   # Services portal
│           ├── startups/     # Startup hub + Grants
│           └── jobs/         # Job marketplace
├── docker-compose.yml
└── .env.example
```

---

## Getting Started

### Prerequisites
- Docker + Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.12+ (for local backend dev)

### Quick Start with Docker

```bash
# 1. Clone and enter
git clone <repo-url> && cd FutureLib

# 2. Copy and configure env
cp .env.example backend/.env
# Edit backend/.env with your values

# 3. Start all services
docker compose up --build

# Access:
# Frontend  → http://localhost:3000
# Backend   → http://localhost:8000
# API Docs  → http://localhost:8000/api/docs
```

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000/api/v1 npm start
```

---

## User Roles

| Role | Access |
|------|--------|
| **Citizen** | Learn, apply for services, find jobs, apply for grants |
| **Startup Founder** | Register startups, apply for funding, post jobs |
| **Educator** | Create and publish courses |
| **Investor** | Browse startups (Phase 2) |
| **Government Official** | Review applications, manage services, verify startups |
| **Admin** | Full platform access |

---

## API Overview

All endpoints are prefixed with `/api/v1/`.

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/auth` | Register, login, MFA, token refresh |
| Users | `/users` | Profile management |
| Learning | `/learning` | Courses, enrollments, certificates |
| Startups | `/startups` | Startup registry, funding |
| Government | `/government` | Services, applications |
| Jobs | `/jobs` | Job listings, applications |

Interactive docs: **http://localhost:8000/api/docs**

---

## Implementation Phases

- ✅ **Phase 1 — Foundation:** Authentication, Learning Platform, Government Services, Startup Ecosystem, Job Marketplace
- 🔜 **Phase 2 — Economy:** Payments (Stripe), Investor portal, Advanced startup analytics
- 🔜 **Phase 3 — Advanced:** AI assistant, National analytics, Cybersecurity center, Infrastructure monitoring
- 🔜 **Phase 4 — Smart Nation:** Smart cities, IoT, Cross-border digital economy, National AI governance

---

## National Policies

The platform is designed to comply with:
- Data Protection Policy (Liberia)
- Cybersecurity National Policy
- AI Governance Framework
- Open Data Policy
- Anti-Corruption Controls
- Citizen Rights Framework

---

## Offline & Accessibility

- PWA manifest included for offline-capable mobile experience
- Designed for low-end devices (minimal JS bundle)
- Local language expansion planned (Liberian English + dialects)
- Voice navigation: Phase 3

---

*Built with 🤍 for the people of Liberia*
