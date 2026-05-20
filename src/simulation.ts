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
