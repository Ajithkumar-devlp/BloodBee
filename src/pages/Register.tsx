import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Heart, Eye, EyeOff, ArrowRight, Droplets } from 'lucide-react';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

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
  @keyframes bouncePop {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
`;

export default function Register() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [isDonor, setIsDonor] = useState(true);
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setStep(2);
  };

  // Validate step 2 before submitting
  const validateStep2 = () => {
    if (!dob) return 'Please enter your date of birth.';
    if (!gender) return 'Please select your gender.';
    if (!phone.trim()) return 'Please enter your phone number.';
    if (!bloodGroup) return 'Please select your blood group.';
    return null;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateStep2();
    if (validationError) { setError(validationError); return; }
    setError('');

    const displayName = name || email.split('@')[0];

    // INSTANT REDIRECT — zero UI delay, zero loading text
    localStorage.setItem('bb_reg_name', displayName);
    navigate('/account-created', { replace: true });

    // FIREBASE BACKGROUND PROCESS — entirely out of the UI thread
    createUserWithEmailAndPassword(auth, email, password)
      .then(({ user }) => {
        setDoc(doc(db, 'users', user.uid), {
          name: displayName,
          email,
          bloodGroup,
          dob,
          gender,
          phone,
          location: '',
          isDonor,
          reliabilityScore: 100,
          donationCount: 0,
          registeredAt: new Date().toISOString(),
        }).catch(console.error);
      })
      .catch(console.error);
  };


  const inputCls = 'w-full px-4 py-3.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500';

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      <style>{SHARED_STYLES}</style>

      {/* ── Background blobs ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-red-100 dark:bg-red-900/20 rounded-full blur-[120px]"
          style={{ animation: 'blobPulse 6s ease-in-out infinite' }} />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-rose-100 dark:bg-rose-900/10 rounded-full blur-[100px]"
          style={{ animation: 'blobPulse 7s ease-in-out infinite 1.5s' }} />
        <div className="absolute -bottom-32 right-1/4 w-[360px] h-[360px] bg-red-50 dark:bg-red-950/20 rounded-full blur-[80px]"
          style={{ animation: 'blobPulse 5s ease-in-out infinite 0.5s' }} />
      </div>

      {/* ── Floating blood group letters ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {BLOOD_GROUPS.map((g, i) => (
          <div key={g}
            className="absolute font-black text-red-200 dark:text-red-900/50 select-none"
            style={{
              fontSize: `${1.8 + (i % 3) * 0.7}rem`,
              top: `${5 + i * 11}%`,
              left: `${(i % 2 === 0 ? 2 : 75) + i * 2.2}%`,
              animation: `floatBlood ${4 + i * 0.55}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.3}s`,
            }}>
            {g}
          </div>
        ))}
      </div>

      {/* ── Left panel (desktop) ── */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col items-center justify-center p-14">
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
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Join the Network</p>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium">
            Become a hero. Your registration could save lives in real-time emergencies.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[['1.4K+', 'Donors', '🩸'], ['98%', 'Match Rate', '🎯'], ['<5min', 'Response', '⚡']].map(([v, l, icon], i) => (
              <div key={l}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 dark:border-slate-700 text-center shadow-sm hover:-translate-y-0.5 transition-transform"
                style={{ animation: `slideUp 0.5s ease-out ${0.3 + i * 0.1}s both` }}>
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xl font-black text-slate-900 dark:text-white">{v}</div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="p-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
            style={{ animation: 'slideUp 0.5s ease-out 0.6s both' }}>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed italic">
              "I donated blood through BloodBee at midnight and saved someone's life. Best decision I ever made."
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center text-red-700 dark:text-red-300 font-black text-xs">O+</div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Priya S.</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Active Donor · Champion 🏆</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — Form ── */}
      <div className="relative z-10 w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px] space-y-6" style={{ animation: 'slideUp 0.6s ease-out 0.15s both' }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-9 h-9 bg-white border border-red-100 dark:border-red-900 rounded-xl p-1.5 shadow-sm">
              <img src="/Bloodbeelogo.png" alt="BloodBee" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">BloodBee</span>
          </div>

          {/* Step indicator (steps 1 & 2 only) */}
          {step < 3 && (
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${step === 1 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                {step > 1 ? '✓' : '1'} Credentials
              </span>
              <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${step === 2 ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
              <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${step === 2 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                2 Blood Info
              </span>
            </div>
          )}

          {/* Header text */}
          {step < 3 && (
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white">
                {step === 1 ? t('signUp') : 'Your Blood Info'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
                {step === 1 ? 'Quick — just your email and a password.' : 'Almost done! One tap to pick your blood group.'}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-3.5 rounded-2xl text-sm flex items-center gap-2"
              style={{ animation: 'slideUp 0.3s ease-out both' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div style={{ animation: 'slideUp 0.4s ease-out 0.2s both' }}>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">{t('email')}</label>
                <input type="email" required autoFocus placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
              </div>
              <div className="relative" style={{ animation: 'slideUp 0.4s ease-out 0.3s both' }}>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">{t('password')}</label>
                <input type={showPass ? 'text' : 'password'} required minLength={6} placeholder="Min 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-12`} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div style={{ animation: 'slideUp 0.4s ease-out 0.4s both' }}>
                <button type="submit"
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black rounded-2xl shadow-xl shadow-red-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base group">
                  Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-3.5">

              {/* Name */}
              <div style={{ animation: 'slideUp 0.4s ease-out 0.1s both' }}>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  {t('fullName')} <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input type="text" placeholder="Your name"
                  value={name} onChange={e => setName(e.target.value)} className={inputCls} />
              </div>

              {/* DOB + Gender row */}
              <div className="grid grid-cols-2 gap-3" style={{ animation: 'slideUp 0.4s ease-out 0.15s both' }}>
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">📅 Date of Birth *</label>
                  <input type="date" required max={new Date(new Date().setFullYear(new Date().getFullYear()-18)).toISOString().split('T')[0]}
                    value={dob} onChange={e => setDob(e.target.value)}
                    className={inputCls} />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Must be 18+ to donate</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">👤 Gender *</label>
                  <div className="flex flex-col gap-1.5">
                    {['Male', 'Female', 'Other'].map(g => (
                      <button key={g} type="button" onClick={() => setGender(g)}
                        className={`py-2 px-3 rounded-xl text-sm font-bold border-2 transition-all text-left ${
                          gender === g
                            ? 'bg-red-600 border-red-600 text-white shadow-md'
                            : 'bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-red-400'
                        }`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div style={{ animation: 'slideUp 0.4s ease-out 0.2s both' }}>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">📞 Phone Number *</label>
                <input type="tel" required placeholder="+91 98765 43210"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  className={inputCls} />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">For emergency donor matching alerts only</p>
              </div>

              {/* Blood group grid */}
              <div style={{ animation: 'slideUp 0.4s ease-out 0.25s both' }}>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                  <Droplets size={13} className="inline mr-1 text-red-500" />{t('bloodGroup')} *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((g, i) => (
                    <button key={g} type="button" onClick={() => setBloodGroup(g)}
                      className={`py-3 rounded-2xl font-black text-sm border-2 transition-all duration-200 ${
                        bloodGroup === g
                          ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
                          : 'bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-red-400 hover:-translate-y-0.5'
                      }`}
                      style={{ animation: `slideUp 0.4s ease-out ${0.25 + i * 0.03}s both` }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Donor toggle */}
              <label className="flex items-center gap-3 p-4 bg-red-50/70 dark:bg-red-900/20 backdrop-blur-sm rounded-2xl border border-red-100 dark:border-red-800 cursor-pointer hover:-translate-y-0.5 transition-transform"
                style={{ animation: 'slideUp 0.4s ease-out 0.5s both' }}>
                <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-all duration-300 ${isDonor ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  onClick={() => setIsDonor(d => !d)}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isDonor ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-900 dark:text-red-200">{t('registerDonor')}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-0.5">Get notified for urgent nearby blood matches</p>
                </div>
                <Heart className="text-red-400 shrink-0" size={18} fill="currentColor" />
              </label>

              <div className="flex gap-3" style={{ animation: 'slideUp 0.4s ease-out 0.6s both' }}>
                <button type="button" onClick={() => { setStep(1); setError(''); }}
                  className="px-5 py-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm text-slate-700 dark:text-slate-300 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-red-400 transition-all">
                  ← Back
                </button>
                <button type="submit"
                  className="flex-1 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black rounded-2xl shadow-xl shadow-red-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 group">
                  Next <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
              {t('hasAccount')}{' '}
              <Link to="/login" className="text-red-600 dark:text-red-400 font-black hover:underline">{t('signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
