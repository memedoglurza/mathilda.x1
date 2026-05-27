import React, { useState, useRef } from 'react';
import { X, Upload, Check, Palette } from 'lucide-react';
import { AudioButton } from './AudioButton';
import { PRESET_GRADIENTS } from '../utils/constants';
import { playClickSound } from '../utils/audio';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, image: string) => void;
  title: string;
  initialName?: string;
  initialImage?: string;
  isProfileEdit?: boolean;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  initialName = '',
  initialImage = 'grad-1',
  isProfileEdit = false,
}) => {
  const [name, setName] = useState(initialName);
  const [selectedImage, setSelectedImage] = useState(initialImage);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialImage.startsWith('data:') ? initialImage : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setSelectedImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setSelectedImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectGradient = (gradId: string) => {
    setImagePreview(null);
    setSelectedImage(gradId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileEdit && !name.trim()) return;
    onConfirm(name.trim(), selectedImage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <AudioButton
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-5 h-5" />
          </AudioButton>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1 select-none">
          {!isProfileEdit && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Parça İsmi *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Yeni Bilgiler"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                maxLength={40}
                required
              />
            </div>
          )}

          {/* Visual Loader */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Görsel Seçimi veya Yükleme</label>
            
            {/* Dropzone & Preview */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="group relative cursor-pointer border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950 rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all duration-200"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-800">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : selectedImage.startsWith('grad-') ? (
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-20 h-20 rounded-xl shadow-lg ${PRESET_GRADIENTS.find(g => g.id === selectedImage)?.className || 'bg-slate-800'}`} />
                  <span className="text-[11px] text-slate-500 font-mono">
                    Seçili: {PRESET_GRADIENTS.find(g => g.id === selectedImage)?.name || 'Renk Paleti'}
                  </span>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
              )}

              <div className="text-center">
                <p className="text-xs text-slate-300 font-medium">Cihazdan dosya seçin veya sürükleyin</p>
                <p className="text-[10px] text-slate-500 mt-1">PNG, JPG veya SVG desteklenir</p>
              </div>
            </div>
          </div>

          {/* Preset Gradients Palette */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span>Hazır Renk Paletleri</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_GRADIENTS.map((gradient) => {
                const isSelected = selectedImage === gradient.id;
                return (
                  <button
                    key={gradient.id}
                    type="button"
                    onClick={() => {
                      playClickSound('toggle');
                      selectGradient(gradient.id);
                    }}
                    title={gradient.name}
                    className={`h-11 rounded-lg ${gradient.className} relative border transition-all duration-150 active:scale-95 cursor-pointer ${
                      isSelected ? 'border-white scale-102 ring-2 ring-emerald-500/20' : 'border-slate-800/40 hover:border-slate-600'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                        <Check className="w-4 h-4 text-white drop-shadow-sm" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-950 flex justify-end gap-3 border-t border-slate-800">
          <AudioButton
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer"
            type="button"
          >
            İptal
          </AudioButton>
          <AudioButton
            type="submit"
            onClick={handleSubmit}
            soundType="success"
            className="px-5 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl active:scale-97 shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            Onayla
          </AudioButton>
        </div>
      </div>
    </div>
  );
};
