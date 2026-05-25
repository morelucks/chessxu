import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useToaster } from '../components/ui/toasts/ToasterProvider';
import { CELO_CONFIG, NETWORK, CHESSXU_DEPLOYER } from '../chess/blockchainConstants';
import celoService from '../chess/services/celoService';
import useAppStore from '../zustand/store';
import { openSTXTransfer } from '@stacks/connect';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

function getActiveAccess(expiresAt: string | null) {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() > Date.now();
}

export const DAILY_ACCESS_STX = "0.5";

export function useMiniPayAccess() {
  const { addToast, updateToast } = useToaster();
  const celoAddress = useAppStore((state) => state.celoAddress);
  const stacksAddress = useAppStore((state) => state.stacksAddress);
  const activeChain = useAppStore((state) => state.activeChain);
  const detected = useAppStore((state) => state.miniPayDetected);
  const expiresAt = useAppStore((state) => state.miniPayAccessExpiresAt);
  const setMiniPayAccess = useAppStore((state) => state.setMiniPayAccess);
  const clearMiniPayAccess = useAppStore((state) => state.clearMiniPayAccess);
  const [cusdBalance, setCusdBalance] = useState<string | null>(null);
  const [celoNativeBalance, setCeloNativeBalance] = useState<string | null>(null);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const hasAccess = useMemo(() => getActiveAccess(expiresAt), [expiresAt]);
  const gasSponsored = celoService.gasSponsored;
  
  // Daily access is required on Stacks, or on Celo when gas is not sponsored
  const requiresAccess = activeChain === 'stacks' || ((detected || activeChain === 'celo') && !gasSponsored);

  useEffect(() => {
    if (!hasAccess && expiresAt) {
      clearMiniPayAccess();
    }
  }, [clearMiniPayAccess, expiresAt, hasAccess]);

  const refreshBalance = async () => {
    if (activeChain === 'stacks') {
      setCusdBalance(null);
      setCeloNativeBalance(null);
      return null;
    }

    if (!celoAddress) {
      setCusdBalance(null);
      setCeloNativeBalance(null);
      return null;
    }

    setIsRefreshingBalance(true);
    try {
      const [balance, nativeBalance] = await Promise.all([
        celoService.getStableTokenBalance(celoAddress as `0x${string}`, CELO_CONFIG.CUSD_ADDRESS),
        celoService.getNativeBalance(celoAddress as `0x${string}`),
      ]);
      const formatted = formatUnits(balance, 18);
      const formattedNative = formatUnits(nativeBalance, 18);
      setCusdBalance(formatted);
      setCeloNativeBalance(formattedNative);
      return formatted;
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      return null;
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [celoAddress, activeChain]);

  const purchaseAccess = async () => {
    if (activeChain === 'stacks') {
      if (!stacksAddress) {
        throw new Error('Connect your Stacks wallet before paying for access.');
      }

      setIsPurchasing(true);
      const toastId = addToast({
        txId: '',
        status: 'pending',
        message: 'Preparing your Stacks access purchase.',
      });

      const stacksNetwork = NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

      try {
        const txId = await new Promise<string>((resolve, reject) => {
          openSTXTransfer({
            recipient: CHESSXU_DEPLOYER,
            amount: "500000", // 0.5 STX
            memo: "Daily Access Payment",
            network: stacksNetwork,
            onFinish: (data) => {
              resolve(data.txId);
            },
            onCancel: () => {
              reject(new Error('Transaction cancelled by user.'));
            }
          });
        });

        const nextExpiry = new Date(Date.now() + CELO_CONFIG.DAILY_ACCESS_DURATION_MS).toISOString();
        setMiniPayAccess(nextExpiry, txId);
        
        updateToast(toastId, {
          txId,
          status: 'success',
          message: 'Daily access unlocked on Stacks.',
        });
        
        return txId;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Stacks purchase failed.';
        updateToast(toastId, {
          status: 'error',
          message,
        });
        throw error;
      } finally {
        setIsPurchasing(false);
      }
    }

    // Celo Flow
    if (!celoAddress) {
      throw new Error('Connect your Celo wallet before paying for access.');
    }

    setIsPurchasing(true);
    const toastId = addToast({
      txId: '',
      status: 'pending',
      message: 'Preparing your MiniPay access purchase.',
    });

    try {
      await celoService.ensureCorrectNetwork();

      const txHash = await celoService.payForDailyAccess();
      updateToast(toastId, {
        txId: txHash,
        status: 'pending',
        message: 'Payment sent. Verifying onchain confirmation.',
      });

      const verified = await celoService.verifyDailyAccessPayment(txHash, celoAddress);
      if (!verified) {
        throw new Error('Payment verification failed.');
      }

      const nextExpiry = new Date(Date.now() + CELO_CONFIG.DAILY_ACCESS_DURATION_MS).toISOString();
      setMiniPayAccess(nextExpiry, txHash);
      updateToast(toastId, {
        txId: txHash,
        status: 'success',
        message: 'Daily access unlocked on Celo.',
      });
      await refreshBalance();
      return txHash;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MiniPay purchase failed.';
      updateToast(toastId, {
        status: 'error',
        message,
      });
      throw error;
    } finally {
      setIsPurchasing(false);
    }
  };

  const purchaseAccessWithCelo = async () => {
    if (!celoAddress) {
      throw new Error('Connect your Celo wallet before paying for access.');
    }

    setIsPurchasing(true);
    const toastId = addToast({
      txId: '',
      status: 'pending',
      message: 'Preparing your CELO access purchase.',
    });

    try {
      await celoService.ensureCorrectNetwork();

      const txHash = await celoService.payForDailyAccessWithCelo();
      updateToast(toastId, {
        txId: txHash,
        status: 'pending',
        message: 'Payment sent. Verifying onchain confirmation.',
      });
      setIsPurchasing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CELO purchase failed.';
      updateToast(toastId, { status: 'error', message });
      setIsPurchasing(false);
      throw error;
    }
  };

  const accessReason = gasSponsored 
    ? "Gas is sponsored by Chessxu foundation" 
    : activeChain === 'stacks'
      ? "Daily access payment required for Stacks Network"
      : (detected || activeChain === 'celo') 
        ? "Daily access payment required for this network" 
        : "Standard wallet - no daily access required";

  return {
    cusdBalance,
    expiresAt,
    hasAccess,
    isPurchasing,
    isRefreshingBalance,
    purchaseAccess,
    refreshBalance,
    requiresAccess,
    accessReason,
  };
}

export default useMiniPayAccess;
