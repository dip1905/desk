# Desk 🖥️

> All-in-one team productivity platform — Tasks, Chat, HR & Analytics in one place.

## Tech Stack
- **Frontend:** React + Vite, Redux Toolkit, Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL + Prisma ORM
- **Real-time:** Socket.io
- **Package Manager:** npm (workspaces)

## Modules
- 🔐 Auth & Role-Based Access Control
- 👥 HR & Employee Management
- 📋 Project & Task Management (Kanban)
- 💬 Team Chat (Real-time)
- 🔔 Notifications
- 📁 File Manager
- 📊 Analytics Dashboard

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm 9+

### Installation
```bash
# Clone the repo
git clone https://github.com/yourusername/desk.git
cd desk

# Install all dependencies
npm install

# Setup environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Run database migrations
cd server && npx prisma migrate dev

# Start both client and server
npm run dev
```

## Project Structure
```
desk/
├── client/          # React + Vite frontend
├── server/          # Express backend
└── package.json     # Root (npm workspaces)
```