# Chessxu Paymaster Service

ERC-4337 paymaster signer backend for Chessxu on Celo Mainnet.

## Overview

This service validates and co-signs UserOperations for the ChessxuVerifyingPaymaster contract. It acts as the off-chain gatekeeper that decides which transactions get sponsored gas.

## Endpoints

- `POST /api/v1/sponsor` — Validate and sign a UserOperation
- `GET /api/v1/health` — Service health and paymaster deposit balance

## Setup

```bash
cp .env.example .env
# Fill in PAYMASTER_SIGNER_PRIVATE_KEY and PAYMASTER_CONTRACT_ADDRESS
npm install
npm run build
npm start
```

## Docker

```bash
docker build -t chessxu-paymaster .
docker run -p 3001:3001 --env-file .env chessxu-paymaster
```

## Docker Compose (with Redis)

```bash
cp .env.example .env
# Fill in required env vars
docker compose up -d
```

## Validation Rules

- Only `chainId: 42220` (Celo Mainnet) is accepted
- `callData` selector must be one of: `submitMove`, `createGame`, `joinGame`, `resign`
- Max 100 sponsored transactions per address per 24h (configurable)
- On-chain nonce is verified against the EntryPoint
