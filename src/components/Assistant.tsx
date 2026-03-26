import { MessageSquare, X, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am the Gemini-Powered BloodBee AI. I can answer questions or instantly scan our database to find the perfect donor matches for your location and blood type!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [donorsContext, setDonorsContext] = useState('[]');

  // Load LIVE donor data into memory for Gemini to analyze
  useEffect(() => {
    async function loadDonors() {
      try {
        const q = query(collection(db, 'users'), where('isDonor', '==', true));
        const snap = await getDocs(q);
        const donorsList = snap.docs.map(doc => {
          const d = doc.data();
          // We don't send emails/passwords to AI, just search criteria
          return { name: d.name, bloodGroup: d.bloodGroup, location: d.location, phone: d.phone, donations: d.donationCount, score: d.reliabilityScore };
        });
        setDonorsContext(JSON.stringify(donorsList));
      } catch (err) {
        console.error("Failed to load donors for AI context", err);
      }
    }
    loadDonors();
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'ai', text: "Error: Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your .env file." }]);
        setIsTyping(false);
        return;
      }

      // Convert our internal state message format to Gemini's format
      const geminiHistory = [
        {
          role: "user",
          parts: [{ text: `SYSTEM INSTRUCTIONS: You are BloodBee AI, a smart assistant for a blood platform.
You must be extremely helpful, concise, and friendly. 
If the user asks to find donors, analyze this live database JSON array of currently available donors and recommend the best matches:
JSON DATABASE: ${donorsContext}

Rules:
1. Only recommend donors that perfectly match the requested blood type, or compatible ones (e.g. O- is universal).
2. Prioritize donors with the highest "score" or closest "location".
3. Format your response cleanly (use bullet points or bold text if necessary).
4. Never reveal the JSON structure directly to the user.` }]
        },
        { role: "model", parts: [{ text: "Understood! I am ready to help find blood donors intelligently." }] },
        ...messages.slice(1).map(m => ({ 
          role: m.role === 'ai' ? 'model' : 'user', 
          parts: [{ text: m.text }] 
        })),
        { role: "user", parts: [{ text: userMessage }] }
      ];

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: geminiHistory })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error?.message || "API Error");

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to process that request.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to my AI brain. Please check your network or API limits." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center transform transition-all hover:scale-110 active:scale-95 ${open ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare size={24} />
      </button>

      <div className={`fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-300 origin-bottom-right ${open ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="px-6 py-4 bg-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <MessageSquare size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight">AI Assistant</h3>
              <p className="text-slate-400 text-xs font-medium">Online</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="h-80 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm shadow-sm' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-4 bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5 focus:outline-none">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={send} className="px-4 py-3 bg-white border-t border-slate-100 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..." 
            className="flex-1 px-4 py-2 bg-slate-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-slate-300 transition-shadow"
          />
          <button type="submit" className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm transition-colors">
            <Send size={16} className="ml-1" />
          </button>
        </form>
      </div>
    </>
  );
}
