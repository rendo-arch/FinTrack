import { NextResponse } from 'next/server';
import { getDb, getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const { source, category, amount, account_id, date, description } = body;
    const db = await getDb();
    const existing = await getOne(db, 'SELECT id FROM income WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    await runQuery(db,
      'UPDATE income SET source = ?, category = ?, amount = ?, account_id = ?, date = ?, description = ? WHERE id = ? AND user_id = ?',
      [source, category, Number(amount), account_id, date, description || '', Number(id), user.id]);
    return NextResponse.json({ success: true, message: 'Income updated successfully' });
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
    const existing = await getOne(db, 'SELECT id FROM income WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    await runQuery(db, 'DELETE FROM income WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    return NextResponse.json({ success: true, message: 'Income deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
