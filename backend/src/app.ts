import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import dashboardRoutes from './routes/dashboard';

const app = express();
const prisma = new PrismaClient();
const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const vercelFrontendDeploymentPattern = /^https:\/\/frontend-[a-z0-9-]+-vipers-projects-a60168f3\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      frontendOrigins.includes(origin) ||
      vercelFrontendDeploymentPattern.test(origin)
    ) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

app.set('prisma', prisma);

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export { app, prisma };
export default app;
