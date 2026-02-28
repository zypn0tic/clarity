export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  category: string;
  description: string;
  date: string;
}

export interface DashboardData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  };
  expensesByCategory: Array<{ category: string; amount: number }>;
  incomeByCategory: Array<{ category: string; amount: number }>;
  dailyTrend: Array<{ date: string; income: number; expense: number }>;
  recentTransactions: Transaction[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Filters {
  category: string;
  type: string;
  startDate: string;
  endDate: string;
}

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Education',
  'Personal',
  'Travel',
  'Bills & Subscriptions',
  'Other',
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Business',
  'Other',
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#ef4444',
  'Transportation': '#f97316',
  'Housing': '#eab308',
  'Utilities': '#84cc16',
  'Entertainment': '#22c55e',
  'Shopping': '#14b8a6',
  'Healthcare': '#06b6d4',
  'Education': '#3b82f6',
  'Personal': '#6366f1',
  'Travel': '#8b5cf6',
  'Bills & Subscriptions': '#a855f7',
  'Salary': '#22c55e',
  'Freelance': '#3b82f6',
  'Investment': '#6366f1',
  'Gift': '#ec4899',
  'Business': '#f97316',
  'Other': '#6b7280',
};
