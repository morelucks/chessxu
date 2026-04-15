/**
 * MiniPay wallet TypeScript declarations.
 *
 * MiniPay injects an EIP-1193 provider at `window.ethereum` with an extra
 * `isMiniPay` boolean flag. These ambient declarations make that flag
 * type-safe across the entire codebase.
 */

interface MiniPayEthereumProvider {
  isMiniPay?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

interface Window {
  ethereum?: MiniPayEthereumProvider & Record<string, unknown>;
  provider?: MiniPayEthereumProvider & Record<string, unknown>;
}
