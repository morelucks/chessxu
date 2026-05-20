import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
  PostConditionMode,
  SignedContractCallOptions,
} from "@stacks/transactions";
import { StacksMainnet } from "@stacks/network";
import { CHESSXU_DEPLOYER, CONTRACTS } from "./index";

const network = new StacksMainnet();

const SIMULATION_CONFIG = {
  ACCOUNT_COUNT: 50,
  TRANSFER_AMOUNT: 1000000, // 1 CHESS (assuming 6 decimals)
  RETRY_ATTEMPTS: 3,
  POLLING_INTERVAL: 10000, // 10 seconds
};
