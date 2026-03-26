import { useState } from 'react';
import { MapPin, Phone, Hospital as HospitalIcon, Clock, Search } from 'lucide-react';
import MobilePageHeader from '../components/MobilePageHeader';

type BloodStock = { [group: string]: 'Critical' | 'Low' | 'Normal' };

interface Hospital {
  name: string;
  city: string;
  distance: string;
  bloodStock: BloodStock;
  status: 'Accepting Donors' | 'Emergency Only' | 'Full Capacity';
  phone: string;
}

const TAMIL_NADU_HOSPITALS: Hospital[] = [
  { name: 'Apollo Hospitals, Greams Road', city: 'Chennai', distance: '1.2 km', bloodStock: { 'O+': 'Low', 'A-': 'Critical', 'B+': 'Normal', 'AB+': 'Low' }, status: 'Accepting Donors', phone: '044-28293333' },
  { name: 'Christian Medical College (CMC)', city: 'Vellore', distance: '5.0 km', bloodStock: { 'O-': 'Critical', 'AB+': 'Normal', 'A+': 'Normal' }, status: 'Emergency Only', phone: '0416-2281000' },
  { name: 'Ganga Hospital', city: 'Coimbatore', distance: '3.5 km', bloodStock: { 'A+': 'Normal', 'B-': 'Low', 'O+': 'Normal' }, status: 'Accepting Donors', phone: '0422-2485000' },
  { name: 'Meenakshi Mission Hospital', city: 'Madurai', distance: '8.1 km', bloodStock: { 'O+': 'Low', 'B+': 'Critical', 'AB-': 'Low' }, status: 'Accepting Donors', phone: '0452-4263000' },
  { name: 'Kauvery Hospital', city: 'Trichy', distance: '2.4 km', bloodStock: { 'A-': 'Low', 'O+': 'Normal', 'B+': 'Normal' }, status: 'Accepting Donors', phone: '0431-4022555' },
  { name: 'MIOT International', city: 'Chennai', distance: '12.0 km', bloodStock: { 'O-': 'Low', 'B-': 'Critical' }, status: 'Emergency Only', phone: '044-22492288' },
  { name: 'Sri Ramakrishna Hospital', city: 'Coimbatore', distance: '4.2 km', bloodStock: { 'O+': 'Normal', 'A+': 'Normal', 'B+': 'Normal' }, status: 'Accepting Donors', phone: '0422-4500000' },
  { name: 'Vadamalayan Hospital', city: 'Madurai', distance: '6.7 km', bloodStock: { 'AB+': 'Low', 'O+': 'Critical' }, status: 'Accepting Donors', phone: '0452-2545400' },
  { name: 'Billroth Hospitals', city: 'Chennai', distance: '7.5 km', bloodStock: { 'A+': 'Critical', 'B+': 'Normal' }, status: 'Emergency Only', phone: '044-23644400' },
  { name: 'Royal Care Super Speciality', city: 'Coimbatore', distance: '10.3 km', bloodStock: { 'O+': 'Low', 'A-': 'Low', 'B-': 'Critical' }, status: 'Accepting Donors', phone: '0422-2227000' },
  { name: 'Fortis Malar Hospital', city: 'Chennai', distance: '9.8 km', bloodStock: { 'O-': 'Normal', 'AB-': 'Normal' }, status: 'Accepting Donors', phone: '044-42892222' },
  { name: 'Gleneagles Global Health City', city: 'Chennai', distance: '15.2 km', bloodStock: { 'A+': 'Low', 'O+': 'Normal', 'B+': 'Critical' }, status: 'Accepting Donors', phone: '044-44770000' },
  { name: 'Velammal Medical College', city: 'Madurai', distance: '11.0 km', bloodStock: { 'O+': 'Critical', 'A+': 'Low', 'B+': 'Normal' }, status: 'Emergency Only', phone: '0452-7113333' },
  { name: 'G.K.N.M Hospital', city: 'Coimbatore', distance: '5.5 km', bloodStock: { 'AB+': 'Normal', 'B-': 'Low', 'O-': 'Normal' }, status: 'Accepting Donors', phone: '0422-4304000' },
  { name: 'Manipal Hospital', city: 'Salem', distance: '3.0 km', bloodStock: { 'O+': 'Normal', 'A+': 'Critical', 'AB+': 'Low' }, status: 'Accepting Donors', phone: '0427-2342200' },
];

export default function Hospitals() {
  const [searchQuery, setSearchQuery] = useState('');

  const getStockColor = (stock: string) => {
    if (stock === 'Critical') return 'text-red-700 bg-red-100 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800';
    if (stock === 'Low') return 'text-orange-700 bg-orange-100 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800';
    return 'text-green-700 bg-green-100 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800';
  };

  const filteredHospitals = TAMIL_NADU_HOSPITALS.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-in fade-in duration-500">
      <MobilePageHeader
        title="Hospitals"
        subtitle="Blood stock &amp; emergency info across Tamil Nadu"
        backTo="/dashboard"
      />
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Hospitals in Tamil Nadu</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Real-time blood stock and emergency requirements across major cities.</p>
        </div>
        <div className="relative w-full lg:w-96">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by hospital name or city (e.g. Chennai)..." 
            className="pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-red-500/20 focus:border-red-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full transition-all shadow-sm text-lg font-medium placeholder:text-slate-400" 
          />
          <Search className="absolute left-4 top-4 text-slate-400" size={24} />
        </div>
      </div>

      {filteredHospitals.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <HospitalIcon className="mx-auto w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">No hospitals found</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredHospitals.map((h, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl dark:hover:shadow-red-900/10 hover:-translate-y-1 transition-all duration-300 flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                  <HospitalIcon size={28} />
                </div>
                <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border ${
                  h.status === 'Emergency Only' 
                    ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 animate-pulse' 
                    : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                }`}>
                  {h.status}
                </span>
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{h.name}</h2>
              <div className="flex flex-wrap items-center text-slate-500 dark:text-slate-400 font-medium text-sm gap-4 mb-6">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                  <MapPin size={16} className="text-red-500" /> {h.city}
                </span>
                <span className="flex items-center gap-1.5"><Clock size={16} /> Open 24/7</span>
              </div>

              <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-5">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-widest">Live Blood Stock</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(h.bloodStock).map(([group, level]) => (
                    <div key={group} className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl border-2 ${getStockColor(level)} transition-colors`}>
                      <span className="font-extrabold text-lg">{group}</span>
                      <span className="font-black text-[10px] tracking-widest uppercase">{level}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-4 mt-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-lg">
                <Phone size={20} /> {h.phone}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
