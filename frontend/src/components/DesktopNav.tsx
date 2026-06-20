import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Gamepad2, Zap, Trophy, Puzzle, ShoppingBag, User, History, BarChart3 } from 'lucide-react';
import './DesktopNav.css';

const navItems = [
  { label: 'Game', icon: Gamepad2, path: '/' },
  { label: 'PvP', icon: Zap, path: '/pvp' },
  { label: 'Puzzle', icon: Puzzle, path: '/puzzle' },
  { label: 'Rank', icon: Trophy, path: '/leaderboard' },
  { label: 'History', icon: History, path: '/history' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Shop', icon: ShoppingBag, path: '/shop' },
  { label: 'Me', icon: User, path: '/profile' },
];

export const DesktopNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="desktop-nav" id="desktop-navigation">
      <div className="desktop-nav-inner">
        {/* Brand */}
        <div className="desktop-nav-brand">
          <span className="desktop-nav-logo">♟️</span>
          <span className="desktop-nav-title">Chessxu</span>
        </div>

        {/* Nav Links */}
        <div className="desktop-nav-links">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={`desktop-nav-link ${isActive ? 'active' : ''}`}
                id={`desktop-nav-${item.label.toLowerCase()}`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{item.label}</span>
                {isActive && <div className="desktop-nav-indicator" />}
              </NavLink>
            );
          })}
        </div>

        {/* Spacer for alignment */}
        <div className="desktop-nav-spacer" />
      </div>
    </nav>
  );
};

export default DesktopNav;
