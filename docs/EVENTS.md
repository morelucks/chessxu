# Chessxu Contract Events

All key state transitions in `chessxu.clar` emit a structured `(print ...)` event.
Off-chain indexers (Subgraphs, custom scrapers, Hiro API listeners) can subscribe
to these events without scanning the full `games` map.

---

## Listening to Events

### Hiro API (recommended)

```
GET https://api.hiro.so/extended/v1/contract/{contract_id}/events
```

Filter by `event_type: "contract_log"` and decode the `value` field from Clarity
hex using `@stacks/transactions` `cvToValue()`.

### Stacks.js example

```typescript
import { cvToValue, hexToCV } from "@stacks/transactions";

const events = await fetch(
  `https://api.hiro.so/extended/v1/contract/${CONTRACT_ID}/events`
).then(r => r.json());

for (const event of events.results) {
  if (event.event_type === "contract_log") {
    const data = cvToValue(hexToCV(event.contract_log.value.hex));
    console.log(data.topic, data);
  }
}
```

---

## Event Shapes

All events include a `block-height` field for ordering and deduplication.

---

### `game-created`

Emitted by `create-game` on success.

| Field          | Type        | Description                                      |
|----------------|-------------|--------------------------------------------------|
| `topic`        | string-ascii | Always `"game-created"`                         |
| `game-id`      | uint        | The newly assigned game ID                       |
| `player-w`     | principal   | Address of the White player (creator)            |
| `wager`        | uint        | Escrowed amount in micro-STX or CHESS base units |
| `is-stx`       | bool        | `true` = STX wager, `false` = CHESS token wager  |
| `block-height` | uint        | Stacks block height at time of creation          |

**Example payload:**
```json
{
  "topic": "game-created",
  "game-id": 42,
  "player-w": "SP1ABC...XYZ",
  "wager": 1000000,
  "is-stx": true,
  "block-height": 150000
}
```

---

### `game-joined`

Emitted by `join-game` on success.

| Field          | Type        | Description                                      |
|----------------|-------------|--------------------------------------------------|
| `topic`        | string-ascii | Always `"game-joined"`                          |
| `game-id`      | uint        | The game that was joined                         |
| `player-w`     | principal   | Address of the White player                      |
| `player-b`     | principal   | Address of the Black player (joiner)             |
| `wager`        | uint        | Matched wager amount                             |
| `is-stx`       | bool        | Token type                                       |
| `block-height` | uint        | Stacks block height at time of joining           |

**Example payload:**
```json
{
  "topic": "game-joined",
  "game-id": 42,
  "player-w": "SP1ABC...XYZ",
  "player-b": "SP2DEF...UVW",
  "wager": 1000000,
  "is-stx": true,
  "block-height": 150001
}
```

---

### `move-submitted`

Emitted by `submit-move` on success.

| Field             | Type        | Description                                   |
|-------------------|-------------|-----------------------------------------------|
| `topic`           | string-ascii | Always `"move-submitted"`                    |
| `game-id`         | uint        | The game the move was submitted to            |
| `player`          | principal   | Address of the player who moved               |
| `move-str`        | string-ascii | Move in algebraic notation (e.g. `"e2e4"`)  |
| `new-board-state` | string-ascii | Resulting board state (FEN or ASCII)         |
| `next-turn`       | string-ascii | `"w"` or `"b"` — whose turn is next         |
| `block-height`    | uint        | Stacks block height at time of move           |

**Example payload:**
```json
{
  "topic": "move-submitted",
  "game-id": 42,
  "player": "SP1ABC...XYZ",
  "move-str": "e2e4",
  "new-board-state": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR",
  "next-turn": "b",
  "block-height": 150002
}
```

---

### `game-resigned`

Emitted by `resign` on success.

| Field          | Type        | Description                                      |
|----------------|-------------|--------------------------------------------------|
| `topic`        | string-ascii | Always `"game-resigned"`                        |
| `game-id`      | uint        | The game that was resigned                       |
| `resigned-by`  | principal   | Address of the player who resigned               |
| `winner`       | principal   | Address of the winning player                    |
| `new-status`   | uint        | `2` = White wins, `3` = Black wins               |
| `wager`        | uint        | Wager amount (prize = wager * 2)                 |
| `is-stx`       | bool        | Token type                                       |
| `block-height` | uint        | Stacks block height at time of resignation       |

**Example payload:**
```json
{
  "topic": "game-resigned",
  "game-id": 42,
  "resigned-by": "SP1ABC...XYZ",
  "winner": "SP2DEF...UVW",
  "new-status": 3,
  "wager": 1000000,
  "is-stx": true,
  "block-height": 150010
}
```

---

### `game-resolved`

Emitted by `resolve-game` on success.

| Field          | Type                    | Description                                  |
|----------------|-------------------------|----------------------------------------------|
| `topic`        | string-ascii            | Always `"game-resolved"`                    |
| `game-id`      | uint                    | The game that was resolved                   |
| `new-status`   | uint                    | `2`=White wins, `3`=Black wins, `4`=Draw, `5`=Cancelled |
| `player-w`     | principal               | White player address                         |
| `player-b`     | (optional principal)    | Black player address (none if cancelled before join) |
| `wager`        | uint                    | Wager amount                                 |
| `is-stx`       | bool                    | Token type                                   |
| `block-height` | uint                    | Stacks block height at time of resolution    |

**Example payload:**
```json
{
  "topic": "game-resolved",
  "game-id": 42,
  "new-status": 4,
  "player-w": "SP1ABC...XYZ",
  "player-b": "SP2DEF...UVW",
  "wager": 1000000,
  "is-stx": true,
  "block-height": 150020
}
```

---

## Status Codes Reference

| Code | Meaning      |
|------|--------------|
| `0`  | Waiting      |
| `1`  | Ongoing      |
| `2`  | White Wins   |
| `3`  | Black Wins   |
| `4`  | Draw         |
| `5`  | Cancelled    |

---

## Indexer Notes

- Events are only emitted on **successful** transactions. Failed calls produce no print events.
- `block-height` can be used for deterministic ordering when multiple events occur in the same block.
- The `game-id` field is present in every event and can be used as the primary join key.
- For `game-resigned`, `new-status` is always `2` or `3`. For `game-resolved`, it can be `2`–`5`.
