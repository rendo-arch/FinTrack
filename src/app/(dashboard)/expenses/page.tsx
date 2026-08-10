'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/utils';

interface ExpenseRecord {
  id: number;
  name: string;
  category: string;
  amount: number;
  account_id: number;
  payment_method: string;
  date: string;
  description: string;
  account_name: string;
}

interface AccountRecord {
  id: number;
  name: string;
}

export default function ExpensesPage() {
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    category: EXPENSE_CATEGORIES[0] || 'Housing',
    amount: '',
    account_id: '',
    payment_method: PAYMENT_METHODS[0] || 'Cash',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesRes, accountsRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/accounts'),
      ]);
      const expensesData = await expensesRes.json();
      const accountsData = await accountsRes.json();
      setRecords(expensesData.data || []);
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
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || r.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [records, search, categoryFilter]);

  const openAddModal = () => {
    setEditingRecord(null);
    setForm({
      name: '', category: EXPENSE_CATEGORIES[0] || 'Housing', amount: '',
      account_id: accounts[0]?.id?.toString() || '', 
      payment_method: PAYMENT_METHODS[0] || 'Cash',
      date: new Date().toISOString().split('T')[0], description: '',
    });
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (record: ExpenseRecord) => {
    setEditingRecord(record);
    setForm({
      name: record.name,
      category: record.category,
      amount: record.amount.toString(),
      account_id: record.account_id.toString(),
      payment_method: record.payment_method || 'Cash',
      date: record.date,
      description: record.description || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Amount must be greater than 0';
    if (!form.account_id) errs.account_id = 'Account is required';
    if (!form.date) errs.date = 'Date is required';
    if (!form.payment_method) errs.payment_method = 'Payment method is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const url = editingRecord ? `/api/expenses/${editingRecord.id}` : '/api/expenses';
      const method = editingRecord ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category.toLowerCase(),
          amount: Number(form.amount),
          account_id: Number(form.account_id),
          payment_method: form.payment_method,
          date: form.date,
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(editingRecord ? 'Expense updated!' : 'Expense added!');
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
      const res = await fetch(`/api/expenses/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Expense deleted!');
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
          <h1 className="page-title">Expenses</h1>
          <p className="page-description">Manage your expenses</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Search expenses..."
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
          {EXPENSE_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : records.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state-title">No expenses recorded yet</h3>
          <p className="empty-state-description">Start tracking your spending.</p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Expense
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Account</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => (
                <tr key={record.id}>
                  <td>
                    <div>{record.name}</div>
                    {record.description && (
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{record.description}</div>
                    )}
                  </td>
                  <td><span className="badge">{record.category}</span></td>
                  <td className="amount-expense">-{formatCurrency(record.amount)}</td>
                  <td>{record.payment_method}</td>
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
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
              <h2>{editingRecord ? 'Edit Expense' : 'Add Expense'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map(c => (
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
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {errors.payment_method && <span className="form-error">{errors.payment_method}</span>}
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
              <p>Are you sure you want to delete this expense record? This action cannot be undone.</p>
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
