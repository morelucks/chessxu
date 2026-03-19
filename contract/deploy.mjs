import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { makeContractDeploy, broadcastTransaction, AnchorMode, getAddressFromPrivateKey, ClarityVersion } = require('@stacks/transactions');
const { STACKS_MAINNET } = require('@stacks/network');
const { readFileSync } = require('fs');
require('dotenv').config();

const PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY;
if (!PRIVATE_KEY) {
    console.error('❌ MAINNET_PRIVATE_KEY not found in .env');
    process.exit(1);
}

const network = STACKS_MAINNET;

// Only redeploy the failed contract
const contracts = [
    { name: 'stackchess', file: 'contracts/stackchess.clar' },
];

async function deployContract(contractName, codeBody, nonce) {
    console.log(`\n🚀 Deploying ${contractName}...`);

    const txOptions = {
        contractName,
        codeBody,
        clarityVersion: ClarityVersion.Clarity2,
        senderKey: PRIVATE_KEY,
        network,
        anchorMode: AnchorMode.Any,
        fee: 50000n, // 0.05 STX fee
        nonce: BigInt(nonce),
    };

    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction({ transaction, network });

    if (broadcastResponse.error) {
        console.error(`❌ Failed to deploy ${contractName}:`, broadcastResponse.error, broadcastResponse.reason);
        if (broadcastResponse.reason_data) console.error('   Details:', JSON.stringify(broadcastResponse.reason_data));
        return null;
    }

    console.log(`✅ ${contractName} broadcast successfully!`);
    console.log(`   TX ID: ${broadcastResponse.txid}`);
    console.log(`   Explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=mainnet`);
    return broadcastResponse.txid;
}

async function main() {
    console.log('=== Stackchess Mainnet Deployment ===\n');

    const senderAddress = getAddressFromPrivateKey(PRIVATE_KEY);
    console.log(`📋 Deployer address: ${senderAddress}`);

    const response = await fetch(`https://api.hiro.so/v2/accounts/${senderAddress}?proof=0`);
    const accountInfo = await response.json();
    let nonce = parseInt(accountInfo.nonce);
    const balanceSTX = parseInt(accountInfo.balance) / 1_000_000;
    console.log(`💰 Balance: ${balanceSTX.toFixed(6)} STX`);
    console.log(`🔢 Current nonce: ${nonce}`);

    if (balanceSTX < 0.2) {
        console.error('❌ Insufficient STX balance for deployment. Need at least 0.2 STX.');
        process.exit(1);
    }

    for (const contract of contracts) {
        const codeBody = readFileSync(contract.file, 'utf-8');
        const txid = await deployContract(contract.name, codeBody, nonce);
        if (!txid) {
            console.error(`\n⛔ Stopping deployment. Fix the error above and re-run.`);
            process.exit(1);
        }
        nonce++;
        // Brief pause between broadcasts
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\n🎉 All contracts broadcast successfully!');
    console.log('⏳ Wait ~10-20 minutes for mainnet confirmations.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
