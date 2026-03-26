import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Heart, MessageSquare, Send, Users, Trash2, Sparkles } from 'lucide-react';

interface Story {
  id: string;
  authorName: string;
  bloodGroup: string;
  message: string;
  createdAt: string;
  likes: number;
  authorId?: string;
}

export default function Community() {
  const { t } = useTheme();
  const { user, profile } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [polishing, setPolishing] = useState(false);

  const handleAiPolish = async () => {
    if (!message.trim() || polishing) return;
    setPolishing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("Gemini API key is missing. Please add VITE_GEMINI_API_KEY.");
        return;
      }
      
      const prompt = `Rewrite this short blood donation community post organically to make it inspiring, grammatically correct, and engaging. Keep it real, under 2 sentences, no hashtags. 
CRITICAL RULE: Return ONLY the exact rewritten text and absolutely nothing else. Do not output conversational filler like "Here is your rewritten text", do not offer options.
Original: "${message}"`;
      
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setMessage(text.trim());
      }
    } catch (err) {
      console.error(err);
      alert("Failed to reach AI for polishing.");
    } finally {
      setPolishing(false);
    }
  };

  useEffect(() => {
    // Listen to stories
    const qStories = query(collection(db, 'community_stories'), orderBy('createdAt', 'desc'));
    const unsubStories = onSnapshot(qStories, snap => {
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Story)));
    });

    return () => {
      unsubStories();
    };
  }, []);

  const postStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    setPosting(true);
    try {
      await Promise.race([
        addDoc(collection(db, 'community_stories'), {
          authorName: profile?.name || user.email,
          authorId: user.uid,
          bloodGroup: profile?.bloodGroup || '?',
          message: message.trim(),
          createdAt: new Date().toISOString(),
          likes: 0,
        }),
        new Promise(r => setTimeout(r, 1500))
      ]);
      setMessage('');
    } catch (err) { console.error(err); }
    finally { setPosting(false); }
  };

  const deleteStory = async (storyId: string) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      import('firebase/firestore').then(async ({ deleteDoc, doc }) => {
        await deleteDoc(doc(db, 'community_stories', storyId));
      });
    } catch (err) { console.error(err); }
  };

  const getBadge = (bg: string) => bg === 'O-' ? '🌟' : bg === 'AB+' ? '💎' : '❤️';

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <Users className="text-emerald-500" size={30} /> {t('communityFeed')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Real stories from real heroes. Your story inspires others.</p>
      </div>

      {/* Post a Story */}
      <form onSubmit={postStory} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center font-black text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700">
            {profile?.bloodGroup || '?'}
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-white">{profile?.name || 'Anonymous'}</p>
            <p className="text-xs text-slate-400 font-medium">Share your donation story</p>
          </div>
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          placeholder="Tell the community about your donation experience, or how BloodBee helped you..."
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none resize-none font-medium transition-all"
        />
        <div className="flex gap-3">
          <button type="button" onClick={handleAiPolish} disabled={polishing || !message.trim() || posting}
            className="flex flex-1 items-center justify-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-black rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200 dark:border-indigo-800">
            {polishing ? <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <Sparkles size={18} />}
            {polishing ? 'Polishing...' : 'AI Polish ✨'}
          </button>

          <button type="submit" disabled={posting || !message.trim() || polishing}
            className="flex flex-[2] items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {posting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
            {posting ? 'Posting...' : 'Share Story'}
          </button>
        </div>
      </form>

      {/* Stories Feed */}
      <div className="space-y-4">
        {stories.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">No stories yet</p>
            <p className="text-sm mt-1">Be the first to share your experience!</p>
          </div>
        ) : (
          stories.map(s => (
            <div key={s.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-2xl flex items-center justify-center font-black text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 text-sm">
                  {s.bloodGroup}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 dark:text-white">{s.authorName}</span>
                    <span className="text-lg">{getBadge(s.bloodGroup)}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{s.message}</p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                  <Heart size={16} /> {s.likes || 0} Likes
                </button>
                <div className="flex-1" />
                {s.authorId === user?.uid && (
                  <button onClick={() => deleteStory(s.id)} className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
