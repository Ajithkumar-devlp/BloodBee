import { QrCode, Calendar, Heart, Shield, Share2, Download, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function HealthPassport() {
  const { user, profile } = useAuth();

  const donationDate = new Date('2026-01-12');
  const nextEligible = new Date(donationDate);
  nextEligible.setMonth(nextEligible.getMonth() + 3);
  const donorId = user ? `BB-${new Date().getFullYear()}-${user.uid.slice(0, 4).toUpperCase()}` : 'BB-GUEST';
  const isEligible = new Date() >= nextEligible;

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() || '?');

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="text-center">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Health Passport</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Your verified digital donor identity.</p>
      </div>

      {/* Passport Card */}
      <div className="relative bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden border border-red-900/50">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-800/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/30 p-1.5">
            <img src="/Bloodbeelogo.png" alt="BloodBee" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="font-black text-sm tracking-widest uppercase text-red-300">BloodBee Network</p>
            <p className="text-white/60 text-xs font-medium">Verified Donor Identity</p>
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-xs font-black uppercase tracking-wide">Active</span>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="relative z-10 flex items-center gap-5 mb-8">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-800 flex items-center justify-center text-3xl font-black border-2 border-white/20 shadow-xl shadow-black/40 shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black leading-tight">{profile?.name || user?.email || 'Guest User'}</h2>
            <p className="text-red-300 text-sm font-bold mt-1">{donorId}</p>
            <p className="text-white/50 text-xs mt-1">{user?.email}</p>
          </div>
          <div className="text-center shrink-0">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-inner">
              <span className="text-2xl font-black text-red-300">{profile?.bloodGroup || '?'}</span>
            </div>
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-1 block">Blood Type</span>
          </div>
        </div>

        {/* QR Section */}
        <div className="relative z-10 flex justify-center mb-8">
          <div className="bg-white p-5 rounded-3xl shadow-2xl shadow-black/40 relative inline-block">
            <QrCode size={140} strokeWidth={1} className="text-slate-900" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm p-1">
                <img src="/Bloodbeelogo.png" alt="BB" className="w-full h-full object-contain" />
              </div>
            </div>
            <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Scan to verify donor</p>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            { label: 'Donations', value: profile?.donationCount ?? 0 },
            { label: 'Score', value: `${profile?.reliabilityScore ?? 100}` },
            { label: 'Location', value: profile?.location || 'N/A' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="text-xl font-black truncate">{s.value}</div>
              <div className="text-red-300 text-[9px] uppercase tracking-widest font-bold mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-blue-500" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Last Donation</span>
          </div>
          <span className="font-black text-slate-900 dark:text-white text-sm">12 Jan 2026</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-emerald-500" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Next Eligible</span>
          </div>
          <div className="flex items-center gap-2">
            {isEligible && <CheckCircle size={14} className="text-green-500" />}
            <span className={`font-black text-sm ${isEligible ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {nextEligible.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-purple-500" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Reliability Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-24 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{ width: `${profile?.reliabilityScore ?? 100}%` }}></div>
            </div>
            <span className="font-black text-slate-900 dark:text-white text-sm">{profile?.reliabilityScore ?? 100}/100</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart size={18} className="text-red-500" fill="currentColor" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Donor Status</span>
          </div>
          <span className={`font-black text-sm px-3 py-1 rounded-full ${profile?.isDonor ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {profile?.isDonor ? '✅ Active Donor' : 'Member Only'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 py-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black rounded-2xl transition-all shadow-lg">
          <Share2 size={18} /> Share
        </button>
        <button className="flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-500/20">
          <Download size={18} /> Download
        </button>
      </div>
    </div>
  );
}
