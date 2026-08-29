import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp, NavTab } from '../../context/AppContext.js';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  CreditCard,
  Bell,
  HelpCircle,
  ShieldCheck,
  Settings,
  LogOut,
  X,
  GraduationCap,
  Monitor,
  Smartphone,
  Shield,
  User,
  ChevronRight,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    isMobileFrame,
    setIsMobileFrame,
  } = useApp();

  if (!isSidebarOpen || !user) return null;

  interface NavLinkItem {
    tab: NavTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  interface NavGroup {
    title: string;
    items: NavLinkItem[];
  }

  let groups: NavGroup[] = [];

  if (user.role === 'developer') {
    groups = [
      {
        title: 'Core Administration',
        items: [
          {
            tab: 'dashboard',
            label: 'System Dashboard',
            description: 'Metrics, collections & quick stats',
            icon: LayoutDashboard,
          },
          {
            tab: 'students',
            label: 'Student Directory',
            description: 'Enrolled students & records',
            icon: Users,
          },
          {
            tab: 'teachers',
            label: 'Faculty Management',
            description: 'Add & manage teacher logins',
            icon: UserCheck,
            badge: 'Admin',
          },
          {
            tab: 'attendance',
            label: 'Attendance Register',
            description: 'Classwise roll-call & summary',
            icon: CalendarCheck,
          },
          {
            tab: 'fees',
            label: 'Fee Management',
            description: 'Receipts, payments & dues',
            icon: CreditCard,
          },
        ],
      },
      {
        title: 'Communication & Doubts',
        items: [
          {
            tab: 'notices',
            label: 'Notice Board',
            description: 'Urgent announcements & circulars',
            icon: Bell,
          },
          {
            tab: 'doubts',
            label: 'Student Doubts Forum',
            description: 'Review queries & teacher replies',
            icon: HelpCircle,
          },
        ],
      },
      {
        title: 'Security & Maintenance',
        items: [
          {
            tab: 'audit',
            label: 'Security Audit Logs',
            description: 'System actions & event trail',
            icon: ShieldCheck,
          },
          {
            tab: 'settings',
            label: 'System Settings',
            description: 'Data backup & center config',
            icon: Settings,
          },
        ],
      },
    ];
  } else if (user.role === 'teacher') {
    groups = [
      {
        title: 'Academic Navigation',
        items: [
          {
            tab: 'dashboard',
            label: 'Teacher Home',
            description: 'Today’s schedule & quick tasks',
            icon: LayoutDashboard,
          },
          {
            tab: 'students',
            label: 'Assigned Students',
            description: 'Student list & profiles',
            icon: Users,
          },
          {
            tab: 'attendance',
            label: 'Mark Daily Attendance',
            description: 'Batch-wise daily roll call',
            icon: CalendarCheck,
          },
          {
            tab: 'fees',
            label: 'Fee Status Overview',
            description: 'Track paid & unpaid dues',
            icon: CreditCard,
          },
        ],
      },
      {
        title: 'Student Assistance',
        items: [
          {
            tab: 'doubts',
            label: 'Doubts & Inquiries',
            description: 'Answer student questions with solutions',
            icon: HelpCircle,
          },
          {
            tab: 'notices',
            label: 'Class Announcements',
            description: 'Post updates to your classes',
            icon: Bell,
          },
        ],
      },
    ];
  } else {
    // Student
    groups = [
      {
        title: 'Student Portal',
        items: [
          {
            tab: 'dashboard',
            label: 'My Dashboard',
            description: 'Personal overview & status',
            icon: LayoutDashboard,
          },
          {
            tab: 'attendance',
            label: 'My Attendance Record',
            description: 'Monthly presence percentage',
            icon: CalendarCheck,
          },
          {
            tab: 'fees',
            label: 'My Fee Receipts & Dues',
            description: 'Payment status & official receipts',
            icon: CreditCard,
          },
        ],
      },
      {
        title: 'Learning & Help',
        items: [
          {
            tab: 'doubts',
            label: 'Ask Subject Doubts',
            description: 'Ask questions & get teacher solutions',
            icon: HelpCircle,
          },
          {
            tab: 'notices',
            label: 'Tuition Notices',
            description: 'Exam schedules & holiday circulars',
            icon: Bell,
          },
        ],
      },
    ];
  }

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-xs">
      {/* Backdrop Overlay */}
      <div
        onClick={() => setIsSidebarOpen(false)}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
      />

      {/* Slide-in Panel */}
      <div className="fixed inset-y-0 left-0 max-w-[320px] w-full bg-white shadow-2xl z-50 flex flex-col justify-between overflow-hidden border-r border-slate-200 animate-slide-right">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/20">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 tracking-tight leading-none">
                Manasthali Tutions
              </h3>
              <p className="text-[10px] text-slate-500 font-medium capitalize mt-0.5">
                Navigation Menu
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {groups.map((grp, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {grp.title}
              </p>

              <div className="space-y-1">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.tab;

                  return (
                    <button
                      key={item.tab}
                      onClick={() => handleSelectTab(item.tab)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-slate-900">{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded border border-amber-200">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{item.description}</p>
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'text-indigo-600' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer & Current User Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/90 space-y-2.5">
          {/* Active Profile Info */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 font-bold">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                ) : user.role === 'developer' ? (
                  <Shield className="w-4 h-4 text-amber-600" />
                ) : user.role === 'teacher' ? (
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                ) : (
                  <User className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-slate-900 truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-mono capitalize">
                  {user.role === 'developer' ? 'Superadmin' : user.role}
                  {user.rollNumber ? ` • Roll #${user.rollNumber}` : ''}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
              {user.role}
            </span>
          </div>

          {/* Quick Viewport Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMobileFrame((prev) => !prev)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-[11px] font-medium cursor-pointer"
            >
              {isMobileFrame ? (
                <>
                  <Monitor className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Desktop Mode</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mobile Frame</span>
                </>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={async () => {
                setIsSidebarOpen(false);
                await logout();
              }}
              className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors text-[11px] font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
