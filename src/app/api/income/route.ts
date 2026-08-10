import { NextResponse } from 'next/server';
import { getDb, getAll, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const data = getAll(db,
      `SELECT i.*, a.name as account_name FROM income i 
       LEFT JOIN accounts a ON i.account_id = a.id 
       WHERE i.user_id = ? ORDER BY i.date DESC`, [user.id]);
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
    const { source, category, amount, account_id, date, description } = body;
    if (!source || !amount || !account_id || !date) {
      return NextResponse.json({ error: 'Source, amount, account, and date are required' }, { status: 400 });
    }
    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }
    const db = await getDb();
    const id = runInsert(db,
      'INSERT INTO income (user_id, account_id, source, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.id, account_id, source, category || 'other', Number(amount), date, description || '']);
    return NextResponse.json({ success: true, data: { id }, message: 'Income added successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
