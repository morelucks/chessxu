import React, { useState } from 'react';
import { Gamepad2, Palette, Sparkles, Award, ShoppingBag, Coins, Gift, Info, Check } from 'lucide-react';
import useAppStore from '../../zustand/store';
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
  const chessBalance = useAppStore((s) => s.chessBalance);
  const setChessBalance = useAppStore((s) => s.setChessBalance);
  const getIcon = (iconName: string, color: string) => {
    const props = { size: 24, style: { color } };
    switch (iconName) {
      case 'Palette': return <Palette {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Award': return <Award {...props} />;
      case 'ShoppingBag': return <ShoppingBag {...props} />;
      default: return <Gamepad2 {...props} />;
    }
  };

  const [ownedItems, setOwnedItems] = useState<string[]>(['board-slate', 'piece-classic']);

  const handleBuy = (item: ShopItem) => {
    if (ownedItems.includes(item.id)) return;
    if (chessBalance >= item.price) {
      setChessBalance(chessBalance - item.price);
      setOwnedItems([...ownedItems, item.id]);
    }
  };

  const filteredItems = SHOP_ITEMS.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'boards' | 'pieces' | 'badges'>('all');

  return (
    <div className="shop-root">
      <div className="shop-bg-glow glow-purple" />
      <div className="shop-bg-glow glow-blue" />
      <div className="shop-container">
        <header className="shop-header">
          <div className="shop-title-section">
            <h1 className="shop-title">Chessxu Premium Shop</h1>
            <p className="shop-subtitle">Customize your chess game appearance with exclusive assets.</p>
          </div>
          <div className="shop-balance-card">
            <span className="balance-label">Your Balance</span>
            <div className="balance-value">{chessBalance} CHESS</div>
          </div>
        </header>

        <nav className="shop-nav">
          {['all', 'boards', 'pieces', 'badges'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as any)}
              className={`shop-nav-tab ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </nav>

        <div className="shop-grid">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="shop-card"
              style={{ '--accent': item.accentColor } as React.CSSProperties}
            >
              <div className="shop-card-glow" />
              <div className="shop-card-icon-container">
                {getIcon(item.icon, item.accentColor)}
              </div>
              <div className="shop-card-body">
                <h3 className="shop-card-title">{item.name}</h3>
                <p className="shop-card-desc">{item.description}</p>
                <div className="shop-card-footer">
                  <div className="shop-card-price">
                    <Coins size={14} className="text-yellow-500" />
                    <span>{item.price} CHESS</span>
                  </div>
                  <button 
                    disabled={chessBalance < item.price}
                    onClick={() => handleBuy(item)}
                    className={`shop-card-btn buy-btn ${chessBalance < item.price ? 'disabled' : ''}`}
                  >
                    Buy Item
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
