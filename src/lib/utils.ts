export function formatCurrency(amount: number, currency: string = '₱'): string {
  return `${currency}${Math.abs(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateInput(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return formatDateShort(dateStr);
}

export function getDaysRemaining(targetDate: string): number {
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function calculatePercentage(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    food: 'Utensils',
    transportation: 'Car',
    education: 'BookOpen',
    utilities: 'Zap',
    healthcare: 'Heart',
    entertainment: 'Gamepad2',
    shopping: 'ShoppingBag',
    bills: 'FileText',
    personal: 'User',
    salary: 'Banknote',
    allowance: 'Coins',
    freelance: 'Laptop',
    gift: 'Gift',
    business: 'Briefcase',
    other: 'MoreHorizontal',
  };
  return icons[category.toLowerCase()] || 'MoreHorizontal';
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    food: '#f59e0b',
    transportation: '#3b82f6',
    education: '#8b5cf6',
    utilities: '#10b981',
    healthcare: '#ef4444',
    entertainment: '#ec4899',
    shopping: '#f97316',
    bills: '#6366f1',
    personal: '#14b8a6',
    salary: '#22c55e',
    allowance: '#06b6d4',
    freelance: '#a855f7',
    gift: '#f43f5e',
    business: '#0ea5e9',
    other: '#64748b',
  };
  return colors[category.toLowerCase()] || '#64748b';
}

export function getAccountTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    cash: 'Banknote',
    bank: 'Landmark',
    'e-wallet': 'Smartphone',
    savings: 'PiggyBank',
    other: 'CreditCard',
  };
  return icons[type.toLowerCase()] || 'CreditCard';
}

export function getDateRange(period: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start: Date;
  
  switch (period) {
    case 'weekly':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  return { start: start.toISOString().split('T')[0], end };
}

export function validateRequired(value: string | number | undefined, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validatePositiveNumber(value: number, fieldName: string): string | null {
  if (isNaN(value) || value <= 0) {
    return `${fieldName} must be greater than 0`;
  }
  return null;
}

export function validateDate(dateStr: string, fieldName: string): string | null {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

export const INCOME_CATEGORIES: string[] = ['Salary', 'Allowance', 'Freelance', 'Gift', 'Business', 'Other'];
export const EXPENSE_CATEGORIES: string[] = ['Food', 'Transportation', 'Education', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Bills', 'Personal', 'Other'];
export const ACCOUNT_TYPES: string[] = ['Cash', 'Bank', 'E-wallet', 'Savings', 'Other'];
export const PAYMENT_METHODS: string[] = ['Cash', 'Credit Card', 'Debit Card', 'E-wallet', 'Bank Transfer', 'Other'];
export const BUDGET_PERIODS: string[] = ['Weekly', 'Monthly', 'Yearly'];
export const FREQUENCIES: string[] = ['Weekly', 'Monthly', 'Yearly'];
