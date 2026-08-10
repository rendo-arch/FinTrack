import { NextResponse } from 'next/server';
import { getDb, getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const { name, amount, category, frequency, next_payment_date, account_id, description, is_active } = body;
    const db = await getDb();
    const existing = getOne(db, 'SELECT id FROM recurring_payments WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    const active = is_active !== undefined ? (is_active ? 1 : 0) : 1;
    runQuery(db,
      'UPDATE recurring_payments SET name = ?, amount = ?, category = ?, frequency = ?, next_payment_date = ?, account_id = ?, description = ?, is_active = ? WHERE id = ? AND user_id = ?',
      [name, Number(amount), category, frequency, next_payment_date, account_id, description || '', active, Number(id), user.id]);
    return NextResponse.json({ success: true, message: 'Recurring payment updated successfully' });
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
    const existing = getOne(db, 'SELECT id FROM recurring_payments WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    runQuery(db, 'DELETE FROM recurring_payments WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    return NextResponse.json({ success: true, message: 'Recurring payment deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
