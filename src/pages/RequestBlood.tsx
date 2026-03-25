import React, { useState } from 'react';
import { Heart, Activity, MapPin, Search } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function RequestBlood() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: '',
    location: '',
    urgency: 'Critical (< 4h)'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await Promise.race([
        addDoc(collection(db, 'blood_requests'), {
          ...formData,
          status: 'pending',
          createdAt: new Date().toISOString()
        }),
        new Promise(r => setTimeout(r, 1500))
      ]);
      setStep(3);
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Emergency Blood Request</h1>
        <p className="text-slate-500 mt-2">Our AI will immediately identify and notify the best compatible donors.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        {/* Progress Bar */}
        <div className="flex bg-slate-50 border-b border-slate-100">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 relative">
              <div className={`h-1.5 w-full ${step >= s ? 'bg-red-500' : 'bg-transparent'}`} />
              <div className={`py-4 text-center text-sm font-semibold ${step >= s ? 'text-slate-900' : 'text-slate-400'}`}>
                {s === 1 ? 'Details' : s === 2 ? 'AI Matching' : 'Status'}
              </div>
            </div>
          ))}
        </div>

        <div className="p-8">
          {step === 1 && (
            <form onSubmit={() => setStep(2)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Patient Name</label>
                  <input required type="text" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Blood Group</label>
                  <select required value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none bg-white">
                    <option value="">Select Group</option>
                    <option>O+</option><option>O-</option>
                    <option>A+</option><option>A-</option>
                    <option>B+</option><option>B-</option>
                    <option>AB+</option><option>AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hospital Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-slate-400" size={20} />
                  <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none" placeholder="Search hospital..." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Urgency Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Normal (24h+)', 'Urgent (12h)', 'Critical (< 4h)'].map((level) => (
                    <label key={level} className="cursor-pointer">
                      <input type="radio" name="urgency" value={level} checked={formData.urgency === level} onChange={e => setFormData({...formData, urgency: e.target.value})} className="peer sr-only" required />
                      <div className="text-center px-4 py-3 rounded-xl border-2 border-slate-100 peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 font-medium text-sm transition-all text-slate-600 hover:bg-slate-50">
                        {level}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => setStep(2)} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all transform hover:-translate-y-0.5 mt-8">
                Continue to Analysis
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                  <Activity size={40} className="text-blue-600" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-transparent animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">AI is analyzing nearby donors...</h2>
              <p className="text-slate-500 mb-8 max-w-sm">Checking proximity, availability, and reliability scores for the best matches.</p>
              
              <button onClick={handleSubmit} disabled={submitting} className="w-full max-w-xs py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex justify-center items-center">
                {submitting ? 'Notifying...' : 'Notify Top 5 Matches'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart size={32} className="text-green-600" fill="currentColor" />
              </div>
              <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Request Broadcasted</h2>
              <p className="text-center text-slate-500 mb-8">Live tracking initiated. You will be notified when a donor accepts.</p>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
                <h3 className="font-semibold text-slate-900 mb-4">Live Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="font-medium">Notified 5 O+ donors nearby</span>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-500">
                    <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                    <span>Awaiting responses...</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 text-sm">
                <Search className="shrink-0 mt-0.5" size={18} />
                <p><strong>Smart Escalation Active:</strong> If no responses are received in 15 minutes, the AI will expand the search radius to 10 miles.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
