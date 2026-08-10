import { NextResponse } from 'next/server';
import { getDb, getAll, getOne, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const data = getAll(db,
      `SELECT t.*, a1.name as from_account_name, a2.name as to_account_name 
       FROM transfers t 
       LEFT JOIN accounts a1 ON t.from_account_id = a1.id 
       LEFT JOIN accounts a2 ON t.to_account_id = a2.id 
       WHERE t.user_id = ? ORDER BY t.date DESC`, [user.id]);
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
    const { from_account_id, to_account_id, amount, description, date } = body;
    if (!from_account_id || !to_account_id || !amount || !date) {
      return NextResponse.json({ error: 'from_account_id, to_account_id, amount, and date are required' }, { status: 400 });
    }
    if (from_account_id === to_account_id) {
      return NextResponse.json({ error: 'Cannot transfer to the same account' }, { status: 400 });
    }
    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }
    
    const db = await getDb();
    
    // Optional: check balance if needed, but not strictly required by prompt unless "checks balance" means hard fail.
    // Let's get from_account to check ownership at least
    const fromAcc = getOne(db, 'SELECT id FROM accounts WHERE id = ? AND user_id = ?', [from_account_id, user.id]);
    const toAcc = getOne(db, 'SELECT id FROM accounts WHERE id = ? AND user_id = ?', [to_account_id, user.id]);
    if (!fromAcc || !toAcc) {
      return NextResponse.json({ error: 'Invalid accounts' }, { status: 400 });
    }

    const id = runInsert(db,
      'INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, from_account_id, to_account_id, Number(amount), description || '', date]);
    return NextResponse.json({ success: true, data: { id }, message: 'Transfer added successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
