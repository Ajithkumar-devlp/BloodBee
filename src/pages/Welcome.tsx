import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Heart, Shield, Users, ArrowRight } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];

const STATS = [
  { value: '1.4K+', label: 'Active Donors', icon: '🩸' },
  { value: '98%', label: 'Match Rate', icon: '🎯' },
  { value: '<5 min', label: 'Avg Response', icon: '⚡' },
  { value: '24/7', label: 'Always On', icon: '🛡️' },
];

const FEATURES = [
  { icon: Zap, title: 'One-Tap SOS', desc: 'Broadcast emergency to all nearby donors instantly', color: 'red' },
  { icon: Heart, title: 'Community Feed', desc: 'Stories, achievements and real donor experiences', color: 'pink' },
  { icon: Shield, title: 'Health Passport', desc: 'Your verified donor identity with QR scan', color: 'emerald' },
  { icon: Users, title: 'Blood Camps', desc: 'Find & organize NGO donation events near you', color: 'blue' },
];

export default function Welcome() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden">

      {/* ── Animated background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-red-100 dark:bg-red-900/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -right-60 w-[500px] h-[500px] bg-rose-100 dark:bg-rose-900/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-red-50 dark:bg-red-950/30 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* ── Floating blood group badges ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {BLOOD_GROUPS.map((g, i) => (
          <div key={g}
            className="absolute text-red-200 dark:text-red-900/60 font-black select-none"
            style={{
              fontSize: `${2 + (i % 3)}rem`,
              top: `${8 + (i * 11)}%`,
              left: `${(i % 2 === 0 ? 2 : 78) + (i * 2.5)}%`,
              animation: `float ${4 + i * 0.5}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.4}s`,
            }}>
            {g}
          </div>
        ))}
      </div>

      {/* ── Hero Section ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">

        {/* Logo + badge */}
        <div className="flex flex-col items-center gap-4 mb-8" style={{ animation: 'slideDown 0.6s ease-out' }}>
          <div className="relative">
            <div className="w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-200/60 dark:shadow-red-900/40 border border-red-100 dark:border-red-900/30 p-4 hover:scale-105 transition-transform duration-300">
              <img src="/Bloodbeelogo.png" alt="BloodBee" className="w-full h-full object-contain" />
            </div>
            {/* Ping ring */}
            <span className="absolute inset-0 rounded-[2rem] border-2 border-red-400/40 animate-ping" />
          </div>
          <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-red-100 dark:border-red-800">
            🩸 AI-Powered Blood Network
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight mb-6"
          style={{ animation: 'slideUp 0.7s ease-out 0.1s both' }}>
          Every Second<br />
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-red-600 via-red-500 to-rose-600 bg-clip-text text-transparent">
              Saves a Life
            </span>
            {/* Underline accent */}
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path d="M0 8 Q75 2 150 8 Q225 14 300 8" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            </svg>
          </span>
        </h1>

        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium mb-10 leading-relaxed"
          style={{ animation: 'slideUp 0.7s ease-out 0.2s both' }}>
          BloodBee connects donors and recipients in real-time emergencies.
          One tap. Instant SOS. Your blood type is someone's lifeline.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          style={{ animation: 'slideUp 0.7s ease-out 0.3s both' }}>
          <Link to="/register"
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black rounded-2xl shadow-2xl shadow-red-500/30 transition-all transform hover:-translate-y-1 text-lg">
            <Heart size={22} fill="white" className="group-hover:scale-110 transition-transform" />
            Join BloodBee — Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/login"
            className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600 transition-all shadow-lg hover:-translate-y-0.5 text-lg">
            Sign In
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-20"
          style={{ animation: 'slideUp 0.7s ease-out 0.4s both' }}>
          {STATS.map((s) => (
            <div key={s.label}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Live pulse bar */}
        <div className="flex items-center justify-center gap-3 mb-20 opacity-70"
          style={{ animation: 'slideUp 0.7s ease-out 0.45s both' }}>
          <div className="flex gap-1 items-end h-8">
            {[4, 7, 3, 9, 5, 8, 4, 6, 3, 8, 5, 7, 4].map((h, i) => (
              <div key={i}
                className="w-1.5 bg-gradient-to-t from-red-600 to-red-400 rounded-full"
                style={{
                  height: `${h * 3}px`,
                  animation: `pulse ${0.6 + i * 0.07}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.08}s`,
                }} />
            ))}
          </div>
          <span className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse" />
            Live network active 24/7 — donors online now
          </span>
          <div className="flex gap-1 items-end h-8">
            {[5, 8, 4, 7, 3, 9, 6, 4, 8, 5, 7, 3, 6].map((h, i) => (
              <div key={i}
                className="w-1.5 bg-gradient-to-t from-red-600 to-red-400 rounded-full"
                style={{
                  height: `${h * 3}px`,
                  animation: `pulse ${0.6 + i * 0.07}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.08 + 0.5}s`,
                }} />
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20"
          style={{ animation: 'slideUp 0.7s ease-out 0.5s both' }}>
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title}
              className={`group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 text-left shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-default`}>
              <div className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                <Icon size={24} />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base mb-1">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>



        {/* Footer note */}
        <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">
          Free forever · No ads · Open source · Built for humanity 🌍
        </p>
      </div>

      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(-3deg); }
          to   { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
