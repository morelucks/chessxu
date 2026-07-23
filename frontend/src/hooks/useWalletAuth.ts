import { useEffect } from "react";
import { showConnect } from "@stacks/connect";
import { usePrivy } from "@privy-io/react-auth";
import useAppStore, { userSession } from "../zustand/store";
import celoService from "../chess/services/celoService";
import { sdk } from "@farcaster/miniapp-sdk";

function getSessionAddress() {
  if (!userSession.isUserSignedIn()) {
    return null;
  }

  const userData = userSession.loadUserData();
  return userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet || null;
}

interface ConnectOptions {
  onFinish?: (address: string | null) => void;
  onCancel?: () => void;
  chain?: 'stacks' | 'celo' | 'privy' | 'farcaster';
}

export function useWalletAuth() {
  const address = useAppStore((state) => state.address);
  const isLoading = useAppStore((state) => state.isLoading);
  const setAddress = useAppStore((state) => state.setAddress);
  const setStacksAddress = useAppStore((state) => state.setStacksAddress);
  const setCeloAddress = useAppStore((state) => state.setCeloAddress);
  const setPrivyAddress = useAppStore((state) => state.setPrivyAddress);
  const setActiveChain = useAppStore((state) => state.setActiveChain);
  const setIsLoading = useAppStore((state) => state.setIsLoading);
  const storeLogout = useAppStore((state) => state.logout);
  const setConnectModalOpen = useAppStore((state) => state.setConnectModalOpen);

  const { login: privyLogin, logout: privyLogout, user: privyUser, authenticated: privyAuthenticated } = usePrivy();

  // Sync Privy user wallet address when authenticated via Privy
  useEffect(() => {
    if (privyAuthenticated && privyUser?.wallet?.address) {
      const privyAddr = privyUser.wallet.address;
      setPrivyAddress(privyAddr);
      setActiveChain('privy');
      setAddress(privyAddr);
    }
  }, [privyAuthenticated, privyUser, setPrivyAddress, setActiveChain, setAddress]);

  const syncAddressFromSession = () => {
    const nextAddress = getSessionAddress();
    setAddress(nextAddress);
    return nextAddress;
  };

  const connect = async ({ onFinish, onCancel, chain }: ConnectOptions = {}) => {
    const { isFarcaster, miniPayDetected } = useAppStore.getState();
    const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : undefined;
    const isMiniPay = Boolean(miniPayDetected || (ethereum && ethereum.isMiniPay));

    if (!chain) {
      if (isMiniPay) {
        chain = 'celo';
      } else {
        setConnectModalOpen(true);
        return;
      }
    }

    setIsLoading(true);

    try {
      if (chain === 'privy') {
        try {
          setActiveChain('privy');
          privyLogin();
          setIsLoading(false);
          onFinish?.(privyUser?.wallet?.address || null);
        } catch (privyErr) {
          console.error("Privy connect error:", privyErr);
          setIsLoading(false);
          onCancel?.();
      try {
        if (!ethereum) {
          throw new Error("No EVM wallet found (like MetaMask or Farcaster)");
        }
        const celoAddr = await celoService.connectWallet();
        setCeloAddress(celoAddr);
        setAddress(celoAddr);
        setActiveChain('celo');
        setIsLoading(false);
        onFinish?.(celoAddr);
      } catch (error) {
        console.error("Celo connection failed:", error);
        setIsLoading(false);
        onCancel?.();
      }
    } catch (globalError) {
      console.error("Global connection error:", globalError);
      setIsLoading(false);
      onCancel?.();
    }
  };

  return {
    address,
    isConnected: !!address,
    isConnecting: isLoading,
    connect,
    disconnect: logout,
  };
}
