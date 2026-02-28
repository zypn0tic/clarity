import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { DashboardData, CATEGORY_COLORS } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardChartsProps {
  data: DashboardData;
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  const { isDark } = useTheme();

  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Spending Trend Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending Trend</h3>
        {data.dailyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.dailyTrend}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                tickFormatter={(val) => format(new Date(val), 'MMM d')}
                tick={{ fill: textColor, fontSize: 12 }}
                stroke={gridColor}
              />
              <YAxis
                tick={{ fill: textColor, fontSize: 12 }}
                stroke={gridColor}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#fff',
                  border: `1px solid ${gridColor}`,
                  borderRadius: '8px',
                  color: isDark ? '#f3f4f6' : '#111827',
                }}
                labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                formatter={(value: number) => [`$${value.toFixed(2)}`]}
              />
              <Legend wrapperStyle={{ color: textColor }} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#22c55e"
                fill="url(#incomeGrad)"
                strokeWidth={2}
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                fill="url(#expenseGrad)"
                strokeWidth={2}
                name="Expense"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            No data available for this period
          </div>
        )}
      </div>

      {/* Expenses by Category Pie Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses by Category</h3>
        {data.expensesByCategory.length > 0 ? (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.expensesByCategory}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ category, percent, x, y }) => (
                    <text x={x} y={y} fill={textColor} textAnchor="middle" dominantBaseline="central" fontSize={11}>
                      {`${category} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  )}
                  labelLine={false}
                >
                  {data.expensesByCategory.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other']}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#fff',
                    border: `1px solid ${gridColor}`,
                    borderRadius: '8px',
                    color: isDark ? '#f3f4f6' : '#111827',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {data.expensesByCategory.map((entry) => (
                <div key={entry.category} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'] }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{entry.category}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            No expenses recorded yet
          </div>
        )}
      </div>
    </div>
  );
}
