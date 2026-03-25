import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];

const FEATURES = [
  { icon: '⚡', title: 'Instant Matching', desc: 'AI finds donors in seconds' },
  { icon: '📍', title: 'Location-Based', desc: 'Nearest donors first' },
  { icon: '📊', title: 'Reliability Score', desc: 'Verified donor profiles' },
  { icon: '🏥', title: 'Hospital Network', desc: 'Live blood bank data' },
];

const SHARED_STYLES = `
  @keyframes floatBlood {
    from { transform: translateY(0px) rotate(-4deg) scale(1); }
    to   { transform: translateY(-24px) rotate(4deg) scale(1.05); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes blobPulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50%       { transform: scale(1.12); opacity: 0.7; }
  }
`;

export default function Login() {
  const { t } = useTheme();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  // Already logged in? Go straight to dashboard
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigate immediately — no delay needed
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500';

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      <style>{SHARED_STYLES}</style>

      {/* ── Background blobs ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-red-100 dark:bg-red-900/20 rounded-full blur-[120px]"
          style={{ animation: 'blobPulse 6s ease-in-out infinite' }} />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-rose-100 dark:bg-rose-900/10 rounded-full blur-[100px]"
          style={{ animation: 'blobPulse 7s ease-in-out infinite 2s' }} />
        <div className="absolute -bottom-32 left-1/4 w-[360px] h-[360px] bg-red-50 dark:bg-red-950/20 rounded-full blur-[80px]"
          style={{ animation: 'blobPulse 5s ease-in-out infinite 1s' }} />
      </div>

      {/* ── Floating blood group letters ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {BLOOD_GROUPS.map((g, i) => (
          <div key={g}
            className="absolute font-black text-red-200 dark:text-red-900/50 select-none"
            style={{
              fontSize: `${1.8 + (i % 3) * 0.8}rem`,
              top: `${6 + i * 11}%`,
              left: `${(i % 2 === 0 ? 1 : 76) + i * 2}%`,
              animation: `floatBlood ${4 + i * 0.6}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.35}s`,
            }}>
            {g}
          </div>
        ))}
      </div>

      {/* ── Left panel (desktop) ── */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col items-center justify-center p-14 overflow-hidden">
        <div className="relative z-10 max-w-sm w-full space-y-8" style={{ animation: 'slideUp 0.6s ease-out both' }}>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-red-200/60 dark:shadow-red-900/40 border border-red-100 dark:border-red-900 p-2.5">
                <img src="/Bloodbeelogo.png" alt="BloodBee" className="w-full h-full object-contain" />
              </div>
              <span className="absolute inset-0 rounded-2xl border-2 border-red-400/30 animate-ping" />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-red-600 to-red-800 dark:from-red-400 dark:to-red-600 bg-clip-text text-transparent">BloodBee</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Emergency Blood Platform</p>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium">
            {t('tagline')}
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className="flex items-center gap-4 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-slate-700 hover:-translate-y-0.5 transition-transform shadow-sm"
                style={{ animation: `slideUp 0.5s ease-out ${0.2 + i * 0.1}s both` }}>
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-slate-900 dark:text-white font-bold text-sm">{f.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stat pill */}
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800">
            <span className="text-2xl">🩸</span>
            <p className="text-red-700 dark:text-red-300 text-xs font-bold">1,240+ lives saved through the BloodBee network this year.</p>
          </div>
        </div>
      </div>

      {/* ── Right panel — Form ── */}
      <div className="relative z-10 w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px] space-y-7" style={{ animation: 'slideUp 0.6s ease-out 0.15s both' }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-9 h-9 bg-white border border-red-100 dark:border-red-900 rounded-xl p-1.5 shadow-sm">
              <img src="/Bloodbeelogo.png" alt="BloodBee" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">BloodBee</span>
          </div>

          {/* Sign in form */}
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white">{t('signIn')}</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Welcome back. The network needs you.</p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-3.5 rounded-2xl text-sm flex items-center gap-2" style={{ animation: 'slideUp 0.3s ease-out both' }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">{t('email')}</label>
                <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className={inputCls} />
              </div>

              <div className="relative" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-300">{t('password')}</label>
                  <a href="#" className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline">Forgot?</a>
                </div>
                <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Your password" className={`${inputCls} pr-12`} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div style={{ animation: 'slideUp 0.5s ease-out 0.4s both' }}>
                <button disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black rounded-2xl shadow-xl shadow-red-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-lg disabled:opacity-70 group">
                  {loading
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing In...</>
                    : <><Zap size={20} fill="white" /> {t('signIn')} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  }
                </button>
              </div>
            </form>

            <p className="text-center text-slate-500 dark:text-slate-400 text-sm" style={{ animation: 'slideUp 0.5s ease-out 0.5s both' }}>
              {t('noAccount')}{' '}
              <Link to="/register" className="text-red-600 dark:text-red-400 font-black hover:underline">{t('signUp')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
