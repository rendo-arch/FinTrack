'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Target, PiggyBank } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, calculatePercentage, getDaysRemaining } from '@/lib/utils';

interface SavingsGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description: string;
}

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    target_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [fundAmount, setFundAmount] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/savings');
      if (!res.ok) throw new Error('Failed to fetch savings goals');
      const result = await res.json();
      if (result.success) {
        setGoals(result.data);
      }
    } catch (error) {
      toast.error('Could not load savings goals');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (goal?: SavingsGoal) => {
    if (goal) {
      setSelectedGoal(goal);
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount.toString(),
        current_amount: goal.current_amount.toString(),
        target_date: goal.target_date.split('T')[0],
        description: goal.description || '',
      });
    } else {
      setSelectedGoal(null);
      setFormData({
        name: '',
        target_amount: '',
        current_amount: '0',
        target_date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenFundModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setFundAmount('');
    setIsFundModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsFundModalOpen(false);
    setSelectedGoal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedGoal ? `/api/savings/${selectedGoal.id}` : '/api/savings';
      const method = selectedGoal ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to save goal');

      toast.success(`Goal ${selectedGoal ? 'updated' : 'created'} successfully`);
      fetchGoals();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      const amountToAdd = parseFloat(fundAmount);
      if (isNaN(amountToAdd) || amountToAdd <= 0) throw new Error('Invalid amount');
      
      const newAmount = selectedGoal.current_amount + amountToAdd;
      
      const res = await fetch(`/api/savings/${selectedGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedGoal, current_amount: newAmount }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to add funds');

      toast.success('Funds added successfully');
      fetchGoals();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/savings/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to delete goal');
      
      toast.success('Goal deleted');
      fetchGoals();
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
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-description">Track and manage your savings targets.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Goal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Target size={32} />
          </div>
          <h2 className="empty-state-title">No savings goals yet</h2>
          <p className="empty-state-description">Start saving for your dreams!</p>
        </div>
      ) : (
        <div className="summary-cards-grid">
          {goals.map(goal => {
            const percentage = calculatePercentage(goal.current_amount, goal.target_amount);
            const remaining = Math.max(0, goal.target_amount - goal.current_amount);
            const daysLeft = getDaysRemaining(goal.target_date);

            return (
              <div key={goal.id} className="card summary-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div className="summary-card-label" style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{goal.name}</div>
                    <div className="summary-card-value">{formatCurrency(goal.current_amount)}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      of {formatCurrency(goal.target_amount)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(goal)} aria-label="Edit goal">
                      <Pencil size={16} />
                    </button>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => handleDelete(goal.id)} 
                      disabled={isDeleting === goal.id}
                      aria-label="Delete goal"
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
                      backgroundColor: percentage >= 100 ? '#22c55e' : 'var(--primary-color)' 
                    }}
                  ></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{remaining > 0 ? `${formatCurrency(remaining)} left` : 'Goal reached!'}</span>
                  <span style={{ fontWeight: 500 }}>{percentage}%</span>
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Target Date: {formatDate(goal.target_date)} ({daysLeft > 0 ? `${daysLeft} days left` : 'Passed'})
                </div>

                <button 
                  className="btn btn-primary btn-sm" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleOpenFundModal(goal)}
                >
                  <PiggyBank size={16} /> Add Funds
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{selectedGoal ? 'Edit Savings Goal' : 'Add New Goal'}</h3>
              <button className="btn btn-ghost" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form id="goal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Goal Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Amount</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                    required
                  />
                </div>
                {!selectedGoal && (
                  <div className="form-group">
                    <label className="form-label">Initial Amount</label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={formData.current_amount}
                      onChange={(e) => setFormData({...formData, current_amount: e.target.value})}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Target Date</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea 
                    className="form-textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={handleCloseModal}>Cancel</button>
              <button type="submit" form="goal-form" className="btn btn-primary">
                {selectedGoal ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isFundModalOpen && selectedGoal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Funds to {selectedGoal.name}</h3>
              <button className="btn btn-ghost" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form id="fund-form" onSubmit={handleAddFunds}>
                <div className="form-group">
                  <label className="form-label">Amount to Add</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    required
                  />
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Current balance: {formatCurrency(selectedGoal.current_amount)}
                </p>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={handleCloseModal}>Cancel</button>
              <button type="submit" form="fund-form" className="btn btn-primary">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
