import { getCurrentUser } from '@/lib/auth';
import { getDb, getAll, getOne } from '@/lib/db';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { 
  formatCurrency, 
  getGreeting, 
  formatDate, 
  formatDateShort, 
  getCategoryColor, 
  calculatePercentage 
} from '@/lib/utils';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Calendar, 
  ArrowRight, 
  AlertTriangle 
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    const cookieStore = await cookies();
    cookieStore.delete('fintrack-auth');
    redirect('/login');
  }

  const db = await getDb();

  const incomeRes = getOne<{ total: number }>(db, 'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ?', [user.id]);
  const expensesRes = getOne<{ total: number }>(db, 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?', [user.id]);
  const savingsRes = getOne<{ total: number }>(db, 'SELECT COALESCE(SUM(current_amount), 0) as total FROM savings_goals WHERE user_id = ?', [user.id]);

  const totalIncome = incomeRes?.total || 0;
  const totalExpenses = expensesRes?.total || 0;
  const totalSavings = savingsRes?.total || 0;
  const currentBalance = totalIncome - totalExpenses;

  const budgets = getAll(db, `
    SELECT b.*, COALESCE((
      SELECT SUM(e.amount) FROM expenses e 
      WHERE e.user_id = ? AND e.category = b.category 
      AND e.date >= b.start_date
    ), 0) as spent
    FROM budgets b WHERE b.user_id = ?
  `, [user.id, user.id]);

  const recentTransactions = getAll(db, `
    SELECT 'income' as type, i.source as tx_name, i.category, i.amount, i.date, a.name as account_name 
    FROM income i JOIN accounts a ON i.account_id = a.id WHERE i.user_id = ?
    UNION ALL
    SELECT 'expense' as type, e.name as tx_name, e.category, e.amount, e.date, a.name as account_name 
    FROM expenses e JOIN accounts a ON e.account_id = a.id WHERE e.user_id = ?
    ORDER BY date DESC LIMIT 8
  `, [user.id, user.id]);

  const upcomingExpenses = getAll(db, `
    SELECT name, amount, next_payment_date FROM recurring_payments 
    WHERE user_id = ? AND is_active = 1 ORDER BY next_payment_date ASC LIMIT 5
  `, [user.id]);

  // Compute chart data from actual DB
  const expensesByCategory = getAll(db, `
    SELECT category, SUM(amount) as total FROM expenses 
    WHERE user_id = ? GROUP BY category ORDER BY total DESC
  `, [user.id]);

  const categoryColors: Record<string, string> = {
    food: '#f59e0b', transportation: '#3b82f6', education: '#8b5cf6',
    utilities: '#10b981', healthcare: '#ef4444', entertainment: '#ec4899',
    shopping: '#f97316', bills: '#6366f1', personal: '#14b8a6', other: '#64748b'
  };

  // Build the last 6 months labels (e.g. 'Mar', 'Apr', ...)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const last6Months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    last6Months.push({ key, label: monthNames[d.getMonth()] });
  }

  const sixMonthsAgo = last6Months[0].key + '-01';

  const monthlyIncome = getAll<{ month: string; total: number }>(db, `
    SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
    FROM income WHERE user_id = ? AND date >= ?
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `, [user.id, sixMonthsAgo]);

  const monthlyExpenses = getAll<{ month: string; total: number }>(db, `
    SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
    FROM expenses WHERE user_id = ? AND date >= ?
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `, [user.id, sixMonthsAgo]);

  const incomeMap = new Map(monthlyIncome.map((r) => [r.month, r.total]));
  const expenseMap = new Map(monthlyExpenses.map((r) => [r.month, r.total]));

  const monthlyData = last6Months.map(({ key, label }) => ({
    month: label,
    income: incomeMap.get(key) || 0,
    expenses: expenseMap.get(key) || 0,
  }));

  const chartData = {
    monthlyData,
    expenseDistribution: expensesByCategory.map((e: any) => ({
      category: e.category.charAt(0).toUpperCase() + e.category.slice(1),
      amount: e.total,
      color: categoryColors[e.category] || '#64748b',
    })),
  };

  return (
    <div className="dashboard-page">
      {/* Welcome Message */}
      <div className="welcome-section">
        <h1 className="welcome-title">
          {getGreeting()}, {user.name.split(' ')[0]}
        </h1>
        <p className="welcome-subtitle">Here&apos;s your financial overview</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <TrendingUp size={24} />
          </div>
          <div className="summary-card-info">
            <span className="summary-card-label">Total Income</span>
            <span className="summary-card-value">{formatCurrency(totalIncome)}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <TrendingDown size={24} />
          </div>
          <div className="summary-card-info">
            <span className="summary-card-label">Total Expenses</span>
            <span className="summary-card-value">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Wallet size={24} />
          </div>
          <div className="summary-card-info">
            <span className="summary-card-label">Current Balance</span>
            <span className="summary-card-value">{formatCurrency(currentBalance)}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <PiggyBank size={24} />
          </div>
          <div className="summary-card-info">
            <span className="summary-card-label">Total Savings</span>
            <span className="summary-card-value">{formatCurrency(totalSavings)}</span>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-main-col">
          {/* Charts */}
          <div className="card">
            <DashboardCharts data={chartData} />
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Recent Transactions</h3>
              <Link href="/expenses" className="view-all-link">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="recent-transactions">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx: any, idx: number) => (
                  <div key={idx} className="transaction-item">
                    <div className="transaction-left">
                      <div 
                        className="transaction-icon"
                        style={{ backgroundColor: getCategoryColor(tx.category) }}
                      >
                        {tx.category.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="transaction-info">
                        <span className="transaction-name">{tx.tx_name}</span>
                        <span className="transaction-meta">
                          <span className="transaction-category">{tx.category}</span>
                          <span className="meta-dot">•</span>
                          <span className="transaction-date">{formatDateShort(tx.date)}</span>
                          <span className="meta-dot">•</span>
                          <span className="transaction-account">{tx.account_name}</span>
                        </span>
                      </div>
                    </div>
                    <span className={`transaction-amount ${tx.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <p>No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-side-col">
          {/* Budget Overview */}
          <div className="card">
            <div className="card-header">
              <h3>Budget Overview</h3>
            </div>
            <div className="budget-overview-list">
              {budgets.length > 0 ? (
                budgets.map((b: any, idx: number) => {
                  const percent = calculatePercentage(b.spent, b.budget_limit);
                  const isOver = b.spent > b.budget_limit;
                  const isWarning = percent >= 75 && !isOver;
                  const barColor = isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';
                  
                  return (
                    <div key={idx} className="budget-overview-item">
                      <div className="budget-overview-header">
                        <span className="budget-overview-category">{b.category}</span>
                        <div className="budget-overview-amounts">
                          <span className="budget-spent-amt">{formatCurrency(b.spent)}</span>
                          <span className="budget-divider">/</span>
                          <span className="budget-limit-amt">{formatCurrency(b.budget_limit)}</span>
                        </div>
                      </div>
                      
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${Math.min(percent, 100)}%`, background: barColor }}
                        ></div>
                      </div>
                      
                      {isOver && (
                        <div className="budget-exceeded-msg">
                          <AlertTriangle size={12} /> Budget exceeded
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="empty-state" style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '0.875rem' }}>No active budgets</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Expenses */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} />
                Upcoming Expenses
              </h3>
            </div>
            
            <div className="upcoming-list">
              {upcomingExpenses.length > 0 ? (
                upcomingExpenses.map((exp: any, idx: number) => (
                  <div key={idx} className="upcoming-item">
                    <div>
                      <div className="upcoming-name">{exp.name}</div>
                      <div className="upcoming-date">{formatDate(exp.next_payment_date)}</div>
                    </div>
                    <div className="upcoming-amount">
                      {formatCurrency(exp.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '0.875rem' }}>No upcoming expenses</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
