import { Filters, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const allCategories = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

  return (
    <div className="card mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Type Filter */}
        <div className="flex-1 min-w-0">
          <label className="label">Type</label>
          <select
            value={filters.type}
            onChange={(e) => onChange({ ...filters, type: e.target.value })}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex-1 min-w-0">
          <label className="label">Category</label>
          <select
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className="input"
          >
            <option value="all">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex-1 min-w-0">
          <label className="label">From</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
            className="input"
          />
        </div>

        {/* End Date */}
        <div className="flex-1 min-w-0">
          <label className="label">To</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
            className="input"
          />
        </div>

        {/* Clear button */}
        <div className="flex items-end">
          <button
            onClick={() =>
              onChange({ category: 'all', type: 'all', startDate: '', endDate: '' })
            }
            className="btn-secondary text-sm whitespace-nowrap"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
