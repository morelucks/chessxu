# MiniPay Integration Guide — Chessxu

Chessxu is fully optimised for [MiniPay](https://www.opera.com/products/minipay) on the Celo blockchain. MiniPay users enjoy a seamless, gasless chess experience powered by Celo Fee Abstraction.

## Features

### 🔗 Wallet Integration
- **Auto-Connect** — MiniPay users are automatically connected on app load (no wallet popup).
- **Detection** — The app checks `window.ethereum.isMiniPay` and adapts the UI accordingly.
- **Celo Network Lock** — When MiniPay is detected, the active chain is set to Celo automatically.

### ⛽ Fee Abstraction (Gasless UX)
- Users **never need native CELO** to pay gas.
- Every write operation (create game, join game, submit move, resign, daily access payment) uses robust fee-currency selection:
  1. Estimates gas for the target transaction.
  2. Adds a 20 % safety buffer + protocol overhead.
  3. Probes each supported stablecoin to verify wallet/network support.
  4. Selects the first currency with sufficient balance.
- Supported fee currencies: **cUSD · USDC · USDT · cEUR · cREAL**

### 💰 Daily Access Payments
- **cUSD micro-payment** (0.1 cUSD) unlocks 24-hour match access.
- On-chain verification of `Transfer` event logs.
- Toast notifications track payment lifecycle.

### 📱 MiniPay-Optimised UI
- Connect-wallet buttons are hidden in MiniPay (auto-connects silently).
- Access-gate banner shown on the chess screen when daily payment is needed.
- Legacy transaction type (`type: 'legacy'`) used as required by MiniPay.

## Technical Architecture

### Key Files

| File | Purpose |
|------|---------|
| `src/hooks/useMiniPay.ts` | Detects MiniPay, auto-connects wallet, sets Zustand state |
| `src/hooks/useMiniPayAccess.ts` | Daily cUSD access purchase + balance tracking |
| `src/utils/feeCurrency.ts` | Robust fee-currency selection with gas estimation |
| `src/chess/services/celoService.ts` | All Celo contract interactions (games + payments) |
| `src/chess/blockchainConstants.ts` | Celo chain config, fee currency list, contract addresses |
| `src/types/minipay.d.ts` | TypeScript declarations for `window.ethereum.isMiniPay` |
| `src/zustand/store.ts` | MiniPay detection & access state (persisted) |

### Fee Currency Selection Flow

```
User triggers write tx (e.g. createGame)
        │
        ▼
  estimateGas(target tx)          ← base gas cost
        │
        ▼
  + FEE_ABSTRACTION_OVERHEAD      ← 50 000 gas
  × GAS_SAFETY_MARGIN             ← × 1.2
        │
        ▼
  For each CELO_FEE_CURRENCIES:
    ├─ readContract(balanceOf)
    ├─ eth_gasPrice(feeCurr)
    ├─ estimateGas(probe)         ← verify wallet supports it
    └─ if normalizedBalance ≥ fee → return feeCurrency ✅
        │
        ▼
  Fallback: native CELO gas (or error)
```

### Supported Fee Currencies

| Symbol | Token Address | Decimals |
|--------|--------------|----------|
| USDT | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` | 6 |
| USDC | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` | 6 |
| cUSD | `0x765DE816845861e75A25fCA122bb6898B8B1282a` | 18 |
| cEUR | `0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73` | 18 |
| cREAL | `0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787` | 18 |

## Testing in MiniPay

1. Deploy the app to a public URL (Vercel recommended).
2. Install MiniPay ([Android](https://play.google.com/store/apps/details?id=com.opera.minipay) / [iOS](https://apps.apple.com/de/app/minipay-easy-global-wallet/id6504087257)).
3. Enable Developer Mode → Settings → About → tap version 10 times.
4. Open the deployed URL in MiniPay's built-in browser.
5. The app should auto-detect MiniPay and connect without a popup.
6. Purchase daily access with cUSD (gas paid in cUSD — no CELO needed).
7. Create or join a game — all transactions use fee abstraction.

### Local Testing with ngrok

```bash
cd frontend
npm run dev            # starts on localhost:5173
ngrok http 5173        # exposes a public URL
```

Open the ngrok URL in MiniPay's browser.

## Security

- On-chain `Transfer` event verification for all cUSD payments.
- Wallet address matching for transaction sender validation.
- Transaction receipt retry logic with configurable max retries.
- Zustand-persisted access expiry prevents stale sessions.

---

**Built with ♟️ for the Celo ecosystem and MiniPay — Proof of Ship S1**
