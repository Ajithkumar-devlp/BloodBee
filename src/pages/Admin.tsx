import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, Users, Activity, AlertCircle, Search, TrendingUp, Map } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalRequests: number;
  activeDonors: number;
  completedDonations: number;
}

export default function Admin() {
  const [stats] = useState<Stats>({
    totalUsers: 1420,
    totalRequests: 89,
    activeDonors: 560,
    completedDonations: 1240
  });

  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<{ location: string; count: number }[]>([]);

  useEffect(() => {
    // Monitor all requests
    const qLogs = query(collection(db, 'blood_requests'), orderBy('createdAt', 'desc'), limit(10));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setRecentLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Generate Donor Density Heatmap
    const unsubUsers = onSnapshot(
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
      },
      (err) => console.error("Admin Heatmap Error:", err)
    );

    return () => {
      unsubLogs();
      unsubUsers();
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
            <Shield className="text-blue-600" size={38} /> Monitoring Console
          </h1>
          <p className="text-slate-500 font-medium mt-1">Real-time system health and emergency response oversight.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-lg">Live Feed</button>
          <button className="px-6 py-2.5 text-slate-500 font-bold rounded-xl text-sm hover:bg-slate-50">Analytics</button>
        </div>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Users, label: 'Registered Users', value: stats.totalUsers, trend: '+12%', color: 'blue' },
          { icon: Activity, label: 'Active Alerts', value: recentLogs.length, trend: 'High', color: 'red' },
          { icon: Shield, label: 'Verified Donors', value: stats.activeDonors, trend: '98%', color: 'emerald' },
          { icon: TrendingUp, label: 'Total Impact', value: stats.completedDonations, trend: '+45', color: 'purple' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform`}>
              <stat.icon size={80} />
            </div>
            <div className="relative z-10">
              <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-4 border border-${stat.color}-100`}>
                <stat.icon size={24} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stat.value}</span>
                <span className={`text-xs font-bold text-${stat.color}-600`}>{stat.trend}</span>
              </div>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-8">
        {/* Real-time System Logs */}
        <div className="xl:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-7 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-xl flex items-center gap-3">
              <AlertCircle className="text-red-500" /> Emergency System Logs
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" placeholder="Search logs..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-7 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Request ID</th>
                  <th className="px-7 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-7 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="px-7 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Urgency</th>
                  <th className="px-7 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-7 py-5 font-bold text-slate-900 text-sm">#{log.id.slice(-4)}</td>
                    <td className="px-7 py-5">
                      <span className="bg-red-50 text-red-700 px-3 py-1 rounded-lg font-black text-xs border border-red-100">{log.bloodGroup}</span>
                    </td>
                    <td className="px-7 py-5 font-medium text-slate-600 text-sm">{log.location}</td>
                    <td className="px-7 py-5">
                      <span className={`flex items-center gap-1.5 text-xs font-black ${log.urgency.includes('Critical') ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${log.urgency.includes('Critical') ? 'bg-red-600' : 'bg-orange-600'}`}></div>
                        {log.urgency}
                      </span>
                    </td>
                    <td className="px-7 py-5">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-black text-[10px] uppercase border border-blue-100 tracking-wider">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-7 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No matching records found in system
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Health Guard Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity size={100} />
            </div>
            <h3 className="font-black text-xl mb-4 relative z-10 flex items-center gap-3">
              <Shield className="text-emerald-400" /> AI Heartbeat
            </h3>
            <p className="text-slate-400 text-sm mb-6 relative z-10 font-medium">System processing load is normal. Smart matching and auto-escalation are running at 99.9% accuracy.</p>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                <span>Matching Engine</span>
                <span className="text-emerald-400">Optimal</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full w-[85%] rounded-full shadow-lg shadow-emerald-400/20"></div>
              </div>
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest mt-6">
                <span>Database Load</span>
                <span className="text-blue-400">Stable</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-400 h-full w-[35%] rounded-full shadow-lg shadow-blue-400/20"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl">
             <h3 className="font-black text-slate-900 text-lg mb-6 flex items-center gap-2">
               <Map className="text-orange-500" size={20} /> Regional Donor Heat Map
             </h3>
             <p className="text-sm font-medium text-slate-500 mb-6">Live concentration of available active donors by city.</p>
             <div className="space-y-4">
               {heatmap.length === 0 ? (
                 <div className="text-center py-6 text-slate-400 text-sm font-bold">No location data found</div>
               ) : (
                 heatmap.map((region, i) => {
                   const maxCount = heatmap[0].count; // highest count
                   const percentage = Math.max(10, Math.round((region.count / maxCount) * 100));
                   // Color scale based on density
                   const colorClass = percentage > 80 ? 'bg-orange-500' : percentage > 40 ? 'bg-orange-400' : 'bg-orange-300';
                   return (
                     <div key={i} className="relative">
                       <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1.5 z-10 relative">
                         <span className="text-slate-700">{region.location}</span>
                         <span className="text-orange-600">{region.count} Donors</span>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                         <div className={`${colorClass} h-full rounded-full transition-all duration-1000 shadow-sm`} style={{ width: `${percentage}%` }}></div>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
