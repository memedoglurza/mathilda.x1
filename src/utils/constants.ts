export interface VisualGradient {
  id: string;
  name: string;
  className: string;
}

export const PRESET_GRADIENTS: VisualGradient[] = [
  { id: 'grad-1', name: 'Zümrüt Derinliği', className: 'bg-gradient-to-tr from-emerald-500 to-teal-700' },
  { id: 'grad-2', name: 'Gece Mavisi', className: 'bg-gradient-to-tr from-slate-900 to-indigo-900' },
  { id: 'grad-3', name: 'Gül Kurusu', className: 'bg-gradient-to-tr from-rose-400 to-pink-600' },
  { id: 'grad-4', name: 'Altın Rüya', className: 'bg-gradient-to-tr from-amber-200 to-orange-500' },
  { id: 'grad-5', name: 'Elektrik Menekşe', className: 'bg-gradient-to-tr from-purple-600 to-indigo-600' },
  { id: 'grad-6', name: 'Atlantik Turkuaz', className: 'bg-gradient-to-tr from-cyan-400 to-blue-600' },
  { id: 'grad-7', name: 'Ateş Lavı', className: 'bg-gradient-to-tr from-red-500 to-rose-700' },
  { id: 'grad-8', name: 'Huzur Ormanı', className: 'bg-gradient-to-tr from-green-400 to-emerald-600' },
];

export function getBgClass(imageSrc: string): string {
  if (!imageSrc) return 'bg-slate-700';
  if (imageSrc.startsWith('grad-')) {
    const found = PRESET_GRADIENTS.find(g => g.id === imageSrc);
    return found ? found.className : 'bg-slate-700';
  }
  return '';
}
