'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, ACCOUNT_TYPES, getAccountTypeIcon } from '@/lib/utils';
import { AccountIconComponent } from '@/components/ui/CategoryIcon';

interface Account {
  id: number;
  name: string;
  type: string;
  initial_balance: number;
  icon: string;
  color: string;
  balance: number;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: ACCOUNT_TYPES[0],
    initial_balance: '0',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const result = await res.json();
      if (result.success) {
        setAccounts(result.data);
      }
    } catch (error) {
      toast.error('Could not load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        type: account.type,
        initial_balance: account.initial_balance.toString(),
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        type: ACCOUNT_TYPES[0],
        initial_balance: '0',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts';
      const method = editingAccount ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        type: formData.type.toLowerCase(),
        initial_balance: parseFloat(formData.initial_balance),
        icon: getAccountTypeIcon(formData.type),
        color: '#3b82f6', // default color
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to save account');

      toast.success(`Account ${editingAccount ? 'updated' : 'created'} successfully`);
      fetchAccounts();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to delete account');
      
      toast.success('Account deleted');
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-description">Manage your financial accounts and balances.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Account
          </button>
        </div>
      </div>

      <div className="summary-cards-grid" style={{ marginBottom: '2rem' }}>
        <div className="card summary-card">
          <div className="summary-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Wallet size={24} />
          </div>
          <div className="summary-card-info">
            <div className="summary-card-label">Total Balance</div>
            <div className="summary-card-value">{formatCurrency(totalBalance)}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Wallet size={32} />
          </div>
          <h2 className="empty-state-title">No accounts yet</h2>
          <p className="empty-state-description">Add your first account to start tracking.</p>
        </div>
      ) : (
        <div className="summary-cards-grid">
          {accounts.map(account => (
            <div key={account.id} className="card summary-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="summary-card-icon" style={{ backgroundColor: account.color ? `${account.color}20` : '#f0f4f8', color: account.color || '#64748b' }}>
                    <AccountIconComponent type={account.type} size={22} />
                  </div>
                  <div>
                    <div className="summary-card-label" style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{account.name}</div>
                    <span className="badge badge-success">{account.type}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(account)} aria-label="Edit account">
                    <Pencil size={16} />
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => handleDelete(account.id)} 
                    disabled={isDeleting === account.id}
                    aria-label="Delete account"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Current Balance</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(account.balance)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingAccount ? 'Edit Account' : 'Add New Account'}</h3>
              <button className="btn btn-ghost" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form id="account-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Account Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <select 
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    {ACCOUNT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Balance</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({...formData, initial_balance: e.target.value})}
                    required
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={handleCloseModal}>Cancel</button>
              <button type="submit" form="account-form" className="btn btn-primary">
                {editingAccount ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
