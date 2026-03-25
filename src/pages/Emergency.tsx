import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { Droplet, MapPin, CheckCircle, ChevronRight, AlertTriangle } from 'lucide-react';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const STEPS = ['Blood Type', 'Your Info', 'Location', 'Send SOS'];

export default function Emergency() {
  const { t } = useTheme();
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', bloodGroup: '', location: '', description: '',
  });

  const canNext = [
    !!form.bloodGroup,
    !!(form.name && form.phone),
    !!form.location,
    true,
  ];

  const sendSOS = async () => {
    setLoading(true);
    try {
      await Promise.race([
        addDoc(collection(db, 'blood_requests'), {
          patientName: form.name, bloodGroup: form.bloodGroup,
          location: form.location, urgency: 'Critical (< 4h)',
          status: 'pending', phone: form.phone,
          description: form.description, isSOS: true,
          createdAt: new Date().toISOString(),
        }),
        new Promise(r => setTimeout(r, 1500))
      ]);
      setSent(true);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-8">
          {/* Animated Success */}
          <div className="relative mx-auto w-40 h-40">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
            <div className="absolute inset-4 rounded-full bg-red-500/30 animate-ping" style={{ animationDelay: '0.3s' }}></div>
            <div className="relative w-40 h-40 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50 border border-red-500/30">
              <CheckCircle size={64} className="text-white" />
            </div>
          </div>
          <div className="text-white space-y-3">
            <h1 className="text-4xl font-black">{t('sosSent')}</h1>
            <p className="text-red-300 text-lg leading-relaxed">{t('sosSentDesc')}</p>
          </div>
          {/* Summary */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-left space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-4">Alert Summary</p>
            {[
              ['Patient', form.name],
              ['Phone', form.phone],
              ['Blood Needed', form.bloodGroup],
              ['Location', form.location],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-red-300 text-sm font-semibold">{k}</span>
                <span className={`text-white font-black text-sm ${k === 'Blood Needed' ? 'text-yellow-300 text-lg' : ''}`}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { setSent(false); setStep(0); setForm({ name: '', phone: '', bloodGroup: '', location: '', description: '' }); }}
            className="w-full py-4 bg-white hover:bg-red-50 text-red-700 font-black rounded-2xl shadow-2xl text-lg transition-colors">
            Send Another SOS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo + Title */}
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse"></div>
            <div className="relative w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
              <img src="/Bloodbeelogo.png" alt="BloodBee" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white">Emergency SOS</h1>
            <p className="text-red-300 font-medium mt-1">Fill in details — donors alerted instantly</p>
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-red-500' : 'bg-white/10'}`} />
              {i < STEPS.length - 1 && <div className={`w-3 h-3 rounded-full shrink-0 border-2 transition-all ${i < step ? 'bg-red-500 border-red-500' : i === step ? 'bg-white border-red-500' : 'bg-transparent border-white/20'}`} />}
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-black text-red-300 uppercase tracking-widest -mt-4">Step {step + 1}: {STEPS[step]}</p>

        {/* Step Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 shadow-2xl min-h-[280px] flex flex-col">

          {/* Step 0 — Blood Type */}
          {step === 0 && (
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">{t('bgGroup')}</h2>
                <p className="text-red-300 text-sm font-medium">Select the blood group needed urgently</p>
              </div>
              <div className="grid grid-cols-4 gap-3 flex-1 items-center">
                {BLOOD_GROUPS.map(g => (
                  <button key={g} onClick={() => setForm({ ...form, bloodGroup: g })}
                    className={`py-4 rounded-2xl font-black text-base transition-all duration-200 ${form.bloodGroup === g
                      ? 'bg-red-600 text-white shadow-xl shadow-red-900/60 scale-110'
                      : 'bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:scale-105'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — Your Info */}
          {step === 1 && (
            <div className="flex-1 flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">{t('yourName')} & Phone</h2>
                <p className="text-red-300 text-sm font-medium">Donors will use this to contact you</p>
              </div>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Patient / Caller Name"
                className="flex-shrink-0 px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-red-300/50 focus:ring-2 focus:ring-red-500 outline-none font-medium transition-all" />
              <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone Number"
                className="flex-shrink-0 px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-red-300/50 focus:ring-2 focus:ring-red-500 outline-none font-medium transition-all" />
            </div>
          )}

          {/* Step 2 — Location */}
          {step === 2 && (
            <div className="flex-1 flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">Location</h2>
                <p className="text-red-300 text-sm font-medium">Hospital name or area for nearest donors</p>
              </div>
              <div className="flex items-start gap-3 flex-1">
                <MapPin size={22} className="text-red-400 mt-4 shrink-0" />
                <input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. City Hospital, Chennai"
                  className="flex-1 px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-red-300/50 focus:ring-2 focus:ring-red-500 outline-none font-medium transition-all" />
              </div>
              <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Additional info for donors (optional)"
                className="px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-red-300/50 focus:ring-2 focus:ring-red-500 outline-none font-medium transition-all resize-none" />
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-yellow-400 shrink-0" size={24} />
                <div>
                  <h2 className="text-2xl font-black text-white">Confirm & Send</h2>
                  <p className="text-red-300 text-sm font-medium">Review your SOS alert</p>
                </div>
              </div>
              <div className="bg-black/30 rounded-2xl p-5 border border-white/10 space-y-3 flex-1">
                {[
                  ['🩸 Blood', form.bloodGroup, 'text-yellow-300 font-black text-xl'],
                  ['👤 Patient', form.name, 'text-white font-bold'],
                  ['📞 Phone', form.phone, 'text-white font-bold'],
                  ['📍 Location', form.location, 'text-white font-bold'],
                ].map(([k, v, cls]) => (
                  <div key={k as string} className="flex justify-between items-center">
                    <span className="text-red-300 text-sm font-semibold">{k as string}</span>
                    <span className={`text-sm ${cls as string} truncate ml-3`}>{v as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-6 py-4 bg-white/10 border border-white/20 text-white font-black rounded-2xl hover:bg-white/20 transition-colors">
              Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext[step]}
              className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-red-900/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg">
              Continue <ChevronRight size={20} />
            </button>
          ) : (
            <button onClick={sendSOS} disabled={loading}
              className="flex-1 py-4 bg-white hover:bg-red-50 text-red-700 font-black rounded-2xl transition-all shadow-2xl text-xl flex items-center justify-center gap-3 disabled:opacity-60">
              {loading ? <div className="w-6 h-6 border-3 border-red-300 border-t-red-700 rounded-full animate-spin" /> : <Droplet size={24} fill="currentColor" />}
              {loading ? 'Broadcasting...' : t('sendSOS')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
