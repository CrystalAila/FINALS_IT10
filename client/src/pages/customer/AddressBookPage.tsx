import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCustomerLocation } from '../../context/CustomerLocationContext';
import FoodpandaAddressModal from '../../components/customer/FoodpandaAddressModal';
import type { SavedAddress } from '../../types/marketplace';
import {
  MapPin,
  Plus,
  Home,
  CheckCircle2,
  Trash2,
  Edit2,
  Navigation,
  FileText,
  Building,
  Info,
} from 'lucide-react';

export default function AddressBookPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setLocation: setGlobalLocation } = useCustomerLocation();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  const loadAddresses = () => {
    setLoading(true);
    api
      .get('/addresses')
      .then((res) => {
        const list: SavedAddress[] = res.data.addresses ?? [];
        setAddresses(list);

        // Sync default address coordinates to customer global location
        const defaultAddr = list.find((a) => a.is_default) ?? list[0];
        if (defaultAddr?.latitude && defaultAddr?.longitude) {
          setGlobalLocation({
            latitude: Number(defaultAddr.latitude),
            longitude: Number(defaultAddr.longitude),
            fullAddress: `${defaultAddr.street_address}, ${defaultAddr.region}`,
            source: 'map_pin',
          });
        }
      })
      .catch(() => toast.error('Failed to load addresses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openAdd = () => {
    setEditingAddress(null);
    setModalOpen(true);
  };

  const openEdit = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this delivery address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Address deleted successfully');
      loadAddresses();
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const res = await api.post(`/addresses/${id}/default`);
      const updated: SavedAddress = res.data.address;
      toast.success('Default delivery address updated');
      loadAddresses();

      if (updated?.latitude && updated?.longitude) {
        setGlobalLocation({
          latitude: Number(updated.latitude),
          longitude: Number(updated.longitude),
          fullAddress: `${updated.street_address}, ${updated.region}`,
          source: 'map_pin',
        });
      }
    } catch {
      toast.error('Failed to set default address');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Address Book
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your delivery addresses and map pins. Your riders navigate directly to your pinned location.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D96B27] hover:bg-[#C55A1A] active:bg-[#B34F14] py-3 px-5 text-sm font-bold text-white shadow-md transition cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Address</span>
        </button>
      </div>

      {/* Foodpanda Banner Info */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 flex items-start gap-3">
        <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin className="h-4 w-4" />
        </div>
        <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          <span className="font-bold block">How delivery pinning works:</span>
          When adding an address, you drop a pin on the map. Your assigned rider will use this exact pin coordinates to deliver your fresh poultry order straight to your doorstep.
        </div>
      </div>

      {/* Address List */}
      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center shadow-card border border-slate-100">
          <p className="text-slate-500">Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center shadow-card border border-slate-100 space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#D96B27]">
            <Home className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No saved addresses yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Drop a pin on the map to save your first delivery location for quick checkout.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-[#D96B27] hover:underline cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add your first address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((addr) => {
            const hasPin = Boolean(addr.latitude && addr.longitude);
            const latNum = addr.latitude ? Number(addr.latitude) : 0;
            const lngNum = addr.longitude ? Number(addr.longitude) : 0;

            return (
              <div
                key={addr.id}
                className={`rounded-2xl bg-white p-5 sm:p-6 shadow-card border transition-all ${
                  addr.is_default
                    ? 'border-[#D96B27]/40 ring-2 ring-[#D96B27]/10'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Address Information */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">
                        {addr.full_name}
                      </h3>
                      {addr.is_default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          Default Address
                        </span>
                      )}
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-600 font-mono">
                        {addr.phone}
                      </span>
                    </div>

                    {/* Street & Municipality */}
                    <div className="text-sm text-slate-700 leading-relaxed">
                      <p className="font-semibold text-slate-900">{addr.street_address}</p>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {addr.region}, Capiz {addr.postal_code}
                      </p>
                    </div>

                    {/* Floor / Unit / Landmark if available */}
                    {addr.floor_unit && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl w-fit">
                        <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          <strong className="text-slate-700">Unit/Landmark:</strong> {addr.floor_unit}
                        </span>
                      </div>
                    )}

                    {/* Notes for Rider if available */}
                    {addr.delivery_notes && (
                      <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50/60 border border-amber-200/60 px-3 py-1.5 rounded-xl w-fit">
                        <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-amber-900">Rider Note:</strong> {addr.delivery_notes}
                        </span>
                      </div>
                    )}

                    {/* Pinned Coordinates Badge */}
                    <div className="pt-1">
                      {hasPin ? (
                        <div className="inline-flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Pinned: {latNum.toFixed(4)}, {lngNum.toFixed(4)}</span>
                          </span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D96B27] hover:underline"
                          >
                            <Navigation className="h-3 w-3" />
                            View on Google Maps
                          </a>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-800">
                          <Info className="h-3.5 w-3.5 text-amber-600" />
                          <span>No map pin attached • Tap edit to drop a pin</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {!addr.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(addr)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(addr.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-600 transition cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Foodpanda Style Add / Edit Address Modal */}
      <FoodpandaAddressModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => loadAddresses()}
        editingAddress={editingAddress}
        defaultFullName={user?.fullname || ''}
      />
    </div>
  );
}
