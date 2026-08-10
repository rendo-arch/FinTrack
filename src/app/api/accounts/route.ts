import { NextResponse } from 'next/server';
import { getDb, getAll, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const data = getAll(db,
      `SELECT a.*,
        a.initial_balance 
        + COALESCE((SELECT SUM(amount) FROM income WHERE account_id = a.id), 0)
        - COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = a.id), 0)
        + COALESCE((SELECT SUM(amount) FROM transfers WHERE to_account_id = a.id), 0)
        - COALESCE((SELECT SUM(amount) FROM transfers WHERE from_account_id = a.id), 0)
        as balance
      FROM accounts a WHERE a.user_id = ?`, [user.id]);
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
    const { name, type, initial_balance, icon, color } = body;
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }
    const db = await getDb();
    const id = runInsert(db,
      'INSERT INTO accounts (user_id, name, type, initial_balance, icon, color) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, name, type, Number(initial_balance || 0), icon || '', color || '']);
    return NextResponse.json({ success: true, data: { id }, message: 'Account added successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
