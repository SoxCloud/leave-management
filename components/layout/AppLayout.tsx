import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import CommandPalette from './CommandPalette';
import ToastContainer from '../common/Toast';
import { useApp } from '../../context/AppContext';
import { clsx } from '../../services/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const { user, setActiveTab, activeTab, setFilters, filters } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#0b1120] text-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          user={user!}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0">
            <Sidebar
              user={user!}
              activeTab={activeTab}
              setActiveTab={(tab) => { setActiveTab(tab); setMobileSidebarOpen(false); }}
              collapsed={false}
              onToggleCollapse={() => {}}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav
          title={title}
          searchQuery={filters.search}
          onSearchChange={(q) => setFilters({ ...filters, search: q })}
          onMenuToggle={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className={clsx(
            'max-w-[1600px] mx-auto space-y-4 sm:space-y-6'
          )}>
            {children}
          </div>
        </main>
      </div>

      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
