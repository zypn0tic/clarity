import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { categorizeWithAI } from '../services/gemini';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/transactions - List transactions with filters
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { category, type, startDate, endDate, page = '1', limit = '20', sortBy = 'date', sortOrder = 'desc' } = req.query;

    const where: any = { userId: req.userId };

    if (category && category !== 'all') {
      where.category = category as string;
    }

    if (type && type !== 'all') {
      where.type = type as string;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [sortBy as string]: sortOrder as string },
        skip,
        take,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/transactions - Create a transaction
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { type, amount, description, date } = req.body;
    const cleanDescription = typeof description === 'string' ? description.trim() : '';

    // Validation
    if (!type || !['income', 'expense'].includes(type)) {
      res.status(400).json({ error: 'Type must be "income" or "expense"' });
      return;
    }

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }

    if (!date) {
      res.status(400).json({ error: 'Date is required' });
      return;
    }

    if (!cleanDescription) {
      res.status(400).json({ error: 'Description is required for AI categorization' });
      return;
    }

    const finalCategory = await categorizeWithAI(cleanDescription, type);

    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        category: finalCategory,
        description: cleanDescription,
        date: new Date(date),
        userId: req.userId!,
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PUT /api/transactions/:id - Update a transaction
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const id = req.params.id as string;
    const { type, amount, description, date } = req.body;
    const cleanDescription = typeof description === 'string' ? description.trim() : '';

    // Check ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    if (!cleanDescription) {
      res.status(400).json({ error: 'Description is required for AI categorization' });
      return;
    }

    const finalType = type || existing.type;
    const finalCategory = await categorizeWithAI(cleanDescription, finalType);

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(type && { type: finalType }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        category: finalCategory,
        description: cleanDescription,
        ...(date && { date: new Date(date) }),
      },
    });

    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /api/transactions/:id - Delete a transaction
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const id = req.params.id as string;

    // Check ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    await prisma.transaction.delete({ where: { id } });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// POST /api/transactions/categorize - AI categorize a description
router.post('/categorize', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { description, type } = req.body;
    const cleanDescription = typeof description === 'string' ? description.trim() : '';

    if (!cleanDescription) {
      res.status(400).json({ error: 'Description is required' });
      return;
    }

    const safeType = type === 'income' ? 'income' : 'expense';

    const category = await categorizeWithAI(cleanDescription, safeType);
    res.json({ category });
  } catch (error) {
    console.error('Error categorizing:', error);
    res.status(500).json({ error: 'Failed to categorize' });
  }
});

export default router;
