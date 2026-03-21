# Desk 🖥️

> All-in-one team productivity platform — Tasks, Chat, HR & Analytics in one place.

![Desk Dashboard](./screenshots/dashboard.png)

## 🚀 Features

- 🔐 **Auth & RBAC** — JWT auth with 4 role levels
- 👥 **HR Module** — Employee management, leaves, attendance
- 📋 **Project & Task Management** — Kanban board with drag & drop
- 💬 **Real-time Chat** — Socket.io powered with edit & delete
- 🔔 **Notifications** — Real-time in-app notifications
- 📁 **File Manager** — Cloudinary powered file storage
- 📊 **Analytics** — Company-wide insights and charts

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| State | Redux Toolkit + RTK Query |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Real-time | Socket.io |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma |
| Auth | JWT + bcrypt |
| Files | Cloudinary |
| Package Manager | npm workspaces |

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm 9+

### Setup
```bash
# Clone the repo
git clone https://github.com/dip1905/desk.git
cd desk

# Install all dependencies
npm install

# Setup environment variables
cp server/.env.example server/.env
# Edit server/.env with your credentials

# Setup client env
echo "VITE_API_URL=http://localhost:5000/api" > client/.env
echo "VITE_SOCKET_URL=http://localhost:5000" >> client/.env

# Run database migrations
cd server
npx prisma migrate dev

# Seed the database
npm run seed

# Start both client and server from root
cd ..
npm run dev
```

## 🔑 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@desk.com | Admin@123 |
| Admin (HR) | hr@desk.com | Admin@123 |
| Manager | amit@desk.com | Admin@123 |
| Employee | priya@desk.com | Admin@123 |

> ⚠️ Change passwords after first login in production

## 📁 Project Structure
```
desk/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── store/
│       └── hooks/
├── server/          # Express backend
│   └── src/
│       ├── modules/
│       ├── middleware/
│       ├── config/
│       └── socket/
└── package.json     # Root (npm workspaces)
```

## 🗄️ Database Models

User, Employee, Leave, Attendance, Project, Task,
Comment, ActivityLog, Channel, Message,
Notification, FileStore

## 📄 License

MIT