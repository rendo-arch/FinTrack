import { NextResponse } from 'next/server';
import { getDb, getAll, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const data = getAll(db,
      `SELECT b.*, COALESCE((
        SELECT SUM(e.amount) FROM expenses e 
        WHERE e.user_id = b.user_id AND e.category = b.category 
        AND e.date >= b.start_date
      ), 0) as spent FROM budgets b WHERE b.user_id = ?`, [user.id]);
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
    const { category, budget_limit, period, start_date } = body;
    if (!category || !budget_limit || !period || !start_date) {
      return NextResponse.json({ error: 'Category, budget_limit, period, and start_date are required' }, { status: 400 });
    }
    const db = await getDb();
    const id = runInsert(db,
      'INSERT INTO budgets (user_id, category, budget_limit, period, start_date) VALUES (?, ?, ?, ?, ?)',
      [user.id, category, Number(budget_limit), period, start_date]);
    return NextResponse.json({ success: true, data: { id }, message: 'Budget added successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
