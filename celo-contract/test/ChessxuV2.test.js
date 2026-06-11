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
            expect(game.playerB).to.equal(player2.address);
            expect(game.status).to.equal(1); // Live

            // Verify contract holds both wagers
            const contractBalance = await mockToken.balanceOf(contractAddr);
            expect(contractBalance).to.equal(WAGER_AMOUNT * 2n);
        });
    });

    describe("Draw Resolution (status = 4)", function () {
        it("should refund both players' ERC-20 wagers on Draw", async function () {
            const { chessxuV2, mockToken, owner, player1, player2 } = await deployFixture();

            const contractAddr = await chessxuV2.getAddress();

            // Record initial balances
            const p1InitialBalance = await mockToken.balanceOf(player1.address);
            const p2InitialBalance = await mockToken.balanceOf(player2.address);

            // Player 1 creates game
            await mockToken.connect(player1).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player1).createGame(WAGER_AMOUNT, false);

            // Player 2 joins game
            await mockToken.connect(player2).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player2).joinGame(1);

            // Verify balances decreased after depositing wagers
            expect(await mockToken.balanceOf(player1.address)).to.equal(
                p1InitialBalance - WAGER_AMOUNT
            );
            expect(await mockToken.balanceOf(player2.address)).to.equal(
                p2InitialBalance - WAGER_AMOUNT
            );

            // Owner resolves game as Draw (status = 4)
            await chessxuV2.connect(owner).resolveGame(1, 4);

            // Verify both players received their wagers back
            expect(await mockToken.balanceOf(player1.address)).to.equal(p1InitialBalance);
            expect(await mockToken.balanceOf(player2.address)).to.equal(p2InitialBalance);

            // Verify game status is updated to Draw
            const game = await chessxuV2.getGame(1);
            expect(game.status).to.equal(4);
        });

        it("should reduce contract ERC-20 balance to zero after Draw refund", async function () {
            const { chessxuV2, mockToken, owner, player1, player2 } = await deployFixture();

            const contractAddr = await chessxuV2.getAddress();

            // Create and join game
            await mockToken.connect(player1).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player1).createGame(WAGER_AMOUNT, false);
            await mockToken.connect(player2).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player2).joinGame(1);

            // Confirm contract holds the wagers
            expect(await mockToken.balanceOf(contractAddr)).to.equal(WAGER_AMOUNT * 2n);

            // Resolve as Draw
            await chessxuV2.connect(owner).resolveGame(1, 4);

            // Contract balance should be zero
            expect(await mockToken.balanceOf(contractAddr)).to.equal(0n);
        });

        it("should handle Draw with zero wager gracefully", async function () {
            const { chessxuV2, mockToken, owner, player1, player2 } = await deployFixture();

            // Create and join a zero-wager ERC-20 game
            await chessxuV2.connect(player1).createGame(0, false);
            await chessxuV2.connect(player2).joinGame(1);

            // Should not revert
            await chessxuV2.connect(owner).resolveGame(1, 4);

            const game = await chessxuV2.getGame(1);
            expect(game.status).to.equal(4);
        });
    });

    describe("Cancellation Resolution (status = 5)", function () {
        it("should refund the creator's ERC-20 wager on Cancellation (no Player 2)", async function () {
            const { chessxuV2, mockToken, owner, player1 } = await deployFixture();

            const contractAddr = await chessxuV2.getAddress();

            // Record initial balance
            const p1InitialBalance = await mockToken.balanceOf(player1.address);

            // Player 1 creates game (no one joins)
            await mockToken.connect(player1).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player1).createGame(WAGER_AMOUNT, false);

            // Verify wager deducted
            expect(await mockToken.balanceOf(player1.address)).to.equal(
                p1InitialBalance - WAGER_AMOUNT
            );

            // Owner cancels the game (status = 5)
            await chessxuV2.connect(owner).resolveGame(1, 5);

            // Verify creator received wager back
            expect(await mockToken.balanceOf(player1.address)).to.equal(p1InitialBalance);

            // Verify game status is updated to Cancelled
            const game = await chessxuV2.getGame(1);
            expect(game.status).to.equal(5);
        });

        it("should reduce contract ERC-20 balance to zero after Cancellation refund", async function () {
            const { chessxuV2, mockToken, owner, player1 } = await deployFixture();

            const contractAddr = await chessxuV2.getAddress();

            // Create game (no join)
            await mockToken.connect(player1).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player1).createGame(WAGER_AMOUNT, false);

            // Confirm contract holds the wager
            expect(await mockToken.balanceOf(contractAddr)).to.equal(WAGER_AMOUNT);

            // Cancel the game
            await chessxuV2.connect(owner).resolveGame(1, 5);

            // Contract balance should be zero
            expect(await mockToken.balanceOf(contractAddr)).to.equal(0n);
        });

        it("should refund both players on Cancellation when Player 2 has joined", async function () {
            const { chessxuV2, mockToken, owner, player1, player2 } = await deployFixture();

            const contractAddr = await chessxuV2.getAddress();

            const p1InitialBalance = await mockToken.balanceOf(player1.address);
            const p2InitialBalance = await mockToken.balanceOf(player2.address);

            // Create and join game
            await mockToken.connect(player1).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player1).createGame(WAGER_AMOUNT, false);
            await mockToken.connect(player2).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player2).joinGame(1);

            // Cancel the game (status = 5)
            await chessxuV2.connect(owner).resolveGame(1, 5);

            // Verify both players received their wagers back
            expect(await mockToken.balanceOf(player1.address)).to.equal(p1InitialBalance);
            expect(await mockToken.balanceOf(player2.address)).to.equal(p2InitialBalance);

            // Contract balance should be zero
            expect(await mockToken.balanceOf(contractAddr)).to.equal(0n);
        });

        it("should handle Cancellation with zero wager gracefully", async function () {
            const { chessxuV2, owner, player1 } = await deployFixture();

            // Create zero-wager ERC-20 game (no join)
            await chessxuV2.connect(player1).createGame(0, false);

            // Should not revert
            await chessxuV2.connect(owner).resolveGame(1, 5);

            const game = await chessxuV2.getGame(1);
            expect(game.status).to.equal(5);
        });
    });

    describe("Access Control & Edge Cases", function () {
        it("should revert if non-owner tries to resolve the game", async function () {
            const { chessxuV2, mockToken, player1, player2 } = await deployFixture();

            const contractAddr = await chessxuV2.getAddress();

            // Create and join game
            await mockToken.connect(player1).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player1).createGame(WAGER_AMOUNT, false);
            await mockToken.connect(player2).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player2).joinGame(1);

            // Player 1 tries to resolve — should revert
            await expect(
                chessxuV2.connect(player1).resolveGame(1, 4)
            ).to.be.revertedWithCustomError(chessxuV2, "NotOwner");
        });

        it("should revert if resolving with an invalid status", async function () {
            const { chessxuV2, mockToken, owner, player1, player2 } = await deployFixture();

            const contractAddr = await chessxuV2.getAddress();

            await mockToken.connect(player1).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player1).createGame(WAGER_AMOUNT, false);
            await mockToken.connect(player2).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player2).joinGame(1);

            // Status 0 and 1 are invalid for resolveGame
            await expect(
                chessxuV2.connect(owner).resolveGame(1, 0)
            ).to.be.revertedWithCustomError(chessxuV2, "InvalidStatus");

            await expect(
                chessxuV2.connect(owner).resolveGame(1, 1)
            ).to.be.revertedWithCustomError(chessxuV2, "InvalidStatus");

            // Status 6+ are invalid
            await expect(
                chessxuV2.connect(owner).resolveGame(1, 6)
            ).to.be.revertedWithCustomError(chessxuV2, "InvalidStatus");
        });

        it("should revert if resolving an already resolved game", async function () {
            const { chessxuV2, mockToken, owner, player1, player2 } = await deployFixture();

            const contractAddr = await chessxuV2.getAddress();

            // Create and join game
            await mockToken.connect(player1).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player1).createGame(WAGER_AMOUNT, false);
            await mockToken.connect(player2).approve(contractAddr, WAGER_AMOUNT);
            await chessxuV2.connect(player2).joinGame(1);

            // Resolve as Draw
            await chessxuV2.connect(owner).resolveGame(1, 4);

            // Try resolving again — game status is now 4, not 0 or 1
