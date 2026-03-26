import { Navigation, CheckCircle2, Clock, Activity, MapPin, Heart, Shield, Bell, Star, TrendingUp, Users, MessageSquare, X, Map, Tent, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  useEffect, 
  useState, 
  useCallback,
  useRef
} from 'react';
import { collection, onSnapshot, query, where, setDoc, doc, deleteDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useLocation } from 'react-router-dom';
import { acceptBloodRequestMatch, markDonationCompleted } from '../services/bloodMatching';

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
  // Receiver details shown to donor
  receiverPhone?: string;
  receiverDescription?: string;
  requesterName?: string;
  // Donor details shown to receiver after acceptance
  acceptedDonorName?: string;
  acceptedDonorPhone?: string;
  acceptedDonorEmail?: string;
  acceptedDonorBloodGroup?: string;
  acceptedDonorLocation?: string;
}

interface AcceptedDonorAlert {
  id: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  donorBloodGroup: string;
  donorLocation: string;
  patientName: string;
  bloodGroup: string;
  location: string;
  urgency: string;
  createdAt: string;
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
  const [acceptedAlerts, setAcceptedAlerts] = useState<AcceptedDonorAlert[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [completingRequestId, setCompletingRequestId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [highlightMatchRef, setHighlightMatchRef] = useState<string | null>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  const scrollToMatches = () => {
    if (alertsRef.current) {
      alertsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Identify the first perfect match to highlight
      const perfectMatch = activeRequests.find(r => r.bloodGroup === profile?.bloodGroup);
      if (perfectMatch) {
        setHighlightMatchRef(perfectMatch.id);
        setTimeout(() => setHighlightMatchRef(null), 3000);
      }
    }
  };

  const [showWelcomeToast, setShowWelcomeToast] = useState(
    !!(location.state as any)?.justRegistered
  );
  const [heatmap, setHeatmap] = useState<{ location: string; count: number }[]>([]);
  const [aiHeatmapInsights, setAiHeatmapInsights] = useState<{ location: string; crisis: string; tip: string; score: number }[]>([]);
  const donationCount = profile?.donationCount ?? 0;

  const [onboardingData, setOnboardingData] = useState({
    bloodGroup: '', location: '', isDonor: true
  });
  const [savingOnboarding, setSavingOnboarding] = useState(false);

  // AI Personalized State
  const [aiStories, setAiStories] = useState(COMMUNITY);
  const [realStories, setRealStories] = useState<any[]>([]);
  const [aiPredictive, setAiPredictive] = useState(PREDICTIVE);
  const [aiMission, setAiMission] = useState({
    cityForecast: "Scanning city requests...",
    healthTip: "Stay hydrated for peak readiness.",
    impactScore: "Your blood can save 3 lives today.",
    bestMatchCount: 0
  });
  const [aiCare, setAiCare] = useState<string[][]>([
    ['💧', 'Drink 500ml+ water immediately', 'Hydration'],
    ['🥗', 'Eat iron-rich food (spinach, lentils)', 'Nutrition'],
    ['🛌', 'Rest for 10–15 minutes after donating', 'Rest'],
    ['🚫', 'Avoid heavy lifting for 24 hours', 'Activity']
  ]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingCare, setLoadingCare] = useState(false);

  const refreshAiCare = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || !profile) return;
    setLoadingCare(true);
    const lastDonation = profile.lastDonationDate ? `Last donation: ${profile.lastDonationDate}.` : profile.donationCount ? `Has donated ${profile.donationCount} times.` : 'Recent first-time donor.';
    const carePrompt = `You are a medical wellness AI for BloodBee. Generate exactly 5 personalized post-donation care tips for a blood donor.
User profile: Name=${profile.name||'Donor'}, Blood=${profile.bloodGroup||'Unknown'}, Donations=${profile.donationCount||0}. ${lastDonation} Role=${profile.isDonor?'Donor':'Receiver'}. Make everything sound authoritative yet inspiring. Return ONLY the JSON object. Don't use terms like 'Neural' or 'Life-system'.
Return ONLY a JSON array, no markdown, no extra text. Each element: ["emoji", "tip under 65 chars", "category (Hydration|Nutrition|Rest|Activity|Mental)"].
Make tips specific, medically sound, and varied. Address their exact blood group needs.`;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: carePrompt }] }] })
      });
      const data = await res.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      text = text.replace(/```json/g,'').replace(/```/g,'').trim();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length) setAiCare(parsed);
    } catch { /* keep existing tips */ }
    setLoadingCare(false);
  };

  const loadAiInsights = useCallback(async () => {
    try {
      setLoadingAi(true);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || !profile) return;

      const currentActiveRequests = activeRequests.map(r => `${r.bloodGroup} at ${r.location}`).join(', ');

      const prompt = `You are the High-Precision AI Mission Control for BloodBee. Generate engaging, tech-focused, and personalized UI configurations in JSON format for the user:
Name: ${profile.name || 'User'}, Blood: ${profile.bloodGroup || 'Unknown'}, Role: ${profile.isDonor ? 'Donor' : 'Receiver'}, Location: ${profile.location || 'Unknown'}.
Current Emergency Requests: ${currentActiveRequests || 'System stabilized - no active alerts'}.

Rules: Output ONLY pure JSON. 
Mission Goals:
1. Provide a "cityForecast" that analyzes request density for blood group ${profile.bloodGroup}.
2. Give a "healthTip" that is medically relevant to a ${profile.bloodGroup} donor based on local demand stress.
3. Calculate an "impactScore" - an inspiring statement about their reliability score (${profile.reliabilityScore || 90}%) and donation count (${profile.donationCount || 0}).
4. "bestMatchCount": number (total active requests they can satisfy right now).

JSON Structure:
{
  "stories": [{"name": "string", "blood": "string", "msg": "inspiring claim", "time": "2h ago", "badge": "⭐"}],
  "predictive": [{"group": "string", "week": number, "trend": "percentage", "critical": boolean}],
  "mission": {
    "cityForecast": "string",
    "healthTip": "string",
    "impactScore": "string",
    "bestMatchCount": number
  },
  "care": [["emoji", "care tip text"]]
}
Return valid JSON only. Avoid using words like 'Neural', 'Neural-net', 'Machine-learning' or 'Life-system' in the output. Focus on Emergency, Guard, and Human terms.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);
        if (parsed.stories?.length) setAiStories(parsed.stories);
        if (parsed.predictive?.length) setAiPredictive(parsed.predictive);
        if (parsed.mission) setAiMission(parsed.mission);
        if (parsed.care?.length) setAiCare(parsed.care);
      }
    } catch (err) {
      console.error("AI Mission Failure:", err);
    } finally {
      setLoadingAi(false);
    }
  }, [profile, activeRequests.length]);

  useEffect(() => {
    if (!profile) return;
    loadAiInsights();
  }, [user?.uid, activeRequests.length, loadAiInsights]);

  useEffect(() => {
    const q = query(collection(db, 'community_stories'), orderBy('createdAt', 'desc'), limit(3));
    const unsubscribe = onSnapshot(q, (snap) => {
      setRealStories(snap.docs.map(d => {
        const data = d.data();
        return {
          name: data.authorName,
          blood: data.bloodGroup === '?' ? 'O+' : data.bloodGroup,
          msg: data.message,
          time: 'Recently',
          badge: data.bloodGroup === 'O-' ? '🌟' : '❤️',
          isReal: true
        };
      }));
    });
    return () => unsubscribe();
  }, []);

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !onboardingData.bloodGroup || !onboardingData.location) return;
    setSavingOnboarding(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...onboardingData,
      }, { merge: true });
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSavingOnboarding(false);
    }
  };

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (showWelcomeToast) {
      const t = setTimeout(() => setShowWelcomeToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showWelcomeToast]);

  useEffect(() => {
    if (!profile || !user) return;

    let latestIncoming: BloodRequest[] = [];
    let latestOutgoing: BloodRequest[] = [];

    const mergeRequests = (inReqs: BloodRequest[], outReqs: BloodRequest[]) => {
      const combined = [...inReqs, ...outReqs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      // Remove duplicates in case a user matches their own request
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setActiveRequests(unique);
    };

    // 1. Listen for requests made BY this user
    const qOutgoing = query(collection(db, 'blood_requests'), where('requesterUserId', '==', user.uid));
    const unsubscribeOutgoing = onSnapshot(qOutgoing, (snapshot) => {
      const reqs: BloodRequest[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as BloodRequest;
        if (data.status !== 'dismissed') {
          reqs.push({ ...data, id: doc.id });
        }
      });
      latestOutgoing = reqs;
      mergeRequests(latestIncoming, latestOutgoing);
    });

    // 2. Listen for all notifications sent TO this user
    const qAllNotifs = query(collection(db, 'notifications'), where('recipientUserId', '==', user.uid));
    const unsubscribeIncoming = onSnapshot(qAllNotifs, (snapshot) => {
      const matches: BloodRequest[] = [];
      const accepted: AcceptedDonorAlert[] = [];

      snapshot.forEach(docSnap => {
        const n = docSnap.data();

        if (n.type === 'donor_accepted') {
          // Receiver gets notified a donor accepted
          accepted.push({
            id: docSnap.id,
            donorName: n.donorName,
            donorPhone: n.donorPhone,
            donorEmail: n.donorEmail,
            donorBloodGroup: n.donorBloodGroup,
            donorLocation: n.donorLocation,
            patientName: n.patientName,
            bloodGroup: n.bloodGroup,
            location: n.location,
            urgency: n.urgency,
            createdAt: n.createdAt,
          });
          return;
        }

        if (profile.isDonor && ['unread', 'read', 'accepted'].includes(n.status)) {
          // Donor sees incoming blood requests
          matches.push({
            id: n.requestId,
            patientName: n.patientName,
            bloodGroup: n.bloodGroup,
            location: n.location,
            urgency: n.urgency,
            status: n.status === 'accepted' ? 'matched' : 'pending',
            createdAt: n.createdAt,
            isSOS: !!n.isSOS,
            matchNotificationId: docSnap.id,
            matchStatus: n.status,
            receiverPhone: n.receiverPhone || '',
            receiverDescription: n.receiverDescription || '',
            requesterName: n.requesterName || n.patientName,
            acceptedDonorName: n.acceptedDonorName,
            acceptedDonorPhone: n.acceptedDonorPhone,
            acceptedDonorEmail: n.acceptedDonorEmail,
            acceptedDonorBloodGroup: n.acceptedDonorBloodGroup,
            acceptedDonorLocation: n.acceptedDonorLocation,
          });
        }
      });

      setAcceptedAlerts(accepted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      latestIncoming = matches;
      mergeRequests(latestIncoming, latestOutgoing);
    }, (err) => {
      console.error("Firebase Incoming Notification Error:", err);
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

        // Generate AI insights for the heatmap
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey && sorted.length > 0) {
          const regionList = sorted.map(r => `${r.location}: ${r.count} donors`).join(', ');
          const heatmapPrompt = `You are a blood crisis analyst AI for BloodBee. Given the following real-time blood donor distribution: [${regionList}]. 
Analyze each region and return a JSON array. Output ONLY a JSON array, no codeblocks, no extra text.
Structure: [{"location": "CityName", "crisis": "High|Medium|Low", "score": 0-100, "tip": "1 actionable sentence under 60 chars"}]
Rules: Higher donor count = Lower crisis score. Low donor regions need urgent action. Be concise.`;
          fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: heatmapPrompt }] }] })
          })
          .then(r => r.json())
          .then(data => {
            let text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            text = text.replace(/```json/g,'').replace(/```/g,'').trim();
            try { setAiHeatmapInsights(JSON.parse(text)); } catch { /* ignore */ }
          })
          .catch(console.error);
        }
      },
      (err) => console.error("Heatmap Error:", err)
    );

    return () => {
      unsubscribeOutgoing();
      unsubscribeIncoming();
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

  const handleMarkDonated = async (request: BloodRequest) => {
    if (!user || !profile || request.matchStatus !== 'accepted') return;
    setCompletingRequestId(request.id);
    try {
      // The notification likely doesn't have the requester's ID directly, but we don't strict-need it for the UI update
      // Find the ID from the acceptedAlerts or pass null. The backend service will still run.
      await markDonationCompleted(request.id, user.uid, null);
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingRequestId(null);
    }
  };

  const handleDismissAlert = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const handleDismissRequest = async (request: BloodRequest) => {
    try {
      if (request.matchNotificationId) {
        await deleteDoc(doc(db, 'notifications', request.matchNotificationId));
      } else {
        await updateDoc(doc(db, 'blood_requests', request.id), { status: 'dismissed' });
      }
    } catch (err) {
      console.error('Error dismissing request:', err);
    }
  };

  if (profile && (!profile.bloodGroup || !profile.location)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <form onSubmit={handleOnboardingSubmit} className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50 dark:border-slate-700">
              <Heart className="text-red-600 dark:text-red-400" size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Complete Your Profile</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">We need a few details to instantly connect you with nearby emergencies.</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Your Blood Group</label>
              <div className="grid grid-cols-4 gap-2">
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                  <button type="button" key={bg} onClick={() => setOnboardingData(prev => ({ ...prev, bloodGroup: bg }))}
                    className={`h-12 rounded-xl border-2 font-bold text-sm transition-all ${
                      onboardingData.bloodGroup === bg 
                        ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/30' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-red-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                    }`}>
                    {bg}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">City / Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="text" placeholder="e.g. New York, NY" 
                  value={onboardingData.location} onChange={e => setOnboardingData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-red-500 transition-colors text-slate-900 dark:text-white font-medium" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setOnboardingData(prev => ({ ...prev, isDonor: true }))}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${onboardingData.isDonor ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-700/50 dark:border-slate-600'}`}>
                  <Activity size={20} className={onboardingData.isDonor ? "text-red-500" : ""} />
                  <span className="font-bold text-sm">Yes, I'll Donate</span>
                </button>
                <button type="button" onClick={() => setOnboardingData(prev => ({ ...prev, isDonor: false }))}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${!onboardingData.isDonor ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-700/50 dark:border-slate-600'}`}>
                  <Shield size={20} className={!onboardingData.isDonor ? "text-blue-500" : ""} />
                  <span className="font-bold text-sm">I Only Need Blood</span>
                </button>
              </div>
            </div>
          </div>
          <button type="submit" disabled={savingOnboarding || !onboardingData.bloodGroup || !onboardingData.location}
            className="w-full mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold py-4 rounded-xl transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {savingOnboarding ? 'Saving...' : 'Finish Setup & Enter Dashboard'}
          </button>
        </form>
      </div>
    );
  }

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
            {profile?.isDonor ? (
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
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md w-fit px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors cursor-help">
                  <Heart size={20} className="text-red-300" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-red-200 uppercase tracking-widest leading-none mb-1">Fulfilled Requests</span>
                    <span className="text-base font-black text-white leading-none">{profile?.receivedCount || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md w-fit px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors cursor-help">
                  <Star size={20} className="text-yellow-300" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-yellow-200 uppercase tracking-widest leading-none mb-1">Community Badge</span>
                    <span className="text-base font-black text-white leading-none">
                      {(profile?.receivedCount || 0) >= 3 ? "Community Anchor ⚓" : (profile?.receivedCount || 0) >= 1 ? "Supported 🤝" : "New Member 🌱"}
                    </span>
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

          {/* 🚀 AI Mission Control Hub */}
          {profile?.isDonor && (
            <div 
              onClick={scrollToMatches}
              className={`glass-premium rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden group mb-8 transition-opacity duration-500 animate-in fade-in slide-in-from-bottom-5 cursor-pointer hover:ring-2 hover:ring-red-500/20 active:scale-[0.99] ${loadingAi ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full translate-x-12 -translate-y-12 animate-blob"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/5 blur-[60px] rounded-full -translate-x-10 translate-y-10 animate-blob animation-delay-2000"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center text-3xl shadow-lg ring-4 ring-red-500/10 shrink-0 group-hover:scale-105 transition-transform animate-neural">
                  ✨
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-black text-white flex items-center justify-center sm:justify-start gap-2 tracking-tight">
                    AI Guardian Mission Hub 
                    <span className="text-[9px] font-black bg-slate-700 text-white px-2 py-0.5 rounded-md uppercase tracking-tighter shadow-sm border border-slate-600">Deep Analysis</span>
                  </h3>
                  <p className="text-slate-400 text-sm font-medium mt-1 leading-relaxed">
                    Analyzing city demand patterns and your optimal response compatibility.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Real-time Insights generated by Gemini */}
                <div className="bg-slate-800/40 p-5 rounded-[1.75rem] border border-slate-800 hover:border-red-500/40 transition-all hover:bg-slate-800/60 group/card">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-red-500" />
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Regional Demand</p>
                  </div>
                  <p className="text-slate-100 font-bold text-sm leading-snug">{aiMission.cityForecast}</p>
                </div>

                <div className="bg-slate-800/40 p-5 rounded-[1.75rem] border border-slate-800 hover:border-emerald-500/40 transition-all hover:bg-slate-800/60 group/card">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-emerald-500" />
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Donor Readiness</p>
                  </div>
                  <p className="text-slate-100 font-bold text-sm leading-snug">{aiMission.healthTip}</p>
                </div>

                <div className="bg-slate-800/40 p-5 rounded-[1.75rem] border border-slate-800 hover:border-blue-500/40 transition-all hover:bg-slate-800/60 group/card sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={14} className="text-blue-500" />
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Impact Factor</p>
                  </div>
                  <p className="text-slate-100 font-bold text-sm leading-snug">{aiMission.impactScore}</p>
                  {aiMission.bestMatchCount > 0 && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Compatible Matches</span>
                      <span className="text-xs font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{aiMission.bestMatchCount} Available</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Live Alerts */}
          <div ref={alertsRef} className="space-y-5 animate-in slide-in-from-bottom-8 fade-in delay-500 fill-mode-both">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Bell className="text-red-500" size={26} /> {t('activeAlerts')}
              </h2>
              <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-black px-3 py-1.5 rounded-full border border-red-200 dark:border-red-700">
                {activeRequests.length} ACTIVE
              </span>
            </div>

            {/* Receiver: Donor Accepted Alerts */}
            {acceptedAlerts.length > 0 && (
              <div className="space-y-4 mb-5">
                <h3 className="text-sm font-black text-green-700 dark:text-green-400 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={16} /> Donor Found — Contact Details
                </h3>
                {acceptedAlerts.map(alert => (
                  <div key={alert.id} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-[2rem] p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-800/40 rounded-2xl flex items-center justify-center font-black text-green-700 dark:text-green-300 text-lg border border-green-200 dark:border-green-700">
                        {alert.donorBloodGroup || '🩸'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-green-900 dark:text-green-200 text-sm">🎉 {alert.donorName} has accepted your request!</p>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-0.5 font-medium">for {alert.patientName} · {alert.bloodGroup}</p>
                      </div>
                      <button onClick={() => handleDismissAlert(alert.id)}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors shrink-0"
                        title="Dismiss Alert">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {alert.donorPhone && (
                        <a href={`tel:${alert.donorPhone}`} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-green-100 dark:border-slate-700 hover:border-green-400 transition-colors group">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center shrink-0">
                            <Phone size={14} className="text-green-600 dark:text-green-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Call Donor</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-green-700 transition-colors">{alert.donorPhone}</p>
                          </div>
                        </a>
                      )}
                      {alert.donorEmail && (
                        <a href={`mailto:${alert.donorEmail}`} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-green-100 dark:border-slate-700 hover:border-green-400 transition-colors group">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0">
                            <Mail size={14} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Donor</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-700 transition-colors">{alert.donorEmail}</p>
                          </div>
                        </a>
                      )}
                      {alert.donorLocation && (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-green-100 dark:border-slate-700 col-span-full sm:col-span-1">
                          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center shrink-0">
                            <MapPin size={14} className="text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Donor Location</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{alert.donorLocation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              {activeRequests.length === 0 && acceptedAlerts.length === 0 ? (
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
                 activeRequests.map(req => {
                   const isExactMatch = req.bloodGroup === profile?.bloodGroup;
                   const isCompatible = profile?.bloodGroup === 'O-' || 
                                       (profile?.bloodGroup === 'O+' && !req.bloodGroup.includes('-')) ||
                                       (req.bloodGroup === 'AB+') ||
                                       (req.bloodGroup === profile?.bloodGroup);
                   
                   return (
                   <div key={req.id} className={`bg-white dark:bg-slate-800 border-2 rounded-[2rem] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden flex flex-col ${
                     highlightMatchRef === req.id ? 'ring-4 ring-red-500 border-red-500 scale-[1.02] shadow-xl' :
                     isExactMatch ? 'border-red-400 dark:border-red-600 shadow-md shadow-red-500/5' :
                     req.isSOS ? 'border-red-300 dark:border-red-700' :
                     req.matchStatus === 'accepted' ? 'border-green-300 dark:border-green-700' :
                     'border-slate-100 dark:border-slate-700'
                   }`}>
                     {/* AI Match Badge */}
                     {profile?.isDonor && isCompatible && (
                       <div className={`absolute top-4 right-14 z-10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${
                         isExactMatch 
                           ? 'bg-red-600 text-white border-red-500 animate-pulse' 
                           : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                       }`}>
                         {isExactMatch ? '💎 Perfect AI Match' : '✅ Compatible'}
                       </div>
                     )}

                     {req.urgency.includes('Critical') && (
                       <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-500"></div>
                     )}
                    <button onClick={() => handleDismissRequest(req)}
                      className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                      title="Clear Request">
                      <X size={16} />
                    </button>
                    <div className="p-5 sm:p-6">
                      {req.isSOS && (
                        <div className="mb-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full w-fit flex items-center gap-1.5">
                          SOS EMERGENCY
                        </div>
                      )}
                      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0 ${
                          req.bloodGroup === 'O-'
                            ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}>
                          {req.bloodGroup}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate">{req.patientName || 'Unknown'}</h3>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            <MapPin size={11} className="text-blue-500 shrink-0" />
                            <span className="truncate">{req.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* AI Triage Insight */}
                      {profile?.isDonor && isCompatible && req.receiverDescription && (
                        <div className="mb-4 bg-slate-900 dark:bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner group/triage">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em]">Emergency Triage Insight</span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                            "AI Analysis: {req.receiverDescription.length > 50 ? req.receiverDescription.substring(0, 50) + '...' : req.receiverDescription}. {isExactMatch ? 'Critical match for your rare profile.' : 'High response probability needed.'}"
                          </p>
                        </div>
                      )}

                      {req.urgency.includes('Critical') && (
                        <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800 mb-4">
                          <Activity size={14} className="animate-pulse" /> CRITICAL PRIORITY
                        </div>
                      )}

                      {/* DONOR VIEW: Receiver details + accept button */}
                      {profile?.isDonor && (
                        <>
                          {/* Collapsible receiver info before accepting */}
                          {req.matchStatus !== 'accepted' && (
                            <button
                              onClick={() => setExpandedCardId(expandedCardId === req.id ? null : req.id)}
                              className="w-full flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 mb-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <span>📋 View Receiver Details</span>
                              {expandedCardId === req.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                          {expandedCardId === req.id && req.matchStatus !== 'accepted' && (
                            <div className="mb-4 space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                              {req.requesterName && (
                                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-800">
                                  <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0">
                                    <Users size={12} className="text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Requested by</p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">{req.requesterName}</p>
                                  </div>
                                </div>
                              )}
                              {req.receiverPhone && (
                                <a href={`tel:${req.receiverPhone}`} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-300 transition-colors">
                                  <div className="w-7 h-7 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center shrink-0">
                                    <Phone size={12} className="text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Contact</p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-white">{req.receiverPhone}</p>
                                  </div>
                                </a>
                              )}
                              {req.receiverDescription && (
                                <div className="bg-orange-50 dark:bg-orange-900/10 p-2.5 rounded-xl border border-orange-100 dark:border-orange-900 text-xs text-orange-800 dark:text-orange-300 font-medium">
                                  📝 {req.receiverDescription}
                                </div>
                              )}
                            </div>
                          )}

                          {/* After acceptance: show donor's own details */}
                          {req.matchStatus === 'accepted' && req.acceptedDonorPhone && (
                            <div className="mb-4 bg-green-50 dark:bg-green-900/10 rounded-2xl p-4 border border-green-200 dark:border-green-800">
                              <p className="text-xs font-black text-green-700 dark:text-green-400 mb-2 uppercase tracking-wider">✅ Your Contact Shared With Receiver</p>
                              <div className="space-y-2">
                                {req.acceptedDonorPhone && (
                                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <Phone size={12} className="text-green-600 shrink-0" /> {req.acceptedDonorPhone}
                                  </div>
                                )}
                                {req.acceptedDonorLocation && (
                                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <MapPin size={12} className="text-orange-500 shrink-0" /> {req.acceptedDonorLocation}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {req.matchStatus === 'accepted' ? (
                            <button
                              onClick={() => handleMarkDonated(req)}
                              disabled={completingRequestId === req.id}
                              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70 active:scale-[0.98] shadow-lg shadow-green-600/20"
                            >
                              <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                              {completingRequestId === req.id ? 'Marking...' : 'Mark as Donated ✅'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAcceptMatch(req)}
                              disabled={acceptingRequestId === req.id}
                              className="w-full bg-slate-900 dark:bg-red-700 hover:bg-slate-800 dark:hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70 active:scale-[0.98]"
                            >
                              <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                              {acceptingRequestId === req.id
                                  ? 'Processing...'
                                  : 'Accept & Share My Contact'}
                            </button>
                          )}
                        </>
                      )}

                      {/* RECEIVER VIEW */}
                      {!profile?.isDonor && (
                        <div className={`w-full py-3.5 rounded-2xl border text-center text-sm font-bold ${
                          req.status === 'matched'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400'
                            : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200'
                        }`}>
                          {req.status === 'matched' ? '✅ Donor accepted — see alert above' : '⏳ Matching donors from network...'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* Predictive Blood Demand */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 animate-in slide-in-from-bottom-8 fade-in delay-[600ms] fill-mode-both">
            <h3 className="font-black text-slate-900 dark:text-white text-xl mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3"><TrendingUp className="text-blue-500" size={26} /> {t('predictive')}</div>
              {loadingAi && <div className="text-xs font-bold text-blue-500 animate-pulse bg-blue-50 px-2 py-1 rounded">AI Processing...</div>}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">AI-predicted demand for next 7 days based on regional hospital data.</p>
            <div className={`space-y-4 transition-opacity duration-500 ${loadingAi ? 'opacity-30' : 'opacity-100'}`}>
              {aiPredictive.map(p => (
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
                      <span className={`text-xs font-black ${String(p.trend).startsWith('+') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{p.trend}</span>
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
            <h3 className="font-black text-slate-900 dark:text-white text-xl mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3"><Users className="text-emerald-500" size={26} /> {t('communityFeed')}</div>
            </h3>
            <div className={`space-y-4 transition-opacity duration-500 ${loadingAi ? 'opacity-30' : 'opacity-100'}`}>
              {[...realStories, ...aiStories].slice(0, 3).map((c, i) => (
                <div key={i} className="flex gap-4 p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-2xl flex items-center justify-center font-black text-red-700 dark:text-red-300 shrink-0 border border-red-200 dark:border-red-700 text-sm">
                    {c.blood || "O+"}
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

          {/* AI-Powered Regional Donor Heat Map */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-7 border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group animate-in slide-in-from-right-8 fade-in delay-[800ms] fill-mode-both">
             <div className="flex justify-between items-center mb-5">
               <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                 <Map className="text-orange-500" size={22} /> AI Network Heat Map
               </h3>
               <div className="flex items-center gap-2">
                 <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded-md">Heat Map</span>
               </div>
             </div>

             {/* SVG Dot Heatmap Canvas */}
             {(() => {
               const userCity = profile?.location?.split(',')[0]?.trim()?.toLowerCase() ?? '';
               return (
             <div className="w-full rounded-2xl overflow-hidden mb-5 border border-slate-100 dark:border-slate-700 relative bg-gradient-to-br from-slate-900 to-slate-800" style={{height: '180px'}}>
               <svg width="100%" height="100%" viewBox="0 0 300 180" preserveAspectRatio="xMidYMid meet">
                 {/* Grid lines */}
                 {[0,60,120,180,240,300].map(x => <line key={x} x1={x} y1="0" x2={x} y2="180" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
                 {[0,45,90,135,180].map(y => <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}

                 {heatmap.length === 0 ? (
                   <text x="150" y="95" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="11" fontWeight="bold">No donor data yet</text>
                 ) : (
                   (() => {
                     const maxCount = heatmap[0]?.count || 1;
                     const positions = [{cx:55,cy:70},{cx:140,cy:55},{cx:230,cy:80},{cx:100,cy:130},{cx:190,cy:140}];
                     return heatmap.map((region, i) => {
                       const pos = positions[i] || {cx: 50+i*50, cy: 90};
                       const intensity = region.count / maxCount;
                       const r = 10 + intensity * 28;
                       const aiInfo = aiHeatmapInsights.find(a => a.location?.toLowerCase() === region.location.toLowerCase());
                       const color = aiInfo?.crisis === 'High' ? '#f97316' : aiInfo?.crisis === 'Medium' ? '#fbbf24' : '#34d399';
                       const isUserCity = userCity && region.location.toLowerCase().includes(userCity);
                       return (
                         <g key={i}>
                           <circle cx={pos.cx} cy={pos.cy} r={r+8} fill={color} opacity={0.08} />
                           <circle cx={pos.cx} cy={pos.cy} r={r+4} fill={color} opacity={0.15} />
                           <circle cx={pos.cx} cy={pos.cy} r={r} fill={color} opacity={0.55} />
                           <circle cx={pos.cx} cy={pos.cy} r={r*0.4} fill={color} opacity={0.9} />
                           {/* User location ring */}
                           {isUserCity && (
                             <>
                               <circle cx={pos.cx} cy={pos.cy} r={r+14} fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 3" opacity={0.7} />
                               <text x={pos.cx} y={pos.cy - r - 8} textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">📍 YOU</text>
                             </>
                           )}
                           <text x={pos.cx} y={pos.cy + r + 11} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="7.5" fontWeight="bold">{region.location}</text>
                           <text x={pos.cx} y={pos.cy + r + 20} textAnchor="middle" fill={color} fontSize="7" fontWeight="900">{region.count}d</text>
                         </g>
                       );
                     });
                   })()
                 )}
               </svg>

               <div className="absolute top-2 left-3 flex gap-2">
                 {[['#34d399','Low'],['#fbbf24','Medium'],['#f97316','High']].map(([c,l]) => (
                   <div key={l} className="flex items-center gap-1">
                     <div className="w-2 h-2 rounded-full" style={{backgroundColor: c}}></div>
                     <span className="text-[8px] text-white/60 font-bold">{l}</span>
                   </div>
                 ))}
               </div>
                <div className="absolute bottom-2 right-2 text-[9px] text-white/40 font-bold">
                  {heatmap.reduce((acc, curr) => acc + curr.count, 0)} donors identified
                </div>
             </div>
               );
             })()}

             {/* AI Region Insights */}
             <div className="space-y-3">
               {heatmap.length === 0 ? (
                 <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-sm font-bold">No location data found</div>
               ) : (
                 heatmap.slice(0, 4).map((region, i) => {
                   const maxCount = heatmap[0]?.count || 1;
                   const percentage = Math.max(10, Math.round((region.count / maxCount) * 100));
                   const aiInfo = aiHeatmapInsights.find(a => a.location?.toLowerCase() === region.location.toLowerCase());
                   const crisis = aiInfo?.crisis || (percentage > 80 ? 'Low' : percentage > 40 ? 'Medium' : 'High');
                   const colorClass = crisis === 'High' ? 'bg-orange-500' : crisis === 'Medium' ? 'bg-yellow-400' : 'bg-emerald-400';
                   const badgeClass = crisis === 'High' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' : crisis === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
                   return (
                     <div key={i} className="relative">
                       <div className="flex justify-between items-center mb-1.5">
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{region.location}</span>
                           <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${badgeClass}`}>{crisis}</span>
                         </div>
                         <span className="text-orange-600 dark:text-orange-400 text-[10px] font-black">{region.count} Donors</span>
                       </div>
                       <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mb-1">
                         <div className={`${colorClass} h-full rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                       </div>
                       {aiInfo?.tip && (
                         <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">🤖 {aiInfo.tip}</p>
                       )}
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

          {/* Post-Donation Care - AI Powered */}
          <div className="bg-gradient-to-br from-red-50/70 to-pink-50/40 dark:from-red-900/10 dark:to-pink-900/5 rounded-[2rem] p-7 border border-red-100 dark:border-red-900/50 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Heart className="text-red-500 animate-pulse" fill="currentColor" size={20} /> Post-Donation Care
              </h3>
              <button
                onClick={refreshAiCare}
                disabled={loadingCare}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              >
                {loadingCare ? (
                  <><span className="animate-spin">⟳</span> AI Thinking...</>
                ) : (
                  <>✨ AI Refresh</>
                )}
              </button>
            </div>

            {/* AI Profile Context Bar */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-white/70 dark:bg-slate-800/50 rounded-2xl border border-red-100 dark:border-red-900/30">
              <span className="w-7 h-7 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full flex items-center justify-center text-xs font-black shrink-0">{profile?.bloodGroup || '?'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Personalised for</p>
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{profile?.name || 'You'} • {profile?.donationCount || 0} donations</p>
              </div>
              <span className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2 py-1 rounded-lg">{profile?.isDonor ? 'Donor' : 'Receiver'}</span>
            </div>

            <div className={`space-y-2.5 transition-opacity duration-500 ${loadingCare ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              {aiCare.map(([icon, tip, category], index) => {
                const catColors: Record<string, string> = {
                  Hydration: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
                  Nutrition: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800',
                  Rest: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800',
                  Activity: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800',
                  Mental: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800',
                };
                const catBadgeColors: Record<string, string> = {
                  Hydration: 'text-blue-600 dark:text-blue-400',
                  Nutrition: 'text-green-600 dark:text-green-400',
                  Rest: 'text-purple-600 dark:text-purple-400',
                  Activity: 'text-orange-600 dark:text-orange-400',
                  Mental: 'text-yellow-600 dark:text-yellow-400',
                };
                const cardClass = catColors[category] || 'bg-white dark:bg-slate-800 border-red-100 dark:border-slate-700';
                const badgeClass = catBadgeColors[category] || 'text-red-500';
                return (
                  <div key={index} className={`flex items-start gap-3 p-3.5 rounded-2xl border shadow-sm ${cardClass}`}>
                    <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      {category && <span className={`text-[9px] font-black uppercase tracking-widest ${badgeClass} block mb-0.5`}>{category}</span>}
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{tip}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {loadingCare && (
              <div className="mt-4 flex items-center justify-center gap-2 text-red-500 text-sm font-bold">
                <span className="animate-pulse">🤖</span> AI is crafting your personalised care plan...
              </div>
            )}
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
