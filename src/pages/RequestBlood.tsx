import React, { useState } from 'react';
import { Heart, Activity, MapPin, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createBloodRequestWithMatches } from '../services/bloodMatching';
import MobilePageHeader from '../components/MobilePageHeader';
import { doc, collection, setDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function RequestBlood() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [matchedGroups, setMatchedGroups] = useState<string[]>([]);
  const [matchedDonors, setMatchedDonors] = useState<any[]>([]);
  const [requestId, setRequestId] = useState('');
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});
  const [expandedDonor, setExpandedDonor] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: '',
    location: '',
    urgency: 'Critical (< 4h)'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await createBloodRequestWithMatches({
        ...formData,
        requesterUserId: user?.uid ?? null,
        requesterName: profile?.name || user?.email || formData.patientName || null,
      });
      setRequestId(result.requestId);
      setMatchCount(0); // Only increments when we actually send request
      setMatchedGroups([]); // Starts empty, filled as user manually sends requests
      setMatchedDonors(result.matches);
      setStep(3);
    } catch (err) {
      console.error(err);
      setError('Unable to notify donors right now. Please try again.');
    }
    setSubmitting(false);
  };

  const sendDirectRequest = async (donor: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requestId || sentRequests[donor.donorId]) return;
    
    setSentRequests(p => ({ ...p, [donor.donorId]: true }));
    setMatchCount(p => p + 1);
    setMatchedGroups(p => Array.from(new Set([...p, donor.bloodGroup])));

    try {
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        type: 'blood_match',
        requestId,
        recipientUserId: donor.donorId,
        requesterUserId: user?.uid ?? null,
        requesterName: profile?.name || user?.email || formData.patientName || null,
        patientName: formData.patientName,
        bloodGroup: formData.bloodGroup,
        donorBloodGroup: donor.bloodGroup,
        urgency: formData.urgency,
        location: formData.location,
        receiverPhone: profile?.phone ?? '',
        receiverDescription: '',
        isSOS: false,
        status: 'unread',
        createdAt: new Date().toISOString(),
        readAt: null,
      });

      const requestRef = doc(db, 'blood_requests', requestId);
      await updateDoc(requestRef, {
        notifiedDonorCount: increment(1),
        notifiedDonorIds: arrayUnion(donor.donorId),
      });
    } catch (err) {
      console.error(err);
      setSentRequests(p => ({ ...p, [donor.donorId]: false }));
      setMatchCount(p => p - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <MobilePageHeader
        title="Request Blood"
        subtitle="AI matches you with compatible donors instantly"
        backTo="/dashboard"
      />
      <div className="mb-8 text-center hidden md:block">
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
                {submitting ? 'Searching...' : 'Find Matches'}
              </button>
              {error && (
                <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
              )}
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
                    <span className="font-medium">
                      Notified {matchCount} matched donor{matchCount === 1 ? '' : 's'}
                      {matchedGroups.length > 0 ? ` (${matchedGroups.join(', ')})` : ''}
                    </span>
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

              {matchedDonors.length > 0 && (
                <div className="text-left mt-8">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <Activity className="text-red-500" /> AI-Matched Donors
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">Click a profile to view details or send a direct request to notify them instantly.</p>
                  <div className="space-y-3">
                     {matchedDonors.map((donor, idx) => {
                        const isExpanded = expandedDonor === donor.donorId;
                        const hasSent = sentRequests[donor.donorId];
                        return (
                          <div 
                            key={idx} 
                            onClick={() => setExpandedDonor(isExpanded ? null : donor.donorId)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 transition-all cursor-pointer hover:border-blue-300"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center font-bold text-red-600">
                                {donor.bloodGroup}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                  {donor.donorName}
                                  {hasSent && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Request Sent ✓</span>}
                                </h4>
                                <p className="text-xs text-slate-500">{donor.location} • {donor.donationCount} past donations</p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                                  Reliablity: {donor.reliabilityScore}/100
                                </span>
                              </div>
                            </div>
                            
                            {/* Expandable Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-4 text-sm mb-4 bg-slate-50 p-3 rounded-lg">
                                  <div>
                                    <span className="text-slate-500 text-xs block">Blood Type Match</span>
                                    <span className="font-semibold text-slate-900">Highly Compatible</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 text-xs block">Proximity</span>
                                    <span className="font-semibold text-slate-900">Close to {formData.location}</span>
                                  </div>
                                </div>
                                <button 
                                  onClick={(e) => sendDirectRequest(donor, e)}
                                  disabled={hasSent}
                                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                                    hasSent 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 active:scale-[0.98]'
                                  }`}
                                >
                                  {hasSent ? 'Notification Sent to Bell' : 'Send Direct Request'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                     })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
