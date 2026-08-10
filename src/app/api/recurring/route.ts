import { NextResponse } from 'next/server';
import { getDb, getAll, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const data = await getAll(db,
      `SELECT r.*, a.name as account_name FROM recurring_payments r 
       LEFT JOIN accounts a ON r.account_id = a.id 
       WHERE r.user_id = ? ORDER BY r.next_payment_date ASC`, [user.id]);
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
    const { name, amount, category, frequency, next_payment_date, account_id, description, is_active } = body;
    if (!name || !amount || !frequency || !next_payment_date || !account_id) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }
    const db = await getDb();
    const active = is_active !== undefined ? (is_active ? 1 : 0) : 1;
    const id = await runInsert(db,
      'INSERT INTO recurring_payments (user_id, name, amount, category, frequency, next_payment_date, account_id, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user.id, name, Number(amount), category || 'other', frequency, next_payment_date, account_id, description || '', active]);
    return NextResponse.json({ success: true, data: { id }, message: 'Recurring payment added successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
