import React, { useState } from 'react';
import { Save, Upload, Palette, Bell, Shield, Database } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { clsx } from '../../services/utils';

const CompanySettings: React.FC = () => {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState('general');

  const saveSettings = () => {
    showToast('success', 'Settings saved successfully');
  };

  const sections = [
    { id: 'general', label: 'General', icon: Database },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'permissions', label: 'Permissions', icon: Shield },
  ];

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-48 shrink-0 space-y-1">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all',
                activeSection === s.id ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <Icon size={16} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6">
        {activeSection === 'general' && (
          <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 space-y-5">
            <h3 className="text-sm font-semibold text-white">General Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Company Name</label>
                <input type="text" defaultValue="My Company" className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Leave Accrual Rate (days)</label>
                <input type="number" defaultValue={1.5} step={0.5} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Max Annual Leave (days)</label>
                <input type="number" defaultValue={18} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Accrual Interval (days)</label>
                <input type="number" defaultValue={30} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Medical Certificate After (days)</label>
                <input type="number" defaultValue={3} className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Theme</label>
                <div className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-400">
                  Dark Mode (only)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Public Holidays (comma separated, YYYY-MM-DD)</label>
              <textarea
                rows={3}
                defaultValue="2024-01-01,2024-03-21,2024-03-29,2024-04-27,2024-05-01,2024-06-16,2024-08-09,2024-09-24,2024-12-16,2024-12-25,2024-12-26"
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm"
              />
            </div>
          </div>
        )}

        {activeSection === 'branding' && (
          <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 space-y-5">
            <h3 className="text-sm font-semibold text-white">Branding Settings</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#4f46e5" className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700" />
                  <span className="text-sm text-slate-400">#4f46e5</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#0ea5e9" className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700" />
                  <span className="text-sm text-slate-400">#0ea5e9</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#8b5cf6" className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700" />
                  <span className="text-sm text-slate-400">#8b5cf6</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Company Logo URL</label>
              <input type="text" placeholder="https://example.com/logo.png" className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm" />
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Notification Preferences</h3>
            {['Leave Request Submitted', 'Leave Approved', 'Leave Rejected', 'Balance Updated', 'Medical Certificate Required', 'Duplicate Request Detected'].map(notif => (
              <div key={notif} className="flex items-center justify-between px-4 py-3 bg-slate-800/30 rounded-xl">
                <span className="text-sm text-slate-300">{notif}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'permissions' && (
          <div className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Role Permissions</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-800/40">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="px-4 py-2 text-left text-xs text-slate-400 uppercase">Feature</th>
                    <th className="px-4 py-2 text-center text-xs text-slate-400 uppercase">Admin</th>
                    <th className="px-4 py-2 text-center text-xs text-slate-400 uppercase">HR</th>
                    <th className="px-4 py-2 text-center text-xs text-slate-400 uppercase">Manager</th>
                    <th className="px-4 py-2 text-center text-xs text-slate-400 uppercase">Supervisor</th>
                    <th className="px-4 py-2 text-center text-xs text-slate-400 uppercase">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {[
                    ['View Dashboard', '✓', '✓', '✓', '✓', '✓'],
                    ['Manage Learners', '✓', '✓', '✓', '-', '-'],
                    ['Approve Leave', '✓', '✓', '✓', '-', '-'],
                    ['Capture Attendance', '✓', '✓', '✓', '✓', '-'],
                    ['View Reports', '✓', '✓', '-', '-', '-'],
                    ['Settings', '✓', '-', '-', '-', '-'],
                    ['Analytics', '✓', '✓', '-', '-', '-'],
                  ].map(([feature, ...perms], i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-sm text-white">{feature}</td>
                      {perms.map((p, j) => (
                        <td key={j} className={clsx('px-4 py-2 text-center text-sm', p === '✓' ? 'text-emerald-400' : 'text-slate-600')}>{p}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={saveSettings} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
