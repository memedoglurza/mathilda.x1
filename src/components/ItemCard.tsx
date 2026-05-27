import React, { useRef, useState, useEffect } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { getBgClass } from '../utils/constants';

interface ItemCardProps {
  id: string;
  name: string;
  image: string; // Base64 or a gradient reference
  index: number;
  isGrid?: boolean; // Level 3 grid or Levels 1-2 list
  isRearrangeMode: boolean;
  onSelect: () => void;
  onLongPress: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  dragOverIndex: number | null;
  draggedIndex: number | null;
  isOffline?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  id,
  name,
  image,
  index,
  isGrid = false,
  isRearrangeMode,
  onSelect,
  onLongPress,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dragOverIndex,
  draggedIndex,
  isOffline = false,
}) => {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartedRef = useRef(false);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Long press implementation
  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    if (isRearrangeMode || isOffline) return; // Disable long-press actions in sorting or offline mode
    setIsLongPressing(true);
    touchStartedRef.current = true;

    timerRef.current = setTimeout(() => {
      onLongPress();
      cancelPress();
    }, 650); // 650ms for a solid intent-based long-press
  };

  const cancelPress = () => {
    setIsLongPressing(false);
    touchStartedRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseUp = () => {
    if (touchStartedRef.current && !isRearrangeMode) {
      onSelect();
    }
    cancelPress();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Prevent default click behavior on tap to keep events smooth
    if (touchStartedRef.current && !isRearrangeMode) {
      e.preventDefault();
      onSelect();
    }
    cancelPress();
  };

  const bgStyle = getBgClass(image);

  // Drag handles
  const handleDragStartEvent = (e: React.DragEvent) => {
    onDragStart(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverEvent = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(index);
  };

  const handleDropEvent = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(index);
  };

  const isCurrentDragged = draggedIndex === index;
  const isCurrentDragOver = dragOverIndex === index;

  if (isGrid) {
    // 3-column Grid view specifically designed for Level 3
    return (
      <div
        draggable={isRearrangeMode}
        onDragStart={handleDragStartEvent}
        onDragOver={handleDragOverEvent}
        onDrop={handleDropEvent}
        onDragEnd={onDragEnd}
        onMouseDown={startPress}
        onMouseUp={handleMouseUp}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={cancelPress}
        className={`group relative flex flex-col items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl transition-all duration-200 cursor-pointer select-none ring-offset-slate-950 ${
          isRearrangeMode
            ? 'opacity-55 scale-98 ring-1 ring-dashed ring-slate-700 animate-pulse-gentle'
            : 'hover:border-slate-700 hover:bg-slate-850 active:scale-97'
        } ${isCurrentDragged ? 'opacity-20 scale-95 border-emerald-500' : ''} ${
          isCurrentDragOver ? 'border-dashed border-emerald-400 scale-102 ring-2 ring-emerald-500/20 bg-slate-800/40' : ''
        }`}
      >
        {isRearrangeMode && (
          <div className="absolute top-1.5 right-1.5 p-1 bg-slate-950/60 rounded border border-slate-800 text-slate-400">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Square visual upper element */}
        <div className="w-full aspect-square rounded-lg overflow-hidden shadow-inner flex items-center justify-center relative bg-slate-950">
          {image.startsWith('data:') ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-full h-full ${bgStyle} select-none`} />
          )}

          {/* Elegant hint overlay on normal hovers */}
          {!isRearrangeMode && (
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-[10px] text-slate-300 bg-slate-950/85 px-2 py-1 rounded border border-slate-800/40 font-semibold shadow-inner">
                {isOffline ? 'Çevrimdışı Mod' : 'Basılı Tut: Kaldır'}
              </span>
            </div>
          )}
        </div>

        {/* Text bottom element */}
        <span className="w-full text-center text-xs font-semibold text-slate-200 truncate mt-2 px-1">
          {name}
        </span>
      </div>
    );
  }

  // Row list view specifically designed for Level 1 and Level 2
  return (
    <div
      draggable={isRearrangeMode}
      onDragStart={handleDragStartEvent}
      onDragOver={handleDragOverEvent}
      onDrop={handleDropEvent}
      onDragEnd={onDragEnd}
      onMouseDown={startPress}
      onMouseUp={handleMouseUp}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={cancelPress}
      className={`group w-full relative p-4 bg-slate-910 border border-slate-850 rounded-xl flex items-center justify-between gap-4 select-none cursor-pointer transition-all duration-200 ${
        isRearrangeMode
          ? 'opacity-55 scale-[0.99] border-dashed border-slate-700 font-mono ring-1 ring-slate-800/40'
          : 'hover:border-slate-700 hover:bg-slate-850 active:scale-[0.99]'
      } ${isCurrentDragged ? 'opacity-20 scale-95 border-emerald-500' : ''} ${
        isCurrentDragOver ? 'border-dashed border-emerald-400 scale-[1.01] ring-2 ring-emerald-500/10 bg-slate-800/20' : ''
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Avatar/Visual element square block */}
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow border border-slate-800 flex items-center justify-center bg-slate-950">
          {image.startsWith('data:') ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover pointer-events-none select-none"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-full h-full ${bgStyle}`} />
          )}
        </div>

        {/* Name */}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white tracking-tight truncate leading-tight">
            {name}
          </h3>
          <p className="text-[10px] text-slate-500 font-medium group-hover:text-slate-400 transition-colors mt-0.5">
            {isRearrangeMode ? 'Sürükleyip sıralayabilirsiniz' : isOffline ? 'Çevrimdışı Mod (Değişiklik Devre Dışı)' : 'Çözmek için dokun / Silmek için basılı tut'}
          </p>
        </div>
      </div>

      {isRearrangeMode ? (
        <div className="text-slate-500 p-2 border border-slate-850 bg-slate-950 rounded-lg pointer-events-none group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all">
          <GripVertical className="w-4 h-4" />
        </div>
      ) : !isOffline ? (
        <div className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-950/30 text-slate-500 hover:text-red-400 rounded-lg transition-all">
          <Trash2 className="w-4 h-4 pointer-events-none" />
        </div>
      ) : null}
    </div>
  );
};
