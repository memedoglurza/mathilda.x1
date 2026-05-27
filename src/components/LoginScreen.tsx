import React from 'react';
import { AudioButton } from './AudioButton';
import { Sparkles, LogIn } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import { googleSignIn } from '../utils/firebase';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLoginSuccess, 
  isLoading, 
  setIsLoading 
}) => {

  const handleGoogleLogin = async () => {
    playClickSound('toggle');
    setIsLoading(true);
    try {
      const user = await googleSignIn();
      if (user) {
        onLoginSuccess(user);
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100 selection:bg-teal-500/30 selection:text-white">
      {/* Ambient background accents */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-sm relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 animate-pulse">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">TheMathilda.x1</h1>
          <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">
            Kişisel bulut portalınıza güvenli bir şekilde bağlanın ve tüm notlarınızı anlık olarak senkronize edin.
          </p>
        </div>

        <div className="pt-4 pb-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Oturum açılıyor...</p>
            </div>
          ) : (
            <AudioButton
              onClick={handleGoogleLogin}
              soundType="success"
              className="w-full bg-slate-950 hover:bg-slate-900 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 font-semibold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/5 active:scale-98 transition-all duration-150 cursor-pointer"
            >
              {/* Clean custom Google branding vector style layout */}
              <svg className="w-5 h-5 mr-1 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Google ile Giriş Yap</span>
            </AudioButton>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800/10 text-[10px] text-slate-500 font-mono tracking-tight">
          GÜVENLİĞİ SAĞLANMIŞTIR • PORTAL v1.2
        </div>
      </div>
    </div>
  );
};
