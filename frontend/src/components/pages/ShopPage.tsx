import React from 'react';
import './ShopPage.css';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'boards' | 'pieces' | 'badges';
  icon: string;
  accentColor: string;
}

const BOARD_THEMES: ShopItem[] = [
  { id: 'board-slate', name: 'Classic Slate', description: 'The elegant default dark theme board.', price: 0, category: 'boards', icon: 'Gamepad2', accentColor: '#64748b' },
  { id: 'board-wood', name: 'Royal Walnut', description: 'Traditional premium wooden chess board.', price: 100, category: 'boards', icon: 'Palette', accentColor: '#b45309' },
  { id: 'board-marble', name: 'Carrara Marble', description: 'Polished Italian white and grey stone.', price: 250, category: 'boards', icon: 'Sparkles', accentColor: '#cbd5e1' },
  { id: 'board-neon', name: 'Synthwave Neon', description: 'Glowing grid cyberpunk board style.', price: 500, category: 'boards', icon: 'ShoppingBag', accentColor: '#ec4899' }
];

const PIECE_SETS: ShopItem[] = [
  { id: 'piece-classic', name: 'Neo Classic', description: 'The standard modern set of pieces.', price: 0, category: 'pieces', icon: 'Gamepad2', accentColor: '#64748b' },
  { id: 'piece-minimal', name: 'Geometric Minimal', description: 'Abstract sharp vector pieces.', price: 150, category: 'pieces', icon: 'Palette', accentColor: '#3b82f6' },
  { id: 'piece-pixel', name: 'Retro Pixel Art', description: '8-bit nostalgic arcade style chess pieces.', price: 300, category: 'pieces', icon: 'Sparkles', accentColor: '#10b981' }
];

const BADGES: ShopItem[] = [
  { id: 'badge-early', name: 'Pioneer Badge', description: 'Show you were here since day one.', price: 50, category: 'badges', icon: 'Award', accentColor: '#eab308' },
  { id: 'badge-gm', name: 'Grandmaster Crown', description: 'A glorious golden crown for your profile.', price: 500, category: 'badges', icon: 'Award', accentColor: '#ec4899' },
  { id: 'badge-diamond', name: 'Infinity Diamond', description: 'The ultimate chess prestige badge.', price: 1000, category: 'badges', icon: 'Award', accentColor: '#a855f7' }
];

const SHOP_ITEMS: ShopItem[] = [...BOARD_THEMES, ...PIECE_SETS, ...BADGES];

export default function ShopPage() {
  return (
    <div className="shop-root">
      <h1>Shop Page Coming Soon</h1>
    </div>
  );
}
