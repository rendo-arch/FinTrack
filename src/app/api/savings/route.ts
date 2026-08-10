import { NextResponse } from 'next/server';
import { getDb, getAll, runInsert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const data = getAll(db,
      `SELECT * FROM savings_goals WHERE user_id = ?`, [user.id]);
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
    const { name, target_amount, current_amount, target_date, description } = body;
    if (!name || !target_amount || !target_date) {
      return NextResponse.json({ error: 'Name, target_amount, and target_date are required' }, { status: 400 });
    }
    const db = await getDb();
    const id = runInsert(db,
      'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, name, Number(target_amount), Number(current_amount || 0), target_date, description || '']);
    return NextResponse.json({ success: true, data: { id }, message: 'Savings goal added successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
