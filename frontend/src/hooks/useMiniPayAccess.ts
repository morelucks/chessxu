import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useToaster } from '../components/ui/toasts/ToasterProvider';
import { CELO_CONFIG } from '../chess/blockchainConstants';
import celoService from '../chess/services/celoService';
import useAppStore from '../zustand/store';

function getActiveAccess(expiresAt: string | null) {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() > Date.now();
}

export function useMiniPayAccess() {
  const { addToast, updateToast } = useToaster();
  const address = useAppStore((state) => state.celoAddress);
  const activeChain = useAppStore((state) => state.activeChain);
  const detected = useAppStore((state) => state.miniPayDetected);
  const expiresAt = useAppStore((state) => state.miniPayAccessExpiresAt);
  const setMiniPayAccess = useAppStore((state) => state.setMiniPayAccess);
  const clearMiniPayAccess = useAppStore((state) => state.clearMiniPayAccess);
  const [cusdBalance, setCusdBalance] = useState<string | null>(null);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const hasAccess = useMemo(() => getActiveAccess(expiresAt), [expiresAt]);
  const requiresAccess = detected || activeChain === 'celo';

  useEffect(() => {
    if (!hasAccess && expiresAt) {
      clearMiniPayAccess();
    }
  }, [clearMiniPayAccess, expiresAt, hasAccess]);

  const refreshBalance = async () => {
    if (!address) {
      setCusdBalance(null);
      return null;
    }

    setIsRefreshingBalance(true);
    try {
      const balance = await celoService.getStableTokenBalance(address as `0x${string}`, CELO_CONFIG.CUSD_ADDRESS);
      const formatted = formatUnits(balance, 18);
      setCusdBalance(formatted);
      return formatted;
    } catch (error) {
      console.error('Failed to refresh cUSD balance:', error);
      return null;
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [address]);

  const purchaseAccess = async () => {
    if (!address) {
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

      const txHash = await celoService.payForDailyAccess(address);
      updateToast(toastId, {
        txId: txHash,
        status: 'pending',
        message: 'Payment sent. Verifying onchain confirmation.',
      });

      const verified = await celoService.verifyDailyAccessPayment(txHash, address);
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

  return {
    cusdBalance,
    expiresAt,
    hasAccess,
    isPurchasing,
    isRefreshingBalance,
    purchaseAccess,
    refreshBalance,
    requiresAccess,
  };
}

export default useMiniPayAccess;
