# Chessxu SDK Helper API

The `@morelucks/chessxu-sdk` package exposes the contract identifiers, error
codes and game-status constants for the Chessxu Clarity contracts, plus a set
of dependency-free helper functions for working with them. Everything below is
covered by the test suite (`npm test`).

## Contract identifiers

| Export | Description |
| --- | --- |
| `CHESSXU_DEPLOYER` | Mainnet deployer address. |
| `CONTRACTS` | `{ TRAIT, TOKEN, GAME }` fully-qualified contract ids. |
| `parseContractId(id)` | Split `"<address>.<name>"` into `{ address, name }`. |
| `getContractAddress(id)` | The address part of a contract id. |
| `getContractName(id)` | The name part of a contract id. |

## Errors

| Export | Description |
| --- | --- |
| `ERRORS` | Map of `ERR_*` names to numeric codes. |
| `ERROR_NAMES` | Reverse map of code → name. |
| `ERROR_MESSAGES` | Map of code → human-readable message. |
| `getErrorName(code)` | Resolve a code to its `ERR_*` name. |
| `getErrorMessage(code)` | Resolve a code to a message (with fallback). |
| `isKnownError(code)` | Whether a code is a known contract error. |
| `describeError(code)` | `"ERR_NAME: message"` summary. |
| `parseClarityErrorCode(value)` | Extract a code from `"(err uNNN)"`. |
| `ChessxuError` | `Error` subclass carrying `code` and `name`; `ChessxuError.fromClarity(value)`. |

## Game status

| Export | Description |
| --- | --- |
| `GAME_STATUS` | Status name → code. |
| `STATUS_NAMES` | Reverse map of code → name. |
| `getStatusName(status)` / `isValidGameStatus(status)` | Status name lookup / validity. |
| `isAwaitingOpponent` / `isGameActive` / `isGameOver` | Lifecycle predicates. |
| `getWinner(status)` | `"white" \| "black" \| "draw" \| null`. |
| `gameResultText(status)` | Human-readable status label. |

## Players and turns

| Export | Description |
| --- | --- |
| `PlayerColor` | `"w" \| "b"`. |
| `opponentOf(color)` | The opposing colour. |
| `colorOf(game, address)` | Which colour an address plays, or `null`. |
| `isPlayer(game, address)` | Whether the address is a participant. |
| `isPlayersTurn(game, address)` | Whether it's the address's turn (active games only). |

## Validation

| Export | Description |
| --- | --- |
| `isValidStacksAddress(address)` | Structural address check (Crockford base32). |
| `isMainnetAddress` / `isTestnetAddress` | Network discrimination. |
| `isValidWager(amount)` / `assertValidWager(amount)` | Positive-integer wager guard. |

## CHESS token amounts

| Export | Description |
| --- | --- |
| `CHESS_DECIMALS` / `ONE_CHESS` | Token decimals (6) and one whole token in base units. |
| `formatChess(baseUnits)` | Render base units as a decimal string. |
| `parseChess(value)` | Parse a decimal string into base units. |

## Board / FEN

| Export | Description |
| --- | --- |
| `STARTING_FEN` | Standard opening position. |
| `isStartingPosition(boardState)` | Whether a board state is the opening. |
| `activeColorFromFen(fen)` | Side-to-move from a FEN, or `null`. |
| `turnMatchesBoard(game)` | Whether `game.turn` agrees with the FEN. |

## Explorer links

| Export | Description |
| --- | --- |
| `txExplorerUrl(txid)` | Hiro explorer link for a transaction. |
| `addressExplorerUrl(address)` | Explorer link for an address. |
| `contractExplorerUrl(id)` | Explorer link for a deployed contract. |
