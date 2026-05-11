# Notes App

A minimalist, modern full-stack notes application built with **React + Vite**, **Node.js + Express**, and **MongoDB**.

---

## Project Structure

```
notes-app/
├── backend/          ← Express + MongoDB API
│   ├── src/
│   │   ├── index.js          ← entry point
│   │   ├── notes.routes.js   ← CRUD routes
│   │   └── note.model.js     ← Mongoose model
│   ├── .env                  ← your local env vars
│   ├── .env.example          ← template
│   └── package.json
│
└── frontend/         ← React + Vite SPA
    ├── src/
    │   ├── api/notes.js      ← API service layer (reads VITE_API_BASE_URL)
    │   ├── App.jsx            ← full UI
    │   ├── main.jsx
    │   └── index.css
    ├── .env                  ← your local env vars
    ├── .env.example          ← template
    ├── vite.config.js
    └── package.json
```

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install

# Copy and edit the .env
cp .env.example .env

npm run dev          # http://localhost:5000
```

**Backend `.env`**
```
MONGODB_URI=mongodb://localhost:27017/notesapp
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

### 2. Frontend

```bash
cd frontend
npm install

# Copy and edit the .env
cp .env.example .env

npm run dev          # http://localhost:5173
```

**Frontend `.env`**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Hosting / Production

### Backend (e.g. Railway, Render, Fly.io)
Set these environment variables on your host:
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/notesapp
PORT=5000
CLIENT_ORIGIN=https://your-frontend-domain.com
```

### Frontend (e.g. Vercel, Netlify)
Set this environment variable on your host:
```
VITE_API_BASE_URL=https://your-api-domain.com/api
```

---

## API Endpoints

| Method | Path             | Description      |
|--------|------------------|------------------|
| GET    | /api/notes       | Get all notes    |
| GET    | /api/notes/:id   | Get one note     |
| POST   | /api/notes       | Create a note    |
| PUT    | /api/notes/:id   | Update a note    |
| DELETE | /api/notes/:id   | Delete a note    |
| GET    | /health          | Health check     |
