import React, { useMemo, useState } from 'react';
import {
  Search, Plus, CheckCircle, XCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { LeaveRequestsService } from '../../services/googleSheets';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import EmptyState from '../common/EmptyState';
import LoadingSkeleton from '../common/LoadingSkeleton';
import { clsx, formatDate } from '../../services/utils';
import {
  LeaveRequest, LeaveStatus, LeaveType, Learner
} from '../../types';
import { getWorkingDays } from '../../services/leaveCalculations';

const newRequestDefaults = () => ({
  learnerName: '', leaveType: LeaveType.ANNUAL,
  startDate: '', endDate: '', daysRequested: 0.5,
  reason: '', medicalCertificate: false,
});

const LeaveRequests: React.FC = () => {
  const { leaveRequests, learners, user, loading, filters, setFilters, refresh } = useApp();
  const { showToast } = useToast();
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [formData, setFormData] = useState(newRequestDefaults());
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [recalcLoading, setRecalcLoading] = useState(false);

  const isAdmin = user.role === 'ADMIN';
  const currentLearner = useMemo(() =>
    learners.find(l => l.email === user.email),
  [learners, user.email]);

  const handleNewChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if ((field === 'startDate' || field === 'endDate') && next.startDate && next.endDate) {
        const days = getWorkingDays(next.startDate, next.endDate);
        next.daysRequested = Math.max(0.5, days);
      }
      return next;
    });
  };

  const statusOrder: Record<string, number> = {
    [LeaveStatus.PENDING]: 0,
    [LeaveStatus.APPROVED]: 1,
  };

  const filteredRequests = useMemo(() => {
    return leaveRequests
      .filter(lr => {
        if (!isAdmin && currentLearner && lr.learnerName !== currentLearner.fullName) return false;
        const learner = learners.find(l => l.fullName === lr.learnerName);
        const name = learner?.fullName || '';
        const q = filters.search.toLowerCase();
        if (q && !name.toLowerCase().includes(q) && !lr.leaveType.toLowerCase().includes(q)) return false;
        if (filters.leaveType && lr.leaveType !== filters.leaveType) return false;
        if (filters.status && lr.status !== filters.status) return false;
        if (filters.month) {
          const m = new Date(lr.startDate).getMonth();
          if (m !== parseInt(filters.month)) return false;
        }
        if (filters.year) {
          const y = new Date(lr.startDate).getFullYear();
          if (y !== parseInt(filters.year)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aOrder = statusOrder[a.status] ?? 2;
        const bOrder = statusOrder[b.status] ?? 2;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
  }, [leaveRequests, learners, filters]);

  const handleSubmitNew = async () => {
    if (!formData.learnerName) {
      showToast('error', 'Please select a learner');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      showToast('error', 'Please select start and end dates');
      return;
    }
    setSaving(true);
    try {
      const request: Omit<LeaveRequest, 'id'> = {
        learnerName: formData.learnerName,
        leaveType: formData.leaveType as LeaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        daysRequested: formData.daysRequested,
        reason: formData.reason,
        medicalCertificate: formData.medicalCertificate,
        documentLink: '',
        approvedBy: '',
        approvalDate: '',
        status: LeaveStatus.PENDING,
        comments: '',
      };
      await LeaveRequestsService.create(request);
      showToast('success', 'Leave request submitted successfully');
      setShowNewModal(false);
      setFormData(newRequestDefaults());
      await refresh();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to submit leave request');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const ok = await LeaveRequestsService.approve(id, user.name);
      if (ok) {
        showToast('success', 'Leave request approved');
        await refresh();
      } else {
        showToast('error', 'Failed to approve leave request');
      }
    } catch {
      showToast('error', 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const ok = await LeaveRequestsService.reject(id);
      if (ok) {
        showToast('info', 'Leave request rejected');
        await refresh();
      } else {
        showToast('error', 'Failed to reject leave request');
      }
    } catch {
      showToast('error', 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecalculateDays = async (lr: LeaveRequest) => {
    const correctDays = getWorkingDays(lr.startDate, lr.endDate);
    if (correctDays === lr.daysRequested) {
      showToast('info', 'Days are already correct');
      return;
    }
    setRecalcLoading(true);
    try {
      const ok = await LeaveRequestsService.updateDays(lr.id, correctDays);
      if (ok) {
        showToast('success', `Days updated from ${lr.daysRequested} to ${correctDays}`);
        setSelectedRequest(null);
        await refresh();
      } else {
        showToast('error', 'Failed to update days');
      }
    } catch {
      showToast('error', 'An error occurred');
    } finally {
      setRecalcLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton type="table" count={8} />;

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search requests..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filters.leaveType}
            onChange={e => setFilters({ ...filters, leaveType: e.target.value })}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Types</option>
            {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Status</option>
            {Object.values(LeaveStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, learnerName: currentLearner?.fullName || '' }));
              setShowNewModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={16} />
            New Request
          </button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState title="No leave requests" description="No requests match your filters." />
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Learner</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leave Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Days</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRequests.map(lr => {
                const learner = learners.find(l => l.fullName === lr.learnerName);
                const statusBadge = {
                  [LeaveStatus.APPROVED]: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200',
                  [LeaveStatus.PENDING]: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200',
                  [LeaveStatus.REJECTED]: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200',
                  [LeaveStatus.CANCELLED]: 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700',
                }[lr.status] || 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';

                return (
                  <tr
                    key={lr.id}
                    onClick={() => setSelectedRequest(lr)}
                    className={clsx('hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors', learner && learner.status !== 'Active' && 'opacity-50')}
                  >
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">{learner?.fullName || 'Unknown'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{lr.leaveType}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(lr.startDate)} – {formatDate(lr.endDate)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-right tabular-nums">{lr.daysRequested}</td>
                    <td className="px-4 py-2">
                      <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', statusBadge)}>
                        {lr.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {lr.status === LeaveStatus.PENDING && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={(e) => { e.stopPropagation(); handleApprove(lr.id); }} disabled={actionLoading === lr.id} className="p-1.5 rounded-md bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-40 transition-colors">
                            {actionLoading === lr.id ? <span className="block w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={14} />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleReject(lr.id); }} disabled={actionLoading === lr.id} className="p-1.5 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-40 transition-colors">
                            {actionLoading === lr.id ? <span className="block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <XCircle size={14} />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Leave Request Details" size="md">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Badge label={selectedRequest.leaveType} size="md" />
              <Badge label={selectedRequest.status} size="md" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Learner', selectedRequest.learnerName],
                ['Start Date', formatDate(selectedRequest.startDate)],
                ['End Date', formatDate(selectedRequest.endDate)],
                ['Days Requested', `${selectedRequest.daysRequested}`],
                ['Correct Days', `${getWorkingDays(selectedRequest.startDate, selectedRequest.endDate)}`],
                ['Medical Certificate', selectedRequest.medicalCertificate ? 'Yes' : 'No'],
                ['Approved By', selectedRequest.approvedBy || '-'],
                ['Approval Date', selectedRequest.approvalDate ? formatDate(selectedRequest.approvalDate) : '-'],
              ].map(([label, value]) => (
                <div key={label} className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{value}</p>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason</p>
              <p className="text-sm text-gray-900 dark:text-white">{selectedRequest.reason || 'No reason provided'}</p>
            </div>
            {selectedRequest.comments && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Comments</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedRequest.comments}</p>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleRecalculateDays(selectedRequest)}
                disabled={recalcLoading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {recalcLoading ? 'Recalculating...' : 'Recalculate Days'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Request Modal */}
      <Modal isOpen={showNewModal} onClose={() => { setShowNewModal(false); setFormData(newRequestDefaults()); }} title="New Leave Request" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Learner</label>
            {isAdmin ? (
              <select value={formData.learnerName} onChange={e => handleNewChange('learnerName', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm">
                <option value="">Select learner</option>
                {learners.map(l => <option key={l.fullName} value={l.fullName} className={l.status !== 'Active' ? 'text-slate-500' : ''}>{l.fullName}</option>)}
              </select>
            ) : (
              <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 text-sm">
                {currentLearner?.fullName || 'Unknown'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Leave Type</label>
            <select value={formData.leaveType} onChange={e => handleNewChange('leaveType', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm">
              {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Days Requested</label>
            <input type="number" min="0.5" step="0.5" value={formData.daysRequested} onChange={e => handleNewChange('daysRequested', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input type="date" value={formData.startDate} onChange={e => handleNewChange('startDate', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input type="date" value={formData.endDate} onChange={e => handleNewChange('endDate', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Reason</label>
            <textarea rows={3} value={formData.reason} onChange={e => handleNewChange('reason', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="medicalCert" checked={formData.medicalCertificate} onChange={e => handleNewChange('medicalCertificate', e.target.checked)} className="rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" />
            <label htmlFor="medicalCert" className="text-sm text-gray-700 dark:text-gray-300">Medical Certificate Attached</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => { setShowNewModal(false); setFormData(newRequestDefaults()); }} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
          <button onClick={handleSubmitNew} disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium">{saving ? 'Submitting...' : 'Submit Request'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveRequests;
