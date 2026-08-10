import type { Database as SqlJsDatabase } from 'sql.js';

export function initializeDatabase(db: SqlJsDatabase) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT '₱',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'e-wallet', 'savings', 'other')),
      initial_balance REAL NOT NULL DEFAULT 0,
      icon TEXT DEFAULT '💳',
      color TEXT DEFAULT '#3b82f6',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      source TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      amount REAL NOT NULL CHECK(amount > 0),
      date TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      amount REAL NOT NULL CHECK(amount > 0),
      payment_method TEXT DEFAULT 'Cash',
      date TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      budget_limit REAL NOT NULL CHECK(budget_limit > 0),
      period TEXT NOT NULL CHECK(period IN ('weekly', 'monthly', 'yearly')),
      start_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL CHECK(target_amount > 0),
      current_amount REAL NOT NULL DEFAULT 0,
      target_date TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      from_account_id INTEGER NOT NULL,
      to_account_id INTEGER NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recurring_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      category TEXT NOT NULL DEFAULT 'other',
      frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'monthly', 'yearly')),
      next_payment_date TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
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
  indexes.forEach((idx) => db.run(idx));
}

export function seedDemoData(db: SqlJsDatabase, userId: number) {
  // Create default accounts
  db.run(
    'INSERT INTO accounts (user_id, name, type, initial_balance, icon, color) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, 'Cash', 'cash', 5000, '💵', '#22c55e']
  );
  const cashId = (db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number) || 1;

  db.run(
    'INSERT INTO accounts (user_id, name, type, initial_balance, icon, color) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, 'Savings', 'savings', 15000, '🏦', '#3b82f6']
  );
  const savingsId = (db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number) || 2;

  db.run(
    'INSERT INTO accounts (user_id, name, type, initial_balance, icon, color) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, 'GCash', 'e-wallet', 3000, '📱', '#0066ff']
  );
  const gcashId = (db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number) || 3;

  db.run(
    'INSERT INTO accounts (user_id, name, type, initial_balance, icon, color) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, 'Bank', 'bank', 10000, '🏦', '#6366f1']
  );
  const bankId = (db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number) || 4;

  // Income records
  const incomeData = [
    [userId, bankId, 'Monthly Salary', 'salary', 25000, '2026-08-01', 'August 2026 salary'],
    [userId, gcashId, 'Freelance Project', 'freelance', 5000, '2026-08-03', 'Web design project'],
    [userId, cashId, 'Birthday Gift', 'gift', 2000, '2026-08-05', 'Gift from parents'],
    [userId, bankId, 'Monthly Salary', 'salary', 25000, '2026-07-01', 'July 2026 salary'],
    [userId, gcashId, 'Freelance Work', 'freelance', 3500, '2026-07-15', 'Logo design'],
  ];
  incomeData.forEach((row) => {
    db.run(
      'INSERT INTO income (user_id, account_id, source, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      row
    );
  });

  // Expense records
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
  expenseData.forEach((row) => {
    db.run(
      'INSERT INTO expenses (user_id, account_id, name, category, amount, payment_method, date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      row
    );
  });

  // Budgets
  const budgetData = [
    [userId, 'food', 4000, 'monthly', '2026-08-01'],
    [userId, 'transportation', 2000, 'monthly', '2026-08-01'],
    [userId, 'entertainment', 1500, 'monthly', '2026-08-01'],
    [userId, 'utilities', 3000, 'monthly', '2026-08-01'],
    [userId, 'shopping', 2000, 'monthly', '2026-08-01'],
    [userId, 'healthcare', 1500, 'monthly', '2026-08-01'],
  ];
  budgetData.forEach((row) => {
    db.run(
      'INSERT INTO budgets (user_id, category, budget_limit, period, start_date) VALUES (?, ?, ?, ?, ?)',
      row
    );
  });

  // Savings goals
  const goalData = [
    [userId, 'New Laptop', 40000, 15000, '2027-03-01', 'MacBook Air M3'],
    [userId, 'Emergency Fund', 50000, 20000, '2027-06-01', '6 months of expenses'],
    [userId, 'Vacation', 25000, 8000, '2026-12-20', 'Boracay trip'],
  ];
  goalData.forEach((row) => {
    db.run(
      'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, description) VALUES (?, ?, ?, ?, ?, ?)',
      row
    );
  });

  // Recurring payments
  const recurringData = [
    [userId, bankId, 'Electric Bill', 1500, 'utilities', 'monthly', '2026-08-12', 'Meralco', 1],
    [userId, bankId, 'Internet Bill', 1699, 'bills', 'monthly', '2026-08-15', 'PLDT Fiber', 1],
    [userId, bankId, 'School Payment', 5000, 'education', 'monthly', '2026-08-20', 'Monthly tuition', 1],
    [userId, gcashId, 'Netflix', 549, 'entertainment', 'monthly', '2026-09-01', 'Streaming subscription', 1],
    [userId, gcashId, 'Spotify', 149, 'entertainment', 'monthly', '2026-08-25', 'Music subscription', 1],
  ];
  recurringData.forEach((row) => {
    db.run(
      'INSERT INTO recurring_payments (user_id, account_id, name, amount, category, frequency, next_payment_date, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      row
    );
  });

  // Transfers
  const transferData = [
    [userId, bankId, savingsId, 5000, 'Monthly savings', '2026-08-01'],
    [userId, bankId, gcashId, 2000, 'GCash top-up', '2026-08-02'],
    [userId, cashId, gcashId, 1000, 'Cash to GCash', '2026-08-05'],
  ];
  transferData.forEach((row) => {
    db.run(
      'INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
      row
    );
  });
}
