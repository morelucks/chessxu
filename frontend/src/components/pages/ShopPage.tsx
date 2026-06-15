import React, { useState } from 'react';
import { Gamepad2, Palette, Sparkles, Award, ShoppingBag, Coins, Gift, Info, Check, Loader2 } from 'lucide-react';
import useAppStore from '../../zustand/store';
import './ShopPage.css';
import { openSTXTransfer } from '@stacks/connect';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { NETWORK, CHESSXU_DEPLOYER, CELO_CONFIG } from '../../chess/blockchainConstants';
import celoService from '../../chess/services/celoService';
import { formatEther, parseEther } from 'viem';

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
  const address = useAppStore((s) => s.address);
  const activeChain = useAppStore((s) => s.activeChain);
  const setConnectModalOpen = useAppStore((s) => s.setConnectModalOpen);

  const [walletBalance, setWalletBalance] = useState<string>('0.0000');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);

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

  const [equippedBoard, setEquippedBoard] = useState<string>(() => localStorage.getItem('chessxu-equipped-board') || 'board-slate');
  const [equippedPieces, setEquippedPieces] = useState<string>(() => localStorage.getItem('chessxu-equipped-pieces') || 'piece-classic');
  const [ownedItems, setOwnedItems] = useState<string[]>(() => {
    const local = localStorage.getItem('chessxu-owned-items');
    return local ? JSON.parse(local) : ['board-slate', 'piece-classic'];
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    document.title = "Chessxu - Shop";
  }, []);

  const refreshWalletBalance = async () => {
    if (!address) return;
    setIsLoadingBalance(true);
    try {
      if (activeChain === 'stacks') {
        const apiHost = NETWORK === 'mainnet' ? 'https://api.mainnet.hiro.so' : 'https://api.testnet.hiro.so';
        const res = await fetch(`${apiHost}/extended/v1/address/${address}/balances`);
        if (res.ok) {
          const data = await res.json();
          const stxMicro = data.stx?.balance || '0';
          setWalletBalance((parseInt(stxMicro) / 1_000_000).toFixed(4));
        }
      } else {
        const nativeBalance = await celoService.getNativeBalance(address as `0x${string}`);
        setWalletBalance(parseFloat(formatEther(nativeBalance)).toFixed(4));
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  React.useEffect(() => {
    refreshWalletBalance();
  }, [address, activeChain]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEquip = (item: ShopItem) => {
    if (!ownedItems.includes(item.id)) return;
    if (item.category === 'boards') {
      setEquippedBoard(item.id);
      localStorage.setItem('chessxu-equipped-board', item.id);
      triggerToast(`Equipped ${item.name} board!`, 'success');
    } else if (item.category === 'pieces') {
      setEquippedPieces(item.id);
      localStorage.setItem('chessxu-equipped-pieces', item.id);
      triggerToast(`Equipped ${item.name} piece set!`, 'success');
    }
  };

  const getPriceString = (price: number) => {
    const converted = price / 1000;
    if (activeChain === 'stacks') {
      return `${converted} STX`;
    } else {
      return `${converted} CELO`;
    }
  };

  const handleBuy = async (item: ShopItem) => {
    if (ownedItems.includes(item.id)) return;
    if (!address) {
      setConnectModalOpen(true);
      triggerToast('Please connect your wallet first.', 'error');
      return;
    }

    const price = item.price / 1000;
    const balanceNum = parseFloat(walletBalance);
    if (balanceNum < price) {
      triggerToast(`Insufficient ${activeChain === 'stacks' ? 'STX' : 'CELO'} balance!`, 'error');
      return;
    }

    setBuyingItemId(item.id);

    try {
      if (activeChain === 'stacks') {
        const stacksNetwork = NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
        const microStx = (price * 1_000_000).toString();

        await new Promise<string>((resolve, reject) => {
          openSTXTransfer({
            recipient: CHESSXU_DEPLOYER,
            amount: microStx,
            memo: `Purchase ${item.name}`,
            network: stacksNetwork,
            onFinish: (data) => {
              resolve(data.txId);
            },
            onCancel: () => {
              reject(new Error('Transaction cancelled by user.'));
            }
          });
        });

        const nextOwned = [...ownedItems, item.id];
        setOwnedItems(nextOwned);
        localStorage.setItem('chessxu-owned-items', JSON.stringify(nextOwned));
        triggerToast(`Successfully purchased ${item.name}!`, 'success');

        // Delay checking next balance
        setTimeout(() => refreshWalletBalance(), 5000);
      } else {
        await celoService.ensureCorrectNetwork();
        const walletClient = celoService.getWalletClient();
        const [account] = await walletClient.requestAddresses();
        const value = parseEther(price.toString());

        const txHash = await walletClient.sendTransaction({
          to: CELO_CONFIG.PAYMENT_RECIPIENT as `0x${string}`,
          value,
          account,
          ...celoService.getTxOptions(),
        });

        triggerToast('Transaction submitted. Verifying payment...', 'success');

        const receipt = await celoService.waitForTransactionReceipt(txHash);
        if (receipt.status !== 'success') {
          throw new Error('Transaction execution failed on-chain.');
        }

        const nextOwned = [...ownedItems, item.id];
        setOwnedItems(nextOwned);
        localStorage.setItem('chessxu-owned-items', JSON.stringify(nextOwned));
        triggerToast(`Successfully purchased ${item.name}!`, 'success');

        await refreshWalletBalance();
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      const msg = error?.message || 'Transaction failed.';
      triggerToast(msg.includes('cancelled') ? 'Transaction cancelled.' : msg, 'error');
    } finally {
      setBuyingItemId(null);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'boards' | 'pieces' | 'badges'>('all');

  const filteredItems = SHOP_ITEMS.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );

  const renderPreview = (item: ShopItem) => {
    if (item.category === 'boards') {
      let lightBg = '#e2e8f0';
      let darkBg = '#475569';
      if (item.id === 'board-wood') {
        lightBg = '#fed7aa';
        darkBg = '#b45309';
      } else if (item.id === 'board-marble') {
        lightBg = '#cbd5e1';
        darkBg = '#64748b';
      } else if (item.id === 'board-neon') {
        lightBg = '#ec4899';
        darkBg = '#1e1b4b';
      }
      return (
        <div className="mini-board-preview" style={{ border: `1px solid ${item.accentColor}` }}>
          <div className="mini-board-row" style={{ height: '50%', display: 'flex' }}>
            <div style={{ backgroundColor: lightBg, flex: 1 }} />
            <div style={{ backgroundColor: darkBg, flex: 1 }} />
          </div>
          <div className="mini-board-row" style={{ height: '50%', display: 'flex' }}>
            <div style={{ backgroundColor: darkBg, flex: 1 }} />
            <div style={{ backgroundColor: lightBg, flex: 1 }} />
          </div>
        </div>
      );
    }

    if (item.category === 'pieces') {
      if (item.id === 'piece-classic') {
        return (
          <div className="mini-piece-preview classic" style={{ color: item.accentColor }}>
            <span style={{ fontSize: '1.5rem' }}>👑</span>
          </div>
        );
      }
      if (item.id === 'piece-minimal') {
        return (
          <div className="mini-piece-preview minimal" style={{ color: item.accentColor }}>
            <span style={{ fontSize: '1.5rem' }}>🔺</span>
          </div>
        );
      }
      if (item.id === 'piece-pixel') {
        return (
          <div className="mini-piece-preview pixel" style={{ color: item.accentColor }}>
            <span style={{ fontSize: '1.5rem' }}>👾</span>
          </div>
        );
      }
    }

    return (
      <div className="mini-badge-preview">
        {getIcon(item.icon, item.accentColor)}
      </div>
    );
  };

  return (
    <div className="shop-root">
      {toast && (
        <div className={`shop-toast toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✨' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}
      <div className="shop-bg-glow glow-purple" />
      <div className="shop-bg-glow glow-blue" />
      <div className="shop-container">
        <header className="shop-header">
          <div className="shop-title-section">
            <h1 className="shop-title">Chessxu Premium Shop</h1>
            <p className="shop-subtitle">Customize your chess game appearance with exclusive assets.</p>
            <div className="shop-notice">
              <Info size={14} className="text-indigo-400" />
              <span>All custom assets are client-side only. Purchases are made on-chain using STX or CELO.</span>
            </div>
          </div>
          <div className="shop-balance-card">
            <span className="balance-label">Your Balance ({activeChain.toUpperCase()})</span>
            {address ? (
              <>
                <div className="balance-value">{walletBalance} {activeChain === 'stacks' ? 'STX' : 'CELO'}</div>
                <button onClick={refreshWalletBalance} disabled={isLoadingBalance} className="shop-faucet-btn" style={{ marginTop: '8px' }}>
                  {isLoadingBalance ? <Loader2 className="animate-spin" size={13} /> : <Gift size={13} />}
                  <span>{isLoadingBalance ? 'Refreshing...' : 'Refresh Balance'}</span>
                </button>
              </>
            ) : (
              <>
                <div className="balance-value" style={{ fontSize: '1.2rem', color: '#64748b', margin: '4px 0' }}>Disconnected</div>
                <button onClick={() => setConnectModalOpen(true)} className="shop-connect-btn">
                  Connect Wallet
                </button>
              </>
            )}
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
              className={`shop-card ${(item.category === 'boards' && equippedBoard === item.id) || (item.category === 'pieces' && equippedPieces === item.id) ? 'equipped' : ''}`}
              style={{ '--accent': item.accentColor } as React.CSSProperties}
            >
              <div className="shop-card-glow" />
              <div className="shop-card-icon-container">
                {renderPreview(item)}
              </div>
              <div className="shop-card-body">
                <h3 className="shop-card-title">{item.name}</h3>
                <p className="shop-card-desc">{item.description}</p>
                <div className="shop-card-footer">
                  <div className="shop-card-price">
                    <Coins size={14} className="text-yellow-500" />
                    <span>{getPriceString(item.price)}</span>
                  </div>
                  {ownedItems.includes(item.id) ? (
                    <>
                      <div className="shop-card-price owned-badge">
                        <Check size={14} className="text-emerald-400" />
                        <span>OWNED</span>
                      </div>
                      {item.category !== 'badges' && (
                        <button onClick={() => handleEquip(item)}
                        className={`shop-card-btn equip-btn ${(item.category === 'boards' && equippedBoard === item.id) || (item.category === 'pieces' && equippedPieces === item.id) ? 'equipped-btn' : ''}`}>
                          {(item.category === 'boards' && equippedBoard === item.id) || (item.category === 'pieces' && equippedPieces === item.id) ? 'Equipped' : 'Equip'}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      disabled={buyingItemId !== null || (!!address && parseFloat(walletBalance) < item.price / 1000)}
                      onClick={() => handleBuy(item)}
                      className={`shop-card-btn buy-btn ${buyingItemId !== null || (!!address && parseFloat(walletBalance) < item.price / 1000) ? 'disabled' : ''}`}
                    >
                      {buyingItemId === item.id ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Loader2 className="animate-spin" size={12} />
                          Processing
                        </span>
                      ) : !address ? (
                        'Connect Wallet'
                      ) : (
                        'Buy Item'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
