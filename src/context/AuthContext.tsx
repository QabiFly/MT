import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (payload: { role: string; username?: string; password?: string; rollNumber?: number; dob?: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchUserRolePreset: (preset: 'developer' | 'teacher' | 'student1' | 'student2') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('tuition_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check session on mount
    const checkSession = async () => {
      try {
        const { session } = await api.getMe();
        setUser(session);
      } catch (err) {
        // If offline or not authenticated, rely on saved localStorage session
      }
    };
    checkSession();
  }, []);

  const login = async (payload: {
    role: string;
    username?: string;
    password?: string;
    rollNumber?: number;
    dob?: string;
  }) => {
    setIsLoading(true);
    try {
      const { session } = await api.login(payload);
      setUser(session);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const switchUserRolePreset = async (preset: 'developer' | 'teacher' | 'student1' | 'student2') => {
    if (preset === 'developer') {
      await login({ role: 'developer', username: 'zeaipc', password: 'arman786' });
    } else if (preset === 'teacher') {
      await login({ role: 'teacher', username: 'teacher1', password: 'teach123' });
    } else if (preset === 'student1') {
      await login({ role: 'student', rollNumber: 1, dob: '2009-05-14' });
    } else if (preset === 'student2') {
      await login({ role: 'student', rollNumber: 2, dob: '2009-08-22' });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchUserRolePreset }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
