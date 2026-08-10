'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, INCOME_CATEGORIES } from '@/lib/utils';

interface IncomeRecord {
  id: number;
  source: string;
  category: string;
  amount: number;
  account_id: number;
  date: string;
  description: string;
  account_name: string;
}

interface AccountRecord {
  id: number;
  name: string;
}

export default function IncomePage() {
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IncomeRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    source: '',
    category: 'Salary',
    amount: '',
    account_id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incomeRes, accountsRes] = await Promise.all([
        fetch('/api/income'),
        fetch('/api/accounts'),
      ]);
      const incomeData = await incomeRes.json();
      const accountsData = await accountsRes.json();
      setRecords(incomeData.data || []);
      setAccounts(accountsData.data || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchSearch = r.source.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || r.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [records, search, categoryFilter]);

  const openAddModal = () => {
    setEditingRecord(null);
    setForm({
      source: '', category: 'Salary', amount: '',
      account_id: accounts[0]?.id?.toString() || '', 
      date: new Date().toISOString().split('T')[0], description: '',
    });
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (record: IncomeRecord) => {
    setEditingRecord(record);
    setForm({
      source: record.source,
      category: record.category,
      amount: record.amount.toString(),
      account_id: record.account_id.toString(),
      date: record.date,
      description: record.description || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.source.trim()) errs.source = 'Source is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Amount must be greater than 0';
    if (!form.account_id) errs.account_id = 'Account is required';
    if (!form.date) errs.date = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const url = editingRecord ? `/api/income/${editingRecord.id}` : '/api/income';
      const method = editingRecord ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: form.source,
          category: form.category.toLowerCase(),
          amount: Number(form.amount),
          account_id: Number(form.account_id),
          date: form.date,
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(editingRecord ? 'Income updated!' : 'Income added!');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/income/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Income deleted!');
      setShowDeleteModal(false);
      setDeletingId(null);
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Income</h1>
          <p className="page-description">Manage your income sources</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Income
          </button>
        </div>
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Search income sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {INCOME_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : records.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state-title">No income recorded yet</h3>
          <p className="empty-state-description">Start by adding your first income source.</p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Income
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => (
                <tr key={record.id}>
                  <td>
                    <div>{record.source}</div>
                    {record.description && (
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{record.description}</div>
                    )}
                  </td>
                  <td><span className="badge">{record.category}</span></td>
                  <td className="amount-income">{formatCurrency(record.amount)}</td>
                  <td>{record.account_name}</td>
                  <td>{formatDate(record.date)}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(record)}>
                      <Pencil size={16} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setDeletingId(record.id);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingRecord ? 'Edit Income' : 'Add Income'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Source</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                />
                {errors.source && <span className="form-error">{errors.source}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {INCOME_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
                {errors.amount && <span className="form-error">{errors.amount}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Account</label>
                <select
                  className="form-select"
                  value={form.account_id}
                  onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                >
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                {errors.account_id && <span className="form-error">{errors.account_id}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
                {errors.date && <span className="form-error">{errors.date}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={submitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this income record? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
