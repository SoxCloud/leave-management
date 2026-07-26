import React, { useMemo, useState } from 'react';
import { Search, Plus, BarChart3, Loader } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { LearnersService } from '../../services/googleSheets';
import Modal from '../common/Modal';
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
      if (filters.status && l.status.toLowerCase() !== filters.status.toLowerCase()) return false;
      return true;
    });
  }, [learners, filters]);

  const statusBadge = (status: string) => {
    const classes: Record<string, string> = {
      Active: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      Inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
      Graduated: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      Terminated: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${classes[status] || 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
        {status}
      </span>
    );
  };

  const departments = useMemo(() => [...new Set(learners.map(l => l.department).filter(Boolean))], [learners]);

  if (loading) return <LoadingSkeleton type="table" count={8} />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filters.department}
            onChange={e => setFilters({ ...filters, department: e.target.value })}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Graduated">Graduated</option>
            <option value="Terminated">Terminated</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={16} />
            Add Learner
          </button>
        </div>
      </div>

      {/* Table */}
      {filteredLearners.length === 0 ? (
        <EmptyState
          title="No learners found"
          description="Try adjusting your filters or add a new learner."
        />
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Learner</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Department</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Campaign</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Supervisor</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Manager</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Start Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {filteredLearners.map(learner => (
                <tr key={learner.fullName} className={clsx('border-b border-gray-100 hover:bg-gray-50 transition-colors', learner.status !== 'Active' && 'opacity-50')}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {learner.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{learner.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{learner.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{learner.department}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{learner.campaign}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{learner.supervisor}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{learner.manager}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">{formatDate(learner.startDate)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <select
                        value={learner.status}
                        onChange={e => handleStatusChange(learner.fullName, e.target.value)}
                        disabled={updatingStatus === learner.fullName}
                        className={`px-2 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                          learner.status === 'Active' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' :
                          learner.status === 'Graduated' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                          learner.status === 'Inactive' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700' :
                          learner.status === 'Terminated' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' :
                          'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Graduated">Graduated</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                      {updatingStatus === learner.fullName && <Loader size={14} className="text-gray-400 animate-spin" />}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setSelectedLearner(learner)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors"
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
              <label className="block text-sm text-gray-700 mb-1">{field === 'fullName' ? 'Full Name' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type={field === 'email' ? 'email' : 'text'}
                value={formData[field]}
                onChange={e => handleChange(field, e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder={field === 'fullName' ? 'Full Name' : field.charAt(0).toUpperCase() + field.slice(1)}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input type="date" value={formData.startDate} onChange={e => handleChange('startDate', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Expected End Date</label>
            <input type="date" value={formData.expectedEndDate} onChange={e => handleChange('expectedEndDate', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => { setShowAddModal(false); setFormData({ ...emptyForm }); }} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">{saving ? 'Saving...' : 'Save Learner'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default LearnerList;
