import { NextResponse } from 'next/server';
import { getDb, getOne, runQuery } from '@/lib/db';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }

    const db = await getDb();
    const dbUser = getOne<{password_hash: string}>(db, 'SELECT password_hash FROM users WHERE id = ?', [user.id]);
    
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isValid = await verifyPassword(currentPassword, dbUser.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid current password' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    runQuery(db, 'UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
    
    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
