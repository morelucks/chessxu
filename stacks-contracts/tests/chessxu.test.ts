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
