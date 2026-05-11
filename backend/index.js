import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import notesRoutes from './src/notes.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/notes', notesRoutes);

// ── DB + Start ────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
