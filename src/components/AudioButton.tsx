import React from 'react';
import { playClickSound } from '../utils/audio';

interface AudioButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  soundType?: 'click' | 'success' | 'delete' | 'toggle';
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  children,
  soundType = 'click',
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const s = soundType as 'click' | 'success' | 'delete' | 'toggle';
    playClickSound(s);
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
};
