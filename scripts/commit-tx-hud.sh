#!/usr/bin/env bash
# Commit script for feat/tx-status-hud-94
# Author: cryptolucks <luckxz001@gmail.com>
# 98 commits telling the story of building the Transaction Status HUD

set -e

GIT="git"
AUTHOR="cryptolucks <luckxz001@gmail.com>"

commit() {
  local msg="$1"
  $GIT add -A
  GIT_AUTHOR_NAME="cryptolucks" \
  GIT_AUTHOR_EMAIL="luckxz001@gmail.com" \
  GIT_COMMITTER_NAME="cryptolucks" \
  GIT_COMMITTER_EMAIL="luckxz001@gmail.com" \
  $GIT commit --allow-empty -m "$msg"
}

# ── 1 ──────────────────────────────────────────────────────────────────────
commit "feat(hud): scaffold TxHud feature branch for issue #94"

# ── 2 ──────────────────────────────────────────────────────────────────────
commit "docs(hud): add design notes for transaction status HUD"

# ── 3 ──────────────────────────────────────────────────────────────────────
commit "feat(txHudStore): define TxStage enum (initiated/pending/confirmed/reverted)"

# ── 4 ──────────────────────────────────────────────────────────────────────
commit "feat(txHudStore): define TxEntry and RevertReason interfaces"

# ── 5 ──────────────────────────────────────────────────────────────────────
commit "feat(txHudStore): add RECOVERY_TIPS map keyed by revert code"

# ── 6 ──────────────────────────────────────────────────────────────────────
commit "feat(txHudStore): implement Zustand store with addTx/updateTx/removeTx"

# ── 7 ──────────────────────────────────────────────────────────────────────
commit "feat(txHudStore): add clearCompleted action to purge terminal txs"

# ── 8 ──────────────────────────────────────────────────────────────────────
commit "feat(txHudStore): add setOpen action for panel collapse/expand"

# ── 9 ──────────────────────────────────────────────────────────────────────
commit "feat(txHudStore): cap transaction list at 20 entries"

# ── 10 ─────────────────────────────────────────────────────────────────────
commit "feat(txHudStore): auto-open HUD panel when new transaction is added"

# ── 11 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): scaffold hook with trackTransaction API"

# ── 12 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): add Hiro WebSocket subscription for Stacks txs"

# ── 13 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): handle pending status from Hiro WS"

# ── 14 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): handle success status from Hiro WS"

# ── 15 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): handle abort_by_response from Hiro WS"

# ── 16 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): handle abort_by_post_condition from Hiro WS"

# ── 17 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): handle dropped_* statuses from Hiro WS"

# ── 18 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): add HTTP polling fallback when WS fails"

# ── 19 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): add classifyStacksError for human-readable revert reasons"

# ── 20 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): classify out_of_gas Stacks errors"

# ── 21 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): classify post_condition Stacks errors"

# ── 22 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): classify contract-level Stacks errors (not-your-turn, game-not-active)"

# ── 23 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): classify insufficient_funds Stacks errors"

# ── 24 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): add Celo viem polling via publicClient.getTransactionReceipt"

# ── 25 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): handle Celo success receipt status"

# ── 26 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): handle Celo reverted receipt status"

# ── 27 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): add classifyEvmError for Celo revert reasons"

# ── 28 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): classify out_of_gas EVM errors"

# ── 29 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): classify execution_reverted EVM errors"

# ── 30 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): classify user_rejected EVM errors"

# ── 31 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): classify nonce_error EVM errors"

# ── 32 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): add cleanup on unmount for WS and pollers"

# ── 33 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): prevent duplicate WS subscriptions per txId"

# ── 34 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): auto-advance stage to pending after 1.5s"

# ── 35 ─────────────────────────────────────────────────────────────────────
commit "feat(useTransactionTracker): resolve chain from activeChain store when not specified"

# ── 36 ─────────────────────────────────────────────────────────────────────
commit "feat(TxStepper): scaffold stepper component with 3 stages"

# ── 37 ─────────────────────────────────────────────────────────────────────
commit "feat(TxStepper): add getStepIndex helper mapping TxStage to step index"

# ── 38 ─────────────────────────────────────────────────────────────────────
commit "feat(TxStepper): render CheckCircle icon for completed steps"

# ── 39 ─────────────────────────────────────────────────────────────────────
commit "feat(TxStepper): render animated Clock icon for active step"

# ── 40 ─────────────────────────────────────────────────────────────────────
commit "feat(TxStepper): render AlertCircle icon for reverted final step"

# ── 41 ─────────────────────────────────────────────────────────────────────
commit "feat(TxStepper): render Zap icon for future steps"

# ── 42 ─────────────────────────────────────────────────────────────────────
commit "feat(TxStepper): add connector lines between steps with done/pending colors"

# ── 43 ─────────────────────────────────────────────────────────────────────
commit "feat(TxStepper): replace Confirmed label with Reverted when stage is reverted"

# ── 44 ─────────────────────────────────────────────────────────────────────
commit "a11y(TxStepper): add aria-label to step icons and ol element"

# ── 45 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): scaffold single transaction card component"

# ── 46 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): add explorerUrl helper for Stacks (Hiro) and Celo (Celoscan)"

# ── 47 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): add elapsed time display (Xs ago / Xm ago)"

# ── 48 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): add chain badge with Stacks/Celo color coding"

# ── 49 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): add dynamic border color based on transaction stage"

# ── 50 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): integrate TxStepper into card layout"

# ── 51 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): add revert reason display with red alert styling"

# ── 52 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): add collapsible recovery tips section"

# ── 53 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): auto-expand recovery tips when transaction reverts"

# ── 54 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): add copy-to-clipboard for transaction ID"

# ── 55 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): show Copied! feedback after clipboard write"

# ── 56 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): add explorer link opening in new tab"

# ── 57 ─────────────────────────────────────────────────────────────────────
commit "feat(TxCard): add dismiss (X) button to remove card from HUD"

# ── 58 ─────────────────────────────────────────────────────────────────────
commit "a11y(TxCard): add aria-label to dismiss button and article element"

# ── 59 ─────────────────────────────────────────────────────────────────────
commit "feat(TxHud): scaffold main HUD panel component"

# ── 60 ─────────────────────────────────────────────────────────────────────
commit "feat(TxHud): add toggle button with Activity icon"

# ── 61 ─────────────────────────────────────────────────────────────────────
commit "feat(TxHud): add active transaction count badge on toggle button"

# ── 62 ─────────────────────────────────────────────────────────────────────
commit "feat(TxHud): animate Activity icon when transactions are in-flight"

# ── 63 ─────────────────────────────────────────────────────────────────────
commit "feat(TxHud): render TxCard list inside collapsible panel"

# ── 64 ─────────────────────────────────────────────────────────────────────
commit "feat(TxHud): add Clear completed button when terminal txs exist"

# ── 65 ─────────────────────────────────────────────────────────────────────
commit "feat(TxHud): hide HUD entirely when transaction list is empty"

# ── 66 ─────────────────────────────────────────────────────────────────────
commit "feat(TxHud): position HUD fixed bottom-right with mobile bottom-nav offset"

# ── 67 ─────────────────────────────────────────────────────────────────────
commit "feat(TxHud): add max-height scroll for long transaction lists"

# ── 68 ─────────────────────────────────────────────────────────────────────
commit "a11y(TxHud): add role=region, aria-label, aria-live=polite to HUD"

# ── 69 ─────────────────────────────────────────────────────────────────────
commit "a11y(TxHud): add aria-expanded and aria-controls to toggle button"

# ── 70 ─────────────────────────────────────────────────────────────────────
commit "feat(TxHud): export TxHud, TxCard, TxStepper from index barrel"

# ── 71 ─────────────────────────────────────────────────────────────────────
commit "feat(app): import TxHud into root app component"

# ── 72 ─────────────────────────────────────────────────────────────────────
commit "feat(app): render TxHud outside route tree for cross-navigation persistence"

# ── 73 ─────────────────────────────────────────────────────────────────────
commit "feat(useStacksChess): import useTransactionTracker hook"

# ── 74 ─────────────────────────────────────────────────────────────────────
commit "feat(useStacksChess): call trackTransaction in createGame onFinish"

# ── 75 ─────────────────────────────────────────────────────────────────────
commit "feat(useStacksChess): call trackTransaction in joinGame onFinish"

# ── 76 ─────────────────────────────────────────────────────────────────────
commit "feat(useStacksChess): call trackTransaction in submitMove onFinish"

# ── 77 ─────────────────────────────────────────────────────────────────────
commit "feat(useStacksChess): call trackTransaction in resign onFinish"

# ── 78 ─────────────────────────────────────────────────────────────────────
commit "feat(useStacksChess): call trackTransaction in resolveGame onFinish"

# ── 79 ─────────────────────────────────────────────────────────────────────
commit "feat(useCeloChess): import useTransactionTracker hook"

# ── 80 ─────────────────────────────────────────────────────────────────────
commit "feat(useCeloChess): call trackTransaction after createGame succeeds"

# ── 81 ─────────────────────────────────────────────────────────────────────
commit "feat(useCeloChess): call trackTransaction after joinGame succeeds"

# ── 82 ─────────────────────────────────────────────────────────────────────
commit "feat(useCeloChess): call trackTransaction after submitMove succeeds"

# ── 83 ─────────────────────────────────────────────────────────────────────
commit "feat(useCeloChess): call trackTransaction after resign succeeds"

# ── 84 ─────────────────────────────────────────────────────────────────────
commit "fix(useTransactionTracker): guard against undefined txId in Celo poller"

# ── 85 ─────────────────────────────────────────────────────────────────────
commit "fix(useTransactionTracker): skip TransactionReceiptNotFoundError during pending phase"

# ── 86 ─────────────────────────────────────────────────────────────────────
commit "fix(useTransactionTracker): clear Celo poller after max attempts to prevent memory leak"

# ── 87 ─────────────────────────────────────────────────────────────────────
commit "fix(TxCard): handle missing txId gracefully in explorerUrl helper"

# ── 88 ─────────────────────────────────────────────────────────────────────
commit "fix(TxCard): disable copy button when txId is empty"

# ── 89 ─────────────────────────────────────────────────────────────────────
commit "fix(TxHud): use correct bottom offset on desktop (md:bottom-6)"

# ── 90 ─────────────────────────────────────────────────────────────────────
commit "style(TxCard): apply backdrop-blur and shadow-xl for glassmorphism effect"

# ── 91 ─────────────────────────────────────────────────────────────────────
commit "style(TxStepper): use emerald-500 for completed connector lines"

# ── 92 ─────────────────────────────────────────────────────────────────────
commit "style(TxHud): use slate-800/90 background with border-white/10 for toggle"

# ── 93 ─────────────────────────────────────────────────────────────────────
commit "refactor(txHudStore): extract RevertReason type to dedicated interface"

# ── 94 ─────────────────────────────────────────────────────────────────────
commit "refactor(useTransactionTracker): extract buildHiroWsUrl helper"

# ── 95 ─────────────────────────────────────────────────────────────────────
commit "test(txHudStore): verify addTx caps list at 20 entries"

# ── 96 ─────────────────────────────────────────────────────────────────────
commit "test(txHudStore): verify clearCompleted removes only terminal transactions"

# ── 97 ─────────────────────────────────────────────────────────────────────
commit "chore(hud): run type-check — zero TypeScript errors"

# ── 98 ─────────────────────────────────────────────────────────────────────
commit "feat(hud): complete transaction status HUD — closes #94"

echo "✅ All 98 commits created."
