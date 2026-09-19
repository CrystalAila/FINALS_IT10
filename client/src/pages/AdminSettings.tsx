import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';

interface SystemSettingsData {
  minSellerCommission: number;
  maxSellerCommission: number;
  permitApprovalDays: number;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceMode: boolean;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingsData>({
    minSellerCommission: 5,
    maxSellerCommission: 10,
    permitApprovalDays: 7,
    notificationsEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data?.settings) {
        setSettings({
          minSellerCommission: res.data.settings.minSellerCommission ?? 5,
          maxSellerCommission: res.data.settings.maxSellerCommission ?? 10,
          permitApprovalDays: res.data.settings.permitApprovalDays ?? 7,
          notificationsEnabled: Boolean(res.data.settings.notificationsEnabled),
          emailNotifications: Boolean(res.data.settings.emailNotifications),
          smsNotifications: Boolean(res.data.settings.smsNotifications),
          maintenanceMode: Boolean(res.data.settings.maintenanceMode),
        });
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
      setMessage({ type: 'error', text: 'Failed to load system settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof SystemSettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Validate commission range
      if (settings.minSellerCommission < 0 || settings.minSellerCommission > 100) {
        setMessage({ type: 'error', text: 'Minimum commission must be between 0% and 100%.' });
        setSaving(false);
        return;
      }
      if (settings.maxSellerCommission < settings.minSellerCommission) {
        setMessage({ type: 'error', text: 'Maximum commission cannot be lower than minimum commission.' });
        setSaving(false);
        return;
      }
      if (settings.permitApprovalDays < 1) {
        setMessage({ type: 'error', text: 'Permit approval days must be at least 1 day.' });
        setSaving(false);
        return;
      }

      const res = await api.put('/admin/settings', settings);
      if (res.data?.settings) {
        setSettings({
          minSellerCommission: res.data.settings.minSellerCommission ?? 5,
          maxSellerCommission: res.data.settings.maxSellerCommission ?? 10,
          permitApprovalDays: res.data.settings.permitApprovalDays ?? 7,
          notificationsEnabled: Boolean(res.data.settings.notificationsEnabled),
          emailNotifications: Boolean(res.data.settings.emailNotifications),
          smsNotifications: Boolean(res.data.settings.smsNotifications),
          maintenanceMode: Boolean(res.data.settings.maintenanceMode),
        });
      }
      setMessage({ type: 'success', text: 'Settings updated and saved successfully in real time!' });

      setTimeout(() => {
        setMessage((prev) => (prev?.type === 'success' ? null : prev));
      }, 5000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      const errDetail = err.response?.data?.message || 'Failed to save system settings.';
      setMessage({ type: 'error', text: errDetail });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all system settings to platform defaults?')) {
      return;
    }

    try {
      setResetting(true);
      setMessage(null);
      const res = await api.post('/admin/settings/reset');
      if (res.data?.settings) {
        setSettings({
          minSellerCommission: res.data.settings.minSellerCommission ?? 5,
          maxSellerCommission: res.data.settings.maxSellerCommission ?? 10,
          permitApprovalDays: res.data.settings.permitApprovalDays ?? 7,
          notificationsEnabled: Boolean(res.data.settings.notificationsEnabled),
          emailNotifications: Boolean(res.data.settings.emailNotifications),
          smsNotifications: Boolean(res.data.settings.smsNotifications),
          maintenanceMode: Boolean(res.data.settings.maintenanceMode),
        });
      }
      setMessage({ type: 'success', text: 'Settings successfully restored to platform defaults.' });
    } catch (err) {
      console.error('Failed to reset settings:', err);
      setMessage({ type: 'error', text: 'Failed to reset settings.' });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24 text-slate-500">
          <span className="w-6 h-6 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin mr-2"></span>
          Loading live system settings...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 w-full">
        {/* Header Banner */}
        <div
          className="rounded-3xl p-6 text-white shadow-sm"
          style={{ background: 'linear-gradient(180deg, #357938 0%, #47994A 41%, #5D8B48 68%, #727542 84%, #87623D 100%)' }}
        >
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-100 font-semibold">System Settings</p>
          <h1 className="mt-2 text-3xl font-semibold">Marketplace Configuration</h1>
        </div>

        {/* Feedback Alert Banner */}
        {message && (
          <div
            className={`rounded-2xl p-4 text-sm font-medium flex items-center justify-between transition-all ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            <div>
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Maintenance Warning if active */}
        {settings.maintenanceMode && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900">
            <p className="font-bold text-base">Marketplace is Currently in Maintenance Mode</p>
            <p className="text-xs text-red-700 mt-0.5">
              Customers and sellers may experience restricted transaction features while maintenance mode remains active.
            </p>
          </div>
        )}

        {/* Platform Policies */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Platform Policies</h2>
            <p className="text-xs text-slate-500">Commission schedules & verification turnaround limits</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">Seller Commission Range</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set the minimum and maximum commission percentage charged on completed seller transactions.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-semibold text-slate-500">Min:</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={settings.minSellerCommission}
                      onChange={(e) => handleSettingChange('minSellerCommission', parseInt(e.target.value) || 0)}
                      className="w-14 bg-transparent font-bold text-slate-900 text-center outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-slate-400">—</span>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-semibold text-slate-500">Max:</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={settings.maxSellerCommission}
                      onChange={(e) => handleSettingChange('maxSellerCommission', parseInt(e.target.value) || 0)}
                      className="w-14 bg-transparent font-bold text-slate-900 text-center outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">Permit Approval Timeline</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standard target days for administrators to review and approve farm business permits.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={settings.permitApprovalDays}
                    onChange={(e) => handleSettingChange('permitApprovalDays', parseInt(e.target.value) || 1)}
                    className="w-16 bg-transparent font-bold text-slate-900 text-center outline-none"
                  />
                  <span className="text-xs text-slate-500 font-medium">days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Notification Settings</h2>
            <p className="text-xs text-slate-500">Channels for system alerts and marketplace notifications</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Enable All Notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">Master toggle to transmit alerts for marketplace orders, disputes, and permits.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {settings.notificationsEnabled && (
              <div className="grid gap-3 sm:grid-cols-2 pl-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Email Notifications</p>
                    <p className="text-xs text-slate-500">Send transactional digests via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">SMS Notifications</p>
                    <p className="text-xs text-slate-500">Send high-priority alerts via SMS</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">System Status</h2>
            <p className="text-xs text-slate-500">Emergency operational toggles</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Maintenance Mode</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Temporarily pause marketplace ordering while maintaining administrator dashboard access.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || resetting}
            className="rounded-xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={saving || resetting}
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
          >
            {resetting ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
                <span>Restoring Defaults...</span>
              </>
            ) : (
              <span>Restore Defaults</span>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
