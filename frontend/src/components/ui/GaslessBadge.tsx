import React from 'react';
import { cn } from '../../utils/utils';
import { Zap } from 'lucide-react';

interface GaslessBadgeProps {
  className?: string;
  showLabel?: boolean;
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
}

const GaslessBadge: React.FC<GaslessBadgeProps> = ({ 
  className, 
  showLabel = true,
  tooltip = "Gas fees are sponsored by Chessxu — play for free!",
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[9px] gap-1',
    md: 'px-2 py-1 text-[10px] gap-1.5',
    lg: 'px-3 py-1.5 text-xs gap-2'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div 
      id="gasless-badge"
      aria-label="Gasless transaction indicator"
      className={cn(
        "gasless-badge flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider cursor-help hover:animate-gasless-pulse transition-all duration-300",
        sizeClasses[size],
        className
      )}
      title={tooltip}
    >
      <Zap className={cn("fill-emerald-400", iconSizes[size])} />
      {showLabel && <span>Gasless</span>}
    </div>
  );
};

export default GaslessBadge;
