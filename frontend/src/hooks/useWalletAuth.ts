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

      if (chain === 'farcaster') {
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

        setIsLoading(false);
        onCancel?.();
        return;
      }

      // Celo connection (default)
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
