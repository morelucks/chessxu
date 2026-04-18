import { useEffect, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import useAppStore from "../zustand/store";

/**
 * Hook that detects the Farcaster Mini App environment,
 * performs auto sign-in, and stores user context.
 *
 * Should be called once from the App root.
 */
export function useFarcaster() {
  const setIsFarcaster = useAppStore((s) => s.setIsFarcaster);
  const setFarcasterUser = useAppStore((s) => s.setFarcasterUser);
  const setAddress = useAppStore((s) => s.setAddress);
  const setCeloAddress = useAppStore((s) => s.setCeloAddress);
  const setActiveChain = useAppStore((s) => s.setActiveChain);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const isFarcaster = useAppStore((s) => s.isFarcaster);

  const didAttempt = useRef(false);

  useEffect(() => {
    if (didAttempt.current) return;
    didAttempt.current = true;

    let cancelled = false;

    const autoLogin = async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp();
        if (!inMiniApp || cancelled) return;

        setIsFarcaster(true);

        // Signal ready to dismiss the Farcaster splash screen
        await sdk.actions.ready();

        // Grab user context from the SDK
        const context = await sdk.context;
        if (cancelled) return;

        if (context?.user) {
          setFarcasterUser({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          });
        }

        // If already authenticated from a previous session, skip sign-in
        if (isAuthenticated) return;

        // Try to get an Ethereum provider for wallet address
        try {
          const ethProvider = await sdk.wallet.getEthereumProvider();
          if (ethProvider && !cancelled) {
            const accounts = (await ethProvider.request({
              method: "eth_requestAccounts",
            })) as string[];

            if (accounts?.[0]) {
              setCeloAddress(accounts[0]);
              setAddress(accounts[0]);
              setActiveChain("celo");
              console.log("[Farcaster] Auto-connected wallet:", accounts[0]);
              return;
            }
          }
        } catch (walletErr) {
          console.warn("[Farcaster] Wallet provider unavailable, trying signIn:", walletErr);
        }

        // Fallback: use signIn to authenticate via Farcaster identity
        try {
          const nonce = crypto.randomUUID();
          const result = await sdk.actions.signIn({ nonce });
          if (result && !cancelled) {
            // Use the FID as a pseudo-address for display purposes
            const fid = context?.user?.fid;
            if (fid) {
              const farcasterAddr = `fc:${fid}`;
              setAddress(farcasterAddr);
              console.log("[Farcaster] Signed in with FID:", fid);
            }
          }
        } catch (signInErr) {
          console.warn("[Farcaster] signIn failed:", signInErr);
        }
      } catch (err) {
        console.error("[Farcaster] Auto-login error:", err);
      }
    };

    void autoLogin();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isFarcaster };
}
