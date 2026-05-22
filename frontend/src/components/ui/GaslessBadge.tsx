import React from 'react';
import { cn } from '../../utils/utils';

interface GaslessBadgeProps {
  className?: string;
}

const GaslessBadge: React.FC<GaslessBadgeProps> = ({ className }) => {
  return (
    <div 
      className={cn("gasless-badge", className)}
      title="Gas fees are sponsored by Chessxu — play for free!"
    >
      <span>⛽ Gasless</span>
    </div>
  );
};

export default GaslessBadge;
