# Changelog

All notable changes to `@morelucks/chessxu-sdk` are documented here. This
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Contract identifier helpers: `parseContractId`, `getContractAddress`,
  `getContractName` and the `ContractId` type.
- Error decoding: `ERROR_NAMES`, `ERROR_MESSAGES`, `getErrorName`,
  `getErrorMessage`, `isKnownError`, `describeError`, `parseClarityErrorCode`
  and the `ChessxuError` class.
- Game-status helpers: `STATUS_NAMES`, `getStatusName`, `isValidGameStatus`,
  `isAwaitingOpponent`, `isGameActive`, `isGameOver`, `getWinner` and
  `gameResultText`.
- Player/turn helpers: `PlayerColor`, `opponentOf`, `colorOf`, `isPlayer` and
  `isPlayersTurn`.
- Validation: `isValidStacksAddress`, `isMainnetAddress`, `isTestnetAddress`,
  `isValidWager` and `assertValidWager`.
- CHESS amount helpers: `CHESS_DECIMALS`, `ONE_CHESS`, `formatChess` and
  `parseChess`.
- Board/FEN helpers: `STARTING_FEN`, `isStartingPosition`, `activeColorFromFen`
  and `turnMatchesBoard`.
- Explorer links: `txExplorerUrl`, `addressExplorerUrl` and
  `contractExplorerUrl`.
- A `node:test` suite (`npm test`) and a `typecheck` script.
- API reference in `docs/SDK.md`.
