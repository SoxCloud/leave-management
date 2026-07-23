import React, { useMemo, useState } from 'react';
import { Search, Plus, BarChart3, Loader } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { LearnersService } from '../../services/googleSheets';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import LoadingSkeleton from '../common/LoadingSkeleton';
import LearnerProfile from './LearnerProfile';
import { clsx, formatDate } from '../../services/utils';
import { Learner } from '../../types';

const emptyForm = {
  fullName: '', department: '', campaign: '', site: '',
  supervisor: '', manager: '', phone: '', email: '',
  startDate: '', expectedEndDate: '',
};

const LearnerList: React.FC = () => {
  const { learners, loading, filters, setFilters, refresh } = useApp();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleStatusChange = async (learnerName: string, newStatus: string) => {
    setUpdatingStatus(learnerName);
    try {
      const ok = await LearnersService.updateStatus(learnerName, newStatus);
      if (ok) {
        showToast('success', `${learnerName} status changed to ${newStatus}`);
        await refresh();
      } else {
        showToast('error', 'Failed to update status');
      }
    } catch {
      showToast('error', 'An error occurred');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      showToast('error', 'Full Name is required');
      return;
    }
    setSaving(true);
    try {
      const learner: Learner = { ...formData, status: 'Active' };
      const result = await LearnersService.create(learner);
      if (result) {
        showToast('success', `Learner "${formData.fullName}" added successfully`);
        setShowAddModal(false);
        setFormData({ ...emptyForm });
        await refresh();
      } else {
        showToast('error', 'Failed to add learner');
      }
    } catch {
      showToast('error', 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const filteredLearners = useMemo(() => {
    return learners.filter(l => {
      const q = filters.search.toLowerCase();
      if (q && !l.fullName.toLowerCase().includes(q) && !l.department.toLowerCase().includes(q) &&
          !l.email.toLowerCase().includes(q)) return false;
      if (filters.department && l.department !== filters.department) return false;
      if (filters.manager && l.manager !== filters.manager) return false;
      if (filters.supervisor && l.supervisor !== filters.supervisor) return false;
      if (filters.status && l.status !== filters.status) return false;
      return true;
    });
  }, [learners, filters]);

  const columns = [
    { key: 'fullName', label: 'Name', render: (v: unknown, row: Record<string, unknown>) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {(v as string)?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-medium text-sm">{v as string}</p>
          <p className="text-slate-500 text-xs">{row.email as string}</p>
        </div>
      </div>
    )},
    { key: 'department', label: 'Department' },
    { key: 'campaign', label: 'Campaign' },
    { key: 'supervisor', label: 'Supervisor' },
    { key: 'manager', label: 'Manager' },
    { key: 'startDate', label: 'Start Date', render: (v: unknown) => <span className="text-slate-400">{formatDate(v as string)}</span> },
    { key: 'status', label: 'Status', render: (v: unknown) => <Badge label={v as string} size="sm" /> },
  ];

  const departments = useMemo(() => [...new Set(learners.map(l => l.department).filter(Boolean))], [learners]);

  if (loading) return <LoadingSkeleton type="table" count={8} />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, department..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <select
          value={filters.department}
          onChange={e => setFilters({ ...filters, department: e.target.value })}
          className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Graduated">Graduated</option>
          <option value="Terminated">Terminated</option>
        </select>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Learner
        </button>
      </div>

      {/* Table */}
      {filteredLearners.length === 0 ? (
        <EmptyState
          title="No learners found"
          description="Try adjusting your filters or add a new learner."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Learner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Supervisor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Manager</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredLearners.map(learner => (
                <tr key={learner.fullName} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {learner.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{learner.fullName}</p>
                        <p className="text-slate-500 text-xs">{learner.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{learner.department}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{learner.campaign}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{learner.supervisor}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{learner.manager}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{formatDate(learner.startDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={learner.status}
                        onChange={e => handleStatusChange(learner.fullName, e.target.value)}
                        disabled={updatingStatus === learner.fullName}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors appearance-none cursor-pointer ${
                          learner.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          learner.status === 'Graduated' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          learner.status === 'Inactive' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                          learner.status === 'Terminated' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Graduated">Graduated</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                      {updatingStatus === learner.fullName && <Loader size={14} className="text-slate-400 animate-spin" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedLearner(learner)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-medium transition-colors"
                    >
                      <BarChart3 size={14} />
                      Dashboard
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Learner Dashboard Modal */}
      <Modal isOpen={!!selectedLearner} onClose={() => setSelectedLearner(null)} title="Learner Dashboard" size="full">
        {selectedLearner && (
          <LearnerProfile
            learnerName={selectedLearner.fullName}
            onBack={() => setSelectedLearner(null)}
          />
        )}
      </Modal>

      {/* Add Learner Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setFormData({ ...emptyForm }); }} title="Add New Learner" size="lg">
        <div className="grid grid-cols-2 gap-4">
          {(['fullName', 'department', 'campaign', 'site', 'supervisor', 'manager', 'phone', 'email'] as const).map(field => (
            <div key={field}>
              <label className="block text-sm text-slate-300 mb-1">{field === 'fullName' ? 'Full Name' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type={field === 'email' ? 'email' : 'text'}
                value={formData[field]}
                onChange={e => handleChange(field, e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50"
                placeholder={field === 'fullName' ? 'Full Name' : field.charAt(0).toUpperCase() + field.slice(1)}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Start Date</label>
            <input type="date" value={formData.startDate} onChange={e => handleChange('startDate', e.target.value)} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Expected End Date</label>
            <input type="date" value={formData.expectedEndDate} onChange={e => handleChange('expectedEndDate', e.target.value)} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800/60">
          <button onClick={() => { setShowAddModal(false); setFormData({ ...emptyForm }); }} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">{saving ? 'Saving...' : 'Save Learner'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default LearnerList;
