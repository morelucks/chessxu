import type { PrivyClientConfig } from "@privy-io/react-auth";

export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || "cmrxc5jws00p20bl67erxwjtg";

export const privyConfig: { appId: string; config: PrivyClientConfig } = {
  appId: PRIVY_APP_ID,
  config: {
    appearance: {
      theme: 'dark',
      accentColor: '#6366f1',
      logo: '/logo.png',
      showWalletLoginFirst: true,