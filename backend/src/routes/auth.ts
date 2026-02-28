import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();

// POST /api/auth/google - Authenticate with Google
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body;
    const prisma: PrismaClient = req.app.get('prisma');
    const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();

    if (!credential) {
      res.status(400).json({ error: 'Google credential is required' });
      return;
    }

    if (!googleClientId) {
      res.status(500).json({ error: 'Google OAuth is not configured on the server' });
      return;
    }

    const googleClient = new OAuth2Client(googleClientId);

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub || !payload.email_verified) {
      res.status(400).json({ error: 'Invalid Google token' });
      return;
    }

    // Find existing user by Google ID or email
    let user = await prisma.user.findUnique({
      where: { googleId: payload.sub },
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: payload.email },
      });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || null,
          avatar: payload.picture || null,
          googleId: payload.sub,
        },
      });
    } else {
      // Update user info on login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          name: payload.name || user.name,
          avatar: payload.picture || user.avatar,
        },
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'clarity-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Wrong recipient')) {
        res.status(401).json({ error: 'Google client ID mismatch between frontend and backend' });
        return;
      }

      if (error.message.includes('Invalid token signature') || error.message.includes('Token used too late')) {
        res.status(401).json({ error: 'Invalid or expired Google token' });
        return;
      }
    }

    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clarity-secret-key') as { userId: string };

    const prisma: PrismaClient = req.app.get('prisma');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
