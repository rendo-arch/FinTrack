import { NextResponse } from 'next/server';
import { getDb, getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const { name, category, amount, account_id, payment_method, date, description } = body;
    const db = await getDb();
    const existing = await getOne(db, 'SELECT id FROM expenses WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    await runQuery(db,
      'UPDATE expenses SET name = ?, category = ?, amount = ?, account_id = ?, payment_method = ?, date = ?, description = ? WHERE id = ? AND user_id = ?',
      [name, category, Number(amount), account_id, payment_method || '', date, description || '', Number(id), user.id]);
    return NextResponse.json({ success: true, message: 'Expense updated successfully' });
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
    const existing = await getOne(db, 'SELECT id FROM expenses WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    await runQuery(db, 'DELETE FROM expenses WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
