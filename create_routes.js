const fs = require('fs');
const path = require('path');

const basePath = 'C:\\Users\\Administrator\\.gemini\\antigravity\\scratch\\fintrack\\src\\app\\api';

function ensureDir(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

const templates = {
  'income/route.ts': `import { getAll, getOne, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const data = await getAll(
      'SELECT i.*, a.name as account_name FROM income i LEFT JOIN accounts a ON i.account_id = a.id WHERE i.user_id = ? ORDER BY i.date DESC',
      [user.id]
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { source, amount, account_id, date, description } = await request.json();
    if (!source || !amount || amount <= 0 || !account_id || !date) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }
    const result = await runInsert(
      'INSERT INTO income (user_id, source, amount, account_id, date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, source, amount, account_id, date, description || null]
    );
    const newRecord = await getOne('SELECT * FROM income WHERE id = ?', [result.lastInsertRowid]);
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'income/[id]/route.ts': `import { getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { source, amount, account_id, date, description } = await request.json();
    await runQuery(
      'UPDATE income SET source = COALESCE(?, source), amount = COALESCE(?, amount), account_id = COALESCE(?, account_id), date = COALESCE(?, date), description = COALESCE(?, description) WHERE id = ? AND user_id = ?',
      [source, amount, account_id, date, description, params.id, user.id]
    );
    const updatedRecord = await getOne('SELECT * FROM income WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await runQuery('DELETE FROM income WHERE id = ? AND user_id = ?', [params.id, user.id]);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'expenses/route.ts': `import { getAll, getOne, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const data = await getAll(
      'SELECT e.*, a.name as account_name FROM expenses e LEFT JOIN accounts a ON e.account_id = a.id WHERE e.user_id = ? ORDER BY e.date DESC',
      [user.id]
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { name, amount, account_id, category, date, description } = await request.json();
    if (!name || !amount || amount <= 0 || !account_id || !category || !date) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }
    const result = await runInsert(
      'INSERT INTO expenses (user_id, name, amount, account_id, category, date, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.id, name, amount, account_id, category, date, description || null]
    );
    const newRecord = await getOne('SELECT * FROM expenses WHERE id = ?', [result.lastInsertRowid]);
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'expenses/[id]/route.ts': `import { getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { name, amount, account_id, category, date, description } = await request.json();
    await runQuery(
      'UPDATE expenses SET name = COALESCE(?, name), amount = COALESCE(?, amount), account_id = COALESCE(?, account_id), category = COALESCE(?, category), date = COALESCE(?, date), description = COALESCE(?, description) WHERE id = ? AND user_id = ?',
      [name, amount, account_id, category, date, description, params.id, user.id]
    );
    const updatedRecord = await getOne('SELECT * FROM expenses WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await runQuery('DELETE FROM expenses WHERE id = ? AND user_id = ?', [params.id, user.id]);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'budgets/route.ts': `import { getAll, getOne, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const data = await getAll(
      \`SELECT b.*, COALESCE((
        SELECT SUM(e.amount) FROM expenses e 
        WHERE e.user_id = b.user_id AND e.category = b.category 
        AND e.date >= b.start_date
      ), 0) as spent
      FROM budgets b WHERE b.user_id = ?\`,
      [user.id]
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { category, budget_limit, period, start_date } = await request.json();
    if (!category || !budget_limit || budget_limit <= 0 || !period || !start_date) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }
    const result = await runInsert(
      'INSERT INTO budgets (user_id, category, budget_limit, period, start_date) VALUES (?, ?, ?, ?, ?)',
      [user.id, category, budget_limit, period, start_date]
    );
    const newRecord = await getOne('SELECT * FROM budgets WHERE id = ?', [result.lastInsertRowid]);
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'budgets/[id]/route.ts': `import { getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { category, budget_limit, period, start_date } = await request.json();
    await runQuery(
      'UPDATE budgets SET category = COALESCE(?, category), budget_limit = COALESCE(?, budget_limit), period = COALESCE(?, period), start_date = COALESCE(?, start_date) WHERE id = ? AND user_id = ?',
      [category, budget_limit, period, start_date, params.id, user.id]
    );
    const updatedRecord = await getOne('SELECT * FROM budgets WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await runQuery('DELETE FROM budgets WHERE id = ? AND user_id = ?', [params.id, user.id]);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'savings/route.ts': `import { getAll, getOne, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const data = await getAll('SELECT * FROM savings WHERE user_id = ? ORDER BY target_date ASC', [user.id]);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { name, target_amount, target_date } = await request.json();
    if (!name || !target_amount || target_amount <= 0 || !target_date) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }
    const result = await runInsert(
      'INSERT INTO savings (user_id, name, target_amount, current_amount, target_date) VALUES (?, ?, ?, 0, ?)',
      [user.id, name, target_amount, target_date]
    );
    const newRecord = await getOne('SELECT * FROM savings WHERE id = ?', [result.lastInsertRowid]);
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'savings/[id]/route.ts': `import { getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { name, target_amount, current_amount, target_date } = await request.json();
    await runQuery(
      'UPDATE savings SET name = COALESCE(?, name), target_amount = COALESCE(?, target_amount), current_amount = COALESCE(?, current_amount), target_date = COALESCE(?, target_date) WHERE id = ? AND user_id = ?',
      [name, target_amount, current_amount, target_date, params.id, user.id]
    );
    const updatedRecord = await getOne('SELECT * FROM savings WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await runQuery('DELETE FROM savings WHERE id = ? AND user_id = ?', [params.id, user.id]);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'accounts/route.ts': `import { getAll, getOne, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const data = await getAll(
      \`SELECT a.*,
        a.initial_balance 
        + COALESCE((SELECT SUM(amount) FROM income WHERE account_id = a.id), 0)
        - COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = a.id), 0)
        + COALESCE((SELECT SUM(amount) FROM transfers WHERE to_account_id = a.id), 0)
        - COALESCE((SELECT SUM(amount) FROM transfers WHERE from_account_id = a.id), 0)
        as balance
      FROM accounts a WHERE a.user_id = ?\`,
      [user.id]
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { name, type, initial_balance } = await request.json();
    if (!name || !type || typeof initial_balance !== 'number' || initial_balance < 0) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }
    const result = await runInsert(
      'INSERT INTO accounts (user_id, name, type, initial_balance) VALUES (?, ?, ?, ?)',
      [user.id, name, type, initial_balance]
    );
    const newRecord = await getOne('SELECT * FROM accounts WHERE id = ?', [result.lastInsertRowid]);
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'accounts/[id]/route.ts': `import { getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { name, type, initial_balance } = await request.json();
    await runQuery(
      'UPDATE accounts SET name = COALESCE(?, name), type = COALESCE(?, type), initial_balance = COALESCE(?, initial_balance) WHERE id = ? AND user_id = ?',
      [name, type, initial_balance, params.id, user.id]
    );
    const updatedRecord = await getOne('SELECT * FROM accounts WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    
    const incomeCount = await getOne('SELECT COUNT(*) as count FROM income WHERE account_id = ?', [params.id]);
    const expensesCount = await getOne('SELECT COUNT(*) as count FROM expenses WHERE account_id = ?', [params.id]);
    const transferCount = await getOne('SELECT COUNT(*) as count FROM transfers WHERE from_account_id = ? OR to_account_id = ?', [params.id, params.id]);
    
    if (incomeCount.count > 0 || expensesCount.count > 0 || transferCount.count > 0) {
      return NextResponse.json({ success: false, error: 'Cannot delete account with existing transactions' }, { status: 400 });
    }

    await runQuery('DELETE FROM accounts WHERE id = ? AND user_id = ?', [params.id, user.id]);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'transfers/route.ts': `import { getAll, getOne, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const data = await getAll(
      \`SELECT t.*, fa.name as from_account_name, ta.name as to_account_name
      FROM transfers t
      JOIN accounts fa ON t.from_account_id = fa.id
      JOIN accounts ta ON t.to_account_id = ta.id
      WHERE t.user_id = ? ORDER BY t.date DESC\`,
      [user.id]
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { from_account_id, to_account_id, amount, date, description } = await request.json();
    
    if (!from_account_id || !to_account_id || from_account_id === to_account_id || !amount || amount <= 0 || !date) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const fromAccount = await getOne(
      \`SELECT a.*,
        a.initial_balance 
        + COALESCE((SELECT SUM(amount) FROM income WHERE account_id = a.id), 0)
        - COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = a.id), 0)
        + COALESCE((SELECT SUM(amount) FROM transfers WHERE to_account_id = a.id), 0)
        - COALESCE((SELECT SUM(amount) FROM transfers WHERE from_account_id = a.id), 0)
        as balance
      FROM accounts a WHERE a.id = ? AND a.user_id = ?\`,
      [from_account_id, user.id]
    );

    if (!fromAccount || fromAccount.balance < amount) {
      return NextResponse.json({ success: false, error: 'Insufficient balance' }, { status: 400 });
    }

    const result = await runInsert(
      'INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, from_account_id, to_account_id, amount, date, description || null]
    );
    const newRecord = await getOne('SELECT * FROM transfers WHERE id = ?', [result.lastInsertRowid]);
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'transfers/[id]/route.ts': `import { runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await runQuery('DELETE FROM transfers WHERE id = ? AND user_id = ?', [params.id, user.id]);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'recurring/route.ts': `import { getAll, getOne, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const data = await getAll(
      'SELECT r.*, a.name as account_name FROM recurring r LEFT JOIN accounts a ON r.account_id = a.id WHERE r.user_id = ? ORDER BY r.next_date ASC',
      [user.id]
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { name, amount, type, account_id, category, frequency, start_date, next_date } = await request.json();
    if (!name || !amount || amount <= 0 || !type || !account_id || !frequency || !start_date || !next_date) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }
    const result = await runInsert(
      'INSERT INTO recurring (user_id, name, amount, type, account_id, category, frequency, start_date, next_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user.id, name, amount, type, account_id, category || null, frequency, start_date, next_date]
    );
    const newRecord = await getOne('SELECT * FROM recurring WHERE id = ?', [result.lastInsertRowid]);
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'recurring/[id]/route.ts': `import { getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { name, amount, type, account_id, category, frequency, next_date } = await request.json();
    await runQuery(
      'UPDATE recurring SET name = COALESCE(?, name), amount = COALESCE(?, amount), type = COALESCE(?, type), account_id = COALESCE(?, account_id), category = COALESCE(?, category), frequency = COALESCE(?, frequency), next_date = COALESCE(?, next_date) WHERE id = ? AND user_id = ?',
      [name, amount, type, account_id, category, frequency, next_date, params.id, user.id]
    );
    const updatedRecord = await getOne('SELECT * FROM recurring WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await runQuery('DELETE FROM recurring WHERE id = ? AND user_id = ?', [params.id, user.id]);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'reports/route.ts': `import { getAll } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Missing date parameters' }, { status: 400 });
    }

    const incomeRecords = await getAll('SELECT * FROM income WHERE user_id = ? AND date >= ? AND date <= ?', [user.id, startDate, endDate]);
    const expensesRecords = await getAll('SELECT * FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?', [user.id, startDate, endDate]);

    const totalIncome = incomeRecords.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expensesRecords.reduce((sum, item) => sum + item.amount, 0);
    const netBalance = totalIncome - totalExpenses;

    const incomeByCategory = incomeRecords.reduce((acc: any, item) => {
      const source = item.source || 'Other';
      acc[source] = (acc[source] || 0) + item.amount;
      return acc;
    }, {});

    const expensesByCategory = expensesRecords.reduce((acc: any, item) => {
      const cat = item.category || 'Other';
      acc[cat] = (acc[cat] || 0) + item.amount;
      return acc;
    }, {});

    const monthlyData = { income: totalIncome, expenses: totalExpenses };

    return NextResponse.json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netBalance,
        incomeByCategory,
        expensesByCategory,
        monthlyData
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'settings/route.ts': `import { getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const settings = await getOne('SELECT id, name, email, currency, created_at FROM users WHERE id = ?', [user.id]);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { name, email, currency } = await request.json();
    await runQuery(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), currency = COALESCE(?, currency) WHERE id = ?',
      [name, email, currency, user.id]
    );
    const updatedRecord = await getOne('SELECT id, name, email, currency, created_at FROM users WHERE id = ?', [user.id]);
    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`,
  'settings/password/route.ts': `import { getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Missing passwords' }, { status: 400 });
    }
    
    const dbUser = await getOne('SELECT * FROM users WHERE id = ?', [user.id]);
    if (!dbUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    
    const isMatch = await bcrypt.compare(currentPassword, dbUser.password_hash);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid current password' }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await runQuery('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, user.id]);
    
    return NextResponse.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}`
};

Object.keys(templates).forEach(file => {
  const fullPath = path.join(basePath, file);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, templates[file]);
  console.log('Created: ' + fullPath);
});
