'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, getCategoryColor } from '@/lib/utils';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface ReportData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [customDates, setCustomDates] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?period=${period}`;
      if (period === 'custom') {
        url += `&startDate=${customDates.startDate}&endDate=${customDates.endDate}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const result = await res.json();
      if (result.success) {
        setReportData(result.data);
      }
    } catch (error) {
      toast.error('Could not load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (period === 'custom') {
      fetchReport();
    }
  };

  const savingsRate = reportData && reportData.totalIncome > 0 
    ? ((reportData.totalIncome - reportData.totalExpenses) / reportData.totalIncome) * 100 
    : 0;

  // Chart Data preparation
  const barChartData = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        label: 'Amount',
        data: [reportData?.totalIncome || 0, reportData?.totalExpenses || 0],
        backgroundColor: ['#22c55e', '#ef4444'],
      },
    ],
  };

  const expenseCategories = reportData ? Object.keys(reportData.expensesByCategory) : [];
  const expenseValues = reportData ? Object.values(reportData.expensesByCategory) : [];
  const doughnutColors = expenseCategories.map(cat => getCategoryColor(cat));

  const doughnutData = {
    labels: expenseCategories,
    datasets: [
      {
        data: expenseValues,
        backgroundColor: doughnutColors,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-description">Analyze your income, expenses, and savings.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className={`btn ${period === 'week' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPeriod('week')}>This Week</button>
          <button className={`btn ${period === 'month' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPeriod('month')}>This Month</button>
          <button className={`btn ${period === 'year' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPeriod('year')}>This Year</button>
          <button className={`btn ${period === 'custom' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPeriod('custom')}>Custom</button>
        </div>

        {period === 'custom' && (
          <form onSubmit={handleCustomDateSubmit} style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" value={customDates.startDate} onChange={e => setCustomDates({...customDates, startDate: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" value={customDates.endDate} onChange={e => setCustomDates({...customDates, endDate: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-primary">Apply</button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : reportData ? (
        <>
          <div className="summary-cards-grid" style={{ marginBottom: '2rem' }}>
            <div className="card summary-card">
              <div className="summary-card-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                <TrendingUp size={24} />
              </div>
              <div className="summary-card-info">
                <div className="summary-card-label">Total Income</div>
                <div className="summary-card-value">{formatCurrency(reportData.totalIncome)}</div>
              </div>
            </div>
            <div className="card summary-card">
              <div className="summary-card-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <TrendingDown size={24} />
              </div>
              <div className="summary-card-info">
                <div className="summary-card-label">Total Expenses</div>
                <div className="summary-card-value">{formatCurrency(reportData.totalExpenses)}</div>
              </div>
            </div>
            <div className="card summary-card">
              <div className="summary-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Wallet size={24} />
              </div>
              <div className="summary-card-info">
                <div className="summary-card-label">Net Balance</div>
                <div className="summary-card-value" style={{ color: reportData.netBalance >= 0 ? '#22c55e' : '#ef4444' }}>
                  {formatCurrency(reportData.netBalance)}
                </div>
              </div>
            </div>
            <div className="card summary-card">
              <div className="summary-card-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                <BarChart3 size={24} />
              </div>
              <div className="summary-card-info">
                <div className="summary-card-label">Savings Rate</div>
                <div className="summary-card-value">{Math.max(0, savingsRate).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Cash Flow</h3>
              <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                <Bar data={barChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Expense Breakdown</h3>
              {expenseCategories.length > 0 ? (
                <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                  <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                </div>
              ) : (
                <div className="empty-state" style={{ height: '300px', padding: 0, justifyContent: 'center' }}>
                  <p className="empty-state-description">No expenses in this period.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
