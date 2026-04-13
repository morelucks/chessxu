const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  boolCV
} = require('@stacks/transactions');

const senderKey = 'STX_KEY_SCRUBBED';
const contractAddress = 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B';
const contractName = 'chessxu';
const FEE_PER_TX = 10000; // 0.01 STX per tx
const NUM_TXS = 45;

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    const text = await res.text();
    if (text.includes("rate limit") || res.status === 429) {
      console.log(`   ⏳ Rate limited. Waiting 30s (Retry ${i + 1}/${retries})...`);
      await sleep(30000);
      continue;
    }
    throw new Error(`API Error: ${res.status} ${text}`);
  }
  throw new Error(`Max retries reached for ${url}`);
}

async function getNextNonce(address) {
  const data = await fetchWithRetry(`https://api.hiro.so/extended/v1/address/${address}/nonces`);
  return data.possible_next_nonce || 0;
}

async function getMempoolCount(address) {
  try {
    const data = await fetchWithRetry(`https://api.hiro.so/extended/v1/address/${address}/mempool`);
    return data.total || 0;
  } catch (e) {
    console.error(`   ⚠️  Mempool fetch failed: ${e.message}`);
    return 0;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runInteractions() {
  console.log('🚀 STACKS INTERACTION SCRIPT V2 (MEMPOOL-AWARE)');
  console.log('Fetching starting nonce...');
  const baseNonce = await getNextNonce(senderKey === 'STX_KEY_SCRUBBED' ? 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B' : ''); // Mapping key to address for mempool check
  const myAddress = 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B';
  
  console.log(`Starting ${NUM_TXS} transactions at nonce ${baseNonce}, fee ${FEE_PER_TX} uSTX (0.01 STX) each...`);
  console.log(`Total STX needed for fees: ${(NUM_TXS * FEE_PER_TX / 1_000_000).toFixed(2)} STX\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < NUM_TXS; i++) {
    // Check mempool count to avoid TooMuchChaining
    let mpCount = await getMempoolCount(myAddress);
    while (mpCount >= 20) {
      process.stdout.write(`   ⏳ Mempool full (${mpCount}/20). Waiting 2 mins... \r`);
      await sleep(120000); // Wait 2 minutes
      mpCount = await getMempoolCount(myAddress);
    }

    try {
      const tx = await makeContractCall({
        contractAddress,
        contractName,
        functionName: 'create-game',
        functionArgs: [uintCV(0), boolCV(true)],
        senderKey,
        network: 'mainnet',
        nonce: baseNonce + i,
        fee: FEE_PER_TX,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      });

      const result = await broadcastTransaction({ transaction: tx, network: 'mainnet' });

      if (result.error || result.reason) {
        const errStr = String(result.error || '');
        const reasonStr = String(result.reason || '');
        if (errStr.includes('TooMuchChaining') || reasonStr.includes('TooMuchChaining') || 
            errStr.includes('TooManyPendingTransactions') || reasonStr.includes('TooManyPendingTransactions')) {
            console.log(`   ⛓️  Mempool Chaining/Pending limit hit. Pausing...`);
            i--; // Retry this one
            await sleep(300000); // 5 min
            continue;
        }
        console.log(`Tx ${i + 1}/${NUM_TXS} FAILED: ${errStr} | Reason: ${reasonStr || 'none'}`);
        failCount++;
      } else {
        console.log(`Tx ${i + 1}/${NUM_TXS} OK: ${result.txid} (Mempool: ${mpCount + 1})`);
        successCount++;
      }
    } catch (e) {
      const eMsg = String(e.message || e);
      if (eMsg.includes('TooMuchChaining') || eMsg.includes('TooManyPendingTransactions')) {
          console.log(`   ⛓️  Chaining limit error in catch. Pausing...`);
          i--;
          await sleep(300000);
          continue;
      }
      console.error(`Tx ${i + 1}/${NUM_TXS} error: ${eMsg}`);
      failCount++;
    }
    
    // Tiny delay between successful broadcasts
    await sleep(2000);
  }

  console.log(`\nDone! ${successCount} succeeded, ${failCount} failed.`);
}

runInteractions().catch(console.error);
