/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import useAppStore from '../zustand/store';
import celoService from '../chess/services/celoService';

export const useMiniPay = () => {
  const setCeloAddress = useAppStore((state) => state.setCeloAddress);
  const setActiveChain = useAppStore((state) => state.setActiveChain);
  const setMiniPayDetected = useAppStore((state) => state.setMiniPayDetected);

  useEffect(() => {
    const checkAndConnectMiniPay = async () => {
      const provider = typeof window !== 'undefined' ? window.ethereum : undefined;
      const detected = Boolean(provider && (provider as any).isMiniPay);
      setMiniPayDetected(detected);

      // Check if the current environment is MiniPay
      if (detected) {
        try {
          // Because MiniPay auto-authenticates the user in the background, 
          // we can request the address directly without prompting the user.
          const address = await celoService.connectWallet();
          
          if (address) {
            // Set the state
            setCeloAddress(address);
            setActiveChain('celo');
            console.log('Successfully auto-connected to MiniPay with Celo Address: ', address);
          }
        } catch (error) {
          console.error('Failed to auto-connect to MiniPay:', error);
        }
      }
    };

    checkAndConnectMiniPay();
  }, [setCeloAddress, setActiveChain, setMiniPayDetected]);
};

export default useMiniPay;
