import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
}

export default function MobilePageHeader({ title, subtitle, backTo }: MobilePageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <div className="flex md:hidden items-center gap-3 mb-6 -mx-0 pt-1 pb-2">
      <button
        onClick={handleBack}
        className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 transition-all active:scale-95 shrink-0"
        aria-label="Go back"
      >
        <ArrowLeft size={20} strokeWidth={2.5} />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
