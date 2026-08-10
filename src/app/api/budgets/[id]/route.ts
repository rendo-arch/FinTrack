import { NextResponse } from 'next/server';
import { getDb, getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const { category, budget_limit, period, start_date } = body;
    const db = await getDb();
    const existing = getOne(db, 'SELECT id FROM budgets WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    runQuery(db,
      'UPDATE budgets SET category = ?, budget_limit = ?, period = ?, start_date = ? WHERE id = ? AND user_id = ?',
      [category, Number(budget_limit), period, start_date, Number(id), user.id]);
    return NextResponse.json({ success: true, message: 'Budget updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const db = await getDb();
    const existing = getOne(db, 'SELECT id FROM budgets WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    runQuery(db, 'DELETE FROM budgets WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    return NextResponse.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
