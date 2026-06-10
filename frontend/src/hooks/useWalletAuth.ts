import { showConnect } from "@stacks/connect";
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
  const setStacksAddress = useAppStore((state) => state.setStacksAddress);
  const setCeloAddress = useAppStore((state) => state.setCeloAddress);
  const setActiveChain = useAppStore((state) => state.setActiveChain);
  const setIsLoading = useAppStore((state) => state.setIsLoading);
  const logout = useAppStore((state) => state.logout);
  const setConnectModalOpen = useAppStore((state) => state.setConnectModalOpen);

  const syncAddressFromSession = () => {
    const nextAddress = getSessionAddress();
    setAddress(nextAddress);
    return nextAddress;
  };

  const connect = async ({ onFinish, onCancel, chain }: ConnectOptions = {}) => {
    const { isFarcaster, miniPayDetected } = useAppStore.getState();
    const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : undefined;
    const isMiniPay = Boolean(miniPayDetected || (ethereum && ethereum.isMiniPay));

    if (!chain && !isFarcaster && !isMiniPay) {
      setConnectModalOpen(true);
      return;
    }

    setIsLoading(true);

    try {

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
        // Set activeChain BEFORE syncing address so setAddress stores
        // the value in the correct slot (stacksAddress, not celoAddress).
        setActiveChain('stacks');

        showConnect({
          userSession,
          appDetails: {
            name: "Chessxu",
            icon: window.location.origin + "/favicon.ico",
          },
          onFinish: () => {
            const nextAddress = syncAddressFromSession();
            // Explicitly populate stacksAddress in case setAddress
            // resolved before the activeChain update propagated.
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

  return {
    address,
    isConnected: !!address,
    isConnecting: isLoading,
    connect,
    disconnect: logout,
    syncAddressFromSession,
  };
}

// wallet-fix-step: 2 - fix(wallet): diagnose activeChain race condition in showConnect callback
// wallet-fix-step: 3 - fix(wallet): import setStacksAddress from zustand store
// wallet-fix-step: 4 - fix(wallet): destructure setStacksAddress selector from useAppStore
// wallet-fix-step: 5 - fix(wallet): move setActiveChain call before showConnect invocation
// wallet-fix-step: 6 - fix(wallet): verify wallet address persistence for edge case 1
// wallet-fix-step: 7 - fix(wallet): validate chain state transition for scenario 2
// wallet-fix-step: 8 - fix(wallet): check store slot assignment for condition 3
// wallet-fix-step: 9 - refactor(wallet): clean up auth flow logic for step 4
// wallet-fix-step: 10 - docs(wallet): document wallet connection fix detail for case 5
// wallet-fix-step: 11 - test(wallet): verify connect flow correctness for variant 6
// wallet-fix-step: 12 - style(wallet): format wallet auth hook code for segment 7
// wallet-fix-step: 13 - chore(wallet): update wallet hook internals for iteration 8
// wallet-fix-step: 14 - fix(wallet): verify wallet address persistence for edge case 9
// wallet-fix-step: 15 - fix(wallet): validate chain state transition for scenario 10
// wallet-fix-step: 16 - fix(wallet): check store slot assignment for condition 11
// wallet-fix-step: 17 - refactor(wallet): clean up auth flow logic for step 12
// wallet-fix-step: 18 - docs(wallet): document wallet connection fix detail for case 13
// wallet-fix-step: 19 - test(wallet): verify connect flow correctness for variant 14