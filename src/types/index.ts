// User
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

// Account
export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet' | 'savings' | 'other';
  initial_balance: number;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
  // Computed
  balance?: number;
}

// Income
export interface Income {
  id: number;
  user_id: number;
  account_id: number;
  source: string;
  category: 'salary' | 'allowance' | 'freelance' | 'gift' | 'business' | 'other';
  amount: number;
  date: string;
  description: string;
  created_at: string;
  // Joined
  account_name?: string;
}

// Expense
export interface Expense {
  id: number;
  user_id: number;
  account_id: number;
  name: string;
  category: 'food' | 'transportation' | 'education' | 'utilities' | 'healthcare' | 'entertainment' | 'shopping' | 'bills' | 'personal' | 'other';
  amount: number;
  payment_method: string;
  date: string;
  description: string;
  created_at: string;
  // Joined
  account_name?: string;
}

// Budget
export interface Budget {
  id: number;
  user_id: number;
  category: string;
  budget_limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  created_at: string;
  updated_at: string;
  // Computed
  spent?: number;
  remaining?: number;
  percentage?: number;
}

// SavingsGoal
export interface SavingsGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description: string;
  created_at: string;
  updated_at: string;
  // Computed
  percentage?: number;
  remaining?: number;
  days_remaining?: number;
}

// Transfer
export interface Transfer {
  id: number;
  user_id: number;
  from_account_id: number;
  to_account_id: number;
  amount: number;
  description: string;
  date: string;
  created_at: string;
  // Joined
  from_account_name?: string;
  to_account_name?: string;
}

// RecurringPayment
export interface RecurringPayment {
  id: number;
  user_id: number;
  account_id: number;
  name: string;
  amount: number;
  category: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  next_payment_date: string;
  description: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  // Joined
  account_name?: string;
}

// Dashboard summary
export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  totalSavings: number;
}

// Chart data
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form state
export interface FormErrors {
  [key: string]: string;
}
