import { Pool } from 'pg';

export async function initializeDatabase(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT '₱',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'e-wallet', 'savings', 'other')),
      initial_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
      icon TEXT DEFAULT '💳',
      color TEXT DEFAULT '#3b82f6',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS income (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      source TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      amount DOUBLE PRECISION NOT NULL CHECK(amount > 0),
      date TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      amount DOUBLE PRECISION NOT NULL CHECK(amount > 0),
      payment_method TEXT DEFAULT 'Cash',
      date TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      budget_limit DOUBLE PRECISION NOT NULL CHECK(budget_limit > 0),
      period TEXT NOT NULL CHECK(period IN ('weekly', 'monthly', 'yearly')),
      start_date TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      target_amount DOUBLE PRECISION NOT NULL CHECK(target_amount > 0),
      current_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      target_date TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transfers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      from_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      to_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      amount DOUBLE PRECISION NOT NULL CHECK(amount > 0),
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recurring_payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL DEFAULT 'other',
      frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'monthly', 'yearly')),
      next_payment_date TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_income_user ON income(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_income_date ON income(date)',
    'CREATE INDEX IF NOT EXISTS idx_income_account ON income(account_id)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)',
    'CREATE INDEX IF NOT EXISTS idx_expenses_account ON expenses(account_id)',
    'CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_savings_user ON savings_goals(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_transfers_user ON transfers(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_payments(user_id)',
  ];

  for (const idx of indexes) {
    await pool.query(idx);
  }
}

export async function seedDemoData(pool: Pool, userId: number) {
  const cashRes = await pool.query(
    'INSERT INTO accounts (user_id, name, type, initial_balance, icon, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [userId, 'Cash', 'cash', 5000, '💵', '#22c55e']
  );
  const cashId = cashRes.rows[0].id;

  const savingsRes = await pool.query(
    'INSERT INTO accounts (user_id, name, type, initial_balance, icon, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [userId, 'Savings', 'savings', 15000, '🏦', '#3b82f6']
  );
  const savingsId = savingsRes.rows[0].id;

  const gcashRes = await pool.query(
    'INSERT INTO accounts (user_id, name, type, initial_balance, icon, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [userId, 'GCash', 'e-wallet', 3000, '📱', '#0066ff']
  );
  const gcashId = gcashRes.rows[0].id;

  const bankRes = await pool.query(
    'INSERT INTO accounts (user_id, name, type, initial_balance, icon, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [userId, 'Bank', 'bank', 10000, '🏦', '#6366f1']
  );
  const bankId = bankRes.rows[0].id;

  const incomeData = [
    [userId, bankId, 'Monthly Salary', 'salary', 25000, '2026-08-01', 'August 2026 salary'],
    [userId, gcashId, 'Freelance Project', 'freelance', 5000, '2026-08-03', 'Web design project'],
    [userId, cashId, 'Birthday Gift', 'gift', 2000, '2026-08-05', 'Gift from parents'],
    [userId, bankId, 'Monthly Salary', 'salary', 25000, '2026-07-01', 'July 2026 salary'],
    [userId, gcashId, 'Freelance Work', 'freelance', 3500, '2026-07-15', 'Logo design'],
  ];
  for (const row of incomeData) {
    await pool.query(
      'INSERT INTO income (user_id, account_id, source, category, amount, date, description) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      row
    );
  }

  const expenseData = [
    [userId, cashId, 'Groceries', 'food', 2500, 'Cash', '2026-08-02', 'Weekly groceries'],
    [userId, gcashId, 'Grab Ride', 'transportation', 350, 'E-wallet', '2026-08-03', 'Ride to office'],
    [userId, bankId, 'Electric Bill', 'utilities', 1500, 'Bank Transfer', '2026-08-04', 'August electricity'],
    [userId, cashId, 'Lunch Out', 'food', 450, 'Cash', '2026-08-05', 'Restaurant lunch'],
    [userId, gcashId, 'Netflix', 'entertainment', 549, 'E-wallet', '2026-08-01', 'Monthly subscription'],
    [userId, cashId, 'Medicine', 'healthcare', 800, 'Cash', '2026-08-06', 'Vitamin supplements'],
    [userId, bankId, 'School Tuition', 'education', 5000, 'Bank Transfer', '2026-08-07', 'Monthly tuition'],
    [userId, gcashId, 'Shopee Order', 'shopping', 1200, 'E-wallet', '2026-08-04', 'Phone accessories'],
    [userId, cashId, 'Water Bill', 'utilities', 350, 'Cash', '2026-07-28', 'Water utility'],
    [userId, bankId, 'Internet Bill', 'bills', 1699, 'Bank Transfer', '2026-07-25', 'PLDT Fiber'],
    [userId, cashId, 'Haircut', 'personal', 200, 'Cash', '2026-07-20', 'Monthly haircut'],
    [userId, gcashId, 'Bus Fare', 'transportation', 200, 'E-wallet', '2026-08-05', 'Daily commute'],
  ];
  for (const row of expenseData) {
    await pool.query(
      'INSERT INTO expenses (user_id, account_id, name, category, amount, payment_method, date, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      row
    );
  }

  const budgetData = [
    [userId, 'food', 4000, 'monthly', '2026-08-01'],
    [userId, 'transportation', 2000, 'monthly', '2026-08-01'],
    [userId, 'entertainment', 1500, 'monthly', '2026-08-01'],
    [userId, 'utilities', 3000, 'monthly', '2026-08-01'],
    [userId, 'shopping', 2000, 'monthly', '2026-08-01'],
    [userId, 'healthcare', 1500, 'monthly', '2026-08-01'],
  ];
  for (const row of budgetData) {
    await pool.query(
      'INSERT INTO budgets (user_id, category, budget_limit, period, start_date) VALUES ($1, $2, $3, $4, $5)',
      row
    );
  }

  const goalData = [
    [userId, 'New Laptop', 40000, 15000, '2027-03-01', 'MacBook Air M3'],
    [userId, 'Emergency Fund', 50000, 20000, '2027-06-01', '6 months of expenses'],
    [userId, 'Vacation', 25000, 8000, '2026-12-20', 'Boracay trip'],
  ];
  for (const row of goalData) {
    await pool.query(
      'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, description) VALUES ($1, $2, $3, $4, $5, $6)',
      row
    );
  }

  const recurringData = [
    [userId, bankId, 'Electric Bill', 1500, 'utilities', 'monthly', '2026-08-12', 'Meralco', 1],
    [userId, bankId, 'Internet Bill', 1699, 'bills', 'monthly', '2026-08-15', 'PLDT Fiber', 1],
    [userId, bankId, 'School Payment', 5000, 'education', 'monthly', '2026-08-20', 'Monthly tuition', 1],
    [userId, gcashId, 'Netflix', 549, 'entertainment', 'monthly', '2026-09-01', 'Streaming subscription', 1],
    [userId, gcashId, 'Spotify', 149, 'entertainment', 'monthly', '2026-08-25', 'Music subscription', 1],
  ];
  for (const row of recurringData) {
    await pool.query(
      'INSERT INTO recurring_payments (user_id, account_id, name, amount, category, frequency, next_payment_date, description, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      row
    );
  }

  const transferData = [
    [userId, bankId, savingsId, 5000, 'Monthly savings', '2026-08-01'],
    [userId, bankId, gcashId, 2000, 'GCash top-up', '2026-08-02'],
    [userId, cashId, gcashId, 1000, 'Cash to GCash', '2026-08-05'],
  ];
  for (const row of transferData) {
    await pool.query(
      'INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, description, date) VALUES ($1, $2, $3, $4, $5, $6)',
      row
    );
  }
}
