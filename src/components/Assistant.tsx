import { MessageSquare, X, Send } from 'lucide-react';
import { useState } from 'react';

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am the BloodBee AI Assistant. Do you need help finding blood or setting up a donation?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const getBotResponse = (query: string) => {
    const q = query.toLowerCase();
    
    // Core Rules & Eligibility
    if (q.includes('age') || q.includes('old') || q.includes('years') || q.includes('18')) {
      return "To donate blood, you must be at least 18 years old and typically no older than 65 years. Minors cannot donate even with parental consent in most regions.";
    }
    if (q.includes('weight') || q.includes('weigh') || q.includes('kg')) {
      return "You must weigh at least 50 kg (110 lbs) to be eligible to donate blood safely.";
    }
    if (q.includes('often') || q.includes('how many times') || q.includes('when can i') || q.includes('frequency')) {
      return "Men can safely donate blood every 3 months (90 days), and women can donate every 4 months (120 days).";
    }
    if (q.includes('tattoo') || q.includes('piercing')) {
      return "If you recently got a tattoo or piercing, you must usually wait 6 to 12 months before you can donate blood to ensure there are no infections.";
    }
    if (q.includes('alcohol') || q.includes('drink') || q.includes('smoke') || q.includes('smoking')) {
      return "You should avoid alcohol for at least 24 hours before donating. Smoking is permitted, but it's recommended to wait at least 2 hours after donating before you smoke.";
    }

    // Process & Platform specific
    if (q.includes('emergency') || q.includes('sos') || q.includes('urgent')) {
      return "If this is a severe emergency, please go to the 'SOS' tab immediately! It will broadcast a high-priority alert to all compatible donors near your hospital location instantly.";
    }
    if (q.includes('hospital') || q.includes('where')) {
      return "You can check the 'Hospitals' section to see a real-time list of major hospitals and their live blood stock inventory.";
    }
    if (q.includes('match') || q.includes('algorithm')) {
      return "BloodBee uses a smart matching algorithm to instantly pair patients with available and medically eligible donors in their vicinity based on exact blood group compatibility.";
    }
    if (q.includes('thank')) {
      return "You're very welcome! Let me know if you need anything else.";
    }
    
    // Greetings
    if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
      return "Hello there! I'm the BloodBee AI. Feel free to ask me questions about blood donation rules, eligibility (like age/weight), or how to use the app!";
    }

    // Default Fallback
    return "I'm still learning! Right now, I can answer questions about blood donation eligibility (age, weight, frequency), emergency SOS instructions, and hospital locations. Try asking 'What is the age limit to donate?'";
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: getBotResponse(userMessage) }]);
      setIsTyping(false);
    }, 800 + Math.random() * 700); // Simulate realistic typing delay
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
