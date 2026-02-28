import { useState, useEffect } from 'react';
import { TransactionFormData } from '../types';
import api from '../api';

interface TransactionFormProps {
  initialData?: TransactionFormData;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function TransactionForm({ initialData, onSubmit, onCancel, isEditing = false }: TransactionFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TransactionFormData>(
    initialData || {
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 3;

  // Auto-categorize with AI when description/type changes
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const description = formData.description.trim();
      if (description.length < 3) {
        setFormData((prev) => (prev.category ? { ...prev, category: '' } : prev));
        return;
      }

      setIsCategorizing(true);
      try {
        const res = await api.post('/transactions/categorize', {
          description,
          type: formData.type,
        });
        if (res.data.category) {
          setFormData((prev) => ({ ...prev, category: res.data.category }));
        }
      } catch {
        setFormData((prev) => ({ ...prev, category: 'Other' }));
      } finally {
        setIsCategorizing(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [formData.description, formData.type]);

  const handleSubmit = async () => {
    setError('');

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      setStep(1);
      return;
    }

    if (!formData.category) {
      setError('AI is still categorizing. Please wait a moment.');
      setStep(2);
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required for AI categorization');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        description: formData.description.trim(),
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAdvance = () => {
    switch (step) {
      case 1:
        return formData.amount && parseFloat(formData.amount) > 0 && formData.date;
      case 2:
        return formData.description.trim().length >= 3;
      case 3:
        return Boolean(formData.category);
      default:
        return false;
    }
  };

  return (
    <div className="card max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Transaction' : 'New Transaction'}
        </h2>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Type, Amount, Date */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Step 1 of {totalSteps}: Amount & Date</p>

          {/* Type Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                formData.type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                formData.type === 'income'
                  ? 'bg-green-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="label">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">$</span>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input pl-7 text-2xl font-semibold"
                autoFocus
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
            />
          </div>
        </div>
      )}

      {/* Step 2: Description */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Step 2 of {totalSteps}: Description (required)</p>

          <div>
            <label className="label">Description</label>
            <textarea
              placeholder="e.g., Coffee at Starbucks, Monthly rent..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[100px] resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              AI uses this description to assign your category automatically.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/60">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Category</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formData.category || (formData.description.trim().length >= 3 ? 'Categorizing...' : 'Enter at least 3 characters')}
            </p>
          </div>

          {isCategorizing && (
            <p className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              AI is suggesting a category...
            </p>
          )}
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Step 3 of {totalSteps}: Review</p>

          {/* Summary */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Summary</h4>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Type</span>
              <span className={`text-sm font-medium ${formData.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formData.type === 'income' ? 'Income' : 'Expense'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Amount</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">${formData.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Category</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formData.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Date</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formData.date}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">Description</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-right break-all">{formData.description}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => (step === 1 ? onCancel() : setStep(step - 1))}
          className="btn-secondary"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="btn-primary"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              isEditing ? 'Update' : 'Add Transaction'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
