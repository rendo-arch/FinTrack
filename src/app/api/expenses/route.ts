import { NextResponse } from 'next/server';
import { getDb, getAll, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const data = await getAll(db,
      `SELECT e.*, a.name as account_name FROM expenses e 
       LEFT JOIN accounts a ON e.account_id = a.id 
       WHERE e.user_id = ? ORDER BY e.date DESC`, [user.id]);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { name, category, amount, account_id, payment_method, date, description } = body;
    if (!name || !amount || !account_id || !date) {
      return NextResponse.json({ error: 'Name, amount, account, and date are required' }, { status: 400 });
    }
    const db = await getDb();
    const id = await runInsert(db,
      'INSERT INTO expenses (user_id, account_id, name, category, amount, payment_method, date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user.id, account_id, name, category || 'other', Number(amount), payment_method || '', date, description || '']);
    return NextResponse.json({ success: true, data: { id }, message: 'Expense added successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
