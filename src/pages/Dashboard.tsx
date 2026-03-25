import { Navigation, CheckCircle2, Clock, Activity, MapPin, Heart, Shield, Bell, Star, TrendingUp, Users, MessageSquare, X, Map, Tent } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useLocation } from 'react-router-dom';
import { acceptBloodRequestMatch } from '../services/bloodMatching';

interface BloodRequest {
  id: string;
  bloodGroup: string;
  patientName: string;
  location: string;
  urgency: string;
  status: string;
  createdAt: string;
  isSOS?: boolean;
  matchNotificationId?: string;
  matchStatus?: string;
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
  const { profile, user } = useAuth();
  const { t } = useTheme();
  const location = useLocation();
  const [activeRequests, setActiveRequests] = useState<BloodRequest[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [showWelcomeToast, setShowWelcomeToast] = useState(
    !!(location.state as any)?.justRegistered
  );
  const [heatmap, setHeatmap] = useState<{ location: string; count: number }[]>([]);
  const donationCount = profile?.donationCount ?? 0;

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (showWelcomeToast) {
      const t = setTimeout(() => setShowWelcomeToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showWelcomeToast]);

  useEffect(() => {
    if (!profile || !user) return;

    const q = profile.isDonor
      ? query(collection(db, 'notifications'), where('recipientUserId', '==', user.uid))
      : query(collection(db, 'blood_requests'), where('requesterUserId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (profile.isDonor) {
        const matchedRequests: BloodRequest[] = [];

        snapshot.forEach(notificationDoc => {
          const notification = notificationDoc.data();
          if (!['unread', 'read', 'accepted'].includes(notification.status)) return;

          matchedRequests.push({
            id: notification.requestId,
            patientName: notification.patientName,
            bloodGroup: notification.bloodGroup,
            location: notification.location,
            urgency: notification.urgency,
            status: notification.status === 'accepted' ? 'matched' : 'pending',
            createdAt: notification.createdAt,
            isSOS: !!notification.isSOS,
            matchNotificationId: notificationDoc.id,
            matchStatus: notification.status,
          });
        });

        setActiveRequests(
          matchedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
        return;
      }

      const ownRequests: BloodRequest[] = [];
      snapshot.forEach(requestDoc => ownRequests.push({ id: requestDoc.id, ...requestDoc.data() } as BloodRequest));
      setActiveRequests(
        ownRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    });

    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const counts: Record<string, number> = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.isDonor) {
            const loc = data.location || 'Unknown';
            const city = loc.split(',')[0].trim();
            counts[city] = (counts[city] || 0) + 1;
          }
        });
        const sorted = Object.entries(counts)
          .map(([location, count]) => ({ location, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setHeatmap(sorted);
      },
      (err) => console.error("Heatmap Error:", err)
    );

    return () => {
      unsubscribe();
      unsubscribeUsers();
    };
  }, [profile, user]);

  const handleAcceptMatch = async (request: BloodRequest) => {
    if (!user || !profile || request.matchStatus === 'accepted') return;

    setAcceptingRequestId(request.id);
    try {
      await acceptBloodRequestMatch(request.id, user.uid, profile.name || user.email || 'BloodBee Donor');
    } catch (err) {
      console.error(err);
    } finally {
      setAcceptingRequestId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Account Created Toast ── */}
      {showWelcomeToast && (
        <div className="flex items-center gap-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-2xl px-5 py-4 shadow-lg animate-in slide-in-from-top-4 fade-in duration-500">
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
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-2xl overflow-hidden relative border border-white/10 animate-in slide-in-from-bottom-8 fade-in duration-700">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-12 -translate-y-12 animate-pulse"><Heart size={200} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Hello, {profile?.name?.split(' ')[0] || 'Hero'}!</h1>
            <p className="text-red-100/90 text-lg max-w-xl font-medium leading-relaxed">
              {profile?.isDonor ? "Your blood type is powerful. You are eligible to donate today!" : "Welcome to BloodBee. Every action helps save lives."}
            </p>
            {profile?.isDonor && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8">
                <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md w-fit px-6 py-3 rounded-2xl border border-white/10 hover:bg-black/30 transition-colors">
                  <span className="text-sm font-bold text-red-50 uppercase tracking-widest">Availability</span>
                  <button onClick={() => setIsAvailable(!isAvailable)}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-500 ${isAvailable ? 'bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 'bg-white/20'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-500 ${isAvailable ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-sm font-black uppercase tracking-wider transition-colors duration-300 ${isAvailable ? 'text-green-400' : 'text-slate-300'}`}>
                    {isAvailable ? 'Active' : 'Busy'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md w-fit px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors cursor-help" title="High Trust Scores prioritize you in the AI matchmaking algorithm">
                  <Shield size={20} className="text-blue-300" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest leading-none mb-1">Trust Score</span>
                    <span className="text-base font-black text-white leading-none">{profile?.reliabilityScore ?? 98}<span className="text-xs text-blue-100/70 font-bold ml-0.5">/100</span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex w-full md:w-auto mt-4 md:mt-0">
            <div className="backdrop-blur-md bg-white rounded-3xl p-6 text-center border border-white/50 shadow-xl w-full md:w-auto transform hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-black tracking-tighter text-red-600 drop-shadow-sm">{profile?.bloodGroup ?? '?'}</div>
              <div className="text-xs uppercase tracking-widest font-black mt-2 text-red-400">Your Blood Type</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 One-Tap Emergency CTA */}
      <Link to="/emergency"
        className="flex items-center gap-5 p-6 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-[2rem] text-white shadow-[0_8px_30px_rgb(220,38,38,0.3)] hover:shadow-[0_15px_40px_rgb(220,38,38,0.4)] transition-all transform hover:-translate-y-1 group cursor-pointer border border-red-500/30 animate-in slide-in-from-bottom-8 fade-in delay-150 fill-mode-both">
        <div className="w-16 h-16 bg-white/20 rounded-[1.25rem] flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform duration-500">🚨</div>
        <div className="flex-1">
          <h3 className="font-black text-2xl tracking-tight">{t('oneEmergency')}</h3>
          <p className="text-red-100/90 text-sm font-medium mt-1">No login needed — broadcast an SOS to all nearby donors instantly</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors hidden sm:flex">
          <Navigation size={24} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 animate-in slide-in-from-bottom-8 fade-in delay-300 fill-mode-both">
        {[
          { to: '/request', icon: Activity, label: 'Request Blood', sub: 'AI Match', color: 'red', from: 'from-red-500', toC: 'to-red-600' },
          { to: '/hospitals', icon: MapPin, label: 'Hospitals', sub: 'Live Inventory', color: 'blue', from: 'from-blue-500', toC: 'to-blue-600' },
          { to: '/passport', icon: Shield, label: 'Health Passport', sub: 'Verified ID', color: 'emerald', from: 'from-emerald-500', toC: 'to-emerald-600' },
          { to: '/camps', icon: Tent, label: 'Blood Camps', sub: 'Local Events', color: 'orange', from: 'from-orange-500', toC: 'to-orange-600' },
        ].map(a => (
          <Link key={a.to} to={a.to}
            className={`bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-${a.color}-200 transition-all duration-300 group flex flex-col items-center text-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1`}>
            <div className={`w-16 h-16 bg-gradient-to-br ${a.from} ${a.toC} text-white rounded-[1.25rem] flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-${a.color}-500/30`}>
              <a.icon size={28} strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base md:text-lg">{a.label}</h3>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-widest">{a.sub}</p>
          </Link>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">

          {/* Live Alerts */}
          <div className="space-y-5 animate-in slide-in-from-bottom-8 fade-in delay-500 fill-mode-both">
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
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                    {profile?.isDonor ? 'No urgent matches right now' : 'No active blood requests yet'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm">
                    {profile?.isDonor
                      ? "We'll notify you instantly when someone needs your blood type."
                      : 'Your blood requests will appear here once they are created.'}
                  </p>
                </div>
              ) : (
                activeRequests.map(req => (
                  <div key={req.id} className={`bg-white dark:bg-slate-800 border-2 rounded-[2rem] p-6 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col ${req.isSOS ? 'border-red-300 dark:border-red-700' : 'border-slate-100 dark:border-slate-700'}`}>
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
                         <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate max-w-[150px]">{req.patientName || 'Unknown'}</h3>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                          <MapPin size={12} className="text-blue-500" /> <span className="truncate max-w-[150px]">{req.location}</span>
                        </div>
                      </div>
                    </div>
                    {req.urgency.includes('Critical') && (
                      <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800 mb-4">
                        <Activity size={14} className="animate-pulse" /> CRITICAL PRIORITY
                      </div>
                    )}
                    {profile?.isDonor ? (
                      <button
                        onClick={() => handleAcceptMatch(req)}
                        disabled={acceptingRequestId === req.id || req.matchStatus === 'accepted'}
                        className="mt-auto w-full bg-slate-900 dark:bg-red-700 hover:bg-slate-800 dark:hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                      >
                        <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                        {req.matchStatus === 'accepted'
                          ? 'Accepted by You'
                          : acceptingRequestId === req.id
                            ? 'Accepting...'
                            : 'Accept Match'}
                      </button>
                    ) : (
                      <div className="mt-auto w-full bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-200 font-bold py-3.5 rounded-2xl border border-slate-200 dark:border-slate-600 text-center">
                        {req.status === 'matched' ? 'A donor accepted this request' : 'Matching donors from database'}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Predictive Blood Demand */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 animate-in slide-in-from-bottom-8 fade-in delay-[600ms] fill-mode-both">
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
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 animate-in slide-in-from-bottom-8 fade-in delay-[700ms] fill-mode-both">
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

          {/* Regional Donor Heat Map - LIVE IFRAME */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-7 border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group animate-in slide-in-from-right-8 fade-in delay-[800ms] fill-mode-both">
             <div className="flex justify-between items-center mb-5">
               <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                 <Map className="text-orange-500" size={22} /> Network Heat Map
               </h3>
               <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded-md">Live</span>
             </div>
             
             {/* Map Integration */}
             <div className="w-full h-48 rounded-2xl overflow-hidden mb-5 border-2 border-slate-100 dark:border-slate-700 relative">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.602280738361!2d80.2079084153408!3d13.060424590799015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5266b033e08fbf%3A0x6b48520bf21e7fc9!2sChennai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1679051052674!5m2!1sen!2sin" 
                  className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500 filter dark:invert dark:hue-rotate-180" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-3 left-3 text-white text-[10px] font-black tracking-widest uppercase truncate drop-shadow-md">
                   Tracking {heatmap.reduce((acc, curr) => acc + curr.count, 0)} Active Donors
                </div>
             </div>

             <div className="space-y-4 relative">
               {heatmap.length === 0 ? (
                 <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-sm font-bold">No location data found</div>
               ) : (
                 heatmap.slice(0, 3).map((region, i) => {
                   const maxCount = heatmap[0]?.count || 1;
                   const percentage = Math.max(10, Math.round((region.count / maxCount) * 100));
                   const colorClass = percentage > 80 ? 'bg-orange-500' : percentage > 40 ? 'bg-orange-400' : 'bg-orange-300';
                   return (
                     <div key={i} className="relative">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                         <span className="text-slate-700 dark:text-slate-300">{region.location}</span>
                         <span className="text-orange-600 dark:text-orange-400">{region.count} Donors</span>
                       </div>
                       <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                         <div className={`${colorClass} h-full rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
          </div>

          {/* Gamification Badges */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-7 border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in slide-in-from-right-8 fade-in delay-[900ms] fill-mode-both">
            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-5 flex items-center gap-2">
              <Star className="text-yellow-500" size={22} fill="currentColor" /> {t('gamification')}
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {BADGES.map(b => {
                const earned = donationCount >= b.min && (b.min > 0 || profile?.isDonor);
                return (
                  <div key={b.id} title={`${b.label}: ${b.desc}`}
                    className={`flex flex-col items-center p-2 rounded-xl border transition-all hover:scale-105 cursor-help ${earned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700 shadow-sm' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700 opacity-50 grayscale'}`}>
                    <span className="text-2xl mb-1">{b.icon}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                <span>Progress to next Rank</span>
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
