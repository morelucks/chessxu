import hre from "hardhat";
import dotenv from "dotenv";
dotenv.config();

// ERC-4337 EntryPoint v0.6 (same on all EVM chains)
const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
// Chessxu game contract on Celo mainnet
const CHESSXU_CONTRACT = "0xf4776929EB56F8C0fC41f87Cc7c4aEa4702de02E";
// Max sponsored txns per address per day
const MAX_TX_PER_DAY = 50;
// Initial deposit into EntryPoint (in CELO)
const INITIAL_DEPOSIT = hre.ethers.parseEther("0.1");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying ChessxuPaymaster with:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "CELO");

  const Paymaster = await hre.ethers.getContractFactory("ChessxuPaymaster");
  const paymaster = await Paymaster.deploy(ENTRY_POINT, CHESSXU_CONTRACT, MAX_TX_PER_DAY);
  await paymaster.waitForDeployment();

  const address = await paymaster.getAddress();
  console.log("ChessxuPaymaster deployed to:", address);

  // Deposit CELO into EntryPoint to fund gas sponsorship
  console.log("Depositing", hre.ethers.formatEther(INITIAL_DEPOSIT), "CELO into EntryPoint...");
  const tx = await paymaster.depositToEntryPoint({ value: INITIAL_DEPOSIT });
  await tx.wait();
  console.log("Deposit tx:", tx.hash);

  // Verify on CeloScan
  if (process.env.CELOSCAN_API_KEY) {
    console.log("Verifying on CeloScan...");
    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: [ENTRY_POINT, CHESSXU_CONTRACT, MAX_TX_PER_DAY],
      });
      console.log("Verified!");
    } catch (e) {
      console.warn("Verification failed (may already be verified):", e.message);
    }
  }

  console.log("\n=== Deployment Summary ===");
  console.log("ChessxuPaymaster:", address);
  console.log("EntryPoint:      ", ENTRY_POINT);
  console.log("ChessxuContract: ", CHESSXU_CONTRACT);
  console.log("MaxTxPerDay:     ", MAX_TX_PER_DAY);
  console.log("\nUpdate PAYMASTER_ADDRESS in frontend/src/chess/blockchainConstants.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
