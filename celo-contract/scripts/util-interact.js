import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Configuration ---
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PUBLIC_RPCS = [
    process.env.CELO_RPC,
    "https://forno.celo.org",
    "https://rpc.ankr.com/celo",
    "https://1rpc.io/celo",
    "https://celo.drpc.org",
    "https://public-node.celo.org",
].filter(Boolean);

function loadArtifact() {
    const artifactPath = join(__dirname, "../artifacts/contracts/Chessxu.sol/Chessxu.json");
    if (!fs.existsSync(artifactPath)) {
        console.error("❌ Artifact not found. Run: npx hardhat compile");
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === "--help" || command === "-h") {
        console.log(`
Usage: node scripts/util-interact.js <command> [options]

Commands:
  create [wager] [isNative]  Create a new game. Wager defaults to 0. isNative defaults to true.
  join <gameId> [wager]      Join an existing game.
  get <gameId>               Get game state for a specific ID.
  last                       Get the last game ID created.
  balance [address]          Get CELO balance of an address (defaults to MAINNET_PRIVATE_KEY wallet).
  resign <gameId>            Resign from a game.
  move <gameId> <move> <fen> Submit a move.

Examples:
  node scripts/util-interact.js create 0.1
  node scripts/util-interact.js join 1 0.1
  node scripts/util-interact.js get 1
        `);
        return;
    }

    if (!CONTRACT_ADDRESS) {
        throw new Error("Missing CONTRACT_ADDRESS in .env");
    }

    // Setup provider with fallback logic
    let provider;
    for (const url of PUBLIC_RPCS) {
        try {
            // console.log(`   Trying RPC: ${url}...`);
            const p = new ethers.JsonRpcProvider(url, { chainId: 42220, name: 'celo' }, { staticNetwork: true });
            // Set a shorter timeout for the network check to fail fast and move to next RPC
            await Promise.race([
                p.getNetwork(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout after 3s")), 3000))
            ]);
            provider = p;
            break;
        } catch (e) {
            console.warn(`   ⚠️  RPC failed: ${url} - ${e.message}`);
        }
    }

    if (!provider) {
        throw new Error("Could not connect to any Celo RPC. Please check your internet connection.");
    }
    const pk = process.env.MAINNET_PRIVATE_KEY2 || process.env.MAINNET_PRIVATE_KEY;
    if (!pk) {
        throw new Error("Missing MAINNET_PRIVATE_KEY in .env");
    }
    const wallet = new ethers.Wallet(pk, provider);
    const artifact = loadArtifact();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

    console.log(`Using wallet: ${wallet.address}`);
    console.log(`Contract: ${CONTRACT_ADDRESS}\n`);

    try {
        switch (command) {
            case "create": {
                const wager = args[1] || "0";
                const isNative = args[2] !== "false";
                const value = isNative ? ethers.parseEther(wager) : 0n;
                
                console.log(`Creating game with wager ${wager} ${isNative ? 'CELO' : 'tokens'}...`);
                const tx = await contract.createGame(ethers.parseEther(wager), isNative, { value });
                const receipt = await tx.wait();
                const lastId = await contract.getLastGameId();
                console.log(`✅ Game created! ID: ${lastId.toString()}`);
                console.log(`Transaction: ${receipt.hash}`);
                break;
            }
            case "join": {
                const gameId = args[1];
                if (!gameId) throw new Error("Missing gameId");
                const wager = args[2] || "0";
                const value = ethers.parseEther(wager);
                
                console.log(`Joining game ${gameId} with wager ${wager} CELO...`);
                const tx = await contract.joinGame(gameId, { value });
                const receipt = await tx.wait();
                console.log(`✅ Joined game ${gameId}!`);
                console.log(`Transaction: ${receipt.hash}`);
                break;
            }
            case "get": {
                const gameId = args[1];
                if (!gameId) throw new Error("Missing gameId");
                const game = await contract.getGame(gameId);
                console.log(`Game ID: ${gameId}`);
                console.log(`- Player W: ${game.playerW}`);
                console.log(`- Player B: ${game.playerB}`);
                console.log(`- Wager: ${ethers.formatEther(game.wager)}`);
                console.log(`- Native: ${game.isNative}`);
                console.log(`- Turn: ${game.turn}`);
                console.log(`- Status: ${game.status}`);
                console.log(`- Board: ${game.boardState}`);
                break;
            }
            case "last": {
                const lastId = await contract.getLastGameId();
                console.log(`Last Game ID: ${lastId.toString()}`);
                break;
            }
            case "balance": {
                const target = args[1] || wallet.address;
                const balance = await provider.getBalance(target);
                console.log(`Balance of ${target}: ${ethers.formatEther(balance)} CELO`);
                break;
            }
            case "resign": {
                const gameId = args[1];
                if (!gameId) throw new Error("Missing gameId");
                console.log(`Resigning from game ${gameId}...`);
                const tx = await contract.resign(gameId);
                await tx.wait();
                console.log(`✅ Resigned from game ${gameId}!`);
                break;
            }
            case "move": {
                const gameId = args[1];
                const move = args[2];
                const fen = args[3];
                if (!gameId || !move || !fen) throw new Error("Usage: move <gameId> <move> <fen>");
                
                console.log(`Submitting move ${move} for game ${gameId}...`);
                const tx = await contract.submitMove(gameId, move, fen);
                await tx.wait();
                console.log(`✅ Move submitted!`);
                break;
            }
            default:
                console.log(`Unknown command: ${command}`);
                break;
        }
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
    }
}

main();
