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

export default function ShopPage() {
  return (
    <div className="shop-root">
      <h1>Shop Page Coming Soon</h1>
    </div>
  );
}
