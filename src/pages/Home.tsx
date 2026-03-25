import { Link } from 'react-router-dom';
import { Clock, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative w-full max-w-5xl mx-auto mt-12 text-center lg:mt-24">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-3xl pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <span className="px-4 py-1.5 rounded-full text-sm font-semibold text-blue-700 bg-blue-100 border border-blue-200 mb-6 shadow-sm">
            AI-Powered Emergency Blood Platform
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Save a Life in <span className="text-red-600">Seconds.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
            BloodBee instantly connects you to the most critical blood needs near you using intelligent matching.
            Request blood instantly or become a donor to make an impact.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/request"
              className="px-8 py-4 text-lg font-bold rounded-full text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/30 transform transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Zap size={20} fill="currentColor" /> Request Blood Now
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-4 text-lg font-bold rounded-full text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transform transition-all hover:scale-105 active:scale-95"
            >
              I Want to Donate
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {[
          {
            title: 'Smart Matching AI',
            desc: 'Our AI finds the most suitable donors based on proximity, compatibility, and responsiveness.',
            icon: Zap,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
          },
          {
            title: 'Real-Time Tracking',
            desc: 'Monitor your emergency request live. See exactly when donors are notified and accept.',
            icon: Clock,
            color: 'text-green-600',
            bg: 'bg-green-100'
          },
          {
            title: 'Health Passport',
            desc: 'Your digital donor profile with a verifiable QR code, donation history, and eligibility tracking.',
            icon: ShieldCheck,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
          }
        ].map((feat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feat.bg}`}>
              <feat.icon className={feat.color} size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
            <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
