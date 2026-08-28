import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp, NavTab } from '../../context/AppContext.js';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Bell,
  HelpCircle,
  ShieldCheck,
  Settings,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const { activeTab, setActiveTab } = useApp();

  if (!user) return null;

  interface NavItem {
    tab: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  let items: NavItem[] = [];

  if (user.role === 'developer') {
    items = [
      { tab: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { tab: 'students', label: 'Students', icon: Users },
      { tab: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { tab: 'fees', label: 'Fees', icon: CreditCard },
      { tab: 'notices', label: 'Notices', icon: Bell },
      { tab: 'doubts', label: 'Doubts', icon: HelpCircle },
      { tab: 'audit', label: 'Audit Logs', icon: ShieldCheck },
      { tab: 'settings', label: 'Config', icon: Settings },
    ];
  } else if (user.role === 'teacher') {
    items = [
      { tab: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { tab: 'students', label: 'Students', icon: Users },
      { tab: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { tab: 'fees', label: 'Fees', icon: CreditCard },
      { tab: 'notices', label: 'Notices', icon: Bell },
      { tab: 'doubts', label: 'Doubts', icon: HelpCircle },
    ];
  } else {
    // Student
    items = [
      { tab: 'dashboard', label: 'My Home', icon: LayoutDashboard },
      { tab: 'attendance', label: 'Attendance', icon: CalendarCheck },
      { tab: 'fees', label: 'My Fees', icon: CreditCard },
      { tab: 'notices', label: 'Notices', icon: Bell },
      { tab: 'doubts', label: 'Ask Doubt', icon: HelpCircle },
    ];
  }

  return (
    <nav className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-xs transition-all">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;

          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 relative min-w-[50px] ${
                isActive
                  ? 'text-indigo-600 bg-indigo-50/80 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-indigo-600 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
