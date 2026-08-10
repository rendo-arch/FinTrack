'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { EXPENSE_CATEGORIES, BUDGET_PERIODS, formatCurrency, calculatePercentage } from '@/lib/utils';

interface Budget {
  id: number;
  category: string;
  budget_limit: number;
  period: string;
  start_date: string;
  spent: number;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0],
    budget_limit: '',
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets');
      if (!res.ok) throw new Error('Failed to fetch budgets');
      const result = await res.json();
      if (result.success) {
        setBudgets(result.data);
      }
    } catch (error) {
      toast.error('Could not load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        category: budget.category,
        budget_limit: budget.budget_limit.toString(),
        period: budget.period,
        start_date: budget.start_date.split('T')[0],
      });
    } else {
      setEditingBudget(null);
      setFormData({
        category: EXPENSE_CATEGORIES[0],
        budget_limit: '',
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBudget ? `/api/budgets/${editingBudget.id}` : '/api/budgets';
      const method = editingBudget ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        budget_limit: parseFloat(formData.budget_limit),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to save budget');

      toast.success(`Budget ${editingBudget ? 'updated' : 'created'} successfully`);
      fetchBudgets();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to delete budget');
      
      toast.success('Budget deleted');
      fetchBudgets();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-description">Manage your spending limits by category.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Budget
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : budgets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Plus size={32} />
          </div>
          <h2 className="empty-state-title">No budgets yet</h2>
          <p className="empty-state-description">Create a budget to track your spending limits.</p>
        </div>
      ) : (
        <div className="summary-cards-grid">
          {budgets.map(budget => {
            const percentage = calculatePercentage(budget.spent, budget.budget_limit);
            const remaining = Math.max(0, budget.budget_limit - budget.spent);
            const isExceeded = budget.spent > budget.budget_limit;
            
            let progressColor = '#22c55e'; // green
            if (isExceeded) progressColor = '#ef4444'; // red
            else if (percentage >= 75) progressColor = '#f59e0b'; // yellow

            return (
              <div key={budget.id} className="card summary-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div className="summary-card-label" style={{ textTransform: 'capitalize' }}>{budget.category} ({budget.period})</div>
                    <div className="summary-card-value">{formatCurrency(budget.spent)}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      of {formatCurrency(budget.budget_limit)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(budget)} aria-label="Edit budget">
                      <Pencil size={16} />
                    </button>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => handleDelete(budget.id)} 
                      disabled={isDeleting === budget.id}
                      aria-label="Delete budget"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="progress-bar" style={{ marginBottom: '0.5rem' }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`, 
                      backgroundColor: progressColor 
                    }}
                  ></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{remaining > 0 ? `${formatCurrency(remaining)} left` : '0 left'}</span>
                  <span style={{ fontWeight: 500 }}>{percentage}%</span>
                </div>

                {isExceeded && (
                  <div className="badge badge-danger" style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertTriangle size={14} /> Budget exceeded!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingBudget ? 'Edit Budget' : 'Add New Budget'}</h3>
              <button className="btn btn-ghost" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form id="budget-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Budget Limit</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.budget_limit}
                    onChange={(e) => setFormData({...formData, budget_limit: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Period</label>
                  <select 
                    className="form-select"
                    value={formData.period}
                    onChange={(e) => setFormData({...formData, period: e.target.value})}
                    required
                  >
                    {BUDGET_PERIODS.map(p => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={handleCloseModal}>Cancel</button>
              <button type="submit" form="budget-form" className="btn btn-primary">
                {editingBudget ? 'Save Changes' : 'Create Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
