# ⚡ TaskFlow — Team Task Manager

A full-stack team collaboration tool with role-based access control, project management, task tracking, and a real-time dashboard.

[![Live Demo](https://img.shields.io/badge/Live-Demo-6366f1?style=for-the-badge)](https://your-app.railway.app)

---

## ✨ Features

- 🔐 **Authentication** — Secure signup/login with JWT tokens
- 👥 **Role-Based Access** — Global Admin/Member + per-project Admin/Member roles
- 📁 **Projects** — Create, update, delete projects; manage members
- ✅ **Tasks** — Create, assign, update status (Todo/In Progress/Done), set priority & due dates
- 📊 **Dashboard** — Stats overview (total, in-progress, done, overdue, mine)
- 📋 **Kanban Board** — Drag-free visual board per project
- 🔍 **Filters** — Filter tasks by status and priority

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcryptjs |
| Frontend | Vanilla HTML/CSS/JS |
| Deployment | Railway |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# 4. Run database migrations
npx prisma migrate deploy

# 5. Start the server
npm run dev
```

Open [http://localhost:5000](http://localhost:5000)

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project (Admin) |
| DELETE | `/api/projects/:id` | Delete project (Admin) |
| GET | `/api/projects/:id/members` | List members |
| POST | `/api/projects/:id/members` | Add member (Admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (Admin) |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks (filterable) |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (Admin) |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Get summary stats |

---

## 🔒 Role-Based Access

| Action | Global Admin | Project Admin | Member |
|---|---|---|---|
| Create Project | ✅ | ✅ | ✅ |
| Delete any Project | ✅ | ❌ | ❌ |
| Add/Remove Members | ✅ | ✅ | ❌ |
| Create Tasks | ✅ | ✅ | ✅ |
| Update any Task | ✅ | ✅ | ❌ |
| Update own Task status | ✅ | ✅ | ✅ |
| Delete Tasks | ✅ | ✅ | ❌ |

---

## 📦 Deployment on Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** plugin
4. Set environment variables:
   - `DATABASE_URL` — auto-set by Railway PostgreSQL plugin
   - `JWT_SECRET` — a long random string
   - `NODE_ENV` — `production`
5. Railway auto-runs: `npm run prisma:migrate && npm start`

---

## 📂 Project Structure

```
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # SQL migrations
├── src/
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth & guards
│   ├── routes/             # Express routes
│   └── index.js            # App entry point
├── public/
│   ├── index.html          # SPA shell
│   ├── css/style.css       # Premium dark UI
│   └── js/                 # Frontend logic
├── .env.example
├── railway.json
└── README.md
```

---

## 🎥 Demo

> 2–5 minute walkthrough video: [Watch on YouTube](#)

---

## 📄 License

MIT
