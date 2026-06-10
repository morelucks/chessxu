import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("ChessxuV2 Smart Contract - Meta-Transaction Functional Tests", function () {
    let chessxuV2;
    let mockToken;
    let owner;
    let player1;
    let player2;
    let forwarder;

    const parseEth = (val) => ethers.parseEther(val.toString());

    beforeEach(async function () {
        [owner, player1, player2, forwarder] = await ethers.getSigners();

        // Deploy Mock Token
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy();
        await mockToken.waitForDeployment();

        // Deploy ChessxuV2 with Trusted Forwarder
        const ChessxuV2 = await ethers.getContractFactory("ChessxuV2");
        chessxuV2 = await ChessxuV2.deploy(await mockToken.getAddress(), await forwarder.getAddress());
        await chessxuV2.waitForDeployment();

        // Mint tokens to players
        await mockToken.mint(player1.address, parseEth("1000"));
        await mockToken.mint(player2.address, parseEth("1000"));
    });

    it("should set the correct trusted forwarder", async function () {
        expect(await chessxuV2.isTrustedForwarder(await forwarder.getAddress())).to.equal(true);
        expect(await chessxuV2.isTrustedForwarder(await owner.getAddress())).to.equal(false);
    });

    it("should correctly identify player via msgSender in createGame", async function () {
        // Skeleton for meta-tx verification
    });

    it("should correctly identify player via msgSender in joinGame", async function () {
        // Skeleton for meta-tx verification
    });

    it("should validate turns using msgSender in submitMove", async function () {
        // Skeleton for meta-tx verification
    });

    it("should correctly identify player via msgSender in resign", async function () {
        // Skeleton for meta-tx verification
    });

    it("should verify owner via msgSender in resolveGame", async function () {
        // Skeleton for meta-tx verification
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("ChessxuV2 — ERC-20 Wager Refund on Draw/Cancellation (#126)", function () {
    let chessxuV2;
    let mockToken;
    let owner;
    let player1;
    let player2;
    let forwarder;
    let contractAddr;

    const parseEth = (val) => ethers.parseEther(val.toString());
    const WAGER = parseEth("100");

    beforeEach(async function () {
        [owner, player1, player2, forwarder] = await ethers.getSigners();

        // Deploy Mock ERC-20 Token
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy();
        await mockToken.waitForDeployment();

        // Deploy ChessxuV2 with mock token and trusted forwarder
        const ChessxuV2 = await ethers.getContractFactory("ChessxuV2");
        chessxuV2 = await ChessxuV2.deploy(await mockToken.getAddress(), await forwarder.getAddress());
        await chessxuV2.waitForDeployment();
        contractAddr = await chessxuV2.getAddress();

        // Mint tokens to both players
        await mockToken.mint(player1.address, parseEth("1000"));
        await mockToken.mint(player2.address, parseEth("1000"));
    });

    // ── Helper: create a token-wagered game ──

    async function createTokenGame() {
        await mockToken.connect(player1).approve(contractAddr, WAGER);
        await chessxuV2.connect(player1).createGame(WAGER, false);
        return await chessxuV2.getLastGameId();
    }

    async function joinTokenGame(gameId) {
        await mockToken.connect(player2).approve(contractAddr, WAGER);
        await chessxuV2.connect(player2).joinGame(gameId);
    }

    // ── Setup verification ──

    it("deploys ChessxuV2 with mock ERC-20 token address", async function () {
        expect(await chessxuV2.chessxuToken()).to.equal(await mockToken.getAddress());
    });

    it("creates a game with isNative = false and correct wager amount", async function () {
        const gameId = await createTokenGame();
        const game = await chessxuV2.getGame(gameId);

        expect(game.isNative).to.be.false;
        expect(game.wager).to.equal(WAGER);
        expect(game.playerW).to.equal(player1.address);
        expect(game.status).to.equal(0); // Waiting
    });

    it("transfers creator's ERC-20 wager into contract escrow on createGame", async function () {
        await createTokenGame();

        const contractBalance = await mockToken.balanceOf(contractAddr);
        expect(contractBalance).to.equal(WAGER);

        const player1Balance = await mockToken.balanceOf(player1.address);
        expect(player1Balance).to.equal(parseEth("900"));
    });

    it("deposits player 2's wager on joinGame", async function () {
        const gameId = await createTokenGame();
        await joinTokenGame(gameId);

        const contractBalance = await mockToken.balanceOf(contractAddr);
        expect(contractBalance).to.equal(WAGER * 2n);

        const player2Balance = await mockToken.balanceOf(player2.address);
        expect(player2Balance).to.equal(parseEth("900"));
    });

    it("sets game status to Live (1) after player 2 joins", async function () {
        const gameId = await createTokenGame();
        await joinTokenGame(gameId);

        const game = await chessxuV2.getGame(gameId);
        expect(game.status).to.equal(1);
        expect(game.playerB).to.equal(player2.address);
    });

    // ── Draw (status = 4): both players refunded ──

    it("resolveGame with status 4 (Draw) refunds creator's ERC-20 wager", async function () {
        const gameId = await createTokenGame();
        await joinTokenGame(gameId);

        const balanceBefore = await mockToken.balanceOf(player1.address);
        await chessxuV2.connect(owner).resolveGame(gameId, 4);
        const balanceAfter = await mockToken.balanceOf(player1.address);

        expect(balanceAfter - balanceBefore).to.equal(WAGER);
    });

    it("resolveGame with status 4 (Draw) refunds joiner's ERC-20 wager", async function () {
        const gameId = await createTokenGame();
        await joinTokenGame(gameId);

        const balanceBefore = await mockToken.balanceOf(player2.address);
        await chessxuV2.connect(owner).resolveGame(gameId, 4);
        const balanceAfter = await mockToken.balanceOf(player2.address);

        expect(balanceAfter - balanceBefore).to.equal(WAGER);
    });

    it("resolveGame with status 4 (Draw) sets game status to 4", async function () {
        const gameId = await createTokenGame();
        await joinTokenGame(gameId);

        await chessxuV2.connect(owner).resolveGame(gameId, 4);

        const game = await chessxuV2.getGame(gameId);
        expect(game.status).to.equal(4);
    });

    it("contract ERC-20 balance is zero after Draw resolution", async function () {
        const gameId = await createTokenGame();
        await joinTokenGame(gameId);

        await chessxuV2.connect(owner).resolveGame(gameId, 4);

        const contractBalance = await mockToken.balanceOf(contractAddr);
        expect(contractBalance).to.equal(0n);
    });

    // ── Cancellation (status = 5): creator refunded ──

    it("resolveGame with status 5 (Cancelled) refunds creator's ERC-20 wager", async function () {
        const gameId = await createTokenGame();
        // No player 2 joins — game is still in Waiting status

        const balanceBefore = await mockToken.balanceOf(player1.address);
        await chessxuV2.connect(owner).resolveGame(gameId, 5);
        const balanceAfter = await mockToken.balanceOf(player1.address);

        expect(balanceAfter - balanceBefore).to.equal(WAGER);
    });

    it("resolveGame with status 5 (Cancelled) sets game status to 5", async function () {
        const gameId = await createTokenGame();
        await chessxuV2.connect(owner).resolveGame(gameId, 5);

        const game = await chessxuV2.getGame(gameId);
        expect(game.status).to.equal(5);
    });

    it("contract ERC-20 balance is zero after Cancellation (no joiner)", async function () {
        const gameId = await createTokenGame();
        await chessxuV2.connect(owner).resolveGame(gameId, 5);

        const contractBalance = await mockToken.balanceOf(contractAddr);
        expect(contractBalance).to.equal(0n);
    });

    it("resolveGame with status 5 (Cancelled) refunds both players if player 2 joined", async function () {
        const gameId = await createTokenGame();
        await joinTokenGame(gameId);

        const p1Before = await mockToken.balanceOf(player1.address);
        const p2Before = await mockToken.balanceOf(player2.address);

        await chessxuV2.connect(owner).resolveGame(gameId, 5);

        const p1After = await mockToken.balanceOf(player1.address);
        const p2After = await mockToken.balanceOf(player2.address);

        expect(p1After - p1Before).to.equal(WAGER);
        expect(p2After - p2Before).to.equal(WAGER);
    });

    it("contract ERC-20 balance is zero after Cancellation (with joiner)", async function () {
        const gameId = await createTokenGame();
        await joinTokenGame(gameId);

        await chessxuV2.connect(owner).resolveGame(gameId, 5);

        const contractBalance = await mockToken.balanceOf(contractAddr);
        expect(contractBalance).to.equal(0n);
    });

    // ── Guard rails ──

    it("reverts resolveGame if caller is not the owner", async function () {
        const gameId = await createTokenGame();
        await joinTokenGame(gameId);

        await expect(
            chessxuV2.connect(player1).resolveGame(gameId, 4)
        ).to.be.revertedWithCustomError(chessxuV2, "NotOwner");
    });

    it("reverts resolveGame with invalid status (1)", async function () {
        const gameId = await createTokenGame();

        await expect(
            chessxuV2.connect(owner).resolveGame(gameId, 1)
        ).to.be.revertedWithCustomError(chessxuV2, "InvalidStatus");
    });

    it("reverts resolveGame with invalid status (6)", async function () {
        const gameId = await createTokenGame();

        await expect(
            chessxuV2.connect(owner).resolveGame(gameId, 6)
        ).to.be.revertedWithCustomError(chessxuV2, "InvalidStatus");
    });

    it("reverts resolveGame if game is already resolved", async function () {
        const gameId = await createTokenGame();
        await joinTokenGame(gameId);

        await chessxuV2.connect(owner).resolveGame(gameId, 4);

        await expect(
            chessxuV2.connect(owner).resolveGame(gameId, 5)
        ).to.be.revertedWithCustomError(chessxuV2, "GameNotActive");
    });

    // ── Player balances restored to original amounts ──

    it("both players have original token balances after Draw refund", async function () {
        const gameId = await createTokenGame();
        await joinTokenGame(gameId);
        await chessxuV2.connect(owner).resolveGame(gameId, 4);

        expect(await mockToken.balanceOf(player1.address)).to.equal(parseEth("1000"));
        expect(await mockToken.balanceOf(player2.address)).to.equal(parseEth("1000"));
    });

    it("creator has original token balance after Cancellation refund", async function () {
        const gameId = await createTokenGame();
        await chessxuV2.connect(owner).resolveGame(gameId, 5);

        expect(await mockToken.balanceOf(player1.address)).to.equal(parseEth("1000"));
    });
});
