import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    minSellerCommission: 5,
    maxSellerCommission: 10,
    permitApprovalDays: 7,
    notificationsEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('Settings saved:', settings);
    alert('Settings updated successfully');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-900 bg-emerald-950 p-6 text-emerald-100 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">System Settings</p>
          <h1 className="mt-3 text-3xl font-semibold">Marketplace configuration</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Manage core admin settings, marketplace policies, and role-based access controls.
          </p>
        </div>

        {/* Platform Policies */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Platform Policies</h2>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Seller Commission Range</p>
                  <p className="text-sm text-slate-600">Set minimum and maximum commission rates</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Min:</label>
                    <input
                      type="number"
                      value={settings.minSellerCommission}
                      onChange={(e) => handleSettingChange('minSellerCommission', parseInt(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center"
                    />
                    <span>%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Max:</label>
                    <input
                      type="number"
                      value={settings.maxSellerCommission}
                      onChange={(e) => handleSettingChange('maxSellerCommission', parseInt(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center"
                    />
                    <span>%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Permit Approval Timeline</p>
                  <p className="text-sm text-slate-600">Days allowed for permit approval process</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.permitApprovalDays}
                    onChange={(e) => handleSettingChange('permitApprovalDays', parseInt(e.target.value))}
                    className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-center"
                  />
                  <span>days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Notification Settings</h2>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Enable All Notifications</p>
                <p className="text-sm text-slate-600">Send alerts for marketplace events</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                className="w-5 h-5 accent-emerald-600"
              />
            </div>

            {settings.notificationsEnabled && (
              <>
                <div className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Email Notifications</p>
                    <p className="text-sm text-slate-600">Send alerts via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="w-5 h-5 accent-emerald-600"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">SMS Notifications</p>
                    <p className="text-sm text-slate-600">Send urgent alerts via SMS</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    className="w-5 h-5 accent-emerald-600"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">System Status</h2>
          <div className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Maintenance Mode</p>
              <p className="text-sm text-slate-600">Temporarily disable marketplace for maintenance</p>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
              className="w-5 h-5 accent-red-600"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            💾 Save Changes
          </button>
          <button className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
            ↻ Reset
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
