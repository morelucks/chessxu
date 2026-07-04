import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useToaster } from '../components/ui/toasts/ToasterProvider';
import { CELO_CONFIG, NETWORK } from '../chess/blockchainConstants';
import celoService from '../chess/services/celoService';
import useAppStore from '../zustand/store';

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
  
  // Daily access is required on Celo when gas is not sponsored
  const requiresAccess = (detected || activeChain === 'celo') && !gasSponsored;

  useEffect(() => {
    if (!hasAccess && expiresAt) {
      clearMiniPayAccess();
    }
  }, [clearMiniPayAccess, expiresAt, hasAccess]);

  const refreshBalance = async () => {
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

      const verified = await celoService.verifyDailyAccessPaymentCelo(txHash, celoAddress);
      if (!verified) {
        throw new Error('Payment verification failed.');
      }

      const nextExpiry = new Date(Date.now() + CELO_CONFIG.DAILY_ACCESS_DURATION_MS).toISOString();
      setMiniPayAccess(nextExpiry, txHash);
      updateToast(toastId, {
        txId: txHash,
        status: 'success',
        message: 'Daily access unlocked with CELO.',
      });
      await refreshBalance();
      return txHash;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CELO purchase failed.';
      updateToast(toastId, { status: 'error', message });
      throw error;
    } finally {
      setIsPurchasing(false);
    }
  };

  const accessReason = gasSponsored 
    ? "Gas is sponsored by Chessxu foundation" 
    : (detected || activeChain === 'celo') 
      ? "Daily access payment required for this network" 
      : "Standard wallet - no daily access required";

  return {
    cusdBalance,
    celoNativeBalance,
    expiresAt,
    hasAccess,
    isPurchasing,
    isRefreshingBalance,
    purchaseAccess,
    purchaseAccessWithCelo,
    refreshBalance,
    requiresAccess,
    accessReason,
  };
}

export default useMiniPayAccess;
