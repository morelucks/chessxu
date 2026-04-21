import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Gamepad2, Zap, Trophy, ShoppingBag, User } from 'lucide-react';

const navItems = [
  { label: 'Game', icon: Gamepad2, path: '/' },
  { label: 'PvP', icon: Zap, path: '/pvp' },
  { label: 'Rank', icon: Trophy, path: '/leaderboard' },
  { label: 'Shop', icon: ShoppingBag, path: '/shop' },
  { label: 'Me', icon: User, path: '/profile' },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-4 pt-2 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-2xl border border-white/10 bg-slate-950/80 p-2 backdrop-blur-lg shadow-2xl">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 px-3 py-1 transition-all duration-200
                ${isActive 
                  ? 'text-indigo-400 scale-110' 
                  : 'text-slate-400 hover:text-slate-200'}
              `}
            >
              <div className={`relative p-1 rounded-xl transition-colors ${isActive ? 'bg-indigo-500/10' : ''}`}>
                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
              {isActive && (
                <div className="h-0.5 w-4 rounded-full bg-indigo-500 animate-in fade-in zoom-in duration-300" />
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
