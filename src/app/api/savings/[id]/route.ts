import { NextResponse } from 'next/server';
import { getDb, getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const { name, target_amount, current_amount, target_date, description } = body;
    const db = await getDb();
    const existing = getOne(db, 'SELECT id FROM savings_goals WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    runQuery(db,
      'UPDATE savings_goals SET name = ?, target_amount = ?, current_amount = ?, target_date = ?, description = ? WHERE id = ? AND user_id = ?',
      [name, Number(target_amount), Number(current_amount), target_date, description || '', Number(id), user.id]);
    return NextResponse.json({ success: true, message: 'Savings goal updated successfully' });
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
    const existing = getOne(db, 'SELECT id FROM savings_goals WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    runQuery(db, 'DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [Number(id), user.id]);
    return NextResponse.json({ success: true, message: 'Savings goal deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
