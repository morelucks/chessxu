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

    beforeEach(async function () {
        [owner, player1, player2, forwarder] = await ethers.getSigners();

        // Deploy Mock Token
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy();

        // Deploy ChessxuV2 with Trusted Forwarder
        const ChessxuV2 = await ethers.getContractFactory("ChessxuV2");
        chessxuV2 = await ChessxuV2.deploy(await mockToken.getAddress(), await forwarder.getAddress());
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

describe("ChessxuV2 - ERC-20 Wager Refund on Draw/Cancellation", function () {
    const WAGER_AMOUNT = ethers.parseEther("100");

    async function deployFixture() {
        const [owner, player1, player2, forwarder] = await ethers.getSigners();

        // Deploy Mock ERC-20 Token
        const MockToken = await ethers.getContractFactory("MockERC20");
        const mockToken = await MockToken.deploy();
        await mockToken.waitForDeployment();

        // Deploy ChessxuV2 with mock token and forwarder
        const ChessxuV2 = await ethers.getContractFactory("ChessxuV2");
        const chessxuV2 = await ChessxuV2.deploy(
            await mockToken.getAddress(),
            await forwarder.getAddress()
        );
        await chessxuV2.waitForDeployment();

        // Mint tokens to players
        await mockToken.mint(player1.address, ethers.parseEther("1000"));
        await mockToken.mint(player2.address, ethers.parseEther("1000"));

        return { chessxuV2, mockToken, owner, player1, player2, forwarder };
    }

    describe("Setup & Deposit Verification", function () {
        it("should deploy ChessxuV2 with the mock ERC-20 token address", async function () {
            const { chessxuV2, mockToken } = await deployFixture();

            expect(await chessxuV2.chessxuToken()).to.equal(await mockToken.getAddress());
        });

        it("should create a game with isNative=false and deposit the ERC-20 wager", async function () {
            const { chessxuV2, mockToken, player1 } = await deployFixture();

            const contractAddr = await chessxuV2.getAddress();

            // Approve and create game
            await mockToken.connect(player1).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player1).createGame(WAGER_AMOUNT, false);

            // Verify game state
            const game = await chessxuV2.getGame(1);
            expect(game.playerW).to.equal(player1.address);
            expect(game.wager).to.equal(WAGER_AMOUNT);
            expect(game.isNative).to.be.false;
            expect(game.status).to.equal(0); // Waiting

            // Verify token was transferred to contract
            const contractBalance = await mockToken.balanceOf(contractAddr);
            expect(contractBalance).to.equal(WAGER_AMOUNT);
        });

        it("should deposit Player 2's ERC-20 wager when joining", async function () {
            const { chessxuV2, mockToken, player1, player2 } = await deployFixture();

            const contractAddr = await chessxuV2.getAddress();

            // Player 1 creates game
            await mockToken.connect(player1).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player1).createGame(WAGER_AMOUNT, false);

            // Player 2 joins game
            await mockToken.connect(player2).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player2).joinGame(1);

            // Verify game state
            const game = await chessxuV2.getGame(1);
