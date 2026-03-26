import { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { Language } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Moon, Sun, Bell, Heart, Smartphone, Check, Edit3, Save, X, Camera } from 'lucide-react';
import MobilePageHeader from '../components/MobilePageHeader';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
];

export default function Settings() {
  const { dark, toggleDark, lang, setLang, t } = useTheme();
  const { profile, user, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(profile?.photoURL || null);
  const [notifyCommunity, setNotifyCommunity] = useState(false);
  const [notifyEmergency, setNotifyEmergency] = useState(true);
  const [notifyRequests, setNotifyRequests] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editProfile, setEditProfile] = useState({
    name: profile?.name || '',
    bloodGroup: profile?.bloodGroup || '',
    location: profile?.location || '',
    isDonor: profile?.isDonor ?? true,
  });

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) { alert('This browser does not support notifications.'); return; }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotifyEmergency(true);
      new Notification('BloodBee Alerts Enabled! 🩸', { body: 'You will now receive emergency blood alerts.', icon: '/Bloodbeelogo.png' });
    } else { alert('Permission denied. Please enable notifications in browser settings.'); }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // Compress to max 200KB using canvas
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX = 300;
        const ratio = Math.min(MAX / img.width, MAX / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.75);
        setPreviewPhoto(base64);
        setUploadingPhoto(true);
        try {
          await Promise.race([
            setDoc(doc(db, 'users', user.uid), { photoURL: base64 }, { merge: true }),
            new Promise(r => setTimeout(r, 1500))
          ]);
        } catch (err) { console.error(err); }
        finally { setUploadingPhoto(false); }
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Use setDoc with { merge: true } instead of updateDoc.
      // updateDoc stalls endlessly if there are network issues. 
      // setDoc({merge: true}) instantly saves to the local cache and resolves instantly.
      await Promise.race([
        setDoc(doc(db, 'users', user.uid), {
          name: editProfile.name,
          bloodGroup: editProfile.bloodGroup,
          location: editProfile.location,
          isDonor: editProfile.isDonor,
        }, { merge: true }),
        new Promise(r => setTimeout(r, 1500))
      ]);
      
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() || '?');

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      <MobilePageHeader
        title="Settings"
        subtitle="Manage your BloodBee preferences"
        backTo="/dashboard"
      />
      <div className="hidden md:block">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">{t('settings')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your BloodBee preferences.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-red-600 to-red-900 rounded-[2rem] p-7 text-white shadow-2xl shadow-red-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-8 -translate-y-8"><Heart size={140} fill="currentColor" /></div>
        <div className="relative z-10 flex items-center gap-5">

          {/* Profile Photo — click to upload */}
          <div className="relative shrink-0 group">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <button onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl relative focus:outline-none focus:ring-2 focus:ring-white">
              {previewPhoto ? (
                <img src={previewPhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-3xl">
                  {initials}
                </div>
              )}
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingPhoto
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Camera size={22} className="text-white" />}
              </div>
            </button>
            {uploadingPhoto && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 border border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="font-black text-xl">{profile?.name || 'Guest User'}</p>
            <p className="text-red-200 text-sm font-medium">{user?.email || 'Not signed in'}</p>
            <p className="text-[10px] text-red-300/70 font-medium mt-0.5">Tap photo to change</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-green-300">{profile?.isDonor ? 'Active Donor' : 'Member'}</span>
            </div>
          </div>
          <button onClick={() => setEditMode(!editMode)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-colors">
            {editMode ? <X size={20} /> : <Edit3 size={20} />}
          </button>
        </div>

        {/* Inline Edit Form */}
        {editMode && (
          <div className="relative z-10 mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-red-200 mb-2">Edit Profile Details</p>
            <input value={editProfile.name} onChange={e => setEditProfile({ ...editProfile, name: e.target.value })}
              placeholder="Full Name"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-red-300/60 focus:ring-2 focus:ring-white outline-none text-sm font-medium" />
            <div className="grid grid-cols-2 gap-3">
              <select value={editProfile.bloodGroup} onChange={e => setEditProfile({ ...editProfile, bloodGroup: e.target.value })}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white outline-none text-sm font-medium">
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(g => <option key={g} value={g} className="text-slate-900">{g}</option>)}
              </select>
              <input value={editProfile.location} onChange={e => setEditProfile({ ...editProfile, location: e.target.value })}
                placeholder="City / Location"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-red-300/60 focus:ring-2 focus:ring-white outline-none text-sm font-medium" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-all ${editProfile.isDonor ? 'bg-green-500' : 'bg-white/20'}`}
                onClick={() => setEditProfile({ ...editProfile, isDonor: !editProfile.isDonor })}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${editProfile.isDonor ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
              <span className="text-sm font-bold text-white">Register as active donor</span>
            </label>
            <button onClick={saveProfile} disabled={saving}
              className="w-full py-3 bg-white text-red-700 font-black rounded-xl transition-all hover:bg-red-50 flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-700 rounded-full animate-spin" /> : <Save size={16} />}
              {saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Appearance */}
      <section className="space-y-3">
        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Appearance</h2>
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className={`w-11 h-11 ${dark ? 'bg-indigo-500' : 'bg-amber-400'} rounded-xl flex items-center justify-center shadow-sm`}>
            {dark ? <Moon size={20} className="text-white" /> : <Sun size={20} className="text-white" />}
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-white text-sm">{t('darkMode')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dark ? 'Dark theme active across the entire app' : 'Light theme active'}</p>
          </div>
          <button onClick={toggleDark}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${dark ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${dark ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>
      </section>

      {/* Language */}
      <section className="space-y-3">
        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t('language')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${lang === l.code
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600 shadow-md'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-red-300 dark:hover:border-red-700'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm">{l.native}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{l.label}</p>
                </div>
                {lang === l.code && <Check size={16} className="text-red-500" />}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-3">
        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">{t('notifications')}</h2>
        {[
          { label: 'Emergency Blood Alerts', sublabel: 'Notify when someone nearby needs blood', on: notifyEmergency, set: setNotifyEmergency, req: true },
          { label: 'Request Updates', sublabel: 'Track status of your blood requests', on: notifyRequests, set: setNotifyRequests, req: false },
          { label: 'Community Posts', sublabel: 'Stories and achievements from the community', on: notifyCommunity, set: setNotifyCommunity, req: false },
        ].map((n, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <Bell size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{n.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{n.sublabel}</p>
            </div>
            <button onClick={() => { if (n.req) requestNotificationPermission(); n.set(!n.on); }}
              className={`w-11 h-6 rounded-full flex items-center px-1 transition-all ${n.on ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${n.on ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>
        ))}
        <button onClick={requestNotificationPermission}
          className="w-full py-3.5 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 text-blue-700 dark:text-blue-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm">
          <Smartphone size={16} /> Enable Browser Push Notifications
        </button>
      </section>

      {/* About */}
      <section className="space-y-3">
        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">About</h2>
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 p-1.5">
            <img src="/Bloodbeelogo.png" alt="BloodBee" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-white text-sm">BloodBee v2.0</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI-powered emergency blood response</p>
          </div>
          <span className="text-xs text-slate-400 font-bold">Build #42</span>
        </div>
      </section>

      {/* Logout */}
      {user && (
        <button onClick={logout}
          className="w-full py-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 font-black rounded-2xl transition-all shadow-sm">
          Sign Out of BloodBee
        </button>
      )}
    </div>
  );
}
