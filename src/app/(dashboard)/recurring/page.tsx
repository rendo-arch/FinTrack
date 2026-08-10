'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Repeat, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, FREQUENCIES } from '@/lib/utils';

interface Account {
  id: number;
  name: string;
}

interface RecurringPayment {
  id: number;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  next_payment_date: string;
  account_id: number;
  description: string;
  is_active: boolean;
  account_name?: string;
}

export default function RecurringPage() {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    frequency: FREQUENCIES[1], // Monthly
    next_payment_date: new Date().toISOString().split('T')[0],
    account_id: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, accountsRes] = await Promise.all([
        fetch('/api/recurring'),
        fetch('/api/accounts'),
      ]);

      if (!paymentsRes.ok || !accountsRes.ok) throw new Error('Failed to fetch data');

      const paymentsResult = await paymentsRes.json();
      const accountsResult = await accountsRes.json();

      if (paymentsResult.success) setPayments(paymentsResult.data);
      if (accountsResult.success) {
        setAccounts(accountsResult.data);
        if (accountsResult.data.length > 0 && !formData.account_id) {
          setFormData(prev => ({ ...prev, account_id: accountsResult.data[0].id.toString() }));
        }
      }
    } catch (error) {
      toast.error('Could not load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (payment?: RecurringPayment) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        name: payment.name,
        amount: payment.amount.toString(),
        category: payment.category,
        frequency: payment.frequency,
        next_payment_date: payment.next_payment_date.split('T')[0],
        account_id: payment.account_id.toString(),
        description: payment.description || '',
      });
    } else {
      setEditingPayment(null);
      setFormData({
        name: '',
        amount: '',
        category: EXPENSE_CATEGORIES[0],
        frequency: FREQUENCIES[1],
        next_payment_date: new Date().toISOString().split('T')[0],
        account_id: accounts.length > 0 ? accounts[0].id.toString() : '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPayment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPayment ? `/api/recurring/${editingPayment.id}` : '/api/recurring';
      const method = editingPayment ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        account_id: parseInt(formData.account_id),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to save payment');

      toast.success(`Payment ${editingPayment ? 'updated' : 'created'} successfully`);
      fetchData();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recurring payment?')) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to delete payment');
      
      toast.success('Payment deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleStatus = async (payment: RecurringPayment) => {
    try {
      const res = await fetch(`/api/recurring/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payment, is_active: !payment.is_active }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to update status');
      
      toast.success(`Payment ${!payment.is_active ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Recurring Payments</h1>
          <p className="page-description">Manage your subscriptions and regular bills.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Payment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Repeat size={32} />
          </div>
          <h2 className="empty-state-title">No recurring payments</h2>
          <p className="empty-state-description">Set up automatic tracking for bills.</p>
        </div>
      ) : (
        <div className="card table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Details</th>
                <th>Next Payment</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} style={{ opacity: payment.is_active ? 1 : 0.6 }}>
                  <td style={{ fontWeight: '500' }}>{payment.name}</td>
                  <td style={{ fontWeight: 'bold' }}>{formatCurrency(payment.amount)}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span className="badge badge-warning" style={{ alignSelf: 'flex-start' }}>{payment.category}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payment.account_name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{formatDate(payment.next_payment_date)}</span>
                      <span className="badge" style={{ backgroundColor: 'var(--bg-light)', color: 'var(--text-main)' }}>
                        {payment.frequency}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button 
                      className={`badge ${payment.is_active ? 'badge-success' : 'badge-danger'}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                      onClick={() => toggleStatus(payment)}
                    >
                      {payment.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(payment)}>
                        <Pencil size={16} />
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => handleDelete(payment.id)}
                        disabled={isDeleting === payment.id}
                        style={{ color: 'var(--danger-color)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingPayment ? 'Edit Recurring Payment' : 'New Recurring Payment'}</h3>
              <button className="btn btn-ghost" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form id="recurring-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                    <label className="form-label">Frequency</label>
                    <select 
                      className="form-select"
                      value={formData.frequency}
                      onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                      required
                    >
                      {FREQUENCIES.map(freq => (
                        <option key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Account</label>
                  <select 
                    className="form-select"
                    value={formData.account_id}
                    onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                    required
                  >
                    <option value="" disabled>Select account...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Next Payment Date</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={formData.next_payment_date}
                    onChange={(e) => setFormData({...formData, next_payment_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea 
                    className="form-textarea"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={handleCloseModal}>Cancel</button>
              <button type="submit" form="recurring-form" className="btn btn-primary">
                {editingPayment ? 'Save Changes' : 'Create Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
