'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrency } from '@/components/providers/CurrencyProvider';

interface UserSettings {
  id: number;
  name: string;
  email: string;
  currency: string;
  created_at: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { setCurrency } = useCurrency();
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    currency: '₱',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const result = await res.json();
      if (result.success) {
        setSettings(result.data);
        setProfileForm({
          name: result.data.name,
          email: result.data.email,
          currency: result.data.currency,
        });
      }
    } catch (error) {
      toast.error('Could not load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to update profile');
      toast.success('Profile updated successfully');
      setSettings(result.data);
      setCurrency(profileForm.currency);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to update password');
      
      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Manage your account preferences and security.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '2rem', maxWidth: '800px' }}>
        
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <User size={20} style={{ color: 'var(--primary-color)' }} />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Profile Settings</h2>
          </div>
          
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={profileForm.name} 
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={profileForm.email} 
                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Default Currency</label>
              <select 
                className="form-select" 
                value={profileForm.currency} 
                onChange={(e) => setProfileForm({...profileForm, currency: e.target.value})}
              >
                <option value="₱">PHP (₱)</option>
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <Lock size={20} style={{ color: 'var(--primary-color)' }} />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Change Password</h2>
          </div>
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={passwordForm.currentPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={passwordForm.newPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={passwordForm.confirmPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                required 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary">
                Update Password
              </button>
            </div>
          </form>
        </div>
        
      </div>
    </div>
  );
}
