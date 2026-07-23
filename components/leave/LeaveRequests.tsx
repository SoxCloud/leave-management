import React, { useMemo, useState } from 'react';
import {
  Search, Plus, Filter, CheckCircle, XCircle, AlertTriangle,
  Clock, FileText
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
import { getDaysExcludingSundays, hasOverlappingLeave } from '../../services/leaveCalculations';

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

  const handleNewChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if ((field === 'startDate' || field === 'endDate') && next.startDate && next.endDate) {
        const days = getDaysExcludingSundays(next.startDate, next.endDate);
        next.daysRequested = Math.max(0.5, days);
      }
      return next;
    });
  };

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(lr => {
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
    if (hasOverlappingLeave(leaveRequests, formData.startDate, formData.endDate)) {
      showToast('error', 'This learner already has an overlapping leave request');
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
      const result = await LeaveRequestsService.create(request);
      if (result) {
        showToast('success', 'Leave request submitted successfully');
        setShowNewModal(false);
        setFormData(newRequestDefaults());
        await refresh();
      } else {
        showToast('error', 'Failed to submit leave request');
      }
    } catch {
      showToast('error', 'An error occurred while saving');
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
    const correctDays = getDaysExcludingSundays(lr.startDate, lr.endDate);
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search requests..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <select
          value={filters.leaveType}
          onChange={e => setFilters({ ...filters, leaveType: e.target.value })}
          className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300"
        >
          <option value="">All Types</option>
          {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300"
        >
          <option value="">All Status</option>
          {Object.values(LeaveStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Request
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState title="No leave requests" description="No requests match your filters." />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredRequests.map(lr => {
      const learner = learners.find(l => l.fullName === lr.learnerName);
            const statusIcon = {
              [LeaveStatus.PENDING]: <Clock size={16} className="text-amber-400" />,
              [LeaveStatus.APPROVED]: <CheckCircle size={16} className="text-emerald-400" />,
              [LeaveStatus.REJECTED]: <XCircle size={16} className="text-red-400" />,
              [LeaveStatus.CANCELLED]: <AlertTriangle size={16} className="text-slate-400" />,
            }[lr.status];

            return (
              <div
                key={lr.id}
                onClick={() => setSelectedRequest(lr)}
                className="flex items-center gap-4 px-5 py-4 rounded-xl border border-slate-800/60 bg-slate-900/50 hover:bg-slate-800/50 transition-all cursor-pointer"
              >
                {statusIcon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{learner?.fullName || 'Unknown'}</span>
                    <Badge label={lr.leaveType} size="sm" />
                    <Badge label={lr.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(lr.startDate)} - {formatDate(lr.endDate)} · {lr.daysRequested} days
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {lr.status === LeaveStatus.PENDING && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(lr.id); }} disabled={actionLoading === lr.id} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 transition-colors">
                        {actionLoading === lr.id ? <span className="block w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleReject(lr.id); }} disabled={actionLoading === lr.id} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-colors">
                        {actionLoading === lr.id ? <span className="block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <XCircle size={16} />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
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
                ['Correct Days (excl. Sun)', `${getDaysExcludingSundays(selectedRequest.startDate, selectedRequest.endDate)}`],
                ['Medical Certificate', selectedRequest.medicalCertificate ? 'Yes' : 'No'],
                ['Approved By', selectedRequest.approvedBy || '-'],
                ['Approval Date', selectedRequest.approvalDate ? formatDate(selectedRequest.approvalDate) : '-'],
              ].map(([label, value]) => (
                <div key={label} className="px-4 py-3 bg-slate-800/30 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className="text-sm text-white font-medium">{value}</p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-slate-800/30 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Reason</p>
              <p className="text-sm text-white">{selectedRequest.reason || 'No reason provided'}</p>
            </div>
            {selectedRequest.comments && (
              <div className="px-4 py-3 bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Comments</p>
                <p className="text-sm text-white">{selectedRequest.comments}</p>
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
            <label className="block text-sm text-slate-300 mb-1">Learner</label>
            <select value={formData.learnerName} onChange={e => handleNewChange('learnerName', e.target.value)} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm">
              <option value="">Select learner</option>
              {learners.map(l => <option key={l.fullName} value={l.fullName}>{l.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Leave Type</label>
            <select value={formData.leaveType} onChange={e => handleNewChange('leaveType', e.target.value)} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm">
              {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Days Requested</label>
            <input type="number" min="0.5" step="0.5" value={formData.daysRequested} onChange={e => handleNewChange('daysRequested', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Start Date</label>
            <input type="date" value={formData.startDate} onChange={e => handleNewChange('startDate', e.target.value)} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">End Date</label>
            <input type="date" value={formData.endDate} onChange={e => handleNewChange('endDate', e.target.value)} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-300 mb-1">Reason</label>
            <textarea rows={3} value={formData.reason} onChange={e => handleNewChange('reason', e.target.value)} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="medicalCert" checked={formData.medicalCertificate} onChange={e => handleNewChange('medicalCertificate', e.target.checked)} className="rounded bg-slate-800 border-slate-700" />
            <label htmlFor="medicalCert" className="text-sm text-slate-300">Medical Certificate Attached</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800/60">
          <button onClick={() => { setShowNewModal(false); setFormData(newRequestDefaults()); }} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button onClick={handleSubmitNew} disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium">{saving ? 'Submitting...' : 'Submit Request'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveRequests;
