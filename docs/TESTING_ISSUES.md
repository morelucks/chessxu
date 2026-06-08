# 🏆 Chessxu Contract Testing Issues

This document lists **13 testing issues** designed to improve the test coverage of the Celo and Stacks smart contracts. These issues are structured to be contribution-friendly, providing clear context, acceptance criteria, and guidance for developers who want to help test the contracts.

---

## 📅 Summary of Issues

| Issue ID | Title | Target Contract | Target Test File | Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **#1** | Test ChessxuV2 ERC-20 Wager Refund on Draw/Cancellation | `ChessxuV2.sol` | `ChessxuV2.test.js` | Medium |
| **#2** | Test validation rate limit edge case | `ChessxuPaymaster.sol` | `ChessxuPaymaster.test.js` | Easy |
| **#3** | Test allowed selector modification | `ChessxuPaymaster.sol` | `ChessxuPaymaster.test.js` | Easy |
| **#4** | Test resign behavior for Native wagers | `Chessxu.sol` | `Chessxu.unit.test.js` | Medium |
| **#5** | Test double resign rejection | `Chessxu.sol` | `Chessxu.unit.test.js` | Easy |
| **#6** | Test invalid wager native boundary conditions | `Chessxu.sol` | `Chessxu.unit.test.js` | Medium |
| **#7** | Test game pause side effects on active games | `chessxu.clar` | `chessxu.test.ts` | Medium |
| **#8** | Test token-wagered game creation and joining | `chessxu.clar` | `chessxu.test.ts` | Medium |
| **#9** | Fix commented out leaderboard stats tests | `chessxu-leaderboard.clar` | `chessxu-leaderboard.test.ts` | Hard |
| **#10**| Fix commented out top-players entry data accessor shape | `chessxu-leaderboard.clar` | `chessxu-leaderboard.test.ts` | Hard |
| **#11**| Fix commented out player history data accessor tests | `chessxu-leaderboard.clar` | `chessxu-leaderboard.test.ts` | Hard |
| **#12**| Test ELO calculation edge cases | `chessxu-leaderboard.clar` | `chessxu-leaderboard.test.ts` | Medium |
| **#13**| Test admin ELO overrides and rank updates | `chessxu-leaderboard.clar` | `chessxu-leaderboard.test.ts` | Easy |

---

## 🛠️ Issues Details

### 1. Test ChessxuV2 ERC-20 Wager Refund on Draw/Cancellation
* **Description:** Ensure that when an ERC-20 wagered game is resolved as a Draw (`status = 4`) or Cancelled (`status = 5`), the escrowed tokens are fully refunded back to the creator and joiner.
* **Contract:** `celo-contract/contracts/ChessxuV2.sol`
* **Test File:** `celo-contract/test/ChessxuV2.test.js`
* **Acceptance Criteria:**
  1. Deploy `ChessxuV2` with a mock ERC-20 token address.
  2. Create a game with `isNative = false` and a wager amount. Approve and transfer tokens into the escrow.
  3. Join the game with Player 2. Verify that Player 2's wager is also deposited.
  4. Call `resolveGame` as the owner with `newStatus = 4` (Draw). Verify both players receive their wagers back.
  5. Repeat step 2 (without joining) and call `resolveGame` as the owner with `newStatus = 5` (Cancelled). Verify the creator receives their wager back.
  6. Confirm the contract's ERC-20 balance is reduced to zero.

### 2. Test validation rate limit edge case
* **Description:** Verify the daily transaction limit for users in the Paymaster is enforced exactly at the boundary. If `maxTxPerDay` is 5, the 5th transaction should succeed, while the 6th should be rejected.
* **Contract:** `celo-contract/contracts/ChessxuPaymaster.sol`
* **Test File:** `celo-contract/test/ChessxuPaymaster.test.js`
* **Acceptance Criteria:**
  1. Set up the Paymaster with a daily limit of 5.
  2. Simulate or execute 5 calls from a single user.
  3. Assert that transaction count updates correctly up to `maxTxPerDay`.
  4. Verify that the 6th transaction is rejected/reverted or returns the validation failure code.

### 3. Test allowed selector modification
* **Description:** Verify that the whitelisted selectors can be dynamically updated by the owner, and that unauthorized accounts cannot modify them.
* **Contract:** `celo-contract/contracts/ChessxuPaymaster.sol`
* **Test File:** `celo-contract/test/ChessxuPaymaster.test.js`
* **Acceptance Criteria:**
  1. Add a new custom selector to the whitelist as owner, and check that `allowedSelectors` returns true.
  2. Remove a whitelisted selector as owner, and check that it is no longer allowed.
  3. Call `setSelector` as a non-owner and verify the transaction reverts.

### 4. Test resign behavior for Native wagers
* **Description:** Test that when a player resigns in a native CELO/ETH wagered game, the winner receives the double wager (wager * 2) and the contract's native balance is decremented correctly.
* **Contract:** `celo-contract/contracts/Chessxu.sol`
* **Test File:** `celo-contract/test/Chessxu.unit.test.js`
* **Acceptance Criteria:**
  1. Create a game with native wager (e.g., 0.5 ETH/CELO).
  2. Join the game as Player 2 with the matching wager.
  3. Call `resign` from Player 1 (White). Verify Player 2's balance increases by `wager * 2` (1.0 ETH/CELO).
  4. Verify game status updates to 3 (Black Wins).
  5. Repeat the flow but call `resign` from Player 2 (Black). Verify Player 1's balance increases and status updates to 2 (White Wins).

### 5. Test double resign rejection
* **Description:** Verify that if a player attempts to resign in a game that has already finished, the transaction reverts with `GameNotActive()`.
* **Contract:** `celo-contract/contracts/Chessxu.sol`
* **Test File:** `celo-contract/test/Chessxu.unit.test.js`
* **Acceptance Criteria:**
  1. Create and join a game.
  2. Player 1 resigns. Verify status changes to 3.
  3. Player 2 attempts to resign on the same game.
  4. Verify that the second resign call reverts with `GameNotActive()`.

### 6. Test invalid wager native boundary conditions
* **Description:** Ensure that `createGame` and `joinGame` reject invalid native wager values (either higher or lower than required), while allowing zero-wager native games to be created/joined with no msg.value.
* **Contract:** `celo-contract/contracts/Chessxu.sol`
* **Test File:** `celo-contract/test/Chessxu.unit.test.js`
* **Acceptance Criteria:**
  1. Attempt to create a game with a native wager of 1 ETH but sending 0.5 ETH or 1.5 ETH. Verify both revert with `InvalidWager()`.
  2. Attempt to join a game with a native wager of 1 ETH but sending 0.5 ETH or 1.5 ETH. Verify both revert with `InvalidWager()`.
  3. Create/join a native game with 0 wager sending 0.1 ETH. Verify it reverts with `InvalidWager()`.
  4. Create/join a native game with 0 wager sending 0 ETH. Verify it succeeds.

### 7. Test game pause side effects on active games
* **Description:** Test that pausing the contract blocks game modification functions (`create-game`, `join-game`, `submit-move`) but leaves read-only/view functions (like `get-game`, `is-paused`, `get-last-game-id`) fully accessible.
* **Contract:** `stacks-contracts/contracts/chessxu.clar`
* **Test File:** `stacks-contracts/tests/chessxu.test.ts`
* **Acceptance Criteria:**
  1. Call `pause` as the deployer. Verify `is-paused` returns `true`.
  2. Attempt to call `create-game`, `join-game`, `submit-move` and check that they revert with `err-paused` (u111).
  3. Verify that `get-game` and `get-last-game-id` still return correct values without reverting.

### 8. Test token-wagered game creation and joining
* **Description:** Verify that SIP-010 token wagers are correctly handled. In a non-STX game, creating and joining a game must transfer `chessxu-token` from the player's account to the contract.
* **Contract:** `stacks-contracts/contracts/chessxu.clar`
* **Test File:** `stacks-contracts/tests/chessxu.test.ts`
* **Acceptance Criteria:**
  1. Create a game with `is-stx = false` and a wager amount.
  2. Verify that `chessxu-token` is transferred from Player 1's balance to the escrow.
  3. Join the game as Player 2. Verify that `chessxu-token` is transferred from Player 2's balance.
  4. Check that the contract's token escrow holds `wager * 2`.

### 9. Fix commented out leaderboard stats tests
* **Description:** Un-comment and fix the basic stats tests that check ELO updates, streak increments, best streak preservation, and stats reset on loss.
* **Contract:** `stacks-contracts/contracts/chessxu-leaderboard.clar`
* **Test File:** `stacks-contracts/tests/chessxu-leaderboard.test.ts`
* **Acceptance Criteria:**
  1. Un-comment tests checking win/loss streaks and best streaks in `leaderboard — record-win basics` and `leaderboard — record-draw basics`.
  2. Fix the data accessors so they match the actual response structure of `get-player-stats` under simnet.
  3. Ensure all assertions run successfully and vitest passes.

### 10. Fix commented out top-players entry data accessor shape
* **Description:** Un-comment and fix the top players pagination and sorting tests.
* **Contract:** `stacks-contracts/contracts/chessxu-leaderboard.clar`
* **Test File:** `stacks-contracts/tests/chessxu-leaderboard.test.ts`
* **Acceptance Criteria:**
  1. Un-comment tests like `offset skips the correct number of entries`, `entries are sorted by ELO descending`, and `each entry contains rank, player, elo, wins, losses, draws`.
  2. Fix any simnet structure mapping issues.
  3. Verify that top-players are sorted correctly by ELO in descending order.

### 11. Fix commented out player history data accessor tests
* **Description:** Un-comment and fix the player history tests checking delta, result, opponent, and new-elo fields.
* **Contract:** `stacks-contracts/contracts/chessxu-leaderboard.clar`
* **Test File:** `stacks-contracts/tests/chessxu-leaderboard.test.ts`
* **Acceptance Criteria:**
  1. Un-comment the history entry data checks in `leaderboard — score history`.
  2. Fix the accessors to extract history entries correctly.
  3. Verify the results match: win gives positive delta/win result, loss gives negative delta/loss result, draw gives 0 delta/draw result.

### 12. Test ELO calculation edge cases
* **Description:** Verify the accuracy of the expected score and ELO calculations under extreme scenarios (e.g. very large ELO gaps, boundary ELO values).
* **Contract:** `stacks-contracts/contracts/chessxu-leaderboard.clar`
* **Test File:** `stacks-contracts/tests/chessxu-leaderboard.test.ts`
* **Acceptance Criteria:**
  1. Setup a match between a player with ELO 2000 and another with ELO 1000.
  2. Assert that `get-expected-score` returns near maximum values for the higher-ranked player.
  3. Record a win and verify the ELO changes are small for the high-ranked winner and large if the low-ranked player wins.

### 13. Test admin ELO overrides and rank updates
* **Description:** Test that `admin-set-elo` can only be called by the owner, modifies the player's ELO correctly, and instantly updates their rank position in the global leaderboard.
* **Contract:** `stacks-contracts/contracts/chessxu-leaderboard.clar`
* **Test File:** `stacks-contracts/tests/chessxu-leaderboard.test.ts`
* **Acceptance Criteria:**
  1. Call `admin-set-elo` on Player 2 to set their ELO to a high value.
  2. Check that Player 2's rank becomes #1.
  3. Attempt to call `admin-set-elo` as a non-owner and verify it returns `err-not-owner` (u100).

---

## 🚀 How to Run the Tests

### Celo Contracts (Hardhat)
```bash
cd celo-contract
npm install
npx hardhat test
```

### Stacks Contracts (Vitest)
```bash
cd stacks-contracts
npm install
npm run test
```
