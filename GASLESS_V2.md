# Gasless Chessxu V2 - ERC-2771 Integration

## Overview
Chessxu V2 implements ERC-2771 meta-transactions to support sponsored play via a Trusted Forwarder. This allows the Paymaster to sponsor gas fees while correctly identifying the original player as the `msg.sender` equivalent.

## Technical Details
- **Base Layer**: `ERC2771Context` (OpenZeppelin)
- **Trusted Forwarder**: Configured during deployment via the constructor.
- **Context Handling**: Replaced all `msg.sender` with `_msgSender()`.

## Wager Handling
- **Native (CELO)**: Wagers must be specified in Wei.
- **Tokens (ERC-20)**: Wagers must be specified in the base unit of the token (e.g., 18 decimals).

## Next Steps
- **EIP-712**: Implement typed data signing for better security.
- **Gasless Gateway**: Integrate with a Gasless Gateway (e.g., Gelato, OpenZeppelin Defender) to relay meta-transactions.
