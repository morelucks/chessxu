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
        }
        return;
      }

      if (chain === 'farcaster') {
        try {
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

      const targetChain = chain || (ethereum ? 'celo' : 'stacks');

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
        setActiveChain('stacks');

        showConnect({
          userSession,
          appDetails: {
            name: "Chessxu",
            icon: window.location.origin + "/favicon.ico",
          },
          onFinish: () => {
            const nextAddress = syncAddressFromSession();
            if (nextAddress) {
              setStacksAddress(nextAddress);
            }
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

  const disconnect = async () => {
    if (privyAuthenticated) {
      try {
        await privyLogout();
      } catch (err) {
        console.warn("Privy logout error:", err);
      }
    }
    storeLogout();
  };

  return {
    address,
    isConnected: !!address,
    isConnecting: isLoading,
    connect,
    disconnect,
    syncAddressFromSession,
  };
}
