import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Learner, LeaveRequest, LeaveBalance, AbsenteeismRecord, AppUser,
  DashboardStats, ChartData, DepartmentData, FilterState, UserRole
} from '../types';
import {
  fetchDashboardStats, fetchChartData, fetchDepartmentData,
  LearnersService, LeaveRequestsService, LeaveBalancesService, AbsenteeismService
} from '../services/googleSheets';

interface AppContextType {
  user: AppUser;
  learners: Learner[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  absenteeism: AbsenteeismRecord[];
  dashboardStats: DashboardStats | null;
  chartData: ChartData[];
  departmentData: DepartmentData[];
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

const defaultFilters: FilterState = {
  search: '', learner: '', manager: '', supervisor: '', campaign: '',
  department: '', month: '', year: '', leaveType: '', attendanceStatus: '', status: '',
};

const AppContext = createContext<AppContextType>(null!);

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user] = useState<AppUser>({
    id: 'admin',
    email: 'admin@leavehub.com',
    name: 'System Admin',
    role: UserRole.ADMIN,
    avatarUrl: 'https://ui-avatars.com/api/?name=System+Admin&background=random',
  });
  const [learners, setLearners] = useState<Learner[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [absenteeism, setAbsenteeism] = useState<AbsenteeismRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, charts, depts, lrs, lvs, lbs, abs] = await Promise.all([
        fetchDashboardStats(),
        fetchChartData(),
        fetchDepartmentData(),
        LearnersService.getAll(),
        LeaveRequestsService.getAll(),
        LeaveBalancesService.getAll(),
        AbsenteeismService.getAll(),
      ]);
      setDashboardStats(stats);
      setChartData(charts);
      setDepartmentData(depts);
      setLearners(lrs);
      setLeaveRequests(lvs);
      setLeaveBalances(lbs);
      setAbsenteeism(abs);
    } catch (err) {
      setError('Failed to load data from Google Sheets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <AppContext.Provider value={{
      user, learners, leaveRequests, leaveBalances, absenteeism,
      dashboardStats, chartData, departmentData, filters, setFilters,
      loading, error, refresh, activeTab, setActiveTab,
    }}>
      {children}
    </AppContext.Provider>
  );
};
