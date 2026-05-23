import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

// scaffold: stacks integration test suite initialized

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;

/**
 * Sets up a new chess game by calling the contract public functions.
 * Optionally joins the game with a second player and sets a custom wager amount.
 * 
 * @param wager The amount of STX or CHESS tokens to wager.
 * @param isStx True if STX is used, false for CHESS tokens.
 * @param players The number of players to join (1 for creator only, 2 to automatically join p2).
 * @returns The newly created game's ID.
 */
function setupGame(wager: number = 0, isStx: boolean = true, players: number = 2) {
    simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(isStx)], wallet_1);
    const gameId = (simnet.callReadOnlyFn("chessxu", "get-last-game-id", [], wallet_1).result as any).value;
    if (players > 1) {
        simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId)], wallet_2);
    }
    return Number(gameId);
}

/**
 * Retrieves the state of a game from the contract readonly map.
 * Extracts and returns the parsed tuple values.
 * 
 * @param gameId The ID of the game to retrieve.
 * @returns The parsed game object containing turn, status, players, board state, etc.
 */
function getGame(gameId: number) {
    const { result } = simnet.callReadOnlyFn("chessxu", "get-game", [Cl.uint(gameId)], wallet_1);
    const val = (result as any).value;
    return val.data || val.value || val;
}

/**
 * Mints CHESS tokens to a specified recipient principal.
 * Uses the contract deployer authority.
 * 
 * @param amount The number of tokens to mint.
 * @param recipient The principal address of the receiver.
 * @returns The contract call response object.
 */
function mintTokens(amount: number, recipient: string) {
    return simnet.callPublicFn("chessxu-token", "mint", [Cl.uint(amount), Cl.standardPrincipal(recipient)], deployer);
}

describe("chessxu - integration tests", () => {
    it("should initialize the test suite", () => {
        expect(true).toBe(true);
    });

    // test: lifecycle helpers added

    it("verifies white resigns black wins full lifecycle (STX)", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 2);
        
        const ongoingGame = getGame(gameId);
        expect(ongoingGame["status"]).toStrictEqual(Cl.uint(1)); // Ongoing
        
        const { events } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_1);
        
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_2);
        expect(transfer.data.amount).toBe("2000");
        
        const endedGame = getGame(gameId);
        expect(endedGame["status"]).toStrictEqual(Cl.uint(3)); // Black Wins
    });

    it("verifies black resigns white wins full lifecycle (STX)", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 2);
        
        const ongoingGame = getGame(gameId);
        expect(ongoingGame["status"]).toStrictEqual(Cl.uint(1)); // Ongoing
        
        const { events } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_2);
        
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_1);
        expect(transfer.data.amount).toBe("2000");
        
        const endedGame = getGame(gameId);
        expect(endedGame["status"]).toStrictEqual(Cl.uint(2)); // White Wins
    });

    it("verifies owner resolves white wins", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 2);
        
        const { result, events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(2)], deployer);
        expect(result).toBeOk(Cl.bool(true));
        
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_1);
        expect(transfer.data.amount).toBe("2000");
        
        const endedGame = getGame(gameId);
        expect(endedGame["status"]).toStrictEqual(Cl.uint(2));
    });

    it("verifies owner resolves black wins", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 2);
        
        const { result, events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(3)], deployer);
        expect(result).toBeOk(Cl.bool(true));
        
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_2);
        expect(transfer.data.amount).toBe("2000");
        
        const endedGame = getGame(gameId);
        expect(endedGame["status"]).toStrictEqual(Cl.uint(3));
    });

    it("verifies owner resolves draw refunds both", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 2);
        
        const { result, events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(4)], deployer);
        expect(result).toBeOk(Cl.bool(true));
        
        const transfers = events.filter(e => e.event === "stx_transfer_event");
        expect(transfers.length).toBe(2);
        
        const transferP1 = transfers.find(t => t.data.recipient === wallet_1)!;
        const transferP2 = transfers.find(t => t.data.recipient === wallet_2)!;
        
        expect(transferP1.data.amount).toBe("1000");
        expect(transferP2.data.amount).toBe("1000");
        
        const endedGame = getGame(gameId);
        expect(endedGame["status"]).toStrictEqual(Cl.uint(4));
    });

    it("verifies token game white resigns black gets tokens", () => {
        const wager = 1000;
        
        mintTokens(wager, wallet_1);
        mintTokens(wager, wallet_2);
        
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(false)], wallet_1);
        const gameId = (simnet.callReadOnlyFn("chessxu", "get-last-game-id", [], wallet_1).result as any).value;
        simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId)], wallet_2);
        
        const { events } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_1);
        
        const transfer = events.find(e => e.event === "ft_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_2);
        expect(transfer.data.amount).toBe("2000");
        
        const endedGame = getGame(Number(gameId));
        expect(endedGame["status"]).toStrictEqual(Cl.uint(3)); // Black Wins
    });

    it("verifies token game draw refunds both", () => {
        const wager = 1000;
        
        mintTokens(wager, wallet_1);
        mintTokens(wager, wallet_2);
        
        simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(false)], wallet_1);
        const gameId = (simnet.callReadOnlyFn("chessxu", "get-last-game-id", [], wallet_1).result as any).value;
        simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId)], wallet_2);
        
        const { events } = simnet.callPublicFn("chessxu-token", "get-balance", [Cl.standardPrincipal(wallet_1)], wallet_1); // Wait, let's just resolve game
        const { events: resolveEvents } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(4)], deployer);
        
        const transfers = resolveEvents.filter(e => e.event === "ft_transfer_event");
        expect(transfers.length).toBe(2);
        
        const transferP1 = transfers.find(t => t.data.recipient === wallet_1)!;
        const transferP2 = transfers.find(t => t.data.recipient === wallet_2)!;
        
        expect(transferP1.data.amount).toBe("1000");
        expect(transferP2.data.amount).toBe("1000");
        
        const endedGame = getGame(Number(gameId));
        expect(endedGame["status"]).toStrictEqual(Cl.uint(4)); // Draw
    });

    it("verifies contract holds zero tokens after resolution", () => {
        const wager = 1000;
        
        mintTokens(wager, wallet_1);
        mintTokens(wager, wallet_2);
        
        const { result: createRes } = simnet.callPublicFn("chessxu", "create-game", [Cl.uint(wager), Cl.bool(false)], wallet_1);
        const gameIdNum = Number((createRes as any).value);
        simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameIdNum)], wallet_2);
        
        const contractPrincipal = `${deployer}.chessxu`;
        const { result: balBefore } = simnet.callReadOnlyFn("chessxu-token", "get-balance", [Cl.standardPrincipal(contractPrincipal)], wallet_1);
        expect((balBefore as any).value.value).toBe(2000n);
        
        simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameIdNum)], wallet_1);
        
        const { result: balAfter } = simnet.callReadOnlyFn("chessxu-token", "get-balance", [Cl.standardPrincipal(contractPrincipal)], wallet_1);
        expect((balAfter as any).value.value).toBe(0n);
    });

    it("verifies two concurrent games are independent", () => {
        const g1Id = setupGame(100, true, 2);
        const g2Id = setupGame(200, true, 2);
        
        expect(g1Id).not.toBe(g2Id);
        
        const g1 = getGame(g1Id);
        const g2 = getGame(g2Id);
        
        expect(g1["wager"]).toStrictEqual(Cl.uint(100));
        expect(g2["wager"]).toStrictEqual(Cl.uint(200));
        
        expect(g1["status"]).toStrictEqual(Cl.uint(1)); // Ongoing
        expect(g2["status"]).toStrictEqual(Cl.uint(1)); // Ongoing
    });

    it("verifies resolving game1 does not affect game2", () => {
        const g1Id = setupGame(100, true, 2);
        const g2Id = setupGame(200, true, 2);
        
        simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(g1Id), Cl.uint(2)], deployer);
        
        const g1 = getGame(g1Id);
        const g2 = getGame(g2Id);
        
        expect(g1["status"]).toStrictEqual(Cl.uint(2));
        expect(g2["status"]).toStrictEqual(Cl.uint(1));
    });

    it("verifies moves in game1 do not affect game2 board", () => {
        const g1Id = setupGame(0, true, 2);
        const g2Id = setupGame(0, true, 2);
        
        const m1Board = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(g1Id), Cl.stringAscii("e2e4"), Cl.stringAscii(m1Board)], wallet_1);
        
        const g1 = getGame(g1Id);
        const g2 = getGame(g2Id);
        
        expect(g1["board-state"]).toStrictEqual(Cl.stringAscii(m1Board));
        expect(g2["board-state"]).toStrictEqual(Cl.stringAscii("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"));
    });

    it("verifies five sequential games have correct IDs", () => {
        const id1 = setupGame(0, true, 1);
        const id2 = setupGame(0, true, 1);
        const id3 = setupGame(0, true, 1);
        const id4 = setupGame(0, true, 1);
        const id5 = setupGame(0, true, 1);
        
        expect(id2).toBe(id1 + 1);
        expect(id3).toBe(id2 + 1);
        expect(id4).toBe(id3 + 1);
        expect(id5).toBe(id4 + 1);
    });

    it("verifies cancel waiting game refunds creator", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 1);
        
        const waitingGame = getGame(gameId);
        expect(waitingGame["status"]).toStrictEqual(Cl.uint(0));
        
        const { result, events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(5)], deployer);
        expect(result).toBeOk(Cl.bool(true));
        
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_1);
        expect(transfer.data.amount).toBe("1000");
        
        const endedGame = getGame(gameId);
        expect(endedGame["status"]).toStrictEqual(Cl.uint(5));
    });

    it("verifies zero-wager resign completes cleanly", () => {
        const gameId = setupGame(0, true, 2);
        
        const ongoingGame = getGame(gameId);
        expect(ongoingGame["status"]).toStrictEqual(Cl.uint(1));
        
        const { result, events } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_1);
        expect(result).toBeOk(Cl.bool(true));
        
        const transfers = events.filter(e => e.event === "stx_transfer_event");
        expect(transfers.length).toBe(0);
        
        const endedGame = getGame(gameId);
        expect(endedGame["status"]).toStrictEqual(Cl.uint(3)); // Black Wins
    });

    it("verifies cannot submit move after resolution", () => {
        const gameId = setupGame(0, true, 2);
        
        simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_1);
        
        const { result } = simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        expect(result).toBeErr(Cl.uint(108)); // err-game-not-active
    });

    it("verifies cannot resign after resolution", () => {
        const gameId = setupGame(0, true, 2);
        
        simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_1);
        
        const { result } = simnet.callPublicFn("chessxu", "resign", [Cl.uint(gameId)], wallet_1);
        expect(result).toBeErr(Cl.uint(108)); // err-game-not-active
    });

    it("verifies multi-move board state integrity", () => {
        const gameId = setupGame(0, true, 2);
        
        const b1 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
        const b2 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR";
        const b3 = "rnbqkbnr/pppp1ppp/8/4p3/3QP3/8/PPP2PPP/RNB1KBNR";
        const b4 = "rnb1kbnr/pppp1ppp/8/4p3/3QP3/2N5/PPP2PPP/R1B1KBNR";
        
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii(b1)], wallet_1);
        expect(getGame(gameId)["turn"]).toStrictEqual(Cl.stringAscii("b"));
        expect(getGame(gameId)["board-state"]).toStrictEqual(Cl.stringAscii(b1));
        
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e7e5"), Cl.stringAscii(b2)], wallet_2);
        expect(getGame(gameId)["turn"]).toStrictEqual(Cl.stringAscii("w"));
        expect(getGame(gameId)["board-state"]).toStrictEqual(Cl.stringAscii(b2));
        
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("d2d4"), Cl.stringAscii(b3)], wallet_1);
        expect(getGame(gameId)["turn"]).toStrictEqual(Cl.stringAscii("b"));
        expect(getGame(gameId)["board-state"]).toStrictEqual(Cl.stringAscii(b3));
        
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("b8c6"), Cl.stringAscii(b4)], wallet_2);
        expect(getGame(gameId)["turn"]).toStrictEqual(Cl.stringAscii("w"));
        expect(getGame(gameId)["board-state"]).toStrictEqual(Cl.stringAscii(b4));
    });

    it("verifies e2e game with moves and owner resolution", () => {
        const wager = 1000;
        const gameId = setupGame(wager, true, 2);
        
        const b1 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
        simnet.callPublicFn("chessxu", "submit-move", [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii(b1)], wallet_1);
        
        const { result, events } = simnet.callPublicFn("chessxu", "resolve-game", [Cl.uint(gameId), Cl.uint(2)], deployer);
        expect(result).toBeOk(Cl.bool(true));
        
        const transfer = events.find(e => e.event === "stx_transfer_event")!;
        expect(transfer.data.recipient).toBe(wallet_1);
        expect(transfer.data.amount).toBe("2000");
        
        const endedGame = getGame(gameId);
        expect(endedGame["status"]).toStrictEqual(Cl.uint(2));
    });

    it("verifies single-player creation state", () => {
        const wager = 1500;
        const gameId = setupGame(wager, true, 1);
        
        const game = getGame(gameId);
        expect(game["status"]).toStrictEqual(Cl.uint(0));
        expect(game["player1"]).toStrictEqual(wallet_1);
        expect(game["player2"]).toStrictEqual(Cl.none());
        expect(game["wager"]).toStrictEqual(Cl.uint(wager));
        expect(game["board-state"]).toStrictEqual(Cl.stringAscii("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"));
    });

    it("verifies player-2 joining transitions status to active", () => {
        const gameId = setupGame(0, true, 1);
        
        let game = getGame(gameId);
        expect(game["status"]).toStrictEqual(Cl.uint(0));
        
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId)], wallet_2);
        expect(result).toBeOk(Cl.bool(true));
        
        game = getGame(gameId);
        expect(game["status"]).toStrictEqual(Cl.uint(1));
        expect(game["player2"]).toStrictEqual(Cl.some(wallet_2));
    });

    it("verifies cannot join full game", () => {
        const gameId = setupGame(0, true, 2);
        
        const { result } = simnet.callPublicFn("chessxu", "join-game", [Cl.uint(gameId)], wallet_3);
        expect(result).toBeErr(Cl.uint(106)); // err-game-already-full
    });
});