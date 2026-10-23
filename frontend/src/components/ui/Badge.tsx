import React from 'react';

export type BadgeVariant = 'active' | 'inactive' | 'lowStock' | 'cashier' | 'manager' | 'admin' | 'info';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children, className = '' }) => {
  const variantStyles: Record<BadgeVariant, string> = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    inactive: 'bg-gray-100 text-gray-700 border-gray-200',
    lowStock: 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse',
    cashier: 'bg-sky-100 text-sky-800 border-sky-200',
    manager: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-rose-100 text-rose-800 border-rose-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
