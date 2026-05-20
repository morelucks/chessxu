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

export default function ShopPage() {
  return (
    <div className="shop-root">
      <h1>Shop Page Coming Soon</h1>
    </div>
  );
}
