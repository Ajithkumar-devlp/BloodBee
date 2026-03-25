import { Navigation, CheckCircle2, Clock, Activity, MapPin, Award, Heart, Shield, Bell, Star, TrendingUp, Users, MessageSquare, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useLocation } from 'react-router-dom';

interface BloodRequest {
  id: string;
  bloodGroup: string;
  patientName: string;
  location: string;
  urgency: string;
  status: string;
  createdAt: string;
  isSOS?: boolean;
}

const BADGES = [
  { id: 'first', icon: '🩸', label: 'First Drop', desc: 'First donation', min: 1 },
  { id: 'hero', icon: '🦸', label: 'Local Hero', desc: '3+ donations', min: 3 },
  { id: 'champion', icon: '🏆', label: 'Champion', desc: '5+ donations', min: 5 },
  { id: 'legend', icon: '⭐', label: 'Legend', desc: '10+ donations', min: 10 },
  { id: 'sos', icon: '🚨', label: 'SOS Responder', desc: 'Responded to SOS', min: 0 },
];

const PREDICTIVE = [
  { group: 'O-', week: 87, trend: '+12%', critical: true },
  { group: 'AB+', week: 34, trend: '+5%', critical: false },
  { group: 'B+', week: 61, trend: '-3%', critical: false },
  { group: 'A-', week: 45, trend: '+22%', critical: true },
];

const COMMUNITY = [
  { name: 'Ranjith K.', blood: 'O+', msg: 'Just donated for the 5th time! The BloodBee team is incredible.', time: '2h ago', badge: '🏆' },
  { name: 'Priya S.', blood: 'A-', msg: 'Got an SOS alert at midnight — rushed and saved a life. This app is magic.', time: '5h ago', badge: '🚨' },
  { name: 'Ajay M.', blood: 'B+', msg: 'My reliability score hit 100! Ready to donate anytime, anywhere.', time: '1d ago', badge: '⭐' },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const { t } = useTheme();
  const location = useLocation();
  const [activeRequests, setActiveRequests] = useState<BloodRequest[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showWelcomeToast, setShowWelcomeToast] = useState(
    !!(location.state as any)?.justRegistered
  );
  const donationCount = profile?.donationCount ?? 0;

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (showWelcomeToast) {
      const t = setTimeout(() => setShowWelcomeToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showWelcomeToast]);

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'blood_requests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs: BloodRequest[] = [];
      snapshot.forEach(doc => reqs.push({ id: doc.id, ...doc.data() } as BloodRequest));
      const compatible = reqs.filter(r =>
        !profile.isDonor || r.bloodGroup === profile.bloodGroup || r.bloodGroup.startsWith('O')
      );
      setActiveRequests(compatible.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
    return unsubscribe;
  }, [profile]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Account Created Toast ── */}
      {showWelcomeToast && (
        <div className="flex items-center gap-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-2xl px-5 py-4 shadow-lg"
          style={{ animation: 'slideDown 0.4s ease-out both' }}>
          <div className="w-10 h-10 bg-green-100 dark:bg-green-800/50 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="text-green-600 dark:text-green-400" size={22} />
          </div>
          <div className="flex-1">
            <p className="font-black text-green-900 dark:text-green-200 text-sm">🎉 Account Created Successfully!</p>
            <p className="text-green-700 dark:text-green-400 text-xs font-medium mt-0.5">
              Welcome to BloodBee, <span className="font-bold">{(location.state as any)?.userName || profile?.name || 'Hero'}</span>! You're all set.
            </p>
          </div>
          <button onClick={() => setShowWelcomeToast(false)}
            className="text-green-500 hover:text-green-700 dark:hover:text-green-300 transition-colors p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/40">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-900 rounded-3xl p-8 sm:p-10 text-white shadow-2xl overflow-hidden relative border border-red-500/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-12 -translate-y-12"><Heart size={200} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Hello, {profile?.name?.split(' ')[0] || 'Hero'}!</h1>
            <p className="text-red-100 text-lg max-w-xl font-medium">
              {profile?.isDonor ? "Your blood type is powerful. You are eligible to donate today!" : "Welcome to BloodBee. Every action helps save lives."}
            </p>
            {profile?.isDonor && (
              <div className="flex items-center gap-4 mt-6 bg-black/30 backdrop-blur-md w-fit px-5 py-2.5 rounded-2xl border border-white/10">
                <span className="text-sm font-semibold text-red-50 uppercase tracking-widest">Availability</span>
                <button onClick={() => setIsAvailable(!isAvailable)}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${isAvailable ? 'bg-green-500' : 'bg-slate-500'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${isAvailable ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
                <span className={`text-sm font-black uppercase ${isAvailable ? 'text-green-400' : 'text-slate-300'}`}>
                  {isAvailable ? 'Active' : 'Busy'}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-4 md:pb-0 pt-4 md:pt-0">
            {[
              { v: profile?.reliabilityScore ?? 98, l: 'Reliability' },
              { v: donationCount, l: 'Donations' },
              { v: profile?.bloodGroup ?? '?', l: 'Blood Group', highlight: true },
            ].map(s => (
              <div key={s.l} className={`backdrop-blur-md rounded-2xl p-5 text-center border min-w-[120px] shadow-xl ${s.highlight ? 'bg-white border-transparent text-red-600' : 'bg-white/10 border-white/20'}`}>
                <div className="text-3xl font-black">{s.v}</div>
                <div className={`text-[10px] uppercase tracking-widest font-bold mt-1.5 ${s.highlight ? 'text-red-400' : 'text-red-100'}`}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🚨 One-Tap Emergency CTA */}
      <Link to="/emergency"
        className="flex items-center gap-5 p-6 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-3xl text-white shadow-2xl shadow-red-500/30 transition-all transform hover:-translate-y-0.5 group cursor-pointer border border-red-500/20">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform animate-pulse">🚨</div>
        <div className="flex-1">
          <h3 className="font-black text-xl">{t('oneEmergency')}</h3>
          <p className="text-red-100 text-sm font-medium mt-0.5">No login needed — broadcast an SOS to all nearby donors instantly</p>
        </div>
        <Navigation size={28} className="shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/request', icon: Activity, label: 'Request Blood', sub: 'AI Triage', color: 'red' },
          { to: '/hospitals', icon: MapPin, label: 'Hospitals', sub: 'Live Inventory', color: 'blue' },
          { to: '/passport', icon: Shield, label: 'Health Passport', sub: 'QR Identity', color: 'emerald' },
          { to: '/camps', icon: Award, label: 'Blood Camps', sub: 'NGO & Events', color: 'orange' },
        ].map(a => (
          <Link key={a.to} to={a.to}
            className={`bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-${a.color}-500 hover:shadow-xl hover:shadow-${a.color}-500/10 transition-all group flex flex-col items-center text-center`}>
            <div className={`w-14 h-14 bg-${a.color}-50 dark:bg-${a.color}-900/30 text-${a.color}-600 dark:text-${a.color}-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
              <a.icon size={28} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">{a.label}</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{a.sub}</p>
          </Link>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">

          {/* Live Alerts */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Bell className="text-red-500" size={26} /> {t('activeAlerts')}
              </h2>
              <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-black px-3 py-1.5 rounded-full border border-red-200 dark:border-red-700">
                {activeRequests.length} LIVE
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {activeRequests.length === 0 ? (
                <div className="col-span-2 py-16 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem]">
                  <Heart className="text-slate-300 dark:text-slate-600 mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No urgent matches right now</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm">We'll notify you instantly when someone needs your blood type.</p>
                </div>
              ) : (
                activeRequests.map(req => (
                  <div key={req.id} className={`bg-white dark:bg-slate-800 border-2 rounded-3xl p-6 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col ${req.isSOS ? 'border-red-400 dark:border-red-700' : 'border-red-100 dark:border-slate-700'}`}>
                    {req.urgency.includes('Critical') && (
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-500"></div>
                    )}
                    {req.isSOS && (
                      <div className="mb-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full w-fit flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div> SOS EMERGENCY
                      </div>
                    )}
                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${req.bloodGroup === 'O-' ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                        {req.bloodGroup}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{req.patientName || 'Unknown'}</h3>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                          <MapPin size={12} className="text-blue-500" /> {req.location}
                        </div>
                      </div>
                    </div>
                    {req.urgency.includes('Critical') && (
                      <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800 mb-4">
                        <Activity size={14} className="animate-pulse" /> CRITICAL PRIORITY
                      </div>
                    )}
                    <button className="mt-auto w-full bg-slate-900 dark:bg-red-700 hover:bg-red-600 dark:hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 group">
                      <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" /> Accept Match
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Predictive Blood Demand */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700 shadow-xl">
            <h3 className="font-black text-slate-900 dark:text-white text-xl mb-6 flex items-center gap-3">
              <TrendingUp className="text-blue-500" size={26} /> {t('predictive')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">AI-predicted demand for next 7 days based on regional hospital data.</p>
            <div className="space-y-4">
              {PREDICTIVE.map(p => (
                <div key={p.group} className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${p.critical ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {p.group}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {p.critical && <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase mr-2">⚠ Critical</span>}
                        {p.week} units needed
                      </span>
                      <span className={`text-xs font-black ${p.trend.startsWith('+') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{p.trend}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all duration-1000 ${p.critical ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
                        style={{ width: `${Math.min(p.week, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Feed */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700 shadow-xl">
            <h3 className="font-black text-slate-900 dark:text-white text-xl mb-6 flex items-center gap-3">
              <Users className="text-emerald-500" size={26} /> {t('communityFeed')}
            </h3>
            <div className="space-y-4">
              {COMMUNITY.map((c, i) => (
                <div key={i} className="flex gap-4 p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-2xl flex items-center justify-center font-black text-red-700 dark:text-red-300 shrink-0 border border-red-200 dark:border-red-700 text-sm">
                    {c.blood}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-black text-slate-900 dark:text-white text-sm">{c.name}</span>
                      <span className="text-lg" title="Badge">{c.badge}</span>
                      <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-medium">{c.time}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{c.msg}</p>
                  </div>
                </div>
              ))}
              <Link to="/community"
                className="w-full py-3 text-sm text-red-600 dark:text-red-400 font-bold border-2 border-dashed border-red-200 dark:border-red-800 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2">
                <MessageSquare size={16} /> Share Your Story
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Gamification Badges */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-7 border border-slate-200 dark:border-slate-700 shadow-xl">
            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-5 flex items-center gap-2">
              <Star className="text-yellow-500" size={22} fill="currentColor" /> {t('gamification')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {BADGES.map(b => {
                const earned = b.min > 0 ? donationCount >= b.min : false;
                return (
                  <div key={b.id} title={`${b.label}: ${b.desc}`}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${earned ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700 opacity-40 grayscale'}`}>
                    <span className="text-3xl mb-1.5">{b.icon}</span>
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 text-center leading-tight uppercase tracking-wide">{b.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                <span>Progress</span>
                <span>{donationCount} / 10 donations</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((donationCount / 10) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Post-Donation Care */}
          <div className="bg-red-50/50 dark:bg-red-900/10 rounded-[2rem] p-7 border border-red-100 dark:border-red-900 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-5 flex items-center gap-2">
              <Heart className="text-red-600 animate-pulse" fill="currentColor" size={22} /> Post-Donation Care
            </h3>
            <div className="space-y-3">
              {[
                ['💧', 'Drink 500ml+ water immediately'],
                ['🥗', 'Eat iron-rich food (spinach, lentils)'],
                ['🛌', 'Rest for 10–15 minutes after donating'],
                ['🚫', 'Avoid heavy lifting for 24 hours'],
              ].map(([icon, tip]) => (
                <div key={tip} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-red-100 dark:border-slate-700 shadow-sm">
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Tracking Timeline */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-7 border border-slate-200 dark:border-slate-700 shadow-xl">
            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-6 flex items-center gap-2">
              <Clock className="text-blue-500" size={22} /> Active Tracking
            </h3>
            <div className="space-y-6">
              <div className="relative pl-8 border-l-2 border-green-500 pb-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 border-3 border-white dark:border-slate-800 shadow-sm"></div>
                <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Completed</p>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">City Hospital Donation</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Mar 12, 2026 • 2 Units O+</p>
              </div>
              <div className="relative pl-8 border-l-2 border-blue-300 dark:border-blue-700">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-3 border-white dark:border-slate-800 shadow-lg shadow-blue-500/50 animate-pulse"></div>
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">AI Triage Active</p>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">B- Blood Request</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Scanning network... 12 donors notified</p>
                <div className="mt-3 bg-slate-50 dark:bg-slate-700 rounded-xl p-3 border border-slate-200 dark:border-slate-600">
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full w-[45%] animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
