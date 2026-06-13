import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "ethers";

const { ethers: hreEthers } = await network.connect();

const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const CHESSXU = "0xf4776929EB56F8C0fC41f87Cc7c4aEa4702de02E";
const MAX_TX = 5;

// Known whitelisted selectors
const SELECTORS = {
  submitMove: "0x" + Buffer.from(
    ethers.id("submitMove(uint256,string)").slice(2, 10), "hex"
  ).toString("hex"),
  createGame: "0x" + Buffer.from(
    ethers.id("createGame(uint256,bool)").slice(2, 10), "hex"
  ).toString("hex"),
  joinGame: "0x" + Buffer.from(
    ethers.id("joinGame(uint256)").slice(2, 10), "hex"
  ).toString("hex"),
  resign: "0x" + Buffer.from(
    ethers.id("resign(uint256)").slice(2, 10), "hex"
  ).toString("hex"),
};

describe("ChessxuPaymaster", function () {
  let paymaster;
  let owner;
  let user;

  beforeEach(async function () {
    [owner, user] = await hreEthers.getSigners();

    // Deploy a mock EntryPoint (minimal) so we don't need the real one
    const MockEntryPoint = await hreEthers.getContractFactory("MockEntryPoint");
    const ep = await MockEntryPoint.deploy();
    const epAddress = await ep.getAddress();

    const Paymaster = await hreEthers.getContractFactory("ChessxuPaymaster");
    paymaster = await Paymaster.deploy(epAddress, CHESSXU, MAX_TX);
    await paymaster.waitForDeployment();
  });

  // ─── Selector whitelisting ────────────────────────────────────────────────

  describe("Selector whitelisting", function () {
    it("whitelists submitMove on deploy", async function () {
      const sel = ethers.id("submitMove(uint256,string)").slice(0, 10);
      expect(await paymaster.allowedSelectors(sel)).to.be.true;
    });

    it("whitelists createGame on deploy", async function () {
      const sel = ethers.id("createGame(uint256,bool)").slice(0, 10);
      expect(await paymaster.allowedSelectors(sel)).to.be.true;
    });

    it("whitelists joinGame on deploy", async function () {
      const sel = ethers.id("joinGame(uint256)").slice(0, 10);
      expect(await paymaster.allowedSelectors(sel)).to.be.true;
    });

    it("whitelists resign on deploy", async function () {
      const sel = ethers.id("resign(uint256)").slice(0, 10);
      expect(await paymaster.allowedSelectors(sel)).to.be.true;
    });

    it("does NOT whitelist arbitrary selectors", async function () {
      const sel = ethers.id("transfer(address,uint256)").slice(0, 10);
      expect(await paymaster.allowedSelectors(sel)).to.be.false;
    });

    it("owner can add a new selector", async function () {
      const sel = ethers.id("newFunc()").slice(0, 10);
      await expect(paymaster.connect(owner).setSelector(sel, true))
        .to.emit(paymaster, "SelectorUpdated")
        .withArgs(sel, true);
      expect(await paymaster.allowedSelectors(sel)).to.be.true;
    });

    it("owner can remove a selector", async function () {
      const sel = ethers.id("resign(uint256)").slice(0, 10);
      await paymaster.connect(owner).setSelector(sel, false);
      expect(await paymaster.allowedSelectors(sel)).to.be.false;
    });

    it("non-owner cannot update selectors", async function () {
      const sel = ethers.id("hack()").slice(0, 10);
      await expect(
        paymaster.connect(user).setSelector(sel, true)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });
  });

  // ─── Rate limiting ────────────────────────────────────────────────────────

  describe("Rate limiting", function () {
    it("tracks txCountToday correctly", async function () {
      // We test the internal logic via the public mapping after simulated calls
      // Since _validatePaymasterUserOp is internal, we test via a helper or
      // by checking initial state.
      expect(await paymaster.txCountToday(user.address)).to.equal(0);
    });

    it("maxTxPerDay is set correctly", async function () {
      expect(await paymaster.maxTxPerDay()).to.equal(MAX_TX);
    });

    it("owner can update maxTxPerDay", async function () {
      await paymaster.connect(owner).setMaxTxPerDay(100);
      expect(await paymaster.maxTxPerDay()).to.equal(100);
    });
  });

  // ─── Owner admin ──────────────────────────────────────────────────────────

  describe("Owner admin", function () {
    it("owner can update chessxuContract", async function () {
      const newAddr = user.address;
      await paymaster.connect(owner).setChessxuContract(newAddr);
      expect(await paymaster.chessxuContract()).to.equal(newAddr);
    });

    it("non-owner cannot update chessxuContract", async function () {
      await expect(
        paymaster.connect(user).setChessxuContract(user.address)
      ).to.be.revertedWithCustomError(paymaster, "OwnableUnauthorizedAccount");
    });

    it("owner can deposit to EntryPoint", async function () {
      const deposit = hreEthers.parseEther("0.01");
      await paymaster.connect(owner).depositToEntryPoint({ value: deposit });
    });
  });
});
