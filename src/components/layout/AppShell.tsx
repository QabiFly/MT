import React from 'react';
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
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-3 sm:p-6 font-sans">
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
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-start overflow-x-hidden font-sans">
      <ToastContainer />

      {/* Conditional Mobile Frame Container vs Wide Responsive Container */}
      <div
        className={`w-full transition-all duration-300 flex flex-col ${
          isMobileFrame
            ? 'max-w-[430px] my-0 md:my-6 rounded-none md:rounded-[40px] shadow-2xl shadow-slate-300/60 border-0 md:border-[8px] md:border-slate-800 bg-slate-50 overflow-hidden min-h-screen md:min-h-[860px]'
            : 'max-w-7xl mx-auto min-h-screen bg-slate-50'
        }`}
      >
        {/* Realistic Mobile Status Bar / Speaker Notch (only in mobile frame mode on desktop) */}
        {isMobileFrame && (
          <div className="hidden md:flex items-center justify-between px-7 pt-3 pb-1 bg-white text-slate-500 text-[11px] font-semibold select-none border-b border-slate-100">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="w-20 h-4 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-2" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">5G</span>
              <div className="w-4 h-2.5 rounded-xs border border-slate-400 flex items-center p-0.5">
                <div className="w-full h-full bg-emerald-500 rounded-xs" />
              </div>
            </div>
          </div>
        )}

        <TopHeader />

        {/* Dynamic Main Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 pb-20 scrollbar-thin scrollbar-thumb-slate-200">
          {renderActiveView()}
        </main>

        <BottomNav />
      </div>

      {/* Global Sidebar Drawer */}
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
