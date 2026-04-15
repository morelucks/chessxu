/**
 * Celo Fee Currency Abstraction Utility
 *
 * Selects the best ERC-20 fee currency that the user has enough balance
 * to cover gas with, enabling fully gasless-feeling UX for MiniPay users
 * who only hold stablecoins (no native CELO required).
 *
 * Algorithm:
 *  1. Estimate gas for the target transaction.
 *  2. Add a safety buffer (20 %) + fee-abstraction protocol overhead.
 *  3. For each supported currency, probe wallet support via a zero-value
 *     `estimateGas` with `feeCurrency` set, then compare the user's token
 *     balance against the estimated fee cost.
 *  4. Return the first currency that can cover the fee.
 */
import { CELO_FEE_CURRENCIES } from '../chess/blockchainConstants';

// ---------- ABI fragments ----------
const ERC20_BALANCE_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// ---------- Constants ----------
/** 20 % safety margin on gas estimates */
const GAS_SAFETY_NUMERATOR = BigInt(12);
const GAS_SAFETY_DENOMINATOR = BigInt(10);

/** Extra gas the fee-abstraction debit/credit calls consume */
const FEE_ABSTRACTION_GAS_OVERHEAD = BigInt(50_000);

// ---------- Helpers ----------
const pow10 = (exp: number): bigint => {
  let v = 1n;
  for (let i = 0; i < exp; i++) v *= 10n;
  return v;
};

/** Normalize an amount to 18 decimals so that comparisons are apples-to-apples */
const normalizeTo18 = (amount: bigint, decimals: number): bigint => {
  if (decimals === 18) return amount;
  return decimals < 18
    ? amount * pow10(18 - decimals)
    : amount / pow10(decimals - 18);
};

// ---------- Public API ----------
export interface SelectFeeCurrencyParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publicClient: any;
  account: `0x${string}`;
  to: `0x${string}`;
  data?: `0x${string}`;
  value?: bigint;
}

/**
 * Selects the first supported Celo fee currency with enough balance to cover
 * gas for the given transaction.  Throws if none qualifies.
 */
export async function selectSupportedFeeCurrency({
  publicClient,
  account,
  to,
  data,
  value = 0n,
}: SelectFeeCurrencyParams): Promise<`0x${string}`> {
  // 1. Estimate base gas on the target transaction
  let baseGas: bigint;
  try {
    baseGas = await publicClient.estimateGas({ account, to, data, value });
  } catch (error: unknown) {
    const msg =
      (error as { shortMessage?: string })?.shortMessage ||
      (error as Error)?.message ||
      'Transaction simulation failed before fee currency selection.';
    throw new Error(`Transaction cannot be executed: ${msg}`);
  }

  const effectiveGas = baseGas + FEE_ABSTRACTION_GAS_OVERHEAD;

  // 2. De-duplicate currencies (by token address)
  const seen = new Set<string>();
  const candidates = CELO_FEE_CURRENCIES.filter((c) => {
    const k = c.tokenAddress.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // 3. Probe each currency
  for (const currency of candidates) {
    try {
      const [balance, gasPriceHex] = await Promise.all([
        publicClient.readContract({
          address: currency.tokenAddress as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: 'balanceOf',
          args: [account],
        }),
        publicClient.request({
          method: 'eth_gasPrice',
          params: [currency.tokenAddress],
        }),
      ]);

      // Probe that the wallet / network actually supports this feeCurrency
      await publicClient.estimateGas({
        account,
        to: account,
        value: 0n,
        feeCurrency: currency.tokenAddress as `0x${string}`,
      });

      const gasPrice = BigInt(gasPriceHex as string);
      const estimatedFee =
        (effectiveGas * gasPrice * GAS_SAFETY_NUMERATOR) /
        GAS_SAFETY_DENOMINATOR;

      const normalizedBalance = normalizeTo18(balance, currency.decimals);

      if (normalizedBalance >= estimatedFee) {
        return currency.tokenAddress as `0x${string}`;
      }
    } catch {
      // Currency unsupported or insufficient – skip
      continue;
    }
  }

  throw new Error(
    'No supported fee currency has enough balance to cover gas. ' +
    'Use MiniPay or Valora and ensure you hold cUSD, USDC, USDT, cEUR, or cREAL.',
  );
}
