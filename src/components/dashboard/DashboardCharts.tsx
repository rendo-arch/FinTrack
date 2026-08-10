'use client';

import { useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

type ChartDataType = {
  monthlyData: { month: string; income: number; expenses: number }[];
  expenseDistribution: { category: string; amount: number; color: string }[];
};

export default function DashboardCharts({ data }: { data: ChartDataType }) {
  const [period, setPeriod] = useState<'month' | 'year'>('year');

  const barChartData = {
    labels: data.monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Income',
        data: data.monthlyData.map(d => d.income),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 6,
        borderSkipped: false as const,
      },
      {
        label: 'Expenses',
        data: data.monthlyData.map(d => d.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderRadius: 6,
        borderSkipped: false as const,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: 'Inter', size: 12 },
        },
      },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          callback: (value: any) => `₱${(value / 1000).toFixed(0)}k`,
          font: { family: 'Inter', size: 11 },
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 } },
      },
    },
  };

  const doughnutData = {
    labels: data.expenseDistribution.map(d => d.category),
    datasets: [
      {
        data: data.expenseDistribution.map(d => d.amount),
        backgroundColor: data.expenseDistribution.map(d => d.color),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { family: 'Inter', size: 12 },
        },
      },
    },
  };

  return (
    <div className="charts-container">
      <div className="chart-section">
        <div className="chart-header">
          <h3>Income vs Expenses</h3>
          <select 
            className="form-select chart-period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'month' | 'year')}
          >
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div className="chart-wrapper" style={{ height: '280px' }}>
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>

      <div className="chart-section" style={{ marginTop: '2rem' }}>
        <div className="chart-header">
          <h3>Expense Distribution</h3>
        </div>
        <div className="chart-wrapper" style={{ height: '260px' }}>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}
