import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import {
  GraduationCap,
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Monitor,
  Download,
  LogOut,
  Shield,
  UserCheck,
  ChevronDown,
  User,
  Menu,
} from 'lucide-react';

export const TopHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    isOnline,
    queueCount,
    isSyncing,
    triggerSync,
    isMobileFrame,
    setIsMobileFrame,
    deferredPrompt,
    installPWA,
    setActiveTab,
    setIsSidebarOpen,
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 py-2.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Brand & Menu Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900">Manasthali Tutions</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium capitalize leading-tight">
                {user ? `${user.role === 'developer' ? 'Superadmin' : user.role} Portal` : 'Tuition Management'}
              </p>
            </div>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Online / Offline / Sync Indicator */}
          <button
            onClick={triggerSync}
            disabled={!isOnline || isSyncing || queueCount === 0}
            title={
              !isOnline
                ? 'Working Offline. Changes will sync when reconnected.'
                : queueCount > 0
                ? `${queueCount} pending changes. Click to sync now.`
                : 'All changes synced with server.'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              !isOnline
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : queueCount > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 animate-pulse cursor-pointer'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px]">Offline</span>
              </>
            ) : queueCount > 0 ? (
              <>
                <RefreshCw className={`w-3 h-3 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-[11px]">{queueCount} Sync</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] hidden sm:inline">Live</span>
              </>
            )}
          </button>

          {/* Desktop / Mobile Frame Viewport Switcher */}
          <button
            onClick={() => setIsMobileFrame((prev) => !prev)}
            title={isMobileFrame ? 'Switch to Full-Width Mode' : 'Switch to Mobile App View'}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[11px]">Desktop View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[11px]">Mobile View</span>
              </>
            )}
          </button>

          {/* PWA Install Button */}
          {deferredPrompt && (
            <button
              onClick={installPWA}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px]">Install</span>
            </button>
          )}

          {/* Secure User Profile & Sign Out Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 transition-all text-xs cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 overflow-hidden font-bold text-[10px]">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : user.role === 'developer' ? (
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                  ) : user.role === 'teacher' ? (
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <div className="text-left hidden sm:block max-w-[100px] truncate">
                  <p className="font-semibold text-[11px] truncate leading-tight text-slate-900">{user.name}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl p-2.5 z-50 text-xs">
                    {/* User Profile Card */}
                    <div className="px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                      <p className="font-bold text-slate-900 text-sm leading-tight">{user.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {user.role === 'student'
                          ? `Roll #${user.rollNumber}`
                          : `@${user.username}`}
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {user.role === 'developer' ? 'Superadmin' : user.role} Account
                      </span>
                    </div>

                    {/* Quick navigation link to Sidebar */}
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsSidebarOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Menu className="w-4 h-4 text-slate-500" />
                        <span>Open Full Menu</span>
                      </div>
                    </button>

                    {user.role === 'developer' && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setActiveTab('settings');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-700 transition-colors font-medium cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-amber-600" />
                          <span>System Settings</span>
                        </div>
                      </button>
                    )}

                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button
                        onClick={async () => {
                          setIsProfileMenuOpen(false);
                          await logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
