import React from 'react';
import { AudioButton } from './AudioButton';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5 select-none text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-white">Parçayı Kaldır</h3>
          <p className="text-slate-300 text-sm leading-relaxed px-2">
            <span className="font-semibold text-red-400">"{itemName}"</span> isimli parçayı kaldırmak istiyor musunuz?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <AudioButton
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:border-slate-800 rounded-xl transition-all cursor-pointer"
            type="button"
          >
            Reddet
          </AudioButton>
          <AudioButton
            onClick={() => {
              onConfirm();
              onClose();
            }}
            soundType="delete"
            className="w-full py-2.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl active:scale-97 transition-all cursor-pointer"
            type="button"
          >
            Onayla
          </AudioButton>
        </div>
      </div>
    </div>
  );
};
