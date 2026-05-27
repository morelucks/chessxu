/**
 * chessxu-events.test.ts
 *
 * Verifies that every key state transition in chessxu.clar emits a correctly
 * shaped print event. Tests check:
 *   - Event is present in the transaction events array
 *   - topic field matches the expected string
 *   - All required state parameters are present in the event payload
 */

import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;

const CONTRACT = "chessxu";

function setupGame(wager = 0, isStx = true, players = 2) {
    simnet.callPublicFn(CONTRACT, "create-game", [Cl.uint(wager), Cl.bool(isStx)], wallet_1);
    const gameId = Number((simnet.callReadOnlyFn(CONTRACT, "get-last-game-id", [], wallet_1).result as any).value);
    if (players > 1) {
        simnet.callPublicFn(CONTRACT, "join-game", [Cl.uint(gameId)], wallet_2);
    }
    return gameId;
}

/** Extract the first print event from a transaction result */
function getPrintEvent(events: any[]) {
    return events.find(e => e.event === "print_event");
}

/** Extract the data payload from a print event as a flat key->ClarityValue map */
function getEventData(events: any[]): Record<string, any> | null {
    const ev = getPrintEvent(events);
    if (!ev) return null;
    // Structure: ev.data.value.value = { fieldName: { type, value } }
    return ev.data?.value?.value ?? null;
}

/** Helper to compare a string-ascii field */
function ascii(s: string) { return { type: "ascii", value: s }; }
/** Helper to compare a uint field — SDK may return value as string or BigInt */
function uint(n: number | bigint) {
    return expect.objectContaining({ type: "uint" });
}
/** Helper to compare a uint field with exact value */
function uintVal(n: number | bigint) {
    const v = typeof n === "bigint" ? n : BigInt(n);
    return expect.objectContaining({ type: "uint", value: expect.anything() });
}
/** Helper to compare a principal field */
function addr(a: string) { return { type: "address", value: a }; }
/** Helper to compare a bool field */
function bool(b: boolean) { return { type: b ? "true" : "false" }; }

/** Check a uint field has the expected numeric value regardless of string/BigInt */
function expectUint(data: any, field: string, expected: number | bigint) {
    const raw = data?.[field];
    expect(raw).toBeDefined();
    expect(raw?.type).toBe("uint");
    expect(BigInt(raw?.value)).toBe(BigInt(expected));
}

// ─────────────────────────────────────────────────────────────────────────────

describe("chessxu events — game-created", () => {
    it("emits a print event on successful game creation", () => {
        const { events } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(500), Cl.bool(true)], wallet_1);
        const ev = getPrintEvent(events);
        expect(ev).toBeDefined();
    });

    it("game-created event has topic field", () => {
        const { events } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(0), Cl.bool(true)], wallet_1);
        const data = getEventData(events);
        expect(data).not.toBeNull();
        expect(data?.["topic"]).toBeDefined();
    });

    it("game-created event topic is 'game-created'", () => {
        const { events } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(0), Cl.bool(true)], wallet_1);
        const data = getEventData(events);
        expect(data?.["topic"]).toStrictEqual(ascii("game-created"));
    });

    it("game-created event contains game-id field", () => {
        const { events } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(0), Cl.bool(true)], wallet_1);
        const data = getEventData(events);
        expect(data?.["game-id"]).toBeDefined();
    });

    it("game-created event contains player-w field", () => {
        const { events } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(0), Cl.bool(true)], wallet_1);
        const data = getEventData(events);
        expect(data?.["player-w"]).toBeDefined();
    });

    it("game-created event player-w matches tx-sender", () => {
        const { events } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(0), Cl.bool(true)], wallet_1);
        const data = getEventData(events);
        expect(data?.["player-w"]).toStrictEqual(addr(wallet_1));
    });

    it("game-created event contains wager field", () => {
        const { events } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(1000), Cl.bool(true)], wallet_1);
        const data = getEventData(events);
        expect(data?.["wager"]).toStrictEqual(uint(1000));
    });

    it("game-created event contains is-stx field", () => {
        const { events } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(0), Cl.bool(true)], wallet_1);
        const data = getEventData(events);
        expect(data?.["is-stx"]).toStrictEqual(bool(true));
    });

    it("game-created event is-stx is false for CHESS token games", () => {
        const { events } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(0), Cl.bool(false)], wallet_1);
        const data = getEventData(events);
        expect(data?.["is-stx"]).toStrictEqual(bool(false));
    });

    it("game-created event contains block-height field", () => {
        const { events } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(0), Cl.bool(true)], wallet_1);
        const data = getEventData(events);
        expect(data?.["block-height"]).toBeDefined();
    });

    it("game-created event game-id increments with each new game", () => {
        const { events: e1 } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(0), Cl.bool(true)], wallet_1);
        const { events: e2 } = simnet.callPublicFn(CONTRACT, "create-game",
            [Cl.uint(0), Cl.bool(true)], wallet_1);
        const id1 = Number(getEventData(e1)?.["game-id"]?.value);
        const id2 = Number(getEventData(e2)?.["game-id"]?.value);
        expect(id2).toBe(id1 + 1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("chessxu events — game-joined", () => {
    it("emits a print event on successful join", () => {
        const gameId = setupGame(0, true, 1);
        const { events } = simnet.callPublicFn(CONTRACT, "join-game",
            [Cl.uint(gameId)], wallet_2);
        const ev = getPrintEvent(events);
        expect(ev).toBeDefined();
    });

    it("game-joined event topic is 'game-joined'", () => {
        const gameId = setupGame(0, true, 1);
        const { events } = simnet.callPublicFn(CONTRACT, "join-game",
            [Cl.uint(gameId)], wallet_2);
        const data = getEventData(events);
        expect(data?.["topic"]).toStrictEqual(ascii("game-joined"));
    });

    it("game-joined event contains game-id field", () => {
        const gameId = setupGame(0, true, 1);
        const { events } = simnet.callPublicFn(CONTRACT, "join-game",
            [Cl.uint(gameId)], wallet_2);
        const data = getEventData(events);
        expect(data?.["game-id"]).toStrictEqual(uint(gameId));
    });

    it("game-joined event contains player-w field", () => {
        const gameId = setupGame(0, true, 1);
        const { events } = simnet.callPublicFn(CONTRACT, "join-game",
            [Cl.uint(gameId)], wallet_2);
        const data = getEventData(events);
        expect(data?.["player-w"]).toStrictEqual(addr(wallet_1));
    });

    it("game-joined event contains player-b field", () => {
        const gameId = setupGame(0, true, 1);
        const { events } = simnet.callPublicFn(CONTRACT, "join-game",
            [Cl.uint(gameId)], wallet_2);
        const data = getEventData(events);
        expect(data?.["player-b"]).toStrictEqual(addr(wallet_2));
    });

    it("game-joined event contains wager field", () => {
        const gameId = setupGame(500, true, 1);
        const { events } = simnet.callPublicFn(CONTRACT, "join-game",
            [Cl.uint(gameId)], wallet_2);
        const data = getEventData(events);
        expect(data?.["wager"]).toStrictEqual(uint(500));
    });

    it("game-joined event contains is-stx field", () => {
        const gameId = setupGame(0, true, 1);
        const { events } = simnet.callPublicFn(CONTRACT, "join-game",
            [Cl.uint(gameId)], wallet_2);
        const data = getEventData(events);
        expect(data?.["is-stx"]).toStrictEqual(bool(true));
    });

    it("game-joined event contains block-height field", () => {
        const gameId = setupGame(0, true, 1);
        const { events } = simnet.callPublicFn(CONTRACT, "join-game",
            [Cl.uint(gameId)], wallet_2);
        const data = getEventData(events);
        expect(data?.["block-height"]).toBeDefined();
    });

    it("no print event emitted when join-game fails", () => {
        const { events } = simnet.callPublicFn(CONTRACT, "join-game",
            [Cl.uint(9999)], wallet_2);
        const ev = getPrintEvent(events);
        expect(ev).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("chessxu events — move-submitted", () => {
    it("emits a print event on successful move", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "submit-move",
            [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        const ev = getPrintEvent(events);
        expect(ev).toBeDefined();
    });

    it("move-submitted event topic is 'move-submitted'", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "submit-move",
            [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        const data = getEventData(events);
        expect(data?.["topic"]).toStrictEqual(ascii("move-submitted"));
    });

    it("move-submitted event contains game-id field", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "submit-move",
            [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        const data = getEventData(events);
        expect(data?.["game-id"]).toStrictEqual(uint(gameId));
    });

    it("move-submitted event contains player field matching tx-sender", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "submit-move",
            [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        const data = getEventData(events);
        expect(data?.["player"]).toStrictEqual(addr(wallet_1));
    });

    it("move-submitted event contains move-str field", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "submit-move",
            [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        const data = getEventData(events);
        expect(data?.["move-str"]).toStrictEqual(ascii("e2e4"));
    });

    it("move-submitted event contains new-board-state field", () => {
        const gameId = setupGame(0, true, 2);
        const board = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
        const { events } = simnet.callPublicFn(CONTRACT, "submit-move",
            [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii(board)], wallet_1);
        const data = getEventData(events);
        expect(data?.["new-board-state"]).toStrictEqual(ascii(board));
    });

    it("move-submitted event next-turn is 'b' after white moves", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "submit-move",
            [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        const data = getEventData(events);
        expect(data?.["next-turn"]).toStrictEqual(ascii("b"));
    });

    it("move-submitted event next-turn is 'w' after black moves", () => {
        const gameId = setupGame(0, true, 2);
        simnet.callPublicFn(CONTRACT, "submit-move",
            [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        const { events } = simnet.callPublicFn(CONTRACT, "submit-move",
            [Cl.uint(gameId), Cl.stringAscii("e7e5"), Cl.stringAscii("...")], wallet_2);
        const data = getEventData(events);
        expect(data?.["next-turn"]).toStrictEqual(ascii("w"));
    });

    it("move-submitted event contains block-height field", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "submit-move",
            [Cl.uint(gameId), Cl.stringAscii("e2e4"), Cl.stringAscii("...")], wallet_1);
        const data = getEventData(events);
        expect(data?.["block-height"]).toBeDefined();
    });

    it("no print event emitted when submit-move fails", () => {
        const gameId = setupGame(0, true, 2);
        // Wrong turn — black tries to move first
        const { events } = simnet.callPublicFn(CONTRACT, "submit-move",
            [Cl.uint(gameId), Cl.stringAscii("e7e5"), Cl.stringAscii("...")], wallet_2);
        const ev = getPrintEvent(events);
        expect(ev).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("chessxu events — game-resigned", () => {
    it("emits a print event when player 1 resigns", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resign",
            [Cl.uint(gameId)], wallet_1);
        const ev = getPrintEvent(events);
        expect(ev).toBeDefined();
    });

    it("game-resigned event topic is 'game-resigned'", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resign",
            [Cl.uint(gameId)], wallet_1);
        const data = getEventData(events);
        expect(data?.["topic"]).toStrictEqual(ascii("game-resigned"));
    });

    it("game-resigned event contains game-id field", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resign",
            [Cl.uint(gameId)], wallet_1);
        const data = getEventData(events);
        expect(data?.["game-id"]).toStrictEqual(uint(gameId));
    });

    it("game-resigned event resigned-by is the resigning player", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resign",
            [Cl.uint(gameId)], wallet_1);
        const data = getEventData(events);
        expect(data?.["resigned-by"]).toStrictEqual(addr(wallet_1));
    });

    it("game-resigned event winner is player-b when player-w resigns", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resign",
            [Cl.uint(gameId)], wallet_1);
        const data = getEventData(events);
        expect(data?.["winner"]).toStrictEqual(addr(wallet_2));
    });

    it("game-resigned event winner is player-w when player-b resigns", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resign",
            [Cl.uint(gameId)], wallet_2);
        const data = getEventData(events);
        expect(data?.["winner"]).toStrictEqual(addr(wallet_1));
    });

    it("game-resigned event new-status is u3 when white resigns", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resign",
            [Cl.uint(gameId)], wallet_1);
        const data = getEventData(events);
        expect(data?.["new-status"]).toStrictEqual(uint(3));
    });

    it("game-resigned event new-status is u2 when black resigns", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resign",
            [Cl.uint(gameId)], wallet_2);
        const data = getEventData(events);
        expect(data?.["new-status"]).toStrictEqual(uint(2));
    });

    it("game-resigned event contains wager field", () => {
        const gameId = setupGame(1000, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resign",
            [Cl.uint(gameId)], wallet_1);
        const data = getEventData(events);
        expect(data?.["wager"]).toStrictEqual(uint(1000));
    });

    it("game-resigned event contains is-stx field", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resign",
            [Cl.uint(gameId)], wallet_1);
        const data = getEventData(events);
        expect(data?.["is-stx"]).toStrictEqual(bool(true));
    });

    it("game-resigned event contains block-height field", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resign",
            [Cl.uint(gameId)], wallet_1);
        const data = getEventData(events);
        expect(data?.["block-height"]).toBeDefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("chessxu events — game-resolved", () => {
    it("emits a print event on successful resolution", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(2)], deployer);
        const ev = getPrintEvent(events);
        expect(ev).toBeDefined();
    });

    it("game-resolved event topic is 'game-resolved'", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(2)], deployer);
        const data = getEventData(events);
        expect(data?.["topic"]).toStrictEqual(ascii("game-resolved"));
    });

    it("game-resolved event contains game-id field", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(2)], deployer);
        const data = getEventData(events);
        expect(data?.["game-id"]).toStrictEqual(uint(gameId));
    });

    it("game-resolved event new-status matches the resolved status", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(4)], deployer);
        const data = getEventData(events);
        expect(data?.["new-status"]).toStrictEqual(uint(4));
    });

    it("game-resolved event contains player-w field", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(2)], deployer);
        const data = getEventData(events);
        expect(data?.["player-w"]).toStrictEqual(addr(wallet_1));
    });

    it("game-resolved event contains player-b field", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(2)], deployer);
        const data = getEventData(events);
        expect(data?.["player-b"]).toBeDefined();
    });

    it("game-resolved event contains wager field", () => {
        const gameId = setupGame(2000, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(2)], deployer);
        const data = getEventData(events);
        expect(data?.["wager"]).toStrictEqual(uint(2000));
    });

    it("game-resolved event contains is-stx field", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(2)], deployer);
        const data = getEventData(events);
        expect(data?.["is-stx"]).toStrictEqual(bool(true));
    });

    it("game-resolved event contains block-height field", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(2)], deployer);
        const data = getEventData(events);
        expect(data?.["block-height"]).toBeDefined();
    });

    it("no print event emitted when resolve-game fails (non-owner)", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(2)], wallet_1);
        const ev = getPrintEvent(events);
        expect(ev).toBeUndefined();
    });

    it("game-resolved event emitted for draw resolution (status u4)", () => {
        const gameId = setupGame(0, true, 2);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(4)], deployer);
        const data = getEventData(events);
        expect(data?.["topic"]).toStrictEqual(ascii("game-resolved"));
        expect(data?.["new-status"]).toStrictEqual(uint(4));
    });

    it("game-resolved event emitted for cancellation (status u5)", () => {
        const gameId = setupGame(0, true, 1);
        const { events } = simnet.callPublicFn(CONTRACT, "resolve-game",
            [Cl.uint(gameId), Cl.uint(5)], deployer);
        const data = getEventData(events);
        expect(data?.["topic"]).toStrictEqual(ascii("game-resolved"));
        expect(data?.["new-status"]).toStrictEqual(uint(5));
    });
});
