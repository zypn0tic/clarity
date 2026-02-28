import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { Transaction, TransactionFormData, Filters, PaginationInfo } from '../types';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import FilterBar from '../components/FilterBar';
import toast from 'react-hot-toast';

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Preserve filters in URL params
  const [filters, setFilters] = useState<Filters>({
    category: searchParams.get('category') || 'all',
    type: searchParams.get('type') || 'all',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', '20');
      if (filters.category !== 'all') params.set('category', filters.category);
      if (filters.type !== 'all') params.set('type', filters.type);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await api.get(`/transactions?${params.toString()}`);
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Persist filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleCreate = async (data: TransactionFormData) => {
    await api.post('/transactions', {
      ...data,
      amount: parseFloat(data.amount),
    });
    toast.success('Transaction added!');
    setShowForm(false);
    fetchTransactions();
  };

  const handleUpdate = async (data: TransactionFormData) => {
    if (!editingTransaction) return;
    await api.put(`/transactions/${editingTransaction.id}`, {
      ...data,
      amount: parseFloat(data.amount),
    });
    toast.success('Transaction updated!');
    setEditingTransaction(null);
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch {
      toast.error('Failed to delete transaction');
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(false);
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Show form or editing form
  if (showForm) {
    return (
      <div className="max-w-lg mx-auto">
        <TransactionForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  if (editingTransaction) {
    return (
      <div className="max-w-lg mx-auto">
        <TransactionForm
          initialData={{
            type: editingTransaction.type,
            amount: String(editingTransaction.amount),
            category: editingTransaction.category,
            description: editingTransaction.description || '',
            date: editingTransaction.date.split('T')[0],
          }}
          onSubmit={handleUpdate}
          onCancel={() => setEditingTransaction(null)}
          isEditing
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} transaction{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Add Transaction
        </button>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={handleFilterChange} />

      {/* Transaction List */}
      <TransactionList
        transactions={transactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
