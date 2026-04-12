import { useEffect } from 'react';
import useAppStore from '../zustand/store';
import celoService from '../chess/services/celoService';

export const useMiniPay = () => {
  const setCeloAddress = useAppStore((state) => state.setCeloAddress);
  const setActiveChain = useAppStore((state) => state.setActiveChain);

  useEffect(() => {
    const checkAndConnectMiniPay = async () => {
      // Check if the current environment is MiniPay
      if (window.ethereum && (window.ethereum as any).isMiniPay) {
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
  }, [setCeloAddress, setActiveChain]);
};

export default useMiniPay;
