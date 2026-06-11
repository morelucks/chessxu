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
