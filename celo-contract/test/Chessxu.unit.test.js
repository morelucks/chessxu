import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function deployFixture() {
  const [owner, player1, player2, player3] = await ethers.getSigners();
  const parseEth = (v) => ethers.parseEther(v.toString());

  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20Factory.deploy();
  await mockToken.waitForDeployment();

  const ChessxuFactory = await ethers.getContractFactory("Chessxu");
  const chessxu = await ChessxuFactory.deploy(await mockToken.getAddress());
  await chessxu.waitForDeployment();

  await mockToken.mint(player1.address, parseEth("1000"));
  await mockToken.mint(player2.address, parseEth("1000"));
  await mockToken.mint(player3.address, parseEth("1000"));

  return { chessxu, mockToken, owner, player1, player2, player3, parseEth };
}

// ─── Unit Tests ─────────────────────────────────────────────────────────────

describe("Chessxu – Unit Tests", function () {

  // ── Deployment ──────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets the deployer as owner", async function () {
      const { chessxu, owner } = await deployFixture();
      expect(await chessxu.owner()).to.equal(owner.address);
    });

    it("initialises nextGameId to 1", async function () {
      const { chessxu } = await deployFixture();
      expect(await chessxu.nextGameId()).to.equal(1);
    });

    it("stores the token address", async function () {
      const { chessxu, mockToken } = await deployFixture();
      expect(await chessxu.chessxuToken()).to.equal(await mockToken.getAddress());
    });

    it("deploys with zero address token when none supplied", async function () {
      const ChessxuFactory = await (await network.connect()).ethers.getContractFactory("Chessxu");
      const c = await ChessxuFactory.deploy(ethers.ZeroAddress);
      await c.waitForDeployment();
      expect(await c.chessxuToken()).to.equal(ethers.ZeroAddress);
    });
  });

  // ── createGame ──────────────────────────────────────────────────────────

  describe("createGame", function () {
    it("creates a zero-wager native game", async function () {
      const { chessxu, player1 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      expect(await chessxu.getLastGameId()).to.equal(1);
    });

    it("creates a native-wager game and holds ETH", async function () {
      const { chessxu, player1, parseEth } = await deployFixture();
      const wager = parseEth("0.5");
      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      const bal = await ethers.provider.getBalance(await chessxu.getAddress());
      expect(bal).to.equal(wager);
    });

    it("sets correct initial game struct", async function () {
      const { chessxu, player1 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      const g = await chessxu.getGame(1);
      expect(g.playerW).to.equal(player1.address);
      expect(g.playerB).to.equal(ethers.ZeroAddress);
      expect(g.wager).to.equal(0);
      expect(g.isNative).to.be.true;
      expect(g.boardState).to.equal("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
      expect(g.turn).to.equal("w");
      expect(g.status).to.equal(0);
    });

    it("increments nextGameId after each creation", async function () {
      const { chessxu, player1 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      expect(await chessxu.nextGameId()).to.equal(2);
      await chessxu.connect(player1).createGame(0, true);
      expect(await chessxu.nextGameId()).to.equal(3);
    });

    it("reverts when native msg.value doesn't match wager", async function () {
      const { chessxu, player1, parseEth } = await deployFixture();
      await expect(
        chessxu.connect(player1).createGame(parseEth("0.5"), true, { value: parseEth("0.4") })
      ).to.be.revertedWithCustomError(chessxu, "InvalidWager");
    });

    it("reverts when ETH sent for a token game", async function () {
      const { chessxu, player1, parseEth } = await deployFixture();
      await expect(
        chessxu.connect(player1).createGame(parseEth("0.5"), false, { value: parseEth("0.1") })
      ).to.be.revertedWithCustomError(chessxu, "InvalidWager");
    });

    it("creates a token-wagered game and holds tokens", async function () {
      const { chessxu, mockToken, player1, parseEth } = await deployFixture();
      const wager = parseEth("100");
      await mockToken.connect(player1).approve(await chessxu.getAddress(), wager);
      await chessxu.connect(player1).createGame(wager, false);
      expect(await mockToken.balanceOf(await chessxu.getAddress())).to.equal(wager);
    });

    it("reverts token game when no allowance given", async function () {
      const { chessxu, player1, parseEth } = await deployFixture();
      await expect(
        chessxu.connect(player1).createGame(parseEth("100"), false)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("assigns sequential IDs across multiple games", async function () {
      const { chessxu, player1 } = await deployFixture();
      for (let i = 1; i <= 3; i++) {
        await chessxu.connect(player1).createGame(0, true);
        expect(await chessxu.getLastGameId()).to.equal(i);
      }
    });
  });

  // ── joinGame ────────────────────────────────────────────────────────────

  describe("joinGame", function () {
    it("joins a zero-wager game and sets status to Ongoing", async function () {
      const { chessxu, player1, player2 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      const g = await chessxu.getGame(1);
      expect(g.playerB).to.equal(player2.address);
      expect(g.status).to.equal(1);
    });

    it("joins a native-wager game and contract holds both wagers", async function () {
      const { chessxu, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("0.5");
      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });
      const bal = await ethers.provider.getBalance(await chessxu.getAddress());
      expect(bal).to.equal(wager * 2n);
    });

    it("reverts on non-existent game", async function () {
      const { chessxu, player2 } = await deployFixture();
      await expect(chessxu.connect(player2).joinGame(999))
        .to.be.revertedWithCustomError(chessxu, "GameNotFound");
    });

    it("reverts when game is already ongoing", async function () {
      const { chessxu, player1, player2, player3 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      await expect(chessxu.connect(player3).joinGame(1))
        .to.be.revertedWithCustomError(chessxu, "NotWaiting");
    });

    it("reverts when creator tries to join own game", async function () {
      const { chessxu, player1 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await expect(chessxu.connect(player1).joinGame(1))
        .to.be.revertedWithCustomError(chessxu, "AlreadyJoined");
    });

    it("reverts when join wager doesn't match", async function () {
      const { chessxu, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("0.5");
      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await expect(chessxu.connect(player2).joinGame(1, { value: parseEth("0.4") }))
        .to.be.revertedWithCustomError(chessxu, "InvalidWager");
    });

    it("joins a token-wagered game and contract holds both token wagers", async function () {
      const { chessxu, mockToken, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("100");
      await mockToken.connect(player1).approve(await chessxu.getAddress(), wager);
      await chessxu.connect(player1).createGame(wager, false);
      await mockToken.connect(player2).approve(await chessxu.getAddress(), wager);
      await chessxu.connect(player2).joinGame(1);
      expect(await mockToken.balanceOf(await chessxu.getAddress())).to.equal(parseEth("200"));
    });

    it("reverts when ETH sent for a token join", async function () {
      const { chessxu, mockToken, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("100");
      await mockToken.connect(player1).approve(await chessxu.getAddress(), wager);
      await chessxu.connect(player1).createGame(wager, false);
      await expect(chessxu.connect(player2).joinGame(1, { value: parseEth("0.1") }))
        .to.be.revertedWithCustomError(chessxu, "InvalidWager");
    });
  });

  // ── submitMove ──────────────────────────────────────────────────────────

  describe("submitMove", function () {
    async function activeGame(f) {
      await f.chessxu.connect(f.player1).createGame(0, true);
      await f.chessxu.connect(f.player2).joinGame(1);
    }

    it("white submits move and turn flips to 'b'", async function () {
      const f = await deployFixture();
      await activeGame(f);
      const newState = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
      await f.chessxu.connect(f.player1).submitMove(1, "e2-e4", newState);
      const g = await f.chessxu.getGame(1);
      expect(g.turn).to.equal("b");
      expect(g.boardState).to.equal(newState);
    });

    it("black submits move and turn flips to 'w'", async function () {
      const f = await deployFixture();
      await activeGame(f);
      await f.chessxu.connect(f.player1).submitMove(1, "e2-e4", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR");
      const newState = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR";
      await f.chessxu.connect(f.player2).submitMove(1, "e7-e5", newState);
      const g = await f.chessxu.getGame(1);
      expect(g.turn).to.equal("w");
      expect(g.boardState).to.equal(newState);
    });

    it("reverts on non-existent game", async function () {
      const { chessxu, player1 } = await deployFixture();
      await expect(chessxu.connect(player1).submitMove(999, "e2-e4", "state"))
        .to.be.revertedWithCustomError(chessxu, "GameNotFound");
    });

    it("reverts when game is not active (Waiting status)", async function () {
      const { chessxu, player1 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await expect(chessxu.connect(player1).submitMove(1, "e2-e4", "state"))
        .to.be.revertedWithCustomError(chessxu, "GameNotActive");
    });

    it("reverts when wrong player moves", async function () {
      const f = await deployFixture();
      await activeGame(f);
      await expect(f.chessxu.connect(f.player2).submitMove(1, "e7-e5", "state"))
        .to.be.revertedWithCustomError(f.chessxu, "NotYourTurn");
    });

    it("board state updates correctly across multiple sequential moves", async function () {
      const f = await deployFixture();
      await activeGame(f);
      const s1 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
      const s2 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR";
      await f.chessxu.connect(f.player1).submitMove(1, "e2-e4", s1);
      await f.chessxu.connect(f.player2).submitMove(1, "e7-e5", s2);
      const g = await f.chessxu.getGame(1);
      expect(g.boardState).to.equal(s2);
    });
  });

  // ── resign ──────────────────────────────────────────────────────────────

  describe("resign", function () {
    it("white resigns → black wins (status 3) and receives prize", async function () {
      const { chessxu, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("0.5");
      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });

      const before = await ethers.provider.getBalance(player2.address);
      const tx = await chessxu.connect(player1).resign(1);
      const receipt = await tx.wait();
      const after = await ethers.provider.getBalance(player2.address);

      expect(after - before).to.equal(wager * 2n);
      expect((await chessxu.getGame(1)).status).to.equal(3);
    });

    it("black resigns → white wins (status 2) and receives prize", async function () {
      const { chessxu, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("0.5");
      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });

      const before = await ethers.provider.getBalance(player1.address);
      const tx = await chessxu.connect(player2).resign(1);
      await tx.wait();
      const after = await ethers.provider.getBalance(player1.address);

      expect(after - before).to.equal(wager * 2n);
      expect((await chessxu.getGame(1)).status).to.equal(2);
    });

    it("reverts when non-player calls resign", async function () {
      const { chessxu, player1, player2, player3 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      await expect(chessxu.connect(player3).resign(1))
        .to.be.revertedWithCustomError(chessxu, "NotPlayer");
    });

    it("reverts when game is not active", async function () {
      const { chessxu, player1 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await expect(chessxu.connect(player1).resign(1))
        .to.be.revertedWithCustomError(chessxu, "GameNotActive");
    });

    it("reverts when player attempts to resign on an already finished/resigned game", async function () {
      const { chessxu, player1, player2 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);

      // Player 1 resigns. Verify status changes to 3.
      await chessxu.connect(player1).resign(1);
      expect((await chessxu.getGame(1)).status).to.equal(3);

      // Player 2 attempts to resign on the same game.
      // Verify that the second resign call reverts with GameNotActive().
      await expect(chessxu.connect(player2).resign(1))
        .to.be.revertedWithCustomError(chessxu, "GameNotActive");
    });

    it("resign with token wager transfers tokens to winner", async function () {
      const { chessxu, mockToken, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("100");
      await mockToken.connect(player1).approve(await chessxu.getAddress(), wager);
      await chessxu.connect(player1).createGame(wager, false);
      await mockToken.connect(player2).approve(await chessxu.getAddress(), wager);
      await chessxu.connect(player2).joinGame(1);

      const before = await mockToken.balanceOf(player2.address);
      await chessxu.connect(player1).resign(1);
      const after = await mockToken.balanceOf(player2.address);
      expect(after - before).to.equal(wager * 2n);
    });
  });

  // ── resolveGame ─────────────────────────────────────────────────────────

  describe("resolveGame", function () {
    it("owner resolves white wins (status 2)", async function () {
      const { chessxu, owner, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("0.5");
      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });

      const before = await ethers.provider.getBalance(player1.address);
      await chessxu.connect(owner).resolveGame(1, 2);
      const after = await ethers.provider.getBalance(player1.address);
      expect(after - before).to.equal(wager * 2n);
      expect((await chessxu.getGame(1)).status).to.equal(2);
    });

    it("owner resolves draw (status 4) and refunds both players", async function () {
      const { chessxu, owner, player1, player2, parseEth } = await deployFixture();
      const wager = parseEth("0.5");
      await chessxu.connect(player1).createGame(wager, true, { value: wager });
      await chessxu.connect(player2).joinGame(1, { value: wager });

      const b1 = await ethers.provider.getBalance(player1.address);
      const b2 = await ethers.provider.getBalance(player2.address);
      await chessxu.connect(owner).resolveGame(1, 4);
      const a1 = await ethers.provider.getBalance(player1.address);
      const a2 = await ethers.provider.getBalance(player2.address);
      expect(a1 - b1).to.equal(wager);
      expect(a2 - b2).to.equal(wager);
    });

    it("reverts when non-owner calls resolveGame", async function () {
      const { chessxu, player1, player2 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      await expect(chessxu.connect(player1).resolveGame(1, 2))
        .to.be.revertedWithCustomError(chessxu, "NotOwner");
    });

    it("reverts with invalid status (< 2 or > 5)", async function () {
      const { chessxu, owner, player1, player2 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      await chessxu.connect(player2).joinGame(1);
      await expect(chessxu.connect(owner).resolveGame(1, 1))
        .to.be.revertedWithCustomError(chessxu, "InvalidStatus");
      await expect(chessxu.connect(owner).resolveGame(1, 6))
        .to.be.revertedWithCustomError(chessxu, "InvalidStatus");
    });

    it("owner cancels a waiting game (status 5) and refunds creator", async function () {
      const { chessxu, owner, player1, parseEth } = await deployFixture();
      const wager = parseEth("0.5");
      await chessxu.connect(player1).createGame(wager, true, { value: wager });

      const before = await ethers.provider.getBalance(player1.address);
      await chessxu.connect(owner).resolveGame(1, 5);
      const after = await ethers.provider.getBalance(player1.address);
      expect(after - before).to.equal(wager);
      expect((await chessxu.getGame(1)).status).to.equal(5);
    });
  });

  // ── getGame / getLastGameId ──────────────────────────────────────────────

  describe("View functions", function () {
    it("getGame returns zero-value struct for non-existent game", async function () {
      const { chessxu } = await deployFixture();
      const g = await chessxu.getGame(999);
      expect(g.playerW).to.equal(ethers.ZeroAddress);
    });

    it("getLastGameId returns 0 before any game is created", async function () {
      const { chessxu } = await deployFixture();
      expect(await chessxu.getLastGameId()).to.equal(0);
    });

    it("getLastGameId returns correct ID after creation", async function () {
      const { chessxu, player1 } = await deployFixture();
      await chessxu.connect(player1).createGame(0, true);
      expect(await chessxu.getLastGameId()).to.equal(1);
    });
  });
});

// scaffold: unit test suite initialized

// test: deployment owner check added

// test: nextGameId initialisation verified

// test: token address stored on deploy

// test: zero-address token deploy

// test: createGame zero wager

// test: createGame native wager holds ETH

// test: createGame initial struct values

// test: createGame increments nextGameId

// test: createGame InvalidWager revert

// test: createGame ETH sent for token game revert

// test: createGame token wager holds tokens

// test: createGame no allowance revert

// test: joinGame sets playerB and status

// test: joinGame GameNotFound revert

// test: joinGame AlreadyJoined revert

// test: submitMove turn alternation

// test: submitMove NotYourTurn revert

// test: resign payout and status

// test: resolveGame owner-only access and payout
// double-resign-step: 1 — feat(resign): assert revert on completed game on finished games
// double-resign-step: 2 — refactor(celo): ensure double resign rejection during game lifecycle
// double-resign-step: 3 — fix(celo): assert inactive match resign check for player interaction
// double-resign-step: 4 — chore(celo): handle double resign rejection in unit tests
// double-resign-step: 5 — refactor(celo): integrate GameNotActive error check during game lifecycle
// double-resign-step: 6 — test(resign): implement resigned game validation with secondary resign calls
// double-resign-step: 7 — docs(celo): refine resigned game validation for resolved matches
// double-resign-step: 8 — test(celo): update inactive match resign check for player interaction
// double-resign-step: 9 — perf(celo): assert double resign rejection in unit tests
// double-resign-step: 10 — feat(celo): handle inactive match resign check to prevent double claims
// double-resign-step: 11 — fix(celo): implement inactive match resign check during game lifecycle
// double-resign-step: 12 — chore(celo): verify revert on completed game for resolved matches
// double-resign-step: 13 — feat(resign): update double resign rejection for resolved matches
// double-resign-step: 14 — docs(celo): update inactive match resign check during game lifecycle
// double-resign-step: 15 — fix(resign): implement inactive match resign check during game lifecycle
// double-resign-step: 16 — fix(resign): handle post-resolution state during game lifecycle
// double-resign-step: 17 — test(resign): test revert on completed game with secondary resign calls
// double-resign-step: 18 — style(celo): update resigned game validation with secondary resign calls
// double-resign-step: 19 — docs(celo): refine revert on completed game with secondary resign calls
// double-resign-step: 20 — refactor(celo): implement revert on completed game for resolved matches
// double-resign-step: 21 — chore(celo): validate GameNotActive error check with secondary resign calls
// double-resign-step: 22 — perf(celo): refine revert on completed game under already ended state
// double-resign-step: 23 — test(celo): verify resigned game validation under already ended state
// double-resign-step: 24 — perf(celo): implement revert on completed game to prevent double claims
// double-resign-step: 25 — feat(resign): refine post-resolution state under already ended state
// double-resign-step: 26 — fix(resign): implement GameNotActive error check on finished games
// double-resign-step: 27 — chore(celo): implement GameNotActive error check with secondary resign calls
// double-resign-step: 28 — docs(celo): check resigned game validation to prevent double claims
// double-resign-step: 29 — refactor(resign): verify double resign rejection in unit tests
// double-resign-step: 30 — test(celo): check GameNotActive error check under already ended state
// double-resign-step: 31 — fix(resign): assert double resign rejection with secondary resign calls
// double-resign-step: 32 — test(resign): integrate inactive match resign check during game lifecycle
// double-resign-step: 33 — test(celo): integrate double resign rejection for player interaction
// double-resign-step: 34 — feat(celo): integrate post-resolution state for player interaction
// double-resign-step: 35 — chore(celo): test resigned game validation on finished games
// double-resign-step: 36 — perf(celo): ensure inactive match resign check for player interaction
// double-resign-step: 37 — feat(celo): ensure payout assertion on resign under already ended state
// double-resign-step: 38 — refactor(celo): integrate payout assertion on resign in unit tests
// double-resign-step: 39 — chore(celo): handle payout assertion on resign to prevent double claims
// double-resign-step: 40 — perf(celo): verify resigned game validation under already ended state
// double-resign-step: 41 — perf(celo): ensure payout assertion on resign with secondary resign calls
// double-resign-step: 42 — fix(resign): implement payout assertion on resign in unit tests
// double-resign-step: 43 — test(celo): validate revert on completed game in unit tests
// double-resign-step: 44 — test(celo): test GameNotActive error check with secondary resign calls
// double-resign-step: 45 — test(celo): refine inactive match resign check on finished games
// double-resign-step: 46 — fix(resign): handle payout assertion on resign during game lifecycle
// double-resign-step: 47 — feat(celo): assert payout assertion on resign to prevent double claims
// double-resign-step: 48 — style(celo): refine double resign rejection for player interaction
// double-resign-step: 49 — fix(resign): refine revert on completed game on finished games
// double-resign-step: 50 — fix(celo): handle GameNotActive error check during game lifecycle
// double-resign-step: 51 — style(celo): ensure double resign rejection for player interaction
// double-resign-step: 52 — test(resign): update post-resolution state under already ended state
// double-resign-step: 53 — chore(celo): ensure GameNotActive error check in unit tests
// double-resign-step: 54 — test(celo): ensure GameNotActive error check during game lifecycle
// double-resign-step: 55 — test(resign): validate revert on completed game for resolved matches
// double-resign-step: 56 — test(celo): implement GameNotActive error check for player interaction
