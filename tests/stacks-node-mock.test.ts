import { test } from "node:test";
import assert from "node:assert/strict";
import * as transactions from "@stacks/transactions";
import {
  getLastGameId,
  getGame,
  getGameCount,
  getPlayerStats,
  getPlayerElo,
  getExpectedScore,
  getGlobalStats,
  CHESSXU_DEPLOYER,
  setGlobalRetryOptions,
  getGlobalRetryOptions,
  withRetry,
} from "../src/index";

// Save original fetch
const originalFetch = global.fetch;

let mockResponse: any = null;
let mockError: Error | null = null;

// Hook fetch
(global as any).fetch = async (url: string, options: any) => {
  if (mockError) {
    throw mockError;
  }
  return mockResponse;
};

function setMockCV(cv: any) {
  mockError = null;
  mockResponse = new Response(
    JSON.stringify({
      okay: true,
      result: transactions.cvToHex(cv),
    }),
    { status: 200 }
  );
}

function setMockError(err: Error) {
  mockResponse = null;
  mockError = err;
}

function setMockRawResponse(body: string, status = 200) {
  mockError = null;
  mockResponse = new Response(body, { status });
}

test("getLastGameId Node.js mock test", async () => {
  setMockCV(transactions.uintCV(42));
  const id = await getLastGameId();
  assert.equal(id, 42);
});

test("getGame Node.js mock test - success", async () => {
  const gameTuple = transactions.tupleCV({
    playerW: transactions.principalCV(CHESSXU_DEPLOYER),
    playerB: transactions.someCV(transactions.principalCV(CHESSXU_DEPLOYER)),
    wager: transactions.uintCV(1000000),
    isStx: transactions.boolCV(true),
    boardState: transactions.stringAsciiCV("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
    turn: transactions.stringAsciiCV("w"),
    status: transactions.uintCV(1),
  });
  const mockSomeCV = transactions.someCV(gameTuple);
  setMockCV(mockSomeCV);

  const game = await getGame(5);
  assert.ok(game);
  assert.equal(game.playerW, CHESSXU_DEPLOYER);
  assert.equal(game.playerB, CHESSXU_DEPLOYER);
  assert.equal(game.wager, 1000000);
  assert.equal(game.isStx, true);
});

test("getGame Node.js mock test - None response", async () => {
  setMockCV(transactions.noneCV());
  const game = await getGame(99);
  assert.equal(game, null);
});

test("getGame Node.js mock test - undefined response", async () => {
  // Simulate an unexpected Clarity Value type (e.g. uintCV instead of optional tuple)
  setMockCV(transactions.uintCV(42));
  const game = await getGame(99);
  assert.equal(game, null);
});

test("getGame Node.js mock test - negative game ID validation", async () => {
  await assert.rejects(
    async () => {
      await getGame(-1);
    },
    /Invalid game ID: must be non-negative/
  );
});

test("getGame Node.js mock test - 404 response", async () => {
  setMockRawResponse("Not Found", 404);
  const game = await getGame(5);
  assert.equal(game, null);
});

test("getGame Node.js mock test - other network errors", async () => {
  setMockError(new Error("500 Internal Error"));
  await assert.rejects(
    async () => {
      await getGame(5);
    },
    /500 Internal Error/
  );
});

test("getGameCount Node.js mock test", async () => {
  setMockCV(transactions.uintCV(150));
  const count = await getGameCount();
  assert.equal(count, 150);
});

test("getPlayerStats Node.js mock test", async () => {
  const mockStatsTuple = transactions.tupleCV({
    wins: transactions.uintCV(10),
    losses: transactions.uintCV(5),
    draws: transactions.uintCV(2),
    elo: transactions.uintCV(1350),
  });
  const mockSomeStatsCV = transactions.someCV(mockStatsTuple);
  setMockCV(mockSomeStatsCV);

  const stats = await getPlayerStats(CHESSXU_DEPLOYER);
  assert.ok(stats);
  assert.equal(stats.wins.value, "10");
});

test("getPlayerStats Node.js mock test - invalid address", async () => {
  await assert.rejects(
    async () => {
      await getPlayerStats("invalid-address");
    },
    /Invalid player address: "invalid-address"/
  );
});

test("getPlayerElo Node.js mock test", async () => {
  setMockCV(transactions.uintCV(1450));
  const elo = await getPlayerElo(CHESSXU_DEPLOYER);
  assert.equal(elo, 1450);
});

test("getPlayerElo Node.js mock test - failure fallback", async () => {
  setMockError(new Error("fail"));
  const elo = await getPlayerElo(CHESSXU_DEPLOYER);
  assert.equal(elo, 1200);
});

test("getExpectedScore Node.js mock test", async () => {
  setMockCV(transactions.uintCV(750));
  const score = await getExpectedScore(CHESSXU_DEPLOYER, CHESSXU_DEPLOYER);
  assert.equal(score, 750);
});

test("getGlobalStats Node.js mock test", async () => {
  const mockGlobalTuple = transactions.tupleCV({
    "total-games": transactions.uintCV(250),
    "total-players": transactions.uintCV(40),
  });
  setMockCV(mockGlobalTuple);

  const stats = await getGlobalStats();
  assert.ok(stats);
  assert.equal(stats["total-games"].value, "250");
});

test("Retry mechanism - success on third attempt", async () => {
  let attempts = 0;
  const originalHook = (global as any).fetch;
  (global as any).fetch = async (url: string, options: any) => {
    attempts++;
    if (attempts < 3) {
      throw new Error("Temporary network error " + attempts);
    }
    return new Response(
      JSON.stringify({
        okay: true,
        result: transactions.cvToHex(transactions.uintCV(42)),
      }),
      { status: 200 }
    );
  };

  try {
    const id = await getLastGameId(undefined, {
      maxRetries: 3,
      initialDelayMs: 1,
      jitter: false,
    });
    assert.equal(id, 42);
    assert.equal(attempts, 3);
  } finally {
    (global as any).fetch = originalHook;
  }
});

test("Retry mechanism - persistent failure exhausts retries", async () => {
  let attempts = 0;
  const originalHook = (global as any).fetch;
  (global as any).fetch = async (url: string, options: any) => {
    attempts++;
    throw new Error("Persistent network error " + attempts);
  };

  try {
    await assert.rejects(
      async () => {
        await getLastGameId(undefined, {
          maxRetries: 2,
          initialDelayMs: 1,
          jitter: false,
        });
      },
      /Persistent network error 3/
    );
    // 1 initial + 2 retries = 3 attempts total
    assert.equal(attempts, 3);
  } finally {
    (global as any).fetch = originalHook;
  }
});

test("Retry mechanism - respects global default options", async () => {
  setGlobalRetryOptions({
    maxRetries: 1,
    initialDelayMs: 1,
    jitter: false,
  });
  
  assert.equal(getGlobalRetryOptions().maxRetries, 1);

  let attempts = 0;
  const originalHook = (global as any).fetch;
  (global as any).fetch = async (url: string, options: any) => {
    attempts++;
    throw new Error("Persistent network error " + attempts);
  };

  try {
    await assert.rejects(
      async () => {
        await getLastGameId();
      },
      /Persistent network error 2/
    );
    // 1 initial + 1 retry = 2 attempts total
    assert.equal(attempts, 2);
  } finally {
    (global as any).fetch = originalHook;
    // Restore default options
    setGlobalRetryOptions({
      maxRetries: 3,
      initialDelayMs: 500,
      backoffFactor: 2,
      jitter: true,
    });
  }
});

test("Retry mechanism - backoff calculation", async () => {
  let attempts = 0;
  const originalHook = (global as any).fetch;
  (global as any).fetch = async (url: string, options: any) => {
    attempts++;
    throw new Error("fail");
  };

  try {
    const start = Date.now();
    await assert.rejects(
      async () => {
        await getLastGameId(undefined, {
          maxRetries: 2,
          initialDelayMs: 10,
          backoffFactor: 2,
          jitter: false,
        });
      },
      /fail/
    );
    const duration = Date.now() - start;
    // Delays: attempt 1 -> initialDelayMs = 10ms. attempt 2 -> 20ms. Total expected: 30ms.
    assert.ok(duration >= 25, `Expected duration >= 25ms, got ${duration}ms`);
  } finally {
    (global as any).fetch = originalHook;
  }
});

test("Retry mechanism - generic helper withRetry", async () => {
  let count = 0;
  const testFn = async () => {
    count++;
    if (count < 3) throw new Error("try again");
    return "success";
  };

  const result = await withRetry(testFn, {
    maxRetries: 3,
    initialDelayMs: 1,
    jitter: false,
  });

  assert.equal(result, "success");
  assert.equal(count, 3);
});

// Restore original fetch
test("cleanup", () => {
  global.fetch = originalFetch;
});
