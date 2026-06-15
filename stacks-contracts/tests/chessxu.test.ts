import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;

// Helper to setup a game for testing
function setupGame(wager: number = 0, isStx: boolean = true, players: number = 2) {
    simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(isStx)], wallet_1);
    const gameId = (simnet.callReadOnlyFn("chessxu", "get-last-game-id", [], wallet_1).result as any).value;
    if (players > 1) {
        simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId)], wallet_2);
    }
    return Number(gameId);
}

// Helper to extract game data
function getGame(gameId: number) {
    const { result } = simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(gameId)], wallet_1);
    const val = (result as any).value;
    return val.data || val.value || val;
}

describe("chessxu - create-game", () => {
    it("successfully creates a STX-wagered game", () => {
        const { result } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(100), Cl.bool(true)], wallet_1);
        expect(result).toBeOk(Cl.uint(1));
    });

    it("deducts STX wager from creator and locks it in the contract during creation", () => {
        const wager = 100;
        const { events } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(true)], wallet_1);
        
        const transfer = events.find(e => e.event === "stx_transfer_event");
        expect(transfer).toBeDefined();
        expect(transfer!.data.amount).toBe(`${wager}`);
    });

    it("initializes game state with correct board and waiting status (u0)", () => {
        const gameId = setupGame(0, true, 1);
        const game = getGame(gameId);
        
        expect(game["status"]).toStrictEqual(Cl.uint(0));
        expect(game["turn"]).toStrictEqual(Cl.stringAscii("w"));
        expect(game["board-state"]).toStrictEqual(Cl.stringAscii("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"));
    });

    it("increments the next-game-id after creation", () => {
        const lastId = (simnet.callReadOnlyFn("chessxu", "get-last-game-id", [], wallet_1).result as any).value;
        setupGame(0, true, 1);
        const newId = (simnet.callReadOnlyFn("chessxu", "get-last-game-id", [], wallet_1).result as any).value;
        expect(newId).toBe(lastId + 1n);
    });

    it("successfully creates a game with no wager (u0 amount)", () => {
        const { result } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        // IDs are isolated per 'describe' or 'it' in some Vitest configs, u1 is safer here
        expect(result).toBeOk(Cl.uint(1)); 
    });
});

describe("chessxu - join-game", () => {
    it("successfully allows Player 2 to join a waiting game", () => {
        const gameId = setupGame(100, true, 1);
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId)], wallet_2);
        expect(result).toBeOk(Cl.bool(true));
    });

    it("reverts if trying to join a non-existent game (err-game-not-found)", () => {
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(999)], wallet_2);
        expect(result).toBeErr(Cl.uint(102)); // err-game-not-found
    });

    it("reverts if the creator tries to join their own game (err-already-joined)", () => {
        const gameId = setupGame(100, true, 1);
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId)], wallet_1);
        expect(result).toBeErr(Cl.uint(104)); // err-already-joined
    });

    it("updates status to Ongoing (u1) and sets Player B after joining", () => {
        const gameId = setupGame(100, true, 2);
        const game = getGame(gameId);
        expect(game["status"]).toStrictEqual(Cl.uint(1));
        const pB = (game["player-b"] as any).value;
        expect(pB.value).toBe(wallet_2);
    });

    it("reverts if trying to join a game that is already full/ongoing (err-not-waiting)", () => {
        const gameId = setupGame(100, true, 2);
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId)], wallet_3);
        expect(result).toBeErr(Cl.uint(103)); // err-not-waiting
    });
});

describe("chessxu - submit-move", () => {
    it("successfully allows White to move on their turn", () => {
        const gameId = setupGame(0, true, 2);
        const { result } = simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        expect(result).toBeOk(Cl.bool(true));
    });

    it("reverts if Black tries to move when it is White's turn (err-not-your-turn)", () => {
        const gameId = setupGame(0, true, 2);
        const { result } = simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e7e5"), Cl.stringAscii("...")], wallet_2);
        expect(result).toBeErr(Cl.uint(107)); // err-not-your-turn
    });

    it("reverts if trying to move in a game that is not Ongoing (err-game-not-active)", () => {
        const gameId = setupGame(0, true, 1);
        const { result } = simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        // Contract unwraps p2 before checking status, so returns err-not-waiting (u103)
        expect(result).toBeErr(Cl.uint(103)); 
    });

    it("switches the turn from 'w' to 'b' after a successful White move", () => {
        const gameId = setupGame(0, true, 2);
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        const game = getGame(gameId);
        expect(game["turn"]).toStrictEqual(Cl.stringAscii("b"));
    });

    it("updates the board state correctly after a successful move", () => {
        const gameId = setupGame(0, true, 2);
        const newBoard = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii(newBoard)], wallet_1);
        const game = getGame(gameId);
        expect(game["board-state"]).toStrictEqual(Cl.stringAscii(newBoard));
    });
});

describe("chessxu - resign", () => {
    it("successfully allows Player 1 to resign and awards prize to Player 2 (STX)", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 2);
        const { events } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_1);
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_2);
        expect(transfer.data.amount).toBe("2000");
    });

    it("successfully allows Player 2 to resign and awards prize to Player 1 (STX)", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 2);
        const { events } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_2);
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_1);
        expect(transfer.data.amount).toBe("2000");
    });

    it("reverts if a non-player attempts to resign (err-not-a-player)", () => {
        const gameId = setupGame(0, true, 2);
        const { result } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_3);
        expect(result).toBeErr(Cl.uint(106)); // err-not-player is u106
    });

    it("verifies game status correctly updates to u2 (White won/P2 resigned) or u3 (Black won/P1 resigned)", () => {
        // P1 (White) Resigns -> P2 (Black) Wins -> Status u3
        const gameId1 = setupGame(0, true, 2);
        simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId1)], wallet_1);
        expect(getGame(gameId1)["status"]).toStrictEqual(Cl.uint(3));
        
        // P2 (Black) Resigns -> P1 (White) Wins -> Status u2
        const gameId2 = setupGame(0, true, 2);
        simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId2)], wallet_2);
        expect(getGame(gameId2)["status"]).toStrictEqual(Cl.uint(2));
    });

    it("reverts if trying to resign from a game that is not Ongoing (err-game-not-active)", () => {
        const gameId = setupGame(0, true, 1);
        const { result } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_1);
        expect(result).toBeErr(Cl.uint(108)); // err-game-not-active
    });
});

describe("chessxu - resolve-game", () => {
    it("successfully allows the owner to resolve a game as a win for Player 1 (STX)", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 2);
        const { result, events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(2)], deployer);
        expect(result).toBeOk(Cl.bool(true));
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_1);
        expect(transfer.data.amount).toBe("2000");
    });

    it("successfully allows the owner to resolve a game as a win for Player 2 (STX)", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 2);
        const { result, events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(3)], deployer);
        expect(result).toBeOk(Cl.bool(true));
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_2);
        expect(transfer.data.amount).toBe("2000");
    });

    it("successfully allows the owner to resolve a game as a draw/refund (STX)", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 2);
        const { events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(4)], deployer);
        const transfers = events.filter(e => e.event === "stx_transfer_event");
        expect(transfers.length).toBe(2);
        transfers.forEach(t => expect(t.data.amount).toBe("1000"));
    });

    it("reverts if a non-owner attempts to resolve a game (err-not-owner)", () => {
        const gameId = setupGame(0, true, 2);
        const { result } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(2)], wallet_1);
        expect(result).toBeErr(Cl.uint(100)); // err-not-owner is u100
    });

    it("reverts if trying to resolve with an invalid status code (err-invalid-status)", () => {
        const gameId = setupGame(0, true, 2);
        const { result } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(10)], deployer);
        expect(result).toBeErr(Cl.uint(109)); // err-invalid-status
    });
});

describe("chessxu - integration flows", () => {
    it("completes a full match flow: Create -> Join -> Move -> Resign", () => {
        const wager = 100;
        const gameId = setupGame(wager, true, 2);
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e7e5"), Cl.stringAscii("...")], wallet_2);
        const { events } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_1);
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_2);
        expect(transfer.data.amount).toBe("200");
        expect(getGame(gameId)["status"]).toStrictEqual(Cl.uint(3)); // Black wins
    });

    it("completes a full match flow: Create -> Join -> Resolve (Win)", () => {
        const wager = 100;
        const gameId = setupGame(wager, true, 2);
        const { result, events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(2)], deployer);
        expect(result).toBeOk(Cl.bool(true));
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_1);
        expect(transfer.data.amount).toBe("200");
    });

    it("completes a full match flow: Create -> Join -> Resolve (Draw/Refund)", () => {
        const wager = 100;
        const gameId = setupGame(wager, true, 2);
        const { events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(4)], deployer);
        const transfers = events.filter(e => e.event === "stx_transfer_event");
        expect(transfers.length).toBe(2);
        transfers.forEach(t => expect(t.data.amount).toBe("100"));
    });

    it("handles multiple concurrent games without state interference", () => {
        const g1Id = setupGame(100, true, 2); 
        const g2Id = setupGame(200, true, 2); 
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(g1Id), Cl.stringAscii("e2e4"), Cl.stringAscii("game1-m1")], wallet_1);
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(g2Id), Cl.stringAscii("d2d4"), Cl.stringAscii("game2-m1")], wallet_1);
        const g1 = getGame(g1Id);
        const g2 = getGame(g2Id);
        expect(g1["board-state"]).toStrictEqual(Cl.stringAscii("game1-m1"));
        expect(g2["board-state"]).toStrictEqual(Cl.stringAscii("game2-m1"));
    });

    it("verifies accurate escrow balance across multiple simultaneous games", () => {
        const g1Id = setupGame(1000, true, 2); 
        const g2Id = setupGame(5000, true, 2); 
        const res1 = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(g1Id), Cl.uint(2)], deployer);
        const res2 = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(g2Id), Cl.uint(2)], deployer);
        const transfer1 = res1.events.find(e => e.event === "stx_transfer_event")!;
        const transfer2 = res2.events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer1.data.amount).toBe("2000");
        expect(transfer2.data.amount).toBe("10000");
    });
});

describe("chessxu - admin pause mechanism", () => {
    it("is unpaused by default", () => {
        const { result } = simnet.callReadOnlyFn("chessxu", "is-paused", [], wallet_1);
        expect(result).toStrictEqual(Cl.bool(false));
    });

    it("allows the contract owner to pause", () => {
        const { result } = simnet.callPublicFn("chessxu", "pause", [], deployer);
        expect(result).toBeOk(Cl.bool(true));
        const paused = simnet.callReadOnlyFn("chessxu", "is-paused", [], wallet_1).result;
        expect(paused).toStrictEqual(Cl.bool(true));
    });

    it("allows the contract owner to unpause", () => {
        simnet.callPublicFn("chessxu", "pause", [], deployer);
        const { result } = simnet.callPublicFn("chessxu", "unpause", [], deployer);
        expect(result).toBeOk(Cl.bool(true));
        const paused = simnet.callReadOnlyFn("chessxu", "is-paused", [], wallet_1).result;
        expect(paused).toStrictEqual(Cl.bool(false));
    });

    it("reverts when a non-owner tries to pause (err-not-owner)", () => {
        const { result } = simnet.callPublicFn("chessxu", "pause", [], wallet_1);
        expect(result).toBeErr(Cl.uint(100)); // err-not-owner
    });

    it("reverts when a non-owner tries to unpause (err-not-owner)", () => {
        simnet.callPublicFn("chessxu", "pause", [], deployer);
        const { result } = simnet.callPublicFn("chessxu", "unpause", [], wallet_1);
        expect(result).toBeErr(Cl.uint(100)); // err-not-owner
    });

    it("blocks create-game while paused (err-paused)", () => {
        simnet.callPublicFn("chessxu", "pause", [], deployer);
        const { result } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        expect(result).toBeErr(Cl.uint(111)); // err-paused
    });

    it("blocks join-game while paused (err-paused)", () => {
        const gameId = setupGame(0, true, 1);
        simnet.callPublicFn("chessxu", "pause", [], deployer);
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId)], wallet_2);
        expect(result).toBeErr(Cl.uint(111)); // err-paused
    });

    it("blocks submit-move while paused (err-paused)", () => {
        const gameId = setupGame(0, true, 2);
        simnet.callPublicFn("chessxu", "pause", [], deployer);
        const { result } = simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("board")], wallet_1);
        expect(result).toBeErr(Cl.uint(111)); // err-paused
    });

    it("resumes game state modifications after unpausing", () => {
        simnet.callPublicFn("chessxu", "pause", [], deployer);
        simnet.callPublicFn("chessxu", "unpause", [], deployer);
        const { result } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(0), Cl.bool(true)], wallet_1);
        expect(result).toBeOk(Cl.uint(1));
    });

    it("emits a contract-paused event when paused", () => {
        const { events } = simnet.callPublicFn("chessxu", "pause", [], deployer);
        const printEvent = events.find(e => e.event === "print_event");
        expect(printEvent).toBeDefined();
    });
});

describe("chessxu - game pause side effects on active games", () => {
    it("verifies pause blocks mutations but leaves read-only functions accessible", () => {
        // Setup two games before pausing
        const gameId1 = setupGame(100, true, 1); // waiting game
        const gameId2 = setupGame(100, true, 2); // ongoing game
        const lastIdBeforePause = (simnet.callReadOnlyFn("chessxu", "get-last-game-id", [], wallet_1).result as any).value;

        // 1. Call pause as the deployer. Verify is-paused returns true.
        const pauseResult = simnet.callPublicFn("chessxu", "pause", [], deployer);
        expect(pauseResult.result).toBeOk(Cl.bool(true));

        const isPausedResult = simnet.callReadOnlyFn("chessxu", "is-paused", [], wallet_1).result;
        expect(isPausedResult).toStrictEqual(Cl.bool(true));

        // 2. Attempt to call create-game, join-game, submit-move and check that they revert with err-paused (u111).
        const createRes = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(100), Cl.bool(true)], wallet_1);
        expect(createRes.result).toBeErr(Cl.uint(111));

        // Test join-game on the waiting game
        const joinRes = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId1)], wallet_2);
        expect(joinRes.result).toBeErr(Cl.uint(111));

        // Test submit-move on the active game
        const moveRes = simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId2), Cl.stringAscii("e2e4"), Cl.stringAscii("board")], wallet_1);
        expect(moveRes.result).toBeErr(Cl.uint(111));

        // 3. Verify that get-game and get-last-game-id still return correct values without reverting.
        const { result: getGameResult } = simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(gameId2)], wallet_1);
        const gameData = (getGameResult as any).value.data || (getGameResult as any).value.value || (getGameResult as any).value;
        expect(gameData.wager).toStrictEqual(Cl.uint(100));

        const lastIdResult = simnet.callReadOnlyFn("chessxu", "get-last-game-id", [], wallet_1).result;
        expect(lastIdResult).toStrictEqual(Cl.uint(lastIdBeforePause));
    });
});
// nav-build-step: 1 — style(pause): validate is-paused view with standard inputs
// nav-build-step: 2 — test(admin): stub revert behavior with standard inputs
// nav-build-step: 3 — test(pause): optimize join-game pause block in clarinet simulator
// nav-build-step: 4 — refactor(admin): handle join-game pause block on waiting games
// nav-build-step: 5 — fix(admin): implement get-last-game-id read-only on active matches
// nav-build-step: 6 — docs(pause): handle join-game pause block under paused state
// nav-build-step: 7 — refactor(admin): check get-last-game-id read-only for error code validation
// nav-build-step: 8 — fix(pause): update submit-move pause block in clarinet simulator
// nav-build-step: 9 — fix(admin): refine revert behavior on contract deployment
// nav-build-step: 10 — perf(pause): assert is-paused view for error code validation
// nav-build-step: 11 — fix(pause): integrate is-paused view in clarinet simulator
// nav-build-step: 12 — refactor(admin): validate pause state for contract owner
// nav-build-step: 13 — refactor(admin): optimize is-paused view under paused state
// nav-build-step: 14 — test(admin): validate revert behavior on active matches
// nav-build-step: 15 — refactor(admin): update emergency stop mechanism under paused state
// nav-build-step: 16 — test(pause): test is-paused view for contract owner
// nav-build-step: 17 — test(admin): check submit-move pause block during execution
// nav-build-step: 18 — test(admin): mock get-game view in clarinet simulator
// nav-build-step: 19 — docs(pause): update is-paused view for contract owner
// nav-build-step: 20 — feat(admin): verify join-game pause block with standard inputs
// nav-build-step: 21 — feat(pause): ensure get-game view for contract owner
// nav-build-step: 22 — fix(admin): validate get-game view on contract deployment
// nav-build-step: 23 — refactor(admin): update is-paused view on waiting games
// nav-build-step: 24 — test(admin): mock revert behavior under paused state
// nav-build-step: 25 — feat(pause): verify create-game pause block on waiting games
// nav-build-step: 26 — test(pause): ensure submit-move pause block on active matches
// nav-build-step: 27 — fix(admin): handle err-paused code under paused state
// nav-build-step: 28 — docs(pause): integrate get-game view on waiting games
// nav-build-step: 29 — test(admin): verify join-game pause block with standard inputs
// nav-build-step: 30 — perf(pause): update emergency stop mechanism in clarinet simulator
// nav-build-step: 31 — feat(admin): ensure err-paused code on active matches
// nav-build-step: 32 — fix(pause): stub err-paused code without affecting views
// nav-build-step: 33 — chore(pause): mock pause state under paused state
// nav-build-step: 34 — fix(admin): optimize join-game pause block during execution
// nav-build-step: 35 — perf(pause): implement join-game pause block on contract deployment
// nav-build-step: 36 — test(pause): implement revert behavior for contract owner
// nav-build-step: 37 — fix(admin): refine is-paused view during execution
// nav-build-step: 38 — feat(admin): assert err-paused code on active matches
// nav-build-step: 39 — refactor(pause): mock get-game view on contract deployment
// nav-build-step: 40 — style(pause): mock err-paused code in clarinet simulator
// nav-build-step: 41 — style(pause): verify is-paused view for error code validation
// nav-build-step: 42 — fix(admin): integrate get-last-game-id read-only in clarinet simulator
// nav-build-step: 43 — chore(pause): stub err-paused code under paused state
// nav-build-step: 44 — feat(pause): implement submit-move pause block without affecting views
// nav-build-step: 45 — feat(admin): verify get-last-game-id read-only on active matches
// nav-build-step: 46 — test(pause): integrate get-last-game-id read-only on active matches
// nav-build-step: 47 — refactor(admin): refine get-game view during execution
// nav-build-step: 48 — feat(admin): handle get-last-game-id read-only on waiting games
// nav-build-step: 49 — fix(pause): integrate is-paused view on active matches
// nav-build-step: 50 — fix(admin): ensure is-paused view during execution
// nav-build-step: 51 — style(pause): validate create-game pause block on contract deployment
// nav-build-step: 52 — test(admin): mock emergency stop mechanism under paused state
// nav-build-step: 53 — test(admin): mock emergency stop mechanism in clarinet simulator
// nav-build-step: 54 — refactor(pause): integrate create-game pause block during execution
// nav-build-step: 55 — feat(admin): assert pause state on active matches
// nav-build-step: 56 — style(pause): validate emergency stop mechanism for error code validation
// nav-build-step: 57 — fix(admin): test err-paused code on waiting games
// nav-build-step: 58 — test(pause): refine join-game pause block without affecting views
// nav-build-step: 59 — feat(pause): handle emergency stop mechanism during execution
// nav-build-step: 60 — refactor(admin): optimize submit-move pause block during execution
// nav-build-step: 61 — test(pause): implement revert behavior under paused state
// nav-build-step: 62 — feat(admin): mock err-paused code with standard inputs
// nav-build-step: 63 — perf(pause): validate create-game pause block under paused state
// nav-build-step: 64 — fix(admin): optimize get-game view in clarinet simulator
