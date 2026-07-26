import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { clsx, formatDate } from '../../services/utils';
import { LeaveRequest, LeaveStatus, LeaveType, Learner } from '../../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TYPE_COLORS: Record<string, string> = {
  [LeaveType.ANNUAL]: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  [LeaveType.SICK]: 'bg-red-500/20 text-red-300 border-red-500/30',
  [LeaveType.FAMILY_RESPONSIBILITY]: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  [LeaveType.UNPAID]: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  [LeaveType.LEAVE]: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  [LeaveType.OTHER]: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

const LeaveCalendar: React.FC = () => {
  const { leaveRequests, learners } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const leaveMap = useMemo(() => {
    const map: Record<string, LeaveRequest[]> = {};
    leaveRequests.filter(lr => lr.status === LeaveStatus.APPROVED || lr.status === LeaveStatus.PENDING).forEach(lr => {
      const start = new Date(lr.startDate);
      const end = new Date(lr.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(lr);
      }
    });
    return map;
  }, [leaveRequests]);

  const selectedLeaves = selectedDate ? leaveMap[selectedDate] || [] : [];

  const getLearnerName = (name: string) => learners.find(l => l.fullName === name)?.fullName || name;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {MONTHS[month]} {year}
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500"><ChevronLeft size={16} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Today</button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs text-gray-500 dark:text-gray-400 font-medium py-2">{d}</div>
          ))}

          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 sm:h-28" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLeaves = leaveMap[dateStr] || [];
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={clsx(
                  'h-24 sm:h-28 p-1.5 rounded-lg border cursor-pointer transition-all overflow-hidden',
                  isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600',
                  isToday && 'ring-1 ring-indigo-500'
                )}
              >
                <span className={clsx(
                  'text-xs font-medium',
                  isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
                )}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayLeaves.slice(0, 2).map(lr => {
                    const isInactive = learners.find(l => l.fullName === lr.learnerName)?.status !== 'Active';
                    return (
                      <div key={lr.id} className={clsx('text-[10px] px-1 py-0.5 rounded border truncate', TYPE_COLORS[lr.leaveType], isInactive && 'opacity-40')}>
                        {getLearnerName(lr.learnerName).split(' ')[0]}
                      </div>
                    );
                  })}
                  {dayLeaves.length > 2 && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">+{dayLeaves.length - 2} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          {selectedDate ? formatDate(selectedDate) : 'Select a date'}
        </h3>
        {selectedLeaves.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No leave on this day</p>
        ) : (
          <div className="space-y-2">
            {selectedLeaves.map(lr => (
              <div key={lr.id} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className={clsx('text-sm font-medium', learners.find(l => l.fullName === lr.learnerName)?.status !== 'Active' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white')}>{getLearnerName(lr.learnerName)}</span>
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded', lr.status === LeaveStatus.APPROVED ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300')}>
                    {lr.status}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{lr.leaveType}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveCalendar;
