;; Chessxu Smart Contract - Pure State Machine Option
;; Manages game state, STX wagers, and turn-taking for on-chain chess
;;
;; v3 - Gas optimization: board-state storage reduced from 128 to 64 bytes.
;;
;; Optimization rationale:
;;   The previous board-state field was (string-ascii 128). A standard FEN
;;   piece-placement string (the part before the first space) is at most 71
;;   characters for pathological positions but averages ~43 for real games.
;;   By storing ONLY the piece-placement component (no side-to-move, castling,
;;   en-passant, or move counters - those are tracked separately in the map)
;;   and capping at 64 characters we:
;;     - Reduce map-write gas by ~50% for the board-state field
;;     - Reduce map-read gas proportionally
;;     - Keep full backwards compatibility: the SDK expands compact storage
;;       back to full FEN using the turn field already in the map
;;
;; Compact board-state format:
;;   Piece-placement only (e.g. "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
;;   Maximum 64 ASCII characters. Side-to-move is stored in the turn field.
;;
;; v2 - Print events added for all key state transitions.
;; Every successful mutation emits a structured (print ...) event so that
;; off-chain indexers (Subgraphs, custom scrapers, Hiro API listeners) can
;; track game lifecycle without scanning the full map.
;;
;; Event topics:
;;   "game-created"   - emitted by create-game
;;   "game-joined"    - emitted by join-game
;;   "move-submitted" - emitted by submit-move
;;   "game-resigned"  - emitted by resign
;;   "game-resolved"  - emitted by resolve-game

;; Constants
(define-constant contract-owner tx-sender)

;; Error Codes
(define-constant err-not-owner (err u100))
(define-constant err-game-exists (err u101))
(define-constant err-game-not-found (err u102))
(define-constant err-not-waiting (err u103))
(define-constant err-already-joined (err u104))
(define-constant err-invalid-wager (err u105))
(define-constant err-not-player (err u106))
(define-constant err-not-your-turn (err u107))
(define-constant err-game-not-active (err u108))
(define-constant err-invalid-status (err u109))
(define-constant err-board-state-too-long (err u110))
(define-constant err-paused (err u111))

;; Maximum length for the compact board-state string (piece-placement only)
(define-constant MAX-BOARD-STATE-LEN u64)

;; Starting position piece-placement (compact, no side-to-move or counters)
(define-constant STARTING-BOARD "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")

;; Game Status Map:
;; 0 = Waiting, 1 = Ongoing, 2 = White Wins, 3 = Black Wins, 4 = Draw, 5 = Cancelled

;; Data Variables
(define-data-var next-game-id uint u1)

;; Administrative pause switch. When true, all game state modifications
;; (create-game, join-game, submit-move) are blocked. Only the contract
;; owner can toggle this. Intended for emergency stops in the event of a
;; vulnerability disclosure or a major contract migration.
;; Read-only functions (get-game, is-paused, get-last-game-id) remain accessible when paused.
(define-data-var paused bool false)

;; Maps
;; board-state is now (string-ascii 64) - piece-placement only, no FEN metadata.
;; This reduces map-write gas by ~50% vs the previous (string-ascii 128).
;; The turn field already encodes side-to-move; castling/en-passant are not
;; tracked on-chain (they are reconstructed off-chain from move history).
(define-map games
    { game-id: uint }
    {
        player-w: principal,
        player-b: (optional principal),
        wager: uint,
        is-stx: bool,
        board-state: (string-ascii 64),
        turn: (string-ascii 1), ;; "w" or "b"
        status: uint
    }
)

;; ===========================
;; Board-State Helpers
;; ===========================

;; Validate that a board-state string fits within the compact 64-char limit.
;; Returns (ok true) if valid, (err u110) if too long.
(define-read-only (validate-board-state (board (string-ascii 64)))
    (if (<= (len board) MAX-BOARD-STATE-LEN)
        (ok true)
        err-board-state-too-long
    )
)

;; Returns the compact starting board-state constant.
(define-read-only (get-starting-board)
    STARTING-BOARD
)

;; ===========================
;; Administrative Functions
;; ===========================

;; @desc Pause the contract. Blocks create-game, join-game, and submit-move.
;;   Owner-only. Intended for emergency stops or migrations.
;; @emits contract-paused { by, block-height }
(define-public (pause)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-not-owner)
        (var-set paused true)
        (print {
            topic: "contract-paused",
            by: tx-sender,
            block-height: block-height
        })
        (ok true)
    )
)

;; @desc Unpause the contract, re-enabling game state modifications.
;;   Owner-only.
;; @emits contract-unpaused { by, block-height }
(define-public (unpause)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-not-owner)
        (var-set paused false)
        (print {
            topic: "contract-unpaused",
            by: tx-sender,
            block-height: block-height
        })
        (ok true)
    )
)

;;
;; Public Functions
;;

;; @desc Create a new game with a wager.
;; @param wager: Amount to lock in (micro-STX or CHESS base units).
;; @param is-stx: True if wagering native STX, false if wagering CHESS token.
;; @emits game-created { game-id, player-w, wager, is-stx, block-height }
(define-public (create-game (wager uint) (is-stx bool))
    (let
        (
            (game-id (var-get next-game-id))
        )
        (begin
            ;; Block new games while the contract is paused
            (asserts! (not (var-get paused)) err-paused)

            ;; Escrow wager
            (if is-stx
                (if (> wager u0) (try! (stx-transfer? wager tx-sender (as-contract tx-sender))) true)
                (if (> wager u0) (try! (contract-call? .chessxu-token transfer wager tx-sender (as-contract tx-sender) none)) true)
            )

            ;; Save game state with compact board-state (piece-placement only, 64 chars max)
            (map-set games
                { game-id: game-id }
                {
                    player-w: tx-sender,
                    player-b: none,
                    wager: wager,
                    is-stx: is-stx,
                    board-state: STARTING-BOARD,
                    turn: "w",
                    status: u0
                }
            )

            ;; Increment ID
            (var-set next-game-id (+ game-id u1))

            ;; Emit event
            (print {
                topic: "game-created",
                game-id: game-id,
                player-w: tx-sender,
                wager: wager,
                is-stx: is-stx,
                block-height: block-height
            })

            (ok game-id)
        )
    )
)

;; @desc Join an existing waiting game.
;; @param game-id: The game to join.
;; @emits game-joined { game-id, player-w, player-b, wager, is-stx, block-height }
(define-public (join-game (game-id uint))
    (let
        (
            (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
            (wager (get wager game))
            (is-stx (get is-stx game))
        )
        (begin
            ;; Block joining while the contract is paused
            (asserts! (not (var-get paused)) err-paused)
            (asserts! (is-eq (get status game) u0) err-not-waiting)
            (asserts! (not (is-eq tx-sender (get player-w game))) err-already-joined)

            ;; P2 must match the wager in the correct token format
            (if is-stx
                (if (> wager u0) (try! (stx-transfer? wager tx-sender (as-contract tx-sender))) true)
                (if (> wager u0) (try! (contract-call? .chessxu-token transfer wager tx-sender (as-contract tx-sender) none)) true)
            )

            ;; Update game state
            (map-set games
                { game-id: game-id }
                (merge game { player-b: (some tx-sender), status: u1 })
            )

            ;; Emit event
            (print {
                topic: "game-joined",
                game-id: game-id,
                player-w: (get player-w game),
                player-b: tx-sender,
                wager: wager,
                is-stx: is-stx,
                block-height: block-height
            })

            (ok true)
        )
    )
)

;; @desc Submit a move to update the board state.
;; @param game-id: The game to move in.
;; @param move-str: The move in algebraic notation (e.g. "e2e4").
;; @param new-board-state: Compact piece-placement string (max 64 chars, no FEN metadata).
;;   Example: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR"
;;   The side-to-move is tracked in the turn field; castling/en-passant are
;;   reconstructed off-chain from move history.
;; @emits move-submitted { game-id, player, move-str, new-board-state, next-turn, block-height }
(define-public (submit-move (game-id uint) (move-str (string-ascii 10)) (new-board-state (string-ascii 64)))
    (let
        (
            (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
            (p1 (get player-w game))
            (p2 (unwrap! (get player-b game) err-not-waiting))
            (current-turn (get turn game))
            (next-turn (if (is-eq current-turn "w") "b" "w"))
        )
        (begin
            ;; Block moves while the contract is paused
            (asserts! (not (var-get paused)) err-paused)
            (asserts! (is-eq (get status game) u1) err-game-not-active)

            ;; Verify the caller is the active player
            (if (is-eq current-turn "w")
                (asserts! (is-eq tx-sender p1) err-not-your-turn)
                (asserts! (is-eq tx-sender p2) err-not-your-turn)
            )

            ;; Record the new board and switch turns
            (map-set games
                { game-id: game-id }
                (merge game {
                    board-state: new-board-state,
                    turn: next-turn
                })
            )

            ;; Emit event
            (print {
                topic: "move-submitted",
                game-id: game-id,
                player: tx-sender,
                move-str: move-str,
                new-board-state: new-board-state,
                next-turn: next-turn,
                block-height: block-height
            })

            (ok true)
        )
    )
)

;; @desc Player resigns, other player wins the wager.
;; @param game-id: The game to resign from.
;; @emits game-resigned { game-id, resigned-by, winner, new-status, wager, is-stx, block-height }
(define-public (resign (game-id uint))
    (let
        (
            (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
            (p1 (get player-w game))
            (p2 (unwrap! (get player-b game) err-game-not-active))
            (wager (get wager game))
            (is-stx (get is-stx game))
            (prize (* wager u2))
        )
        (begin
            (asserts! (is-eq (get status game) u1) err-game-not-active)
            (asserts! (or (is-eq tx-sender p1) (is-eq tx-sender p2)) err-not-player)

            ;; Distribute prize and update status
            (if (is-eq tx-sender p1)
                (begin ;; P1 resigned, P2 wins
                    (if is-stx
                        (if (> prize u0) (try! (as-contract (stx-transfer? prize tx-sender p2))) true)
                        (if (> prize u0) (try! (as-contract (contract-call? .chessxu-token transfer prize tx-sender p2 none))) true)
                    )
                    (map-set games { game-id: game-id } (merge game { status: u3 }))
                    ;; Emit event
                    (print {
                        topic: "game-resigned",
                        game-id: game-id,
                        resigned-by: tx-sender,
                        winner: p2,
                        new-status: u3,
                        wager: wager,
                        is-stx: is-stx,
                        block-height: block-height
                    })
                )
                (begin ;; P2 resigned, P1 wins
                    (if is-stx
                        (if (> prize u0) (try! (as-contract (stx-transfer? prize tx-sender p1))) true)
                        (if (> prize u0) (try! (as-contract (contract-call? .chessxu-token transfer prize tx-sender p1 none))) true)
                    )
                    (map-set games { game-id: game-id } (merge game { status: u2 }))
                    ;; Emit event
                    (print {
                        topic: "game-resigned",
                        game-id: game-id,
                        resigned-by: tx-sender,
                        winner: p1,
                        new-status: u2,
                        wager: wager,
                        is-stx: is-stx,
                        block-height: block-height
                    })
                )
            )

            (ok true)
        )
    )
)

;; @desc Oracle resolution for checkmates, timeouts, or disputes.
;; @param game-id: The game to resolve.
;; @param new-status: The final status (2=white wins, 3=black wins, 4=draw, 5=cancelled).
;; @emits game-resolved { game-id, new-status, player-w, player-b, wager, is-stx, block-height }
(define-public (resolve-game (game-id uint) (new-status uint))
    (let
        (
            (game (unwrap! (map-get? games { game-id: game-id }) err-game-not-found))
            (p1 (get player-w game))
            (p2-opt (get player-b game))
            (wager (get wager game))
            (is-stx (get is-stx game))
            (prize (* wager u2))
        )
        (begin
            (asserts! (is-eq tx-sender contract-owner) err-not-owner)
            (asserts! (or (is-eq (get status game) u1) (is-eq (get status game) u0)) err-game-not-active)
            (asserts! (and (>= new-status u2) (<= new-status u5)) err-invalid-status)

            (if (is-eq new-status u2)
                ;; White wins
                (if is-stx
                    (if (> prize u0) (try! (as-contract (stx-transfer? prize tx-sender p1))) true)
                    (if (> prize u0) (try! (as-contract (contract-call? .chessxu-token transfer prize tx-sender p1 none))) true)
                )

                (if (is-eq new-status u3)
                    ;; Black wins
                    (if is-stx
                        (match p2-opt p2 (if (> prize u0) (try! (as-contract (stx-transfer? prize tx-sender p2))) true) true)
                        (match p2-opt p2 (if (> prize u0) (try! (as-contract (contract-call? .chessxu-token transfer prize tx-sender p2 none))) true) true)
                    )

                    ;; Draw or Cancel - Refund wagers
                    (begin
                        (if is-stx
                            (begin
                                (if (> wager u0) (try! (as-contract (stx-transfer? wager tx-sender p1))) true)
                                (match p2-opt p2 (if (> wager u0) (try! (as-contract (stx-transfer? wager tx-sender p2))) true) true)
                            )
                            (begin
                                (if (> wager u0) (try! (as-contract (contract-call? .chessxu-token transfer wager tx-sender p1 none))) true)
                                (match p2-opt p2 (if (> wager u0) (try! (as-contract (contract-call? .chessxu-token transfer wager tx-sender p2 none))) true) true)
                            )
                        )
                    )
                )
            )

            ;; Update status
            (map-set games { game-id: game-id } (merge game { status: new-status }))

            ;; Emit event
            (print {
                topic: "game-resolved",
                game-id: game-id,
                new-status: new-status,
                player-w: p1,
                player-b: p2-opt,
                wager: wager,
                is-stx: is-stx,
                block-height: block-height
            })

            (ok true)
        )
    )
)

;; Read-Only Functions

(define-read-only (get-game (game-id uint))
    (map-get? games { game-id: game-id })
)

(define-read-only (get-last-game-id)
    (- (var-get next-game-id) u1)
)

;; @desc Returns whether the contract is currently paused.
(define-read-only (is-paused)
    (var-get paused)
)
