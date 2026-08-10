'use client';

import {
  Utensils, Car, BookOpen, Zap, Heart, Gamepad2, ShoppingBag, FileText,
  User, Banknote, Coins, Laptop, Gift, Briefcase, MoreHorizontal,
  Landmark, Smartphone, PiggyBank, CreditCard, Wallet
} from 'lucide-react';
import { getCategoryIcon, getAccountTypeIcon } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<any>> = {
  Utensils, Car, BookOpen, Zap, Heart, Gamepad2, ShoppingBag, FileText,
  User, Banknote, Coins, Laptop, Gift, Briefcase, MoreHorizontal,
  Landmark, Smartphone, PiggyBank, CreditCard, Wallet
};

export function CategoryIconComponent({ category, size = 18, className = '' }: { category: string; size?: number; className?: string }) {
  const iconName = getCategoryIcon(category);
  const Icon = iconMap[iconName] || MoreHorizontal;
  return <Icon size={size} className={className} />;
}

export function AccountIconComponent({ type, size = 18, className = '' }: { type: string; size?: number; className?: string }) {
  const iconName = getAccountTypeIcon(type);
  const Icon = iconMap[iconName] || CreditCard;
  return <Icon size={size} className={className} />;
}
