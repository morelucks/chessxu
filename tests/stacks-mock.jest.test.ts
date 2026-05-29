import {
  getLastGameId,
  getGame,
  getGameCount,
  getPlayerStats,
  getPlayerElo,
  getExpectedScore,
  getGlobalStats,
  CONTRACTS,
  CHESSXU_DEPLOYER,
  setGlobalRetryOptions,
  getGlobalRetryOptions,
  withRetry,
} from "../src/index";
import * as transactions from "@stacks/transactions";

// Mock only fetchCallReadOnlyFunction from @stacks/transactions
jest.mock("@stacks/transactions", () => {
  const actual = jest.requireActual("@stacks/transactions");
  return {
    ...actual,
    fetchCallReadOnlyFunction: jest.fn(),
  };
});

const mockedFetchCall = transactions.fetchCallReadOnlyFunction as jest.MockedFunction<
  typeof transactions.fetchCallReadOnlyFunction
>;

describe("Stacks Network and Contract Parsing Helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLastGameId", () => {
    it("should return the game ID successfully when node responds with valid CV", async () => {
      mockedFetchCall.mockResolvedValueOnce(transactions.uintCV(42));

      const lastId = await getLastGameId();
      expect(lastId).toBe(42);
      expect(mockedFetchCall).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if the network call fails", async () => {
      mockedFetchCall.mockRejectedValueOnce(new Error("Connection refused"));

      await expect(getLastGameId()).rejects.toThrow("Connection refused");
    });
  });

  describe("getGame", () => {
    it("should fetch and parse game successfully when game exists", async () => {
      // Build a real Clarity tuple value wrapped in a Clarity Some
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
      mockedFetchCall.mockResolvedValueOnce(mockSomeCV);

      const game = await getGame(5);
      expect(game).toEqual({
        playerW: CHESSXU_DEPLOYER,
        playerB: CHESSXU_DEPLOYER,
        wager: 1000000,
        isStx: true,
        boardState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        turn: "w",
        status: 1,
      });
    });

    it("should return null if the game does not exist (Clarity None response)", async () => {
      mockedFetchCall.mockResolvedValueOnce(transactions.noneCV());

      const game = await getGame(99);
      expect(game).toBeNull();
    });

    it("should return null if cvToValue returns null/undefined (e.g. empty response)", async () => {
      mockedFetchCall.mockResolvedValueOnce(undefined as any);

      const game = await getGame(99);
      expect(game).toBeNull();
    });

    it("should throw validation error on malformed input (negative game ID)", async () => {
      await expect(getGame(-1)).rejects.toThrow("Invalid game ID: must be non-negative");
    });

    it("should return null if node responds with a 404 error message", async () => {
      mockedFetchCall.mockRejectedValueOnce(new Error("Request failed with status code 404"));

      const game = await getGame(5);
      expect(game).toBeNull();
    });

    it("should return null if node responds with a 'not found' error message", async () => {
      mockedFetchCall.mockRejectedValueOnce(new Error("contract not found"));

      const game = await getGame(5);
      expect(game).toBeNull();
    });

    it("should throw non-404 network errors", async () => {
      mockedFetchCall.mockRejectedValueOnce(new Error("500 Internal Server Error"));

      await expect(getGame(5)).rejects.toThrow("500 Internal Server Error");
    });
  });

  describe("getGameCount", () => {
    it("should return the total game count successfully", async () => {
      mockedFetchCall.mockResolvedValueOnce(transactions.uintCV(120));

      const count = await getGameCount();
      expect(count).toBe(120);
    });

    it("should fallback to getLastGameId if get-game-count call fails", async () => {
      // First call (get-game-count) fails
      mockedFetchCall.mockRejectedValueOnce(new Error("function not found"));
      // Second call (get-last-game-id fallback) succeeds
      mockedFetchCall.mockResolvedValueOnce(transactions.uintCV(119));

      const count = await getGameCount();
      expect(count).toBe(119);
      expect(mockedFetchCall).toHaveBeenCalledTimes(2);
    });
  });

  describe("getPlayerStats", () => {
    it("should fetch and parse player stats successfully", async () => {
      const mockStatsTuple = transactions.tupleCV({
        wins: transactions.uintCV(10),
        losses: transactions.uintCV(5),
        draws: transactions.uintCV(2),
        elo: transactions.uintCV(1350),
      });
      const mockSomeStatsCV = transactions.someCV(mockStatsTuple);
      mockedFetchCall.mockResolvedValueOnce(mockSomeStatsCV);

      const stats = await getPlayerStats(CHESSXU_DEPLOYER);
      expect(stats).toEqual({
        wins: { type: "uint", value: "10" },
        losses: { type: "uint", value: "5" },
        draws: { type: "uint", value: "2" },
        elo: { type: "uint", value: "1350" },
      });
    });

    it("should throw validation error for invalid player address", async () => {
      await expect(getPlayerStats("invalid-address")).rejects.toThrow(
        'Invalid player address: "invalid-address"'
      );
    });
  });

  describe("getPlayerElo", () => {
    it("should return player ELO successfully", async () => {
      mockedFetchCall.mockResolvedValueOnce(transactions.uintCV(1450));

      const elo = await getPlayerElo(CHESSXU_DEPLOYER);
      expect(elo).toBe(1450);
    });

    it("should default to 1200 if the call fails", async () => {
      mockedFetchCall.mockRejectedValueOnce(new Error("Leaderboard not active"));

      const elo = await getPlayerElo(CHESSXU_DEPLOYER);
      expect(elo).toBe(1200);
    });

    it("should throw validation error for invalid player address", async () => {
      await expect(getPlayerElo("invalid")).rejects.toThrow('Invalid player address: "invalid"');
    });
  });

  describe("getExpectedScore", () => {
    it("should return the expected score win probability", async () => {
      mockedFetchCall.mockResolvedValueOnce(transactions.uintCV(750));

      const score = await getExpectedScore(
        CHESSXU_DEPLOYER,
        CHESSXU_DEPLOYER
      );
      expect(score).toBe(750);
    });

    it("should throw validation error if player address is invalid", async () => {
      await expect(
        getExpectedScore("invalid", CHESSXU_DEPLOYER)
      ).rejects.toThrow("Invalid player address(es)");

      await expect(
        getExpectedScore(CHESSXU_DEPLOYER, "invalid")
      ).rejects.toThrow("Invalid player address(es)");
    });
  });

  describe("getGlobalStats", () => {
    it("should return global leaderboard stats successfully", async () => {
      const mockGlobalTuple = transactions.tupleCV({
        "total-games": transactions.uintCV(250),
        "total-players": transactions.uintCV(40),
      });
      mockedFetchCall.mockResolvedValueOnce(mockGlobalTuple);

      const stats = await getGlobalStats();
      expect(stats).toEqual({
        "total-games": { type: "uint", value: "250" },
        "total-players": { type: "uint", value: "40" },
      });
    });
  });

  describe("Retry Mechanism and Backoff logic", () => {
    afterEach(() => {
      // Restore default global options
      setGlobalRetryOptions({
        maxRetries: 3,
        initialDelayMs: 500,
        backoffFactor: 2,
        jitter: true,
      });
    });

    it("should succeed immediately without retry on a successful call", async () => {
      mockedFetchCall.mockResolvedValueOnce(transactions.uintCV(42));
      const res = await getLastGameId();
      expect(res).toBe(42);
      expect(mockedFetchCall).toHaveBeenCalledTimes(1);
    });

    it("should retry and eventually succeed if initial calls fail", async () => {
      mockedFetchCall
        .mockRejectedValueOnce(new Error("Transient error 1"))
        .mockRejectedValueOnce(new Error("Transient error 2"))
        .mockResolvedValueOnce(transactions.uintCV(42));

      // Use very short delays in tests to keep execution fast
      const res = await getLastGameId(undefined, {
        maxRetries: 3,
        initialDelayMs: 1,
        jitter: false,
      });
      expect(res).toBe(42);
      expect(mockedFetchCall).toHaveBeenCalledTimes(3);
    });

    it("should fail after exhausting maxRetries", async () => {
      mockedFetchCall.mockRejectedValue(new Error("Persistent error"));

      await expect(
        getLastGameId(undefined, {
          maxRetries: 2,
          initialDelayMs: 1,
          jitter: false,
        })
      ).rejects.toThrow("Persistent error");

      // 1 initial try + 2 retries = 3 total attempts
      expect(mockedFetchCall).toHaveBeenCalledTimes(3);
    });

    it("should respect global default retry options", async () => {
      setGlobalRetryOptions({
        maxRetries: 1,
        initialDelayMs: 1,
        jitter: false,
      });

      expect(getGlobalRetryOptions().maxRetries).toBe(1);

      mockedFetchCall.mockRejectedValue(new Error("Persistent error"));

      await expect(getLastGameId()).rejects.toThrow("Persistent error");
      // 1 initial + 1 retry = 2 attempts
      expect(mockedFetchCall).toHaveBeenCalledTimes(2);
    });

    it("should calculate backoff delays correctly with and without jitter", async () => {
      let start = Date.now();
      mockedFetchCall
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce(transactions.uintCV(42));

      await getLastGameId(undefined, {
        maxRetries: 3,
        initialDelayMs: 10,
        backoffFactor: 2,
        jitter: false,
      });

      // Delays: 10ms + 20ms = 30ms minimum wait time
      let duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(25); // allow minor timing variance

      // Check with jitter (delay should be random and generally smaller/equal)
      mockedFetchCall.mockClear();
      mockedFetchCall
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce(transactions.uintCV(42));

      await getLastGameId(undefined, {
        maxRetries: 3,
        initialDelayMs: 10,
        backoffFactor: 2,
        jitter: true,
      });
      expect(mockedFetchCall).toHaveBeenCalledTimes(3);
    });

    it("should generic helper withRetry execute custom functions successfully", async () => {
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

      expect(result).toBe("success");
      expect(count).toBe(3);
    });
  });
});
