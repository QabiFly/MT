import React from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { AppProvider } from './context/AppContext.js';
import { AppShell } from './components/layout/AppShell.js';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </AuthProvider>
  );
}
