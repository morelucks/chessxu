import React from 'react';
import { cn } from '../../utils/utils';

interface GaslessBadgeProps {
  className?: string;
}

const GaslessBadge: React.FC<GaslessBadgeProps> = ({ className }) => {
  return (
    <div className={cn("gasless-badge", className)}>
      <span>⛽ Gasless</span>
    </div>
  );
};

export default GaslessBadge;
