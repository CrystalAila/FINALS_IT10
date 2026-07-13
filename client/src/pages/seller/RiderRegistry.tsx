import { useMemo, useState, type FormEvent } from 'react';
import Layout from '../../components/Layout';

type Rider = {
  id: number;
  fullname: string;
  phone: string;
  photoUrl: string;
};

const initialRiders: Rider[] = [
  { id: 1, fullname: 'Jun Mendoza', phone: '+63 917 123 4567', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
  { id: 2, fullname: 'Anna Rivera', phone: '+63 926 987 1234', photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
];

const RiderRegistry: React.FC = () => {
  const [riders, setRiders] = useState<Rider[]>(initialRiders);
  const [showForm, setShowForm] = useState(false);
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : ''),
    [photoFile]
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!fullname.trim() || !phone.trim()) {
      setError('Full name and phone number are required.');
      return;
    }

    const newRider: Rider = {
      id: riders.length ? Math.max(...riders.map((r) => r.id)) + 1 : 1,
      fullname: fullname.trim(),
      phone: phone.trim(),
      photoUrl: photoPreview || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    };

    setRiders((current) => [newRider, ...current]);
    setShowForm(false);
    setFullname('');
    setPhone('');
    setPhotoFile(null);
  };

  return (
    <Layout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">Rider registry</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your delivery team</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Manage your riders and assign them to delivery orders from one place.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((show) => !show)}
          className="inline-flex items-center justify-center rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-700"
        >
          {showForm ? 'Cancel' : 'Add New Rider'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 rounded-3xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-orange-900">Add a new rider</h2>
          <p className="mt-2 text-sm text-orange-700">Enter rider details and upload a photo so you can assign them to delivery orders.</p>

          {error && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="riderFullname" className="block text-sm font-semibold text-slate-700">
                Rider full name
              </label>
              <input
                id="riderFullname"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="riderPhone" className="block text-sm font-semibold text-slate-700">
                Phone number
              </label>
              <input
                id="riderPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                required
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label htmlFor="riderPhoto" className="block text-sm font-semibold text-slate-700">
                Photo upload
              </label>
              <input
                id="riderPhoto"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              />
              {photoPreview && (
                <img src={photoPreview} alt="Rider preview" className="mt-3 h-44 w-full rounded-3xl object-cover" />
              )}
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
              >
                Save rider
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {riders.map((rider) => (
          <div key={rider.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
            <div className="h-44 overflow-hidden bg-slate-100">
              <img src={rider.photoUrl} alt={rider.fullname} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-3 p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Rider</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{rider.fullname}</h2>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="text-slate-500">Phone</p>
                <p className="mt-1 font-medium">{rider.phone}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default RiderRegistry;
