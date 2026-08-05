# ♟️ Chessxu Smart Contracts

This directory contains the multi-chain smart contracts powering Chessxu escrow wagers and game resolution logic.

## Structure

```text
contracts/
├── celo/      # EVM Hardhat project deployed on Celo Mainnet
└── stacks/    # Clarinet project written in Clarity for Stacks Mainnet
```

## Quick Commands

### Celo (EVM)
```bash
cd contracts/celo
npm install
npx hardhat test
```

### Stacks (Clarity)
```bash
cd contracts/stacks
clarinet check
clarinet test
```
