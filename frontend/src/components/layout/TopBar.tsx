import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export interface TopBarProps {
  onMenuToggle: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageInfo = (): { title: string; subtitle?: string } => {
    const path = location.pathname;
    if (path.startsWith('/billing')) {
      return { title: 'Billing Counter', subtitle: 'Search products, apply points, and process orders' };
    }
    if (path.startsWith('/customers/') && path !== '/customers') {
      return { title: 'Customer Profile', subtitle: 'View customer details and transaction history' };
    }
    if (path.startsWith('/customers')) {
      return { title: 'Customer Directory', subtitle: 'Manage loyalty members and customer records' };
    }
    if (path.startsWith('/products')) {
      return { title: 'Products & Categories', subtitle: 'Maintain inventory levels, pricing, and categories' };
    }
    if (path.startsWith('/reports')) {
      return { title: 'Analytics & Insights', subtitle: 'Monitor sales volume, top spenders, and low stock' };
    }
    if (path.startsWith('/staff')) {
      return { title: 'Staff Administration', subtitle: 'Manage user access and assigned store roles' };
    }
    return { title: 'SuperMart' };
  };

  const { title, subtitle } = getPageInfo();
  const role = user?.role;
  const roleBadgeVariant =
    role === 'ADMIN' ? 'admin' : role === 'MANAGER' ? 'manager' : 'cashier';

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/90 backdrop-blur px-4 sm:px-6">
      {/* Left side: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="hidden sm:block text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side: User summary & quick logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2.5 text-right">
          <div>
            <p className="text-sm font-semibold text-slate-800">{user?.name || 'Staff'}</p>
            <div className="flex justify-end">
              <Badge variant={roleBadgeVariant} className="text-[10px] py-0 px-1.5 uppercase font-medium">
                {role}
              </Badge>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <UserIcon className="w-4 h-4" />
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          title="Sign out"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
