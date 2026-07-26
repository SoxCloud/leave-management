import React, { useState } from 'react';
import { Save, Upload, Palette, Bell, Shield, Database } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { clsx } from '../../services/utils';

export default function CompanySettings() {
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
                activeSection === s.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
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
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">General Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                <input type="text" defaultValue="My Company" className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Leave Accrual Rate (days)</label>
                <input type="number" defaultValue={1.5} step={0.5} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Max Annual Leave (days)</label>
                <input type="number" defaultValue={18} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Accrual Interval (days)</label>
                <input type="number" defaultValue={30} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Medical Certificate After (days)</label>
                <input type="number" defaultValue={3} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Theme</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400">
                  Dark Mode (only)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Public Holidays (comma separated, YYYY-MM-DD)</label>
              <textarea
                rows={3}
                defaultValue="2024-01-01,2024-03-21,2024-03-29,2024-04-27,2024-05-01,2024-06-16,2024-08-09,2024-09-24,2024-12-16,2024-12-25,2024-12-26"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
        )}

        {activeSection === 'branding' && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-gray-900">Branding Settings</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#4f46e5" className="w-10 h-10 rounded-lg cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">#4f46e5</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#0ea5e9" className="w-10 h-10 rounded-lg cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">#0ea5e9</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#8b5cf6" className="w-10 h-10 rounded-lg cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">#8b5cf6</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Company Logo URL</label>
              <input type="text" placeholder="https://example.com/logo.png" className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500" />
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Notification Preferences</h3>
            {['Leave Request Submitted', 'Leave Approved', 'Leave Rejected', 'Balance Updated', 'Medical Certificate Required', 'Duplicate Request Detected'].map(notif => (
              <div key={notif} className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">{notif}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'permissions' && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Role Permissions</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-2 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">Feature</th>
                    <th className="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400 uppercase">Admin</th>
                    <th className="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400 uppercase">HR</th>
                    <th className="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400 uppercase">Manager</th>
                    <th className="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400 uppercase">Supervisor</th>
                    <th className="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400 uppercase">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{feature}</td>
                      {perms.map((p, j) => (
                        <td key={j} className={clsx('px-4 py-2 text-center text-sm', p === '✓' ? 'text-green-600 dark:text-green-400' : 'text-gray-300 dark:text-gray-500')}>{p}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={saveSettings} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}