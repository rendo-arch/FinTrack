import { NextResponse } from 'next/server';
import { getDb, getAll, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDateStr = startDateParam;
    let endDateStr = endDateParam;

    if (!startDateStr || !endDateStr) {
      const now = new Date();
      const end = new Date();
      let start = new Date();
      if (period === 'week') {
        start.setDate(now.getDate() - 7);
      } else if (period === 'year') {
        start.setFullYear(now.getFullYear() - 1);
      } else {
        start.setMonth(now.getMonth() - 1);
      }
      startDateStr = startDateStr || start.toISOString().split('T')[0];
      endDateStr = endDateStr || end.toISOString().split('T')[0];
    }

    const db = await getDb();
    
    const incomeTotalRow = getOne<{total: number}>(db, 'SELECT SUM(amount) as total FROM income WHERE user_id = ? AND date >= ? AND date <= ?', [user.id, startDateStr, endDateStr]);
    const expensesTotalRow = getOne<{total: number}>(db, 'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?', [user.id, startDateStr, endDateStr]);
    
    const totalIncome = incomeTotalRow?.total || 0;
    const totalExpenses = expensesTotalRow?.total || 0;
    const netBalance = totalIncome - totalExpenses;

    const incomeByCategory = getAll(db, 'SELECT category, SUM(amount) as total FROM income WHERE user_id = ? AND date >= ? AND date <= ? GROUP BY category', [user.id, startDateStr, endDateStr]);
    const expensesByCategory = getAll(db, 'SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? AND date >= ? AND date <= ? GROUP BY category', [user.id, startDateStr, endDateStr]);

    return NextResponse.json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netBalance,
        incomeByCategory,
        expensesByCategory
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
