import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { TopHeader } from './TopHeader.js';
import { BottomNav } from './BottomNav.js';
import { Sidebar } from './Sidebar.js';
import { ToastContainer } from './ToastContainer.js';
import { LoginPage } from '../auth/LoginPage.js';
import { DeveloperDashboard } from '../dashboard/DeveloperDashboard.js';
import { TeacherDashboard } from '../dashboard/TeacherDashboard.js';
import { StudentDashboard } from '../dashboard/StudentDashboard.js';
import { StudentsListPage } from '../students/StudentsListPage.js';
import { AttendancePage } from '../attendance/AttendancePage.js';
import { FeeManagementPage } from '../fees/FeeManagementPage.js';
import { NoticesPage } from '../notices/NoticesPage.js';
import { DoubtsPage } from '../doubts/DoubtsPage.js';
import { AuditLogsPage } from '../audit/AuditLogsPage.js';
import { TeacherManagementPage } from '../teachers/TeacherManagementPage.js';
import { SettingsPage } from '../settings/SettingsPage.js';
import { AddEditStudentModal } from '../students/AddEditStudentModal.js';
import { StudentDetailModal } from '../students/StudentDetailModal.js';
import { FeeWarningModal } from '../fees/FeeWarningModal.js';

export const AppShell: React.FC = () => {
  const { user } = useAuth();
  const {
    activeTab,
    isMobileFrame,
    selectedStudent,
    setSelectedStudent,
    isAddStudentModalOpen,
    setIsAddStudentModalOpen,
    isFeeWarningModalOpen,
    setIsFeeWarningModalOpen,
    targetFeeStudent,
  } = useApp();

  if (!user) {
    return (
      <div className="h-screen w-full bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 font-sans overflow-y-auto">
        <ToastContainer />
        <LoginPage />
      </div>
    );
  }

  const renderActiveView = () => {
    // Student role restricted views
    if (user.role === 'student') {
      switch (activeTab) {
        case 'dashboard':
          return <StudentDashboard />;
        case 'attendance':
          return <AttendancePage />;
        case 'fees':
          return <FeeManagementPage />;
        case 'notices':
          return <NoticesPage />;
        case 'doubts':
          return <DoubtsPage />;
        default:
          return <StudentDashboard />;
      }
    }

    // Developer and Teacher views
    switch (activeTab) {
      case 'dashboard':
        return user.role === 'developer' ? <DeveloperDashboard /> : <TeacherDashboard />;
      case 'students':
        return <StudentsListPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'fees':
        return <FeeManagementPage />;
      case 'notices':
        return <NoticesPage />;
      case 'doubts':
        return <DoubtsPage />;
      case 'teachers':
        return <TeacherManagementPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <TeacherDashboard />;
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-full bg-slate-900/90 md:bg-slate-200 text-slate-900 flex items-center justify-center overflow-hidden font-sans select-none sm:select-auto">
      <ToastContainer />

      {/* App Container - Fixed Mobile Frame or Responsive App Container */}
      <div
        className={`w-full transition-all duration-300 flex flex-col bg-slate-50 overflow-hidden relative shadow-2xl ${
          isMobileFrame
            ? 'max-w-[430px] h-full md:h-[92vh] md:max-h-[880px] md:rounded-[44px] md:border-[9px] md:border-slate-800 md:shadow-2xl'
            : 'max-w-5xl h-full md:h-[96vh] md:rounded-3xl md:border md:border-slate-200/90'
        }`}
      >
        {/* Realistic Mobile Status Bar / Speaker Notch (visible on desktop mobile frame mode) */}
        {isMobileFrame && (
          <div className="hidden md:flex items-center justify-between px-7 pt-2.5 pb-1 bg-white text-slate-600 text-[11px] font-semibold select-none border-b border-slate-100 shrink-0">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="w-20 h-4 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-2" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold">5G</span>
              <div className="w-4 h-2.5 rounded-xs border border-slate-400 flex items-center p-0.5">
                <div className="w-full h-full bg-emerald-500 rounded-xs" />
              </div>
            </div>
          </div>
        )}

        {/* 1. FIXED TOP HEADER (Pinned at top, never scrolls) */}
        <div className="shrink-0 z-30 bg-white/95 backdrop-blur-md">
          <TopHeader />
        </div>

        {/* 2. SLIDING / SCROLLING MAIN CONTENT VIEWPORT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative overscroll-contain p-3 sm:p-4 scrollbar-thin scrollbar-thumb-slate-200">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="w-full min-h-full pb-4"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* 3. FIXED BOTTOM NAVIGATION (Pinned at bottom, never scrolls) */}
        <div className="shrink-0 z-30 bg-white/95 backdrop-blur-md">
          <BottomNav />
        </div>
      </div>

      {/* Global Slide-Over Navigation Drawer */}
      <Sidebar />

      {/* Global Modals */}
      {isAddStudentModalOpen && (
        <AddEditStudentModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
        />
      )}

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {isFeeWarningModalOpen && targetFeeStudent && (
        <FeeWarningModal
          student={targetFeeStudent}
          isOpen={isFeeWarningModalOpen}
          onClose={() => setIsFeeWarningModalOpen(false)}
        />
      )}
    </div>
  );
};
