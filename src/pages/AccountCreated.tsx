import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Reads name from localStorage set by Register page
export default function AccountCreated() {
  const navigate = useNavigate();
  const name = localStorage.getItem('bb_reg_name') || 'Hero';
  const [count, setCount] = useState(3);

  useEffect(() => {
    // Countdown then go to dashboard — by now auth state has fully settled in React
    const interval = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(interval);
          localStorage.removeItem('bb_reg_name');
          navigate('/dashboard', { replace: true });
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fff 0%, #fff1f2 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: '24px',
      textAlign: 'center',
    }}>

      {/* Animated check circle */}
      <div style={{
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #16a34a, #22c55e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        animation: 'pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        boxShadow: '0 20px 60px rgba(22,163,74,0.4)',
      }}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <path
            d="M14 26L22 34L38 18"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'draw 0.4s ease-out 0.3s both' }}
          />
        </svg>
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: 36,
        fontWeight: 900,
        color: '#111827',
        margin: '0 0 10px',
        animation: 'fadeUp 0.5s ease-out 0.2s both',
      }}>
        Account Created! 🎉
      </h1>

      <p style={{
        fontSize: 17,
        color: '#6b7280',
        margin: '0 0 6px',
        fontWeight: 600,
        animation: 'fadeUp 0.5s ease-out 0.35s both',
      }}>
        Welcome to BloodBee, <span style={{ color: '#dc2626', fontWeight: 800 }}>{name}</span>!
      </p>

      <p style={{
        fontSize: 14,
        color: '#9ca3af',
        margin: '0 0 40px',
        animation: 'fadeUp 0.5s ease-out 0.45s both',
      }}>
        Your profile has been saved. Redirecting to dashboard…
      </p>

      {/* Countdown pill */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        animation: 'fadeUp 0.5s ease-out 0.55s both',
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '3px solid #dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 900,
          color: '#dc2626',
          animation: 'ring 1s linear infinite',
        }}>
          {count}
        </div>
        <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>seconds</span>
      </div>

      {/* Go now button */}
      <button
        onClick={() => { localStorage.removeItem('bb_reg_name'); navigate('/dashboard', { replace: true }); }}
        style={{
          marginTop: 28,
          padding: '14px 36px',
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          color: 'white',
          border: 'none',
          borderRadius: 16,
          fontWeight: 800,
          fontSize: 15,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(220,38,38,0.35)',
          transition: 'transform 0.15s',
          animation: 'fadeUp 0.5s ease-out 0.65s both',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
      >
        Go to Dashboard →
      </button>

      <style>{`
        @keyframes pop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes draw {
          from { stroke-dasharray: 0 60; }
          to   { stroke-dasharray: 60 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ring {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  );
}
