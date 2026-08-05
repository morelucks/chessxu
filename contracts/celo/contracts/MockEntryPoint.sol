// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/IStakeManager.sol";
import "@account-abstraction/contracts/interfaces/UserOperation.sol";

/**
 * @dev Minimal mock EntryPoint for unit tests.
 *      Only implements the functions called by BasePaymaster/ChessxuPaymaster.
 */
contract MockEntryPoint is IEntryPoint {
    mapping(address => uint256) private _deposits;

    function depositTo(address account) external payable override {
        _deposits[account] += msg.value;
    }

    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external override {
        require(_deposits[msg.sender] >= withdrawAmount, "insufficient deposit");
        _deposits[msg.sender] -= withdrawAmount;
        withdrawAddress.transfer(withdrawAmount);
    }

    function getDepositInfo(address account) external view override returns (DepositInfo memory info) {
        info.deposit = uint112(_deposits[account]);
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _deposits[account];
    }

    // ── Stub implementations (not used in tests) ──────────────────────────

    function handleOps(UserOperation[] calldata, address payable) external override {}
    function handleAggregatedOps(UserOpsPerAggregator[] calldata, address payable) external override {}
    function simulateValidation(UserOperation calldata) external override {}
    
    function addStake(uint32) external payable override {}
    function unlockStake() external override {}
    function withdrawStake(address payable) external override {}

    function getUserOpHash(UserOperation calldata) external view override returns (bytes32) {
        return bytes32(0);
    }

    function getNonce(address, uint192) external view override returns (uint256) {
        return 0;
    }
    function incrementNonce(uint192) external override {}
    function getSenderAddress(bytes memory) external override {}
    function simulateHandleOp(UserOperation calldata, address, bytes calldata) external override {}

    receive() external payable {}
}
