import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
import dns from "dns";

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const BURNERS_FILE = './burners_celo.json';
const NUM_USERS = 475;
const FUND_AMOUNT = ethers.parseEther("0.06"); // 0.06 CELO for gas (createGame ~171k gas @ up to 240 gwei)
const MIN_BALANCE = ethers.parseEther("0.035"); // Min balance to attempt interaction at current gas prices

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callWithRetry(fn, retries = 5, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (e) {
            if (i === retries - 1) throw e;
            console.log(`      ⚠️ RPC call failed (attempt ${i + 1}/${retries}): ${e.message}. Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
}

async function getWorkingProvider() {
    const rpcs = [
        "https://forno.celo.org",
        "https://rpc.ankr.com/celo",
        "https://celo.drpc.org",
        "https://1rpc.io/celo",
        "https://public-node.celo.org"
    ];
    
    for (const rpc of rpcs) {
        try {
            const provider = new ethers.JsonRpcProvider(rpc, { chainId: 42220, name: 'celo' }, { staticNetwork: true });
            
            // Test with a real call
            await Promise.race([
                provider.getBalance("0x0000000000000000000000000000000000000000"),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
            ]);
            
            console.log(`📡 Connected to ${rpc}`);
            return provider;
        } catch (e) {
            console.log(`⚠️ Failed to connect to ${rpc}: ${e.code || ''} ${e.message}`);
        }
    }
    throw new Error("Could not connect to any Celo RPC endpoint.");
}

function loadOrCreateBurners() {
    let burners = [];
    if (fs.existsSync(BURNERS_FILE)) {
        try {
            burners = JSON.parse(fs.readFileSync(BURNERS_FILE, 'utf8'));
            console.log(`📂 Loaded ${burners.length} burners from ${BURNERS_FILE}`);
        } catch (e) {
            console.log(`⚠️ Error reading ${BURNERS_FILE}, starting fresh.`);
            burners = [];
        }
    }

    if (burners.length < NUM_USERS) {
        const toGenerate = NUM_USERS - burners.length;
        console.log(`🔧 Generating ${toGenerate} additional burners...`);
        for (let i = 0; i < toGenerate; i++) {
            const wallet = ethers.Wallet.createRandom();
            burners.push({ 
                privKey: wallet.privateKey, 
                address: wallet.address 
            });
        }
        fs.writeFileSync(BURNERS_FILE, JSON.stringify(burners, null, 2));
        console.log(`✅ Saved ${burners.length} total burners to ${BURNERS_FILE}`);
    }

    return burners.slice(0, NUM_USERS);
}

async function interact(burner, i, total, provider, contractAddress, currentGasPrice) {
    console.log(`   [${i+1}/${total}] Interacting: ${burner.address} ...`);
    try {
        const wallet = new ethers.Wallet(burner.privKey, provider);
        const abi = ["function createGame(uint256 wager, bool isNative) external payable returns (uint256)"];
        const contract = new ethers.Contract(contractAddress, abi, wallet);

        // Use actual gas price + 25% buffer instead of hardcoded 400 gwei
        const maxFee = currentGasPrice * 125n / 100n;

        const tx = await contract.createGame(0, true, {
            gasLimit: 200000, // createGame uses ~171k gas, leave headroom
            maxFeePerGas: maxFee,
            maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
        });
        console.log(`      ✅ TxID: ${tx.hash}`);
        await tx.wait(1);
        console.log(`      ✨ Confirmed!`);
    } catch (e) {
        console.error(`      ❌ Interaction failed: ${e.message}`);
    }
}

async function run() {
    console.log(`🚀 CELO DAU SIMULATION - ${NUM_USERS} USERS`);
    const provider = await getWorkingProvider();
    
    const pk = process.env.MAINNET_PRIVATE_KEY2 || process.env.MAINNET_PRIVATE_KEY;
    if (!pk) {
        throw new Error("Missing MAINNET_PRIVATE_KEY or MAINNET_PRIVATE_KEY2 in .env");
    }
    const mainWallet = new ethers.Wallet(pk, provider);
    const contractAddr = process.env.CONTRACT_ADDRESS || "0x2439f6dB24684782Ef2590484B60BED21684c617"; // Deployed V2 Mainnet Contract
    
    console.log(`Main Funding Account: ${mainWallet.address}`);
    console.log(`Contract Address: ${contractAddr}`);

    console.log(`\n🔍 Checking current network gas fees...`);
    const feeData = await callWithRetry(() => provider.getFeeData());
    const rawGasPrice = feeData.gasPrice || 0n;
    const gasPriceGwei = parseFloat(ethers.formatUnits(rawGasPrice, "gwei"));
    console.log(`   Current Gas Price: ${gasPriceGwei.toFixed(2)} gwei`);
    
    if (gasPriceGwei > 240) {
        console.log(`\n⚠️  ABORTING: Network is too congested right now.`);
        console.log(`   The current gas price is ${gasPriceGwei.toFixed(2)} gwei, but we cap at 240 gwei (to fit in 0.06 CELO funding).`);
        console.log(`   Running this now would cause all transactions to fail or be too expensive.`);
        console.log(`   Please try running the script again in a little while when fees drop.\n`);
        return;
    }

    // Calculate dynamic MIN_BALANCE: gasPrice * 125% buffer * 200k gasLimit
    const maxFee = rawGasPrice * 125n / 100n;
    const dynamicMinBalance = maxFee * 200000n;
    console.log(`   Max fee per gas: ${parseFloat(ethers.formatUnits(maxFee, "gwei")).toFixed(2)} gwei`);
    console.log(`   Min balance needed: ${ethers.formatEther(dynamicMinBalance)} CELO`);

    const burners = loadOrCreateBurners();
    const needsFunding = [];

    console.log(`\n💰 Checking balances and performing immediate interactions...`);
    
    for (let i = 0; i < burners.length; i++) {
        const burner = burners[i];
        if (i % 10 === 0) console.log(`   ... Checked ${i}/${burners.length} burners`);
        
        // Wrap with retry and add a small sleep delay to prevent Cloudflare/RPC rate limits
        const balance = await callWithRetry(() => provider.getBalance(burner.address));
        await sleep(50);
        
        if (balance >= dynamicMinBalance) {
            await interact(burner, i, NUM_USERS, provider, contractAddr, rawGasPrice);
            await sleep(200);
            continue;
        }

        needsFunding.push({ burner, index: i, balance });
    }

    if (needsFunding.length > 0) {
        // Prioritize newly generated accounts (those with 0 balance)
        needsFunding.sort((a, b) => {
            if (a.balance === 0n && b.balance > 0n) return -1;
            if (a.balance > 0n && b.balance === 0n) return 1;
            return 0;
        });
        
        console.log(`\n💸 Funding ${needsFunding.length} burners from main account...`);
        let currentNonce = await callWithRetry(() => provider.getTransactionCount(mainWallet.address, "latest"));
        
        for (const item of needsFunding) {
            let amountToSend = FUND_AMOUNT;
            if (item.balance > 0n && item.balance < FUND_AMOUNT) {
                amountToSend = FUND_AMOUNT - item.balance;
            }
            
            console.log(`   [${item.index+1}/${NUM_USERS}] Funding ${item.burner.address} with ${ethers.formatEther(amountToSend)} CELO ...`);
            try {
                const tx = await mainWallet.sendTransaction({
                    to: item.burner.address,
                    value: amountToSend,
                    nonce: currentNonce++,
                    maxFeePerGas: maxFee,
                    maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
                });
                console.log(`      ✅ Funding TxID: ${tx.hash}`);
            } catch (e) {
                console.error(`      ❌ Funding failed: ${e.message}`);
                currentNonce = await callWithRetry(() => provider.getTransactionCount(mainWallet.address, "latest"));
            }
            await sleep(100);
        }

        console.log(`\n⏳ Waiting 15 seconds for funding transactions to settle...`);
        await sleep(15000);

        console.log(`\n🎮 Performing interactions for recently funded burners...`);
        for (const item of needsFunding) {
            await interact(item.burner, item.index, NUM_USERS, provider, contractAddr, rawGasPrice);
            await sleep(200);
        }
    }

    console.log(`\n🌟 FINISHED! Celo simulation complete.`);
}

run().catch(console.error);
