import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import api from '../lib/axios';
import { useToast } from '../context/ToastContext';

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
  const toast = useToast();
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
      toast.success('Settings saved successfully.');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      const errDetail = err.response?.data?.message || 'Failed to save system settings.';
      toast.error(errDetail);
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
      toast.success('Settings restored to defaults.');
    } catch (err) {
      console.error('Failed to reset settings:', err);
      toast.error('Failed to reset settings.');
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
          <h1 className="text-2xl font-bold">System Settings</h1>
        </div>

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
