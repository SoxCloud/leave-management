import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppProvider, useApp } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';
import ExecutiveDashboard from './components/dashboard/ExecutiveDashboard';
import LearnerList from './components/learners/LearnerList';
import LearnerProfile from './components/learners/LearnerProfile';
import LeaveRequests from './components/leave/LeaveRequests';
import LeaveCalendar from './components/leave/LeaveCalendar';
import AttendanceTracker from './components/attendance/AttendanceTracker';
import AbsenteeismReport from './components/attendance/AbsenteeismReport';
import ReportGenerator from './components/reports/ReportGenerator';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import CompanySettings from './components/settings/CompanySettings';
import { RefreshCw } from 'lucide-react';

const LeaveManagementApp: React.FC = () => {
  const { loading, activeTab, setActiveTab } = useApp();
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);

  const getTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard', learners: 'Learners', leave: 'Leave Requests',
      attendance: 'Attendance', calendar: 'Leave Calendar', reports: 'Reports',
      analytics: 'Analytics', settings: 'Settings',
    };
    return titles[activeTab] || 'LeaveHub';
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0b1120]">
        <RefreshCw className="animate-spin mb-4 text-indigo-500" size={32} />
        <p className="text-xs text-indigo-400 font-medium tracking-widest animate-pulse">LOADING LEAVEHUB...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <ExecutiveDashboard />;
      case 'learners':
        if (selectedLearnerId) {
          return <LearnerProfile learnerName={selectedLearnerId} onBack={() => setSelectedLearnerId(null)} />;
        }
        return <LearnerList />;
      case 'leave': return <LeaveRequests />;
      case 'attendance': return <><AttendanceTracker /><AbsenteeismReport /></>;
      case 'calendar': return <LeaveCalendar />;
      case 'reports': return <ReportGenerator />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'settings': return <CompanySettings />;
      default: return <ExecutiveDashboard />;
    }
  };

  return (
    <AppLayout title={getTitle()}>
      {renderContent()}
    </AppLayout>
  );
};

const LeaveAppWrapper: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppProvider>
          <LeaveManagementApp />
        </AppProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default LeaveAppWrapper;
