;; chessxu-leaderboard.clar
;; On-chain leaderboard for the Chessxu game
;;
;; v2 - Paginated rankings + score-adjustment history
;;
;; Design:
;;   - ranked-list: index map (slot -> principal) sorted by ELO descending.
;;     Updated on every win via fold-based helpers (no recursion).
;;   - score-history: per-player ring-buffer of last 20 ELO adjustments.
;;   - get-top-players: O(limit) paginated read - no map scanning.
;;   - get-player-history: paginated score-adjustment log.
;;   - get-player-rank: O(MAX-PLAYERS) rank lookup.

;; ===========================
;; Constants
;; ===========================

(define-constant contract-owner tx-sender)
(define-constant chessxu-contract .chessxu)

(define-constant err-not-authorized   (err u100))
(define-constant err-player-not-found (err u101))
(define-constant err-invalid-result   (err u102))
(define-constant err-same-player      (err u103))

;; Ranked list capacity
(define-constant MAX-PLAYERS u50)

;; Per-player history ring-buffer size
(define-constant HISTORY-SIZE u20)

;; ELO constants
(define-constant elo-k-factor u32)

;; ===========================
;; Data Maps
;; ===========================

(define-map player-stats
    { player: principal }
    {
        wins:         uint,
        losses:       uint,
        draws:        uint,
        total-games:  uint,
        elo:          uint,
        streak:       uint,
        best-streak:  uint
    }
)

;; Ranked list: slot (uint) -> principal
(define-map ranked-list
    { slot: uint }
    { player: principal }
)

;; Score history ring-buffer
(define-map score-history
    { player: principal, index: uint }
    {
        game-id:      uint,
        opponent:     principal,
        delta:        int,
        new-elo:      uint,
        result:       (string-ascii 4),
        block-height: uint
    }
)

(define-map history-pointer
    { player: principal }
    { next-index: uint }
)

;; ===========================
;; Global Variables
;; ===========================

(define-data-var total-games-played       uint u0)
(define-data-var total-decisive-games     uint u0)
(define-data-var total-players-registered uint u0)
(define-data-var default-elo              uint u1200)
(define-data-var ranked-list-size         uint u0)

;; ===========================
;; ELO Engine
;; ===========================

(define-private (expected-score-times-1000 (elo-a uint) (elo-b uint))
    (/ (* elo-a u1000) (+ elo-a elo-b))
)

(define-private (elo-win-delta (winner-elo uint) (loser-elo uint))
    (let ((expected (expected-score-times-1000 winner-elo loser-elo)))
        (/ (* elo-k-factor (- u1000 expected)) u1000)
    )
)

(define-private (elo-loss-delta (winner-elo uint) (loser-elo uint))
    (let ((expected (expected-score-times-1000 loser-elo winner-elo)))
        (/ (* elo-k-factor expected) u1000)
    )
)

;; ===========================
;; Private ELO lookup
;; ===========================

(define-private (player-elo-priv (player principal))
    (match (map-get? player-stats { player: player })
        s (get elo s)
        (var-get default-elo)
    )
)

;; ===========================
;; Ranked-List: fold-based upsert
;;
;; We represent the ranked list as a map from slot -> principal.
;; To insert a player we:
;;   1. Find their old slot (fold over slots 0..size-1).
;;   2. Find the insertion slot (first slot with ELO < new-elo).
;;   3. Shift entries to make room (fold).
;;   4. Write the new entry.
;;
;; All folds use a fixed list of u50 indices so there is no recursion.
;; ===========================

;; The index list used for folds (slots 0..49)
(define-constant SLOTS (list
    u0  u1  u2  u3  u4  u5  u6  u7  u8  u9
    u10 u11 u12 u13 u14 u15 u16 u17 u18 u19
    u20 u21 u22 u23 u24 u25 u26 u27 u28 u29
    u30 u31 u32 u33 u34 u35 u36 u37 u38 u39
    u40 u41 u42 u43 u44 u45 u46 u47 u48 u49
))

;; Fold step: find the slot of `target` player. State = { found: uint, target: principal }
;; found = u999 means not found yet; otherwise holds the slot index.
(define-private (find-player-step (slot uint) (state { found: uint, target: principal }))
    (if (< (get found state) u999)
        state  ;; already found
        (match (map-get? ranked-list { slot: slot })
            entry
            (if (is-eq (get player entry) (get target state))
                { found: slot, target: (get target state) }
                state
            )
            state
        )
    )
)

;; Fold step: find insertion position for new-elo.
;; State = { pos: uint, new-elo: uint, size: uint, done: bool }
(define-private (find-insert-step
    (slot uint)
    (state { pos: uint, new-elo: uint, size: uint, done: bool })
)
    (if (get done state)
        state
        (if (>= slot (get size state))
            (merge state { done: true })
            (let (
                (slot-player-elo
                    (match (map-get? ranked-list { slot: slot })
                        entry (player-elo-priv (get player entry))
                        u0
                    )
                )
            )
                (if (< slot-player-elo (get new-elo state))
                    (merge state { pos: slot, done: true })
                    (merge state { pos: (+ slot u1) })
                )
            )
        )
    )
)

;; Fold step: shift entries one slot higher (from high to low index).
;; We iterate SLOTS in reverse by folding and only acting when slot is in range.
;; State = { from: uint, to: uint }  -- shift slots [from..to-1] to [from+1..to]
;; We process in descending order so we fold the reversed list.
(define-constant SLOTS-REV (list
    u49 u48 u47 u46 u45 u44 u43 u42 u41 u40
    u39 u38 u37 u36 u35 u34 u33 u32 u31 u30
    u29 u28 u27 u26 u25 u24 u23 u22 u21 u20
    u19 u18 u17 u16 u15 u14 u13 u12 u11 u10
    u9  u8  u7  u6  u5  u4  u3  u2  u1  u0
))

(define-private (shift-up-step (slot uint) (state { from: uint, to: uint }))
    ;; Copy slot -> slot+1 for slots in [from .. to-1]
    (if (and (>= slot (get from state)) (< slot (get to state)))
        (begin
            (match (map-get? ranked-list { slot: slot })
                entry (map-set ranked-list { slot: (+ slot u1) } entry)
                true
            )
            state
        )
        state
    )
)

;; Fold step: shift entries one slot lower (remove a slot).
;; Copy slot -> slot-1 for slots in [remove+1 .. size-1].
(define-private (shift-down-step (slot uint) (state { remove: uint, size: uint }))
    (if (and (> slot (get remove state)) (< slot (get size state)))
        (begin
            (match (map-get? ranked-list { slot: slot })
                entry (map-set ranked-list { slot: (- slot u1) } entry)
                true
            )
            state
        )
        state
    )
)

;; Main upsert function
(define-private (ranked-list-upsert (player principal) (new-elo uint))
    (let (
        (list-size  (var-get ranked-list-size))
        ;; Step 1: find old position
        (find-result (fold find-player-step SLOTS { found: u999, target: player }))
        (old-pos     (get found find-result))
        ;; Step 2: remove old entry if present
        (after-remove-size
            (if (< old-pos u999)
                (begin
                    (fold shift-down-step SLOTS { remove: old-pos, size: list-size })
                    (map-delete ranked-list { slot: (- list-size u1) })
                    (- list-size u1)
                )
                list-size
            )
        )
        ;; Step 3: cap at MAX-PLAYERS
        (work-size (if (>= after-remove-size MAX-PLAYERS) (- MAX-PLAYERS u1) after-remove-size))
        ;; Step 4: find insertion position
        (ins-result (fold find-insert-step SLOTS
            { pos: work-size, new-elo: new-elo, size: work-size, done: false }))
        (insert-pos (get pos ins-result))
    )
        ;; Step 5: shift entries up to make room
        (fold shift-up-step SLOTS-REV { from: insert-pos, to: work-size })
        ;; Step 6: write new entry
        (map-set ranked-list { slot: insert-pos } { player: player })
        ;; Step 7: update size
        (var-set ranked-list-size
            (if (>= after-remove-size MAX-PLAYERS)
                MAX-PLAYERS
                (+ after-remove-size u1)
            )
        )
    )
)

;; ===========================
;; Score History
;; ===========================

(define-private (history-write
    (player   principal)
    (game-id  uint)
    (opponent principal)
    (delta    int)
    (new-elo  uint)
    (result   (string-ascii 4))
)
    (let (
        (ptr (match (map-get? history-pointer { player: player })
                p (get next-index p)
                u0
             ))
    )
        (map-set score-history
            { player: player, index: ptr }
            {
                game-id:      game-id,
                opponent:     opponent,
                delta:        delta,
                new-elo:      new-elo,
                result:       result,
                block-height: block-height
            }
        )
        (map-set history-pointer { player: player }
            { next-index: (mod (+ ptr u1) HISTORY-SIZE) }
        )
    )
)

;; ===========================
;; Player Registration
;; ===========================

(define-private (ensure-player-exists (player principal))
    (match (map-get? player-stats { player: player })
        existing true
        (begin
            (map-set player-stats { player: player }
                {
                    wins:         u0,
                    losses:       u0,
                    draws:        u0,
                    total-games:  u0,
                    elo:          (var-get default-elo),
                    streak:       u0,
                    best-streak:  u0
                }
            )
            (var-set total-players-registered (+ (var-get total-players-registered) u1))
            true
        )
    )
)

;; ===========================
;; Public Match Recording
;; ===========================

(define-public (record-win (winner principal) (loser principal))
    (let (
        (wi (ensure-player-exists winner))
        (li (ensure-player-exists loser))
        (w-stats (unwrap! (map-get? player-stats { player: winner }) err-player-not-found))
        (l-stats (unwrap! (map-get? player-stats { player: loser  }) err-player-not-found))
        (w-elo     (get elo w-stats))
        (l-elo     (get elo l-stats))
        (w-delta   (elo-win-delta  w-elo l-elo))
        (l-delta   (elo-loss-delta w-elo l-elo))
        (new-w-elo (+ w-elo w-delta))
        (new-l-elo (if (> l-elo l-delta) (- l-elo l-delta) u0))
        (w-streak  (+ (get streak w-stats) u1))
        (w-best    (if (> w-streak (get best-streak w-stats)) w-streak (get best-streak w-stats)))
        (game-id   (var-get total-games-played))
    )
        (asserts! (or (is-eq contract-caller chessxu-contract) (is-eq contract-caller contract-owner)) err-not-authorized)
        (asserts! (not (is-eq winner loser)) err-same-player)

        (map-set player-stats { player: winner }
            (merge w-stats {
                wins:        (+ (get wins w-stats) u1),
                total-games: (+ (get total-games w-stats) u1),
                elo:         new-w-elo,
                streak:      w-streak,
                best-streak: w-best
            })
        )
        (map-set player-stats { player: loser }
            (merge l-stats {
                losses:      (+ (get losses l-stats) u1),
                total-games: (+ (get total-games l-stats) u1),
                elo:         new-l-elo,
                streak:      u0
            })
        )

        (ranked-list-upsert winner new-w-elo)
        (ranked-list-upsert loser  new-l-elo)

        (history-write winner game-id loser (to-int w-delta) new-w-elo "win")
        (history-write loser  game-id winner (* -1 (to-int l-delta)) new-l-elo "loss")

        (var-set total-games-played   (+ (var-get total-games-played)   u1))
        (var-set total-decisive-games (+ (var-get total-decisive-games) u1))

        (ok true)
    )
)

(define-public (record-draw (player-a principal) (player-b principal))
    (let (
        (ai (ensure-player-exists player-a))
        (bi (ensure-player-exists player-b))
        (a-stats (unwrap! (map-get? player-stats { player: player-a }) err-player-not-found))
        (b-stats (unwrap! (map-get? player-stats { player: player-b }) err-player-not-found))
        (game-id (var-get total-games-played))
    )
        (asserts! (or (is-eq contract-caller chessxu-contract) (is-eq contract-caller contract-owner)) err-not-authorized)
        (asserts! (not (is-eq player-a player-b)) err-same-player)

        (map-set player-stats { player: player-a }
            (merge a-stats {
                draws:       (+ (get draws a-stats) u1),
                total-games: (+ (get total-games a-stats) u1),
                streak:      u0
            })
        )
        (map-set player-stats { player: player-b }
            (merge b-stats {
                draws:       (+ (get draws b-stats) u1),
                total-games: (+ (get total-games b-stats) u1),
                streak:      u0
            })
        )

        (history-write player-a game-id player-b 0 (get elo a-stats) "draw")
        (history-write player-b game-id player-a 0 (get elo b-stats) "draw")

        (var-set total-games-played (+ (var-get total-games-played) u1))

        (ok true)
    )
)

;; ===========================
;; Read-Only Queries
;; ===========================

(define-read-only (get-player-stats (player principal))
    (map-get? player-stats { player: player })
)

(define-read-only (get-player-elo (player principal))
    (match (map-get? player-stats { player: player })
        s (get elo s)
        (var-get default-elo)
    )
)

(define-read-only (get-global-stats)
    {
        total-games:    (var-get total-games-played),
        total-decisive: (var-get total-decisive-games),
        total-players:  (var-get total-players-registered)
    }
)

(define-read-only (get-expected-score (player-a principal) (player-b principal))
    (expected-score-times-1000 (get-player-elo player-a) (get-player-elo player-b))
)

(define-read-only (get-ranked-list-size)
    (var-get ranked-list-size)
)

;; Paginated top-players - reads directly from ranked-list index, no map scan.
(define-read-only (get-top-players (offset uint) (limit uint))
    (let (
        (list-size  (var-get ranked-list-size))
        (safe-limit (if (> limit u10) u10 limit))
    )
        {
            total:   list-size,
            offset:  offset,
            limit:   safe-limit,
            entries: (get-top-players-fold offset safe-limit list-size)
        }
    )
)

;; Fold step for get-top-players
(define-private (top-players-step
    (slot uint)
    (state {
        offset: uint, remaining: uint, size: uint, cur: uint,
        entries: (list 10 { rank: uint, player: principal, elo: uint, wins: uint, losses: uint, draws: uint })
    })
)
    (if (or (is-eq (get remaining state) u0) (>= (get cur state) (get size state)))
        state
        (if (< (get cur state) (get offset state))
            (merge state { cur: (+ (get cur state) u1) })
            (match (map-get? ranked-list { slot: (get cur state) })
                entry
                (match (map-get? player-stats { player: (get player entry) })
                    stats
                    (merge state {
                        cur:       (+ (get cur state) u1),
                        remaining: (- (get remaining state) u1),
                        entries:   (unwrap-panic (as-max-len?
                            (append (get entries state) {
                                rank:   (+ (get cur state) u1),
                                player: (get player entry),
                                elo:    (get elo stats),
                                wins:   (get wins stats),
                                losses: (get losses stats),
                                draws:  (get draws stats)
                            })
                            u10
                        ))
                    })
                    (merge state { cur: (+ (get cur state) u1) })
                )
                (merge state { cur: (+ (get cur state) u1) })
            )
        )
    )
)

(define-private (get-top-players-fold (offset uint) (limit uint) (size uint))
    (get entries
        (fold top-players-step SLOTS
            { offset: offset, remaining: limit, size: size, cur: u0, entries: (list) }
        )
    )
)

;; Paginated score-history - most-recent-first via ring-buffer walk.
(define-read-only (get-player-history (player principal) (offset uint) (limit uint))
    (let (
        (safe-limit  (if (> limit u20) u20 limit))
        (ptr         (match (map-get? history-pointer { player: player }) p (get next-index p) u0))
        (total-games (match (map-get? player-stats { player: player }) s (get total-games s) u0))
        (filled      (if (>= total-games HISTORY-SIZE) HISTORY-SIZE total-games))
    )
        {
            player:  player,
            total:   filled,
            offset:  offset,
            limit:   safe-limit,
            entries: (get-history-fold player ptr filled offset safe-limit)
        }
    )
)

;; Index list for history fold (0..19)
(define-constant HIST-SLOTS (list
    u0 u1 u2 u3 u4 u5 u6 u7 u8 u9
    u10 u11 u12 u13 u14 u15 u16 u17 u18 u19
))

(define-private (history-step
    (i uint)
    (state {
        player: principal, ptr: uint, filled: uint,
        offset: uint, remaining: uint, cur: uint,
        entries: (list 20 { game-id: uint, opponent: principal, delta: int, new-elo: uint, result: (string-ascii 4), block-height: uint })
    })
)
    (if (or (is-eq (get remaining state) u0) (>= (get cur state) (get filled state)))
        state
        (if (< (get cur state) (get offset state))
            (merge state { cur: (+ (get cur state) u1) })
            (let (
                (idx (mod
                    (+ (+ HISTORY-SIZE (get ptr state))
                       (- HISTORY-SIZE (+ (get cur state) u1)))
                    HISTORY-SIZE
                ))
            )
                (match (map-get? score-history { player: (get player state), index: idx })
                    entry
                    (merge state {
                        cur:       (+ (get cur state) u1),
                        remaining: (- (get remaining state) u1),
                        entries:   (unwrap-panic (as-max-len?
                            (append (get entries state) {
                                game-id:      (get game-id entry),
                                opponent:     (get opponent entry),
                                delta:        (get delta entry),
                                new-elo:      (get new-elo entry),
                                result:       (get result entry),
                                block-height: (get block-height entry)
                            })
                            u20
                        ))
                    })
                    (merge state { cur: (+ (get cur state) u1) })
                )
            )
        )
    )
)

(define-private (get-history-fold
    (player principal) (ptr uint) (filled uint) (offset uint) (limit uint)
)
    (get entries
        (fold history-step HIST-SLOTS
            { player: player, ptr: ptr, filled: filled,
              offset: offset, remaining: limit, cur: u0, entries: (list) }
        )
    )
)

;; Rank lookup - returns 1-based rank, or u0 if not in ranked list.
(define-read-only (get-player-rank (player principal))
    (let (
        (result (fold find-player-step SLOTS { found: u999, target: player }))
        (pos    (get found result))
    )
        (if (< pos u999) (+ pos u1) u0)
    )
)

;; ===========================
;; Admin Functions
;; ===========================

(define-public (admin-set-elo (player principal) (new-elo uint))
    (let (
        (inited (ensure-player-exists player))
        (stats  (unwrap! (map-get? player-stats { player: player }) err-player-not-found))
    )
        (asserts! (is-eq contract-caller contract-owner) err-not-authorized)
        (map-set player-stats { player: player } (merge stats { elo: new-elo }))
        (ranked-list-upsert player new-elo)
        (ok true)
    )
)
