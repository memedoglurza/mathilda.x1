import React from 'react';
import { AudioButton } from './AudioButton';
import { ChevronLeft, Home, SlidersHorizontal, LogOut } from 'lucide-react';

interface NavbarProps {
  currentPage: string; // 'home' | 'level2' | 'level3' | 'level4'
  onBack: () => void;
  onHome: () => void;
  onLogout: () => void;
  onSortAlphabetical?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onBack,
  onHome,
  onLogout,
  onSortAlphabetical,
}) => {
  const isAtHome = currentPage === 'home';

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 py-3 select-none flex items-center justify-between">
      {/* Left Back Button */}
      <div className="flex items-center">
        {!isAtHome ? (
          <AudioButton
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 transition-colors text-xs font-medium active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Geri Dön</span>
          </AudioButton>
        ) : (
          <AudioButton
            onClick={onLogout}
            soundType="delete"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors text-xs font-semibold active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış Yap</span>
          </AudioButton>
        )}
      </div>

      {/* Middle "Sırala" Button - Strictly only on Level 3 */}
      <div className="flex-1 flex justify-center px-2">
        {currentPage === 'level3' && onSortAlphabetical && (
          <AudioButton
            onClick={onSortAlphabetical}
            soundType="toggle"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all text-xs font-bold active:scale-95 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sırala (A-Z)</span>
          </AudioButton>
        )}
      </div>

      {/* Right Home Button */}
      <div className="flex items-center">
        <AudioButton
          onClick={onHome}
          disabled={isAtHome}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            isAtHome
              ? 'opacity-40 bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 active:scale-95 cursor-pointer'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Ana Sayfa</span>
        </AudioButton>
      </div>
    </header>
  );
};
