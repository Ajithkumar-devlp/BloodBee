import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AlertTriangle, MapPin, ChevronRight, CheckCircle, AlarmClock } from 'lucide-react';
import { createBloodRequestWithMatches } from '../services/bloodMatching';

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const STEPS = ['Blood Type', 'Your Info', 'Location', 'Send SOS'];

export default function Emergency() {
  const { t } = useTheme();
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
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
      const result = await createBloodRequestWithMatches({
        patientName: form.name,
        bloodGroup: form.bloodGroup,
        location: form.location,
        urgency: 'Critical (< 4h)',
        phone: form.phone,
        description: form.description,
        isSOS: true,
      });
      setMatchCount(result.matches.length);
      setSent(true);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-950 relative flex items-center justify-center p-6 overflow-hidden">
        {/* Pulsing Warning Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/30 blur-[120px] rounded-full pointer-events-none animate-pulse" />

        <div className="w-full max-w-md text-center space-y-10 relative z-10 animate-in fade-in zoom-in-95 duration-700">
          {/* Animated Success */}
          <div className="relative mx-auto w-44 h-44">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
            <div className="absolute inset-4 rounded-full bg-white/30 animate-ping" style={{ animationDelay: '0.4s' }}></div>
            <div className="relative w-44 h-44 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50 border-8 border-red-500/50 overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-white to-red-50 opacity-50"></div>
               <CheckCircle size={72} className="text-red-600 relative z-10" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-lg uppercase italic">SOS <span className="text-red-200">Broadcasted</span></h1>
            <p className="text-red-100 text-lg leading-relaxed font-bold px-4 drop-shadow-md">Your emergency alert is ringing on the phones of nearby donors right now!</p>
            <div className="inline-block bg-white/20 backdrop-blur-md text-white font-black px-6 py-3 rounded-full border border-white/30 shadow-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
              <span className="flex items-center justify-center gap-2 relative z-10">
                <span className="w-3 h-3 bg-red-200 rounded-full animate-ping"></span>
                {matchCount} MATCHED DONOR{matchCount === 1 ? '' : 'S'} ALERTED
              </span>
            </div>
          </div>
          
          <div className="bg-black/20 backdrop-blur-xl rounded-[2rem] p-8 border border-white/20 shadow-2xl text-left space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-red-200 mb-6 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-400 animate-pulse" /> Live Alert Summary
            </p>
            {[
              ['Patient Name', form.name],
              ['Contact Number', form.phone],
              ['Blood Needed', form.bloodGroup],
              ['Location', form.location],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-b border-white/10 pb-4 last:border-0 last:pb-0">
                <span className="text-red-200/80 text-sm font-bold uppercase tracking-wider">{k}</span>
                <span className={`text-white font-black lg:text-lg tracking-wide ${k === 'Blood Needed' ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)] text-2xl' : ''}`}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { setSent(false); setStep(0); setForm({ name: '', phone: '', bloodGroup: '', location: '', description: '' }); }}
            className="w-full py-5 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/30 text-white font-black rounded-2xl shadow-2xl text-lg transition-all uppercase tracking-widest">
            Send Another Alert
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-950 relative flex items-center justify-center p-4 overflow-hidden transition-colors duration-500">
      {/* Background Warning Elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] opacity-10 mix-blend-overlay"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/20 blur-[100px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-900/40 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Header Section */}
        <div className="text-center space-y-5">
          <div className="relative mx-auto w-24 h-24 group">
            <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-ping group-hover:bg-white/40 transition-colors"></div>
            <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-red-500 shadow-[0_0_40px_rgba(255,255,255,0.3)] rotate-3 hover:rotate-0 transition-transform duration-300">
              <img src="/Bloodbeelogo.png" alt="BloodBee" className="w-16 h-16 object-contain drop-shadow-md relative z-10" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic drop-shadow-md">Emergency SOS</h1>
            <p className="text-red-100 font-bold mt-2 text-lg drop-shadow">Every second counts. Donors are on standby.</p>
          </div>
        </div>

        {/* Step Progress Container */}
        <div className="bg-black/20 backdrop-blur-md px-5 py-4 rounded-3xl border border-white/10 shadow-inner">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex-1 h-2 rounded-full transition-all duration-700 ${i <= step ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-black/30'}`} />
                {i < STEPS.length - 1 && <div className={`w-3.5 h-3.5 rounded-full shrink-0 border-[3px] transition-all duration-700 ${i < step ? 'bg-white border-white' : i === step ? 'bg-red-600 border-white' : 'bg-transparent border-black/30'}`} />}
              </div>
            ))}
          </div>
          <p className="text-center text-xs font-black text-red-100 uppercase tracking-widest mt-3 drop-shadow-md flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-ping"></span> 
            Step {step + 1} OF 4: <span className="text-white">{STEPS[step]}</span>
          </p>
        </div>

        {/* Main Interactive Card */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/20 shadow-2xl shadow-red-900/50 min-h-[320px] flex flex-col transition-all duration-500">

          {/* Step 0 — Blood Type */}
          {step === 0 && (
            <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-3xl font-black text-white mb-2 uppercase drop-shadow-sm">{t('bgGroup')}</h2>
                <p className="text-red-200 text-sm font-bold tracking-wide">Select the blood group required IMMEDIATELY</p>
              </div>
              <div className="grid grid-cols-4 gap-3 flex-1 items-center">
                {BLOOD_GROUPS.map(g => (
                  <button key={g} onClick={() => setForm({ ...form, bloodGroup: g })}
                    className={`h-16 rounded-2xl font-black text-xl transition-all duration-300 border-2 ${form.bloodGroup === g
                      ? 'bg-white text-red-700 border-white shadow-[0_0_20px_rgba(255,255,255,0.5)] scale-110 -translate-y-1'
                      : 'bg-black/20 text-white border-white/20 hover:bg-white/20 hover:border-white/50 hover:scale-105'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — Your Info */}
          {step === 1 && (
            <div className="flex-1 flex flex-col gap-5 animate-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-3xl font-black text-white mb-2 uppercase drop-shadow-sm">{t('yourName')} & Contact</h2>
                <p className="text-red-200 text-sm font-bold tracking-wide">Donors will call this exact number.</p>
              </div>
              <div className="space-y-4 pt-2">
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Patient or Contact Name"
                  className="w-full px-6 py-5 bg-black/20 backdrop-blur-md border-[3px] border-white/20 focus:border-white focus:bg-white/30 rounded-2xl text-white placeholder:text-red-200/50 focus:ring-4 focus:ring-white/20 outline-none font-black text-xl transition-all shadow-inner" />
                <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="Direct Phone Number"
                  className="w-full px-6 py-5 bg-black/20 backdrop-blur-md border-[3px] border-white/20 focus:border-white focus:bg-white/30 rounded-2xl text-white placeholder:text-red-200/50 focus:ring-4 focus:ring-white/20 outline-none font-black text-xl transition-all shadow-inner" />
              </div>
            </div>
          )}

          {/* Step 2 — Location */}
          {step === 2 && (
            <div className="flex-1 flex flex-col gap-5 animate-in slide-in-from-right-4">
              <div className="text-center">
                <h2 className="text-3xl font-black text-white mb-2 uppercase drop-shadow-sm">Hospital Location</h2>
                <p className="text-red-200 text-sm font-bold tracking-wide">Where must the donor arrive RIGHT NOW?</p>
              </div>
              <div className="space-y-4 pt-2">
                <div className="relative">
                  <MapPin size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50" />
                  <input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Apollo Hospital ICU, Ward B"
                    className="w-full pl-16 pr-6 py-5 bg-black/20 backdrop-blur-md border-[3px] border-white/20 focus:border-white focus:bg-white/30 rounded-2xl text-white placeholder:text-red-200/50 focus:ring-4 focus:ring-white/20 outline-none font-black text-lg transition-all shadow-inner" />
                </div>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="CRITICAL ADDTL INFO (e.g. Room #304, Ask for Dr. Sharma)"
                  className="w-full px-6 py-5 bg-black/20 backdrop-blur-md border-[3px] border-white/20 focus:border-white focus:bg-white/30 rounded-2xl text-white placeholder:text-red-200/50 focus:ring-4 focus:ring-white/20 outline-none font-bold text-base transition-all resize-none shadow-inner" />
              </div>
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-4 bg-yellow-500 p-4 rounded-2xl border-4 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                <div className="w-14 h-14 bg-black/90 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-yellow-400 animate-pulse" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black leading-tight uppercase">Verify SOS Details!</h2>
                  <p className="text-yellow-900 text-xs font-black mt-1 uppercase tracking-widest">This alerts hundreds of donors instantly.</p>
                </div>
              </div>
              <div className="bg-black/30 rounded-2xl p-6 border border-white/20 space-y-4 flex-1 backdrop-blur-sm">
                {[
                  ['Blood Needed', form.bloodGroup, 'font-black text-2xl text-yellow-300 drop-shadow-md'],
                  ['Patient Name', form.name, 'text-white font-black text-lg'],
                  ['Phone Number', form.phone, 'text-white font-black text-lg'],
                  ['Hospital Location', form.location, 'text-white font-bold'],
                ].map(([k, v, cls]) => (
                  <div key={k as string} className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0 last:pb-0">
                    <span className="text-red-200/80 text-xs font-black uppercase tracking-widest">{k as string}</span>
                    <span className={`text-sm ${cls as string} text-right max-w-[60%] truncate ml-3`}>{v as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 px-2">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-8 py-5 bg-black/20 border border-white/20 text-white font-black rounded-3xl hover:bg-black/40 transition-all shadow-lg hover:shadow-xl uppercase tracking-widest text-sm backdrop-blur-md">
              Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext[step]}
              className="flex-1 py-5 bg-white hover:bg-slate-100 text-red-700 font-black rounded-3xl transition-all shadow-[0_10px_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-xl group uppercase tracking-widest transform hover:-translate-y-1">
              Continue <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button onClick={sendSOS} disabled={loading}
              className="flex-1 py-5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 hover:brightness-110 text-red-900 font-black rounded-3xl transition-all shadow-[0_0_40px_rgba(253,224,71,0.6)] flex items-center justify-center gap-3 disabled:opacity-70 text-2xl transform hover:scale-105 active:scale-95 uppercase tracking-widest">
              {loading ? <div className="w-8 h-8 border-4 border-yellow-700/30 border-t-red-900 rounded-full animate-spin" /> : <AlarmClock size={28} fill="currentColor" />}
              {loading ? 'Broadcasting...' : 'SOUND THE SOS ALARM'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
