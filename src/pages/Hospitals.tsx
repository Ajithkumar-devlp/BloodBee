import { MapPin, Phone, Hospital as HospitalIcon, Clock } from 'lucide-react';

export default function Hospitals() {
  const hospitals = [
    { name: 'City General Hospital', distance: '1.2 km', bloodStock: { 'O+': 'Low', 'A-': 'Critical', 'B+': 'Normal' }, status: 'Accepting Donors' },
    { name: 'Metro Care Center', distance: '3.5 km', bloodStock: { 'O-': 'Critical', 'AB+': 'Normal' }, status: 'Emergency Only' },
    { name: 'St. Jude Blood Bank', distance: '5.0 km', bloodStock: { 'A+': 'Normal', 'B-': 'Low', 'O+': 'Normal' }, status: 'Accepting Donors' },
  ];

  const getStockColor = (stock: string) => {
    if (stock === 'Critical') return 'text-red-700 bg-red-100 border-red-200';
    if (stock === 'Low') return 'text-orange-700 bg-orange-100 border-orange-200';
    return 'text-green-700 bg-green-100 border-green-200';
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Hospital Availability</h1>
          <p className="text-slate-500 mt-2">Real-time blood stock and emergency requirements near you.</p>
        </div>
        <div className="relative">
          <input type="text" placeholder="Search by hospital..." className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64 shadow-sm" />
          <MapPin className="absolute left-3 top-3.5 text-slate-400" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map((h, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <HospitalIcon size={24} />
              </div>
              <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${h.status === 'Emergency Only' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {h.status}
              </span>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-1">{h.name}</h2>
            <div className="flex items-center text-slate-500 text-sm mb-6 space-x-3">
              <span className="flex items-center gap-1"><MapPin size={14} /> {h.distance}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> Open 24/7</span>
            </div>

            <div className="mt-auto border-t border-slate-50 pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Live Blood Stock</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(h.bloodStock).map(([group, level]) => (
                  <div key={group} className={`flex items-center justify-between w-full px-3 py-2 rounded-lg border text-sm ${getStockColor(level)}`}>
                    <span className="font-bold">{group}</span>
                    <span className="font-semibold text-xs tracking-wider uppercase">{level}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full py-3 mt-6 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2">
              <Phone size={16} /> Contact Hospital
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
