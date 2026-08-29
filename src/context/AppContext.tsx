import React, { createContext, useContext, useState, useEffect } from 'react';
import { RealtimeMessage, Student } from '../types/index.js';
import { realtimeClient } from '../services/realtime.js';
import { getOfflineQueue, flushOfflineQueue } from '../services/offlineQueue.js';
import { api } from '../services/api.js';

export type NavTab =
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'fees'
  | 'notices'
  | 'doubts'
  | 'teachers'
  | 'audit'
  | 'settings';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
}

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean | ((prev: boolean) => boolean)) => void;
  isOnline: boolean;
  queueCount: number;
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  selectedStudent: Student | null;
  setSelectedStudent: (stu: Student | null) => void;
  isAddStudentModalOpen: boolean;
  setIsAddStudentModalOpen: (val: boolean) => void;
  isFeeWarningModalOpen: boolean;
  setIsFeeWarningModalOpen: (val: boolean) => void;
  targetFeeStudent: Student | null;
  setTargetFeeStudent: (stu: Student | null) => void;
  deferredPrompt: any;
  installPWA: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(() => {
    // Default to true if user is on desktop to provide the requested "mobile app feel inside desktop browser"
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return false;
  });
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [queueCount, setQueueCount] = useState<number>(() => getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isFeeWarningModalOpen, setIsFeeWarningModalOpen] = useState(false);
  const [targetFeeStudent, setTargetFeeStudent] = useState<Student | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
      addToast({
        title: 'Connection Restored',
        message: 'You are back online. Synchronizing offline changes...',
        type: 'success',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast({
        title: 'Offline Mode Active',
        message: 'Network disconnected. Data will be saved locally and queued for sync.',
        type: 'warning',
      });
    };

    const handleQueueUpdate = () => {
      setQueueCount(getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('tuition:queue-updated', handleQueueUpdate);

    // Register PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('tuition:queue-updated', handleQueueUpdate);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Realtime WebSocket Subscription
  useEffect(() => {
    const unsubscribe = realtimeClient.subscribe((msg: RealtimeMessage) => {
      if (msg.type === 'notice:new') {
        addToast({
          title: '📢 New Notice Broadcasted',
          message: `${msg.payload.priority === 'urgent' ? '[URGENT] ' : ''}${msg.payload.title}`,
          type: msg.payload.priority === 'urgent' ? 'alert' : 'info',
        });
      } else if (msg.type === 'fee:updated') {
        addToast({
          title: '💳 Fee Status Updated',
          message: `Fee record updated for ${msg.payload.student?.fullName || 'student'}.`,
          type: 'success',
        });
      } else if (msg.type === 'attendance:updated') {
        addToast({
          title: '📅 Attendance Marked',
          message: `Attendance updated for ${msg.payload.count} students on ${msg.payload.date}.`,
          type: 'info',
        });
      } else if (msg.type === 'doubt:created') {
        addToast({
          title: '❓ New Doubt Submitted',
          message: `${msg.payload.studentName} asked: "${msg.payload.title}"`,
          type: 'info',
        });
      } else if (msg.type === 'doubt:replied') {
        addToast({
          title: '💬 Doubt Reply Received',
          message: `New reply on doubt: "${msg.payload.doubt?.title || 'Doubt'}"`,
          type: 'success',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const addToast = (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const newToast: ToastNotification = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      dismissToast(newToast.id);
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerSync = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      const result = await flushOfflineQueue(api.syncBatch);
      setQueueCount(getOfflineQueue().length);
      if (result.syncedCount > 0) {
        addToast({
          title: 'Sync Complete',
          message: `Successfully synchronized ${result.syncedCount} queued action(s) to server.`,
          type: 'success',
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const installPWA = async () => {
    if (!deferredPrompt) {
      alert('PWA installation is ready! You can also click "Add to Home Screen" or install from browser menu.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      addToast({
        title: 'App Installed',
        message: 'Manasthali Tutions has been added to your device homescreen.',
        type: 'success',
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isSidebarOpen,
        setIsSidebarOpen,
        isMobileFrame,
        setIsMobileFrame,
        isOnline,
        queueCount,
        isSyncing,
        triggerSync,
        toasts,
        dismissToast,
        selectedStudent,
        setSelectedStudent,
        isAddStudentModalOpen,
        setIsAddStudentModalOpen,
        isFeeWarningModalOpen,
        setIsFeeWarningModalOpen,
        targetFeeStudent,
        setTargetFeeStudent,
        deferredPrompt,
        installPWA,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
