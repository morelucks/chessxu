# Game History Services

This directory contains services for offline-first game history management.

## Overview

The game history system provides:
- **Offline-first storage** using IndexedDB
- **Automatic synchronization** from blockchain
- **Efficient caching** for reduced RPC calls
- **Progressive enhancement** for offline mode

## Services

### gameHistoryDB.ts

IndexedDB wrapper for storing game history locally.

**Key Features:**
- Stores complete game objects with metadata
- Indexes by player address for fast queries
- Supports both Stacks and Celo chains
- Provides statistics and cache management

**Usage:**
```typescript
import { gameHistoryDB } from './gameHistoryDB';

// Initialize database
await gameHistoryDB.init();

// Save a game
await gameHistoryDB.saveGame(cachedGame);

// Get player games
const games = await gameHistoryDB.getPlayerGames(address, 'celo');

// Get statistics
const stats = await gameHistoryDB.getStats();
```

### gameSyncService.ts

Handles synchronization between blockchain and local cache.

**Key Features:**
- Fetches games from Stacks and Celo blockchains
- Batch processing with progress tracking
- Smart sync (only updates changed games)
- Auto-sync on application load

**Usage:**
```typescript
import { gameSyncService } from './gameSyncService';

// Sync player games
const result = await gameSyncService.syncPlayerGames(
  address,
  'celo',
  { maxGames: 50, forceRefresh: false }
);

// Sync single game
await gameSyncService.syncGame(gameId, 'stacks');

// Auto-sync (called on app load)
await gameSyncService.autoSync(address, chain);
```

## Data Flow

```
Blockchain (RPC)
      ↓
gameSyncService (fetch & transform)
      ↓
gameHistoryDB (IndexedDB storage)
      ↓
useGameHistory (React hook)
      ↓
UI Components (offline-ready)
```

## Offline Support

The system works offline by:
1. Caching all fetched games in IndexedDB
2. Serving cached data when offline
3. Syncing automatically when connection restored
4. Showing offline indicators in UI

## Performance

- **Initial load**: Syncs last 30 games
- **Cache-first**: Reads from IndexedDB (< 10ms)
- **Background sync**: Updates cache without blocking UI
- **Smart polling**: Only syncs active games

## Browser Support

Requires IndexedDB support:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

## Future Enhancements

- [ ] Move history parsing from blockchain events
- [ ] Block timestamp for accurate game dates
- [ ] Compression for large game histories
- [ ] Export/import game history
- [ ] Cloud backup integration
