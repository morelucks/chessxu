import { showConnect } from "@stacks/connect-react";
import useAppStore, { userSession } from "../zustand/store";
import celoService from "../chess/services/celoService";

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
  chain?: 'stacks' | 'celo';
}

export function useWalletAuth() {
  const address = useAppStore((state) => state.address);
  const isLoading = useAppStore((state) => state.isLoading);
  const setAddress = useAppStore((state) => state.setAddress);
  const setCeloAddress = useAppStore((state) => state.setCeloAddress);
  const setActiveChain = useAppStore((state) => state.setActiveChain);
  const setIsLoading = useAppStore((state) => state.setIsLoading);
  const logout = useAppStore((state) => state.logout);

  const syncAddressFromSession = () => {
    const nextAddress = getSessionAddress();
    setAddress(nextAddress);
    return nextAddress;
  };

  const connect = async ({ onFinish, onCancel, chain }: ConnectOptions = {}) => {
    setIsLoading(true);

    try {
      // Detect if we should use Celo (MiniPay or explicit)
      const ethereum = (window as any).ethereum;
      const isMiniPay = typeof window !== 'undefined' && ethereum?.isMiniPay;
      const targetChain = chain || (isMiniPay ? 'celo' : 'stacks');

      console.log(`Connecting to ${targetChain}...`);

      if (targetChain === 'celo') {
        try {
          if (!ethereum) {
            throw new Error("No EVM wallet found (like MetaMask or MiniPay)");
          }
          const celoAddr = await celoService.connectWallet();
          setCeloAddress(celoAddr);
          setActiveChain('celo');
          setIsLoading(false);
          onFinish?.(celoAddr);
        } catch (error) {
          console.error("Celo connection failed:", error);
          setIsLoading(false);
          onCancel?.();
        }
        return;
      }

      // Default to Stacks
      try {
        showConnect({
          appDetails: {
            name: "Chessxu",
            icon: window.location.origin + "/favicon.ico",
          },
          onFinish: () => {
            const nextAddress = syncAddressFromSession();
            setActiveChain('stacks');
            setIsLoading(false);
            onFinish?.(nextAddress);
          },
          onCancel: () => {
            setIsLoading(false);
            onCancel?.();
          },
        });
      } catch (stacksError) {
        console.error("Stacks showConnect error:", stacksError);
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
    syncAddressFromSession,
  };
}
