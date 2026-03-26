import { Calendar, Heart, Shield, Share2, Download, CheckCircle, RotateCcw, Award, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef } from 'react';
import MobilePageHeader from '../components/MobilePageHeader';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function HealthPassport() {
  const { user, profile } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const donationDate = new Date('2026-01-12');
  const nextEligible = new Date(donationDate);
  nextEligible.setMonth(nextEligible.getMonth() + 3);
  const donorId = user ? `BB-${new Date().getFullYear()}-${user.uid.slice(0, 4).toUpperCase()}` : 'BB-GUEST-2026';
  const isEligible = new Date() >= nextEligible;

  const downloadPDF = async () => {
    if (!cardRef.current || isGenerating) return;
    try {
      setIsGenerating(true);
      // Temporarily unflip to ensure front side is captured
      const wasFlipped = isFlipped;
      if (wasFlipped) setIsFlipped(false);
      
      // Small delay to let React render the flip
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`BloodBee_Passport_${donorId}.pdf`);

      if (wasFlipped) setIsFlipped(true);
    } catch (err) {
      console.error('Error generating PDF', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareCard = async () => {
    if (!cardRef.current || isGenerating) return;
    try {
      setIsGenerating(true);
      
      if (navigator.share) {
        // Just text sharing for better compatibility across devices to bloodbee context
        await navigator.share({
          title: 'BloodBee Donor Passport',
          text: `Check out my BloodBee Donor Passport! I have a reliable score of ${profile?.reliabilityScore ?? 100}% and have donated blood ${profile?.donationCount ?? 0} times. Join the hive!`,
          url: window.location.origin
        });
      } else {
        alert("Sharing not supported on this browser.");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <MobilePageHeader
        title="Donor Passport"
        subtitle="Your verified blood donor identity card"
        backTo="/dashboard"
      />
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Donor Passport</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Your official medical identity card.</p>
      </div>

      {/* 3D Flip Card Container */}
      <div className="relative w-full min-h-[220px] xs:min-h-[240px] perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div ref={cardRef} className={`w-full h-full absolute inset-0 preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT OF CARD */}
          <div className="absolute inset-0 backface-hidden rounded-[2rem] bg-gradient-to-br from-red-600 via-red-700 to-red-950 p-6 flex flex-col text-white shadow-2xl overflow-hidden border border-white/20">
            {/* Holographic Overlays */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-3xl rounded-full pointer-events-none translate-x-12 -translate-y-12"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/20 blur-3xl rounded-[100%] pointer-events-none -translate-x-12 translate-y-12"></div>

            {/* Header */}
            <div className="relative z-10 flex justify-between items-start mb-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-black/30 shrink-0">
                  <img src="/Bloodbeelogo.png" alt="BB" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-none tracking-wider text-white">BLOODBEE</h3>
                  <p className="text-[9px] font-bold text-red-200 tracking-widest uppercase mt-0.5">Verified Medical ID</p>
                </div>
              </div>
              <div className="border border-white/30 px-3 py-1 rounded-full backdrop-blur-md bg-white/10 shrink-0 shadow-inner">
                <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 text-green-300">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> Active
                </span>
              </div>
            </div>

            {/* Middle Profile */}
            <div className="relative z-10 flex items-end justify-between w-full mt-4 mb-3">
              <div className="flex flex-col min-w-0 pr-4">
                <p className="text-[10px] text-red-200 uppercase tracking-widest font-black mb-0.5">Donor ID</p>
                <p className="font-mono text-lg sm:text-xl tracking-wider font-bold text-white mb-2">{donorId}</p>
                <p className="text-[10px] text-red-200 uppercase tracking-widest font-black mb-0.5">Full Name</p>
                <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md uppercase text-white truncate w-full max-w-[200px]">
                  {profile?.name || user?.email?.split('@')[0] || 'Valued Hero'}
                </h2>
              </div>
              <div className="text-center shrink-0 flex flex-col items-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/40 shadow-xl mb-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">{profile?.bloodGroup || '?'}</span>
                </div>
                <span className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-red-200">Blood Type</span>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 text-[9px] font-black tracking-widest text-red-100/60 uppercase flex items-center gap-1.5 pointer-events-none">
              <RotateCcw size={10} className="text-white/60" /> Tap to flip card
            </div>
          </div>

          {/* BACK OF CARD */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[2rem] bg-white dark:bg-slate-900 p-6 shadow-xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 flex flex-col items-center h-full">
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-100 dark:bg-red-900/30 blur-2xl rounded-full pointer-events-none"></div>
            
            <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center gap-3 my-auto pt-2">
              <div className="bg-white p-3 rounded-2xl shadow-xl shadow-red-500/10 border border-slate-100 inline-block relative shrink-0">
                {/* Simulated QR Code structure */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 grid grid-cols-4 grid-rows-4 gap-1 p-1 bg-black rounded-lg">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className={`bg-white rounded-sm ${i % 3 === 0 ? 'opacity-0' : 'opacity-100'}`}></div>
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 bg-white rounded-xl shadow-md p-1 border-2 border-red-500">
                       <img src="/Bloodbeelogo.png" alt="BB" className="w-full h-full object-contain" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Medical Scan QR</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Show this code at any partnered hospital</p>
              </div>
            </div>
            
            <div className="relative z-10 mt-auto text-[9px] font-black tracking-widest text-slate-400 capitalize flex items-center gap-1.5 pointer-events-none pb-1">
              <RotateCcw size={10} /> Tap to flip back
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Matrix */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center group hover:border-red-500 transition-colors">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Award size={24} />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{profile?.donationCount ?? 0}</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Donations</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center group hover:border-purple-500 transition-colors">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Shield size={24} />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{profile?.reliabilityScore ?? 100}%</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Reliability</span>
        </div>
      </div>

      {/* detailed list */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm text-blue-500">
               <Calendar size={20} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Donation</p>
               <p className="font-bold text-slate-900 dark:text-white">12 Jan 2026</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-green-200 dark:border-green-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center shadow-sm text-green-600">
               <Heart size={20} fill="currentColor" />
            </div>
            <div>
               <p className="text-[10px] font-black text-green-600 dark:text-green-500 uppercase tracking-widest">Eligibility Status</p>
               <div className="flex items-center gap-1">
                 {isEligible && <CheckCircle size={14} className="text-green-500" />}
                 <p className="font-bold text-slate-900 dark:text-white">Ready to Donate</p>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm text-orange-500">
               <MapPin size={20} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Region</p>
               <p className="font-bold text-slate-900 dark:text-white">{profile?.location || 'Tamil Nadu, IN'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button 
          onClick={shareCard}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 py-5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-white font-black rounded-3xl transition-all shadow-sm disabled:opacity-50"
        >
          <Share2 size={20} /> {isGenerating ? 'Wait...' : 'Share Card'}
        </button>
        <button 
          onClick={downloadPDF}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-3xl transition-all shadow-xl shadow-red-500/30 disabled:opacity-50"
        >
          <Download size={20} /> {isGenerating ? 'Wait...' : 'Download PDF'}
        </button>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
