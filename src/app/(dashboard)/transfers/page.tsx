'use client';

import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, ArrowLeftRight, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Account {
  id: number;
  name: string;
}

interface Transfer {
  id: number;
  from_account_id: number;
  to_account_id: number;
  amount: number;
  description: string;
  date: string;
  from_account_name?: string;
  to_account_name?: string;
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transfersRes, accountsRes] = await Promise.all([
        fetch('/api/transfers'),
        fetch('/api/accounts'),
      ]);

      if (!transfersRes.ok || !accountsRes.ok) throw new Error('Failed to fetch data');

      const transfersResult = await transfersRes.json();
      const accountsResult = await accountsRes.json();

      if (transfersResult.success) setTransfers(transfersResult.data);
      if (accountsResult.success) setAccounts(accountsResult.data);
    } catch (error) {
      toast.error('Could not load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      from_account_id: accounts.length > 0 ? accounts[0].id.toString() : '',
      to_account_id: accounts.length > 1 ? accounts[1].id.toString() : '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.from_account_id === formData.to_account_id) {
      toast.error('Source and destination accounts must be different');
      return;
    }

    try {
      const payload = {
        from_account_id: parseInt(formData.from_account_id),
        to_account_id: parseInt(formData.to_account_id),
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
      };

      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to create transfer');

      toast.success('Transfer successful');
      fetchData();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transfer? This may affect account balances.')) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/transfers/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to delete transfer');
      
      toast.success('Transfer deleted');
      fetchData();
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
          <h1 className="page-title">Transfers</h1>
          <p className="page-description">Move money between your accounts.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleOpenModal} disabled={accounts.length < 2}>
            <Plus size={18} />
            New Transfer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : transfers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ArrowLeftRight size={32} />
          </div>
          <h2 className="empty-state-title">No transfers yet</h2>
          <p className="empty-state-description">Move money between your accounts.</p>
          {accounts.length < 2 && (
            <p className="empty-state-description" style={{ color: 'var(--danger-color)', marginTop: '0.5rem' }}>
              You need at least 2 accounts to make a transfer.
            </p>
          )}
        </div>
      ) : (
        <div className="card table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transfer</th>
                <th>Amount</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(transfer => (
                <tr key={transfer.id}>
                  <td>{formatDate(transfer.date)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-warning">{transfer.from_account_name}</span>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                      <span className="badge badge-success">{transfer.to_account_name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{formatCurrency(transfer.amount)}</td>
                  <td>{transfer.description || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => handleDelete(transfer.id)}
                      disabled={isDeleting === transfer.id}
                      style={{ color: 'var(--danger-color)' }}
                    >
                      <Trash2 size={16} />
                    </button>
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
              <h3>New Transfer</h3>
              <button className="btn btn-ghost" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form id="transfer-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">From Account</label>
                  <select 
                    className="form-select"
                    value={formData.from_account_id}
                    onChange={(e) => setFormData({...formData, from_account_id: e.target.value})}
                    required
                  >
                    <option value="">Select account...</option>
                    {accounts.map(acc => (
                      <option key={`from-${acc.id}`} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">To Account</label>
                  <select 
                    className="form-select"
                    value={formData.to_account_id}
                    onChange={(e) => setFormData({...formData, to_account_id: e.target.value})}
                    required
                  >
                    <option value="">Select account...</option>
                    {accounts.map(acc => (
                      <option key={`to-${acc.id}`} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
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
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
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
              <button type="submit" form="transfer-form" className="btn btn-primary">
                Transfer Funds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
