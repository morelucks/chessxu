# ♟️ Chessxu Backend Services

This directory is reserved for Chessxu backend services, off-chain relays, and API infrastructure.

## Structure

```text
backend/
└── paymaster/    # Gasless transaction sponsorship service for Celo
```

## Future Services Planned
- **WebSocket Game Relayer**: High-speed off-chain move synchronization between players.
- **Matchmaking Engine**: Real-time lobby queues, custom game creation, and ELO-based auto-matching.
- **Indexer & Analytics API**: Cached game history, player profiles, and dune/on-chain telemetry queries.
- **Anti-Cheat Engine**: Stockfish move evaluation and centipawn loss verification before wager disbursement.
