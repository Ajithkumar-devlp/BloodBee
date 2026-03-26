import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, User, Menu, Bell, LogOut, Settings, Zap, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { collection, query, where, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Header() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile, logout } = useAuth();
  const { dark, toggleDark, t } = useTheme();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('recipientUserId', '==', user.uid), where('status', '==', 'unread'));
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.docs.length);
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleNotifClick = async (n: any) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'notifications', n.id), { status: 'read' });
      await batch.commit();
    } catch (e) {
      console.error('Failed to mark read', e);
    }
    setShowNotifs(false);
    navigate('/dashboard');
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, label }: any) => (
    <Link to={to} onClick={() => setMenuOpen(false)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-semibold ${
        isActive(to)
          ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}>
      <Icon size={17} />
      <span>{label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">

          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-red-200/60 group-hover:scale-105 transition-transform border border-red-100 p-1.5">
              <img src="/Bloodbeelogo.png" alt="BloodBee" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-800 dark:from-red-400 dark:to-red-600">
              BloodBee
            </span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 bg-white dark:bg-slate-800 rounded-full p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <NavLink to="/dashboard" icon={Activity} label={t('dashboard')} />
              <NavLink to="/passport" icon={User} label={t('passport')} />
              <NavLink to="/settings" icon={Settings} label={t('settings')} />
            </nav>
          )}

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Dark mode toggle */}
            <button onClick={toggleDark}
              className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title={t('darkMode')}>
              {dark ? '☀️' : '🌙'}
            </button>

            {user ? (
              <>
                {/* Emergency button */}
                <Link to="/emergency"
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-full text-sm shadow-lg shadow-red-500/20 transition-all transform hover:-translate-y-0.5 animate-pulse">
                  <Zap size={15} fill="white" /> {t('emergency')}
                </Link>

                {/* Notification bell */}
                <div className="relative">
                  <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] text-white font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700 py-2 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                       <h4 className="px-5 py-3 font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">Notifications</h4>
                       {notifications.length === 0 ? (
                         <div className="p-8 text-center bg-white dark:bg-slate-800">
                           <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                             <Bell size={20} className="text-slate-400" />
                           </div>
                           <p className="text-sm font-semibold text-slate-500">No new notifications</p>
                         </div>
                       ) : (
                         <div className="max-h-[300px] overflow-y-auto bg-white dark:bg-slate-800">
                           {notifications.map(n => (
                             <div key={n.id} onClick={() => handleNotifClick(n)} className="p-4 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors">
                               <div className="flex items-start gap-3">
                                 <div className="w-2 h-2 mt-1.5 bg-blue-600 rounded-full shrink-0"></div>
                                 <div>
                                   <p className="font-bold text-sm text-slate-900 dark:text-white">
                                     {n.type === 'blood_match' ? '🚨 Emergency Blood Match' : n.type === 'blood_camp' ? '🏕️ New Blood Camp' : 'Notification'}
                                   </p>
                                   <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                                     {n.type === 'blood_camp' ? (
                                       <><span className="text-slate-700 dark:text-slate-300 font-bold">{n.campTitle}</span> at {n.location} on {n.date}</>
                                     ) : (
                                       <><span className="text-slate-700 dark:text-slate-300 font-bold">{n.patientName}</span> needs <span className="text-red-600 font-bold">{n.bloodGroup}</span> blood urgently at {n.location}.</>
                                     )}
                                   </p>
                                   <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Click to view</p>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                    </div>
                  )}
                </div>

                {/* User chip */}
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 py-2 px-3 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full flex items-center justify-center text-xs font-black">
                    {profile?.bloodGroup?.slice(0,1) || user.email?.slice(0,1).toUpperCase()}
                  </span>
                  <span className="max-w-[100px] truncate">{profile?.name?.split(' ')[0] || user.email}</span>
                </div>

                <button onClick={logout} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" title={t('logout')}>
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-sm transition-colors">{t('signIn')}</Link>
                <Link to="/register" className="px-5 py-2.5 font-black rounded-full text-white bg-red-600 hover:bg-red-700 text-sm shadow-lg shadow-red-500/20 transition-all">{t('signUp')}</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleDark} className="p-2 text-slate-400">{dark ? '☀️' : '🌙'}</button>
            {user && (
              <Link to="/emergency" className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white font-black rounded-full text-xs">
                <Zap size={12} fill="white" /> SOS
              </Link>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 -mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
          <div className="px-4 pt-3 pb-5 space-y-1">
            {user ? (
              <>
                <div className="flex items-center gap-3 p-3 mb-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center font-black text-red-700 dark:text-red-300 text-sm">{profile?.bloodGroup || '?'}</div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-sm">{profile?.name || user.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{profile?.isDonor ? 'Active Donor' : 'Member'}</p>
                  </div>
                </div>
                {[
                  { to: '/dashboard', label: t('dashboard') },
                  { to: '/request', label: t('requestBlood') },
                  { to: '/hospitals', label: t('hospitals') },
                  { to: '/passport', label: t('passport') },
                  { to: '/settings', label: t('settings') },
                ].map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                    {l.label}
                  </Link>
                ))}
                <button onClick={() => { logout(); setMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mt-2">
                  {t('logout')}
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block w-full text-center py-3 rounded-2xl font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">{t('signIn')}</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block w-full text-center py-3 rounded-2xl font-black text-white bg-red-600 hover:bg-red-700">{t('signUp')}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
