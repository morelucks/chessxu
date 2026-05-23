import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

// scaffold: stacks integration test suite initialized

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

// Helper to mint CHESS tokens
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

    // test: white resigns black wins full lifecycle
    // test: black resigns white wins full lifecycle
    // test: owner resolves white wins
    // test: owner resolves black wins
    // test: owner resolves draw refunds both
    // test: token game white resigns black gets tokens
    // test: token game draw refunds both
    // test: contract holds zero tokens after resolution
    // test: two concurrent games are independent
    // test: resolving game1 does not affect game2
    // test: moves in game1 do not affect game2 board
    // test: five sequential games have correct IDs
    // test: cancel waiting game refunds creator
    // test: zero-wager resign completes cleanly
    // test: cannot submit move after resolution
    // test: cannot resign after resolution
    // test: multi-move board state integrity
    // test: e2e game with moves and owner resolution
});