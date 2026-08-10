import { NextResponse } from 'next/server';
import { getDb, getOne, runQuery } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = await getDb();
    const profile = await getOne(db, 'SELECT id, name, email, currency, created_at FROM users WHERE id = ?', [user.id]);
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { name, email, currency } = body;
    const db = await getDb();
    await runQuery(db, 'UPDATE users SET name = ?, email = ?, currency = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [name, email, currency || '₱', user.id]);
    const updated = await getOne(db, 'SELECT id, name, email, currency, created_at FROM users WHERE id = ?', [user.id]);
    return NextResponse.json({ success: true, data: updated, message: 'Settings updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
