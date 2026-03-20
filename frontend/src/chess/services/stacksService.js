import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { NETWORK } from '../stacksConstants';

const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

/**
 * Service to handle all Stacks blockchain interactions
 */
const stacksService = {
  network,
  
  // Placeholder for future functions
};

export default stacksService;
