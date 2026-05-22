import React from 'react';
import { cn } from '../../utils/utils';
import { Zap } from 'lucide-react';

interface GaslessBadgeProps {
  className?: string;
  showLabel?: boolean;
  tooltip?: string;
}

const GaslessBadge: React.FC<GaslessBadgeProps> = ({ 
  className, 
  showLabel = true,
  tooltip = "Gas fees are sponsored by Chessxu — play for free!"
}) => {
  return (
    <div 
      id="gasless-badge"
      aria-label="Gasless transaction indicator"
      className={cn(
        "gasless-badge flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider cursor-help hover:animate-gasless-pulse transition-all duration-300",
        className
      )}
      title={tooltip}
    >
      <Zap className="w-3 h-3 fill-emerald-400" />
      {showLabel && <span>Gasless</span>}
    </div>
  );
};

export default GaslessBadge;
