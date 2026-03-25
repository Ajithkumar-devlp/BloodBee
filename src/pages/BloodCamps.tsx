import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MapPin, Users, Plus, Heart, X, Building2, Clock } from 'lucide-react';

interface Camp {
  id: string;
  title: string;
  organizer: string;
  type: 'donation' | 'awareness' | 'checkup';
  date: string;
  time: string;
  location: string;
  description: string;
  contactPhone: string;
  targetUnits: number;
  registeredCount: number;
  createdAt: string;
}

const CAMP_TYPES = [
  { id: 'donation', label: 'Blood Donation Camp', icon: '🩸', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700' },
  { id: 'awareness', label: 'Awareness Drive', icon: '📢', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' },
  { id: 'checkup', label: 'Health Checkup Camp', icon: '🏥', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' },
];

export default function BloodCamps() {
  const { user } = useAuth();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', organizer: '', type: 'donation',
    date: '', time: '', location: '', description: '',
    contactPhone: '', targetUnits: 50,
  });

  useEffect(() => {
    const q = query(collection(db, 'blood_camps'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setCamps(snap.docs.map(d => ({ id: d.id, ...d.data() } as Camp)));
    });
    return unsub;
  }, []);

  const submitCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await Promise.race([
        addDoc(collection(db, 'blood_camps'), {
          ...form,
          registeredCount: 0,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid,
        }),
        new Promise(r => setTimeout(r, 1500))
      ]);
      setShowForm(false);
      setForm({ title: '', organizer: '', type: 'donation', date: '', time: '', location: '', description: '', contactPhone: '', targetUnits: 50 });
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const campType = (type: string) => CAMP_TYPES.find(c => c.id === type) || CAMP_TYPES[0];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Building2 className="text-orange-500" size={30} /> Blood Camps & Events
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium">NGOs, hospitals, and organizations: organize a camp, save more lives.</p>
        </div>
        {user && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-500/20 transition-all shrink-0">
            <Plus size={18} /> Create Camp
          </button>
        )}
      </div>

      {/* Create Camp Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Organize a Camp</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitCamp} className="space-y-4">
              {/* Camp Type */}
              <div>
                <label className="block text-sm font-black text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider">Camp Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {CAMP_TYPES.map(ct => (
                    <button key={ct.id} type="button" onClick={() => setForm({ ...form, type: ct.id })}
                      className={`p-3 rounded-2xl border text-center transition-all text-sm font-bold ${form.type === ct.id ? 'ring-2 ring-orange-500 border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-orange-300'}`}>
                      <div className="text-2xl mb-1">{ct.icon}</div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-tight">{ct.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: 'Camp/Event Title', key: 'title', placeholder: 'e.g. NSS Blood Donation Drive 2026' },
                { label: 'Organizer Name', key: 'organizer', placeholder: 'e.g. Rotary Club / Hospital Name / NGO' },
                { label: 'Venue / Location', key: 'location', placeholder: 'Full address' },
                { label: 'Contact Phone', key: 'contactPhone', placeholder: 'Organizer contact number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-black text-slate-600 dark:text-slate-300 mb-1.5">{f.label}</label>
                  <input required value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm placeholder:text-slate-400" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-black text-slate-600 dark:text-slate-300 mb-1.5">Date</label>
                  <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-600 dark:text-slate-300 mb-1.5">Time</label>
                  <input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-600 dark:text-slate-300 mb-1.5">Target Units / Expected Donors</label>
                <input type="number" min={10} max={5000} value={form.targetUnits} onChange={e => setForm({ ...form, targetUnits: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-600 dark:text-slate-300 mb-1.5">Description <span className="text-slate-400 font-medium normal-case">(optional)</span></label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Any special instructions, facilities available, etc."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none transition-all text-sm placeholder:text-slate-400" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 transition-all disabled:opacity-60 text-lg">
                {submitting ? 'Publishing...' : '🏕️ Publish Camp'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Camps Feed */}
      <div className="space-y-5">
        {camps.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="text-6xl mb-4">🏕️</div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No camps scheduled yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">Be the first to organize a blood donation camp in your area.</p>
          </div>
        ) : (
          camps.map(camp => {
            const ct = campType(camp.type);
            return (
              <div key={camp.id} className="bg-white dark:bg-slate-800 rounded-[2rem] p-7 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border ${ct.color} shrink-0`}>
                    {ct.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-xl leading-tight">{camp.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm mt-1">{camp.organizer}</p>
                      </div>
                      <span className={`text-xs font-black px-3 py-1.5 rounded-full border shrink-0 ${ct.color}`}>{ct.label}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-semibold">
                        <Calendar size={15} className="text-orange-500 shrink-0" />
                        {new Date(camp.date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-semibold">
                        <Clock size={15} className="text-blue-500 shrink-0" /> {camp.time}
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 font-semibold col-span-2">
                        <MapPin size={15} className="text-red-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{camp.location}</span>
                      </div>
                    </div>

                    {camp.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">{camp.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 font-semibold">
                        <Users size={15} className="text-emerald-500" />
                        {camp.registeredCount || 0} registered · Target: {camp.targetUnits} donors
                      </div>
                      <button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-sm transition-colors shadow-sm shadow-orange-400/30 flex items-center gap-2">
                        <Heart size={14} fill="white" /> Register
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
