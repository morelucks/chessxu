# Gasless Chessxu V2 - ERC-2771 Integration

## Overview
Chessxu V2 implements ERC-2771 meta-transactions to support sponsored play via a Trusted Forwarder. This allows the Paymaster to sponsor gas fees while correctly identifying the original player as the `msg.sender` equivalent.
