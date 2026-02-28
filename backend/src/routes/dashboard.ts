import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/dashboard - Get dashboard summary
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Total income and expenses for the period
    const [incomeResult, expenseResult] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId: req.userId,
          type: 'income',
          date: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          userId: req.userId,
          type: 'expense',
          date: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalIncome = incomeResult._sum.amount || 0;
    const totalExpenses = expenseResult._sum.amount || 0;
    const balance = totalIncome - totalExpenses;

    // Spending by category
    const expensesByCategory = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId: req.userId,
        type: 'expense',
        date: { gte: startDate },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    // Income by category
    const incomeByCategory = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId: req.userId,
        type: 'income',
        date: { gte: startDate },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    // Daily spending trend (last N days)
    const dailyTrend = await prisma.$queryRawUnsafe<Array<{ date: string; income: number; expense: number }>>(
      `
      SELECT 
        DATE(date) as date,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions
      WHERE "userId" = $1 AND date >= $2
      GROUP BY DATE(date)
      ORDER BY date ASC
      `,
      req.userId,
      startDate
    );

    // Recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
      take: 5,
    });

    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        transactionCount: (incomeResult._count || 0) + (expenseResult._count || 0),
      },
      expensesByCategory: expensesByCategory.map((item) => ({
        category: item.category,
        amount: item._sum.amount || 0,
      })),
      incomeByCategory: incomeByCategory.map((item) => ({
        category: item.category,
        amount: item._sum.amount || 0,
      })),
      dailyTrend: dailyTrend.map((item) => ({
        date: item.date,
        income: Number(item.income),
        expense: Number(item.expense),
      })),
      recentTransactions,
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
