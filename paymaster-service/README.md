# Chessxu Paymaster Service

ERC-4337 paymaster signer backend for Chessxu on Celo Mainnet.

## Overview

This service validates and co-signs UserOperations for the ChessxuVerifyingPaymaster contract. It acts as the off-chain gatekeeper that decides which transactions get sponsored gas.

## Architecture

### Distributed Rate Limiting

The service uses a **Redis-backed distributed rate limiter** to enforce per-address sponsorship limits across multiple horizontally-scaled instances:

- **Redis store (primary)**: Rate limits are shared across all instances via atomic Lua scripts — prevents attackers from bypassing limits by hitting different instances behind a load balancer.
- **In-memory store (fallback)**: If Redis becomes unavailable, the service automatically degrades to per-instance in-memory limiting. This ensures the system never blocks all transactions due to a Redis outage.
- **Automatic recovery**: When Redis comes back online, the service transparently switches back to the distributed store.

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Instance1│     │ Instance2│     │ Instance3│
│ (PM2/K8s)│     │ (PM2/K8s)│     │ (PM2/K8s)│
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     └────────────────┼────────────────┘
                      │
                ┌─────▼─────┐
                │   Redis   │
                │ (shared   │
                │  counters)│
                └───────────┘
```

### Key Components

| File | Purpose |
|------|---------|
| `src/services/redisPool.ts` | Singleton Redis connection pool with reconnection, health monitoring |
| `src/services/distributedRateLimiter.ts` | Atomic Lua-script-based rate limiting with memory fallback |
| `src/services/rateLimiter.ts` | Public API facade delegating to the distributed limiter |
| `src/services/healthMonitor.ts` | Diagnostics engine including Redis pool and rate limiter stats |
| `src/config.ts` | Environment-based configuration with Redis pool options |

## Endpoints

- `POST /api/v1/sponsor` — Validate and sign a UserOperation
- `GET /api/v1/health` — Service health and paymaster deposit balance
- `GET /api/v1/healthz` — Detailed diagnostics (Redis, rate limiter, balances)

### Rate Limit Headers

All `/api/v1/sponsor` responses include:
- `X-RateLimit-Remaining` — Requests remaining in current window
- `X-RateLimit-Reset` — Unix timestamp when window resets
- `X-RateLimit-Store` — Which backing store served the check (`redis` or `memory`)

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

This spins up both the paymaster service and a Redis instance, with rate limits automatically shared across all instances.

## PM2 (VPS — Multi-Instance)

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

PM2 is configured for cluster mode with multiple instances. Redis-backed rate limiting ensures consistent limits across all worker processes.

## Redis Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | *(unset)* | Redis connection string. Omit to use in-memory only |
| `REDIS_MAX_RECONNECT_ATTEMPTS` | `50` | Max reconnection attempts (-1 = infinite) |
| `REDIS_RECONNECT_BASE_DELAY_MS` | `500` | Base delay for exponential back-off |
| `REDIS_RECONNECT_MAX_DELAY_MS` | `30000` | Max delay cap for back-off |
| `REDIS_CONNECT_TIMEOUT_MS` | `5000` | Initial connection timeout |
| `REDIS_COMMAND_TIMEOUT_MS` | `3000` | Per-command execution timeout |
| `REDIS_HEALTH_CHECK_INTERVAL_MS` | `15000` | PING health-check interval |
| `REDIS_KEY_PREFIX` | `chessxu:paymaster:` | Key prefix for multi-tenant setups |

## Validation Rules

- Only `chainId: 42220` (Celo Mainnet) is accepted
- `callData` selector must be one of: `submitMove`, `createGame`, `joinGame`, `resign`
- Max 100 sponsored transactions per address per 24h (configurable)
- On-chain nonce is verified against the EntryPoint
- EIP-712 structured signature verification prevents replay attacks
