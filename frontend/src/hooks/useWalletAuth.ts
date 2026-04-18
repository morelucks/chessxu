import { showConnect } from "@stacks/connect-react";
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
      const { isFarcaster } = useAppStore.getState();

      if (isFarcaster) {
        try {
          // Attempt the same logic as auto-login but manually triggered
          const ethProvider = await sdk.wallet.getEthereumProvider();
          if (ethProvider) {
            const accounts = (await ethProvider.request({ method: "eth_requestAccounts" })) as string[];
            if (accounts?.[0]) {
              setCeloAddress(accounts[0]);
              setAddress(accounts[0]);
              setActiveChain("celo");
              setIsLoading(false);
              onFinish?.(accounts[0]);
              return;
            }
          }
        } catch (warn) {
           console.warn("[Farcaster] Wallet connect failed during manual trigger:", warn);
        }

        try {
          const nonce = crypto.randomUUID();
          await sdk.actions.signIn({ nonce });
          const context = await sdk.context;
          const fid = context?.user?.fid;
          if (fid) {
             const farcasterAddr = `fc:${fid}`;
             setAddress(farcasterAddr);
             setIsLoading(false);
             onFinish?.(farcasterAddr);
             return;
          }
        } catch (error) {
          console.error("Farcaster sign-in failed:", error);
        }
      }

      // Detect if we should use Celo (EVM environments) or Stacks
      const ethereum = (window as any).ethereum;
      const targetChain = chain || (ethereum ? 'celo' : 'stacks');

      console.log(`Connecting to ${targetChain}...`);

      if (targetChain === 'celo') {
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
