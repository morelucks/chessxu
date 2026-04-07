import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Chessxu Contract", function () {
  async function deployChessxuFixture() {
    const [owner, player1, player2] = await ethers.getSigners();

    // Deploy Mock Token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20Factory.deploy();
    await mockToken.waitForDeployment();

    // Deploy Chessxu using the mock token address
    const ChessxuFactory = await ethers.getContractFactory("Chessxu");
    const chessxu = await ChessxuFactory.deploy(await mockToken.getAddress());
    await chessxu.waitForDeployment();

    // Setup: Mint some tokens to players
    const parseEth = (val) => ethers.parseEther(val.toString());
    await mockToken.mint(player1.address, parseEth("1000"));
    await mockToken.mint(player2.address, parseEth("1000"));

    return { chessxu, mockToken, owner, player1, player2, parseEth };
  }

  describe("createGame", function () {
    it("Should create a new game with zero wager", async function () {
      const { chessxu, player1 } = await deployChessxuFixture();
      
      const tx = await chessxu.connect(player1).createGame(0, true);
      await tx.wait();

      const gameId = await chessxu.getLastGameId();
      expect(gameId).to.equal(1);
    });
  });

  describe("joinGame", function () {
    // Tests for joinGame will go here
  });

  describe("submitMove", function () {
    // Tests for submitMove will go here
  });
});
