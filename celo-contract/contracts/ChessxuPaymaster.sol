// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

/**
 * @title ChessxuPaymaster
 * @notice ERC-4337 VerifyingPaymaster that sponsors gas for Chessxu game transactions.
 *         Only whitelisted function selectors on the Chessxu game contract are sponsored.
 *         Rate limiting prevents a single address from draining the paymaster.
 */
contract ChessxuPaymaster is BasePaymaster {
    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice The Chessxu game contract whose calls we sponsor.
    address public chessxuContract;

    /// @notice Whitelisted function selectors (submitMove, createGame, joinGame, resign).
    mapping(bytes4 => bool) public allowedSelectors;

    /// @notice Max sponsored transactions per address per 24-hour window.
    uint256 public maxTxPerDay;

    /// @notice Per-address rate-limit tracking.
    mapping(address => uint256) public txCountToday;
    mapping(address => uint256) public windowStart;

    uint256 private constant ONE_DAY = 1 days;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ContractUpdated(address indexed newContract);
    event SelectorUpdated(bytes4 indexed selector, bool allowed);
    event RateLimitUpdated(uint256 newMax);
    event Sponsored(address indexed sender, bytes4 selector);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _entryPoint  ERC-4337 EntryPoint address.
     * @param _chessxu     Chessxu game contract address.
     * @param _maxTxPerDay Maximum sponsored txns per address per day.
     */
    constructor(
        IEntryPoint _entryPoint,
        address _chessxu,
        uint256 _maxTxPerDay
    ) BasePaymaster(_entryPoint) {
        chessxuContract = _chessxu;
        maxTxPerDay = _maxTxPerDay;

        // Whitelist game function selectors
        _setSelector(bytes4(keccak256("submitMove(uint256,string)")), true);
        _setSelector(bytes4(keccak256("createGame(uint256,bool)")), true);
        _setSelector(bytes4(keccak256("joinGame(uint256)")), true);
        _setSelector(bytes4(keccak256("resign(uint256)")), true);
    }

    // ─── Owner functions ──────────────────────────────────────────────────────

    /// @notice Update the whitelisted Chessxu contract address.
    function setChessxuContract(address _contract) external onlyOwner {
        chessxuContract = _contract;
        emit ContractUpdated(_contract);
    }

    /// @notice Add or remove a whitelisted function selector.
    function setSelector(bytes4 selector, bool allowed) external onlyOwner {
        _setSelector(selector, allowed);
    }

    /// @notice Update the per-address daily transaction limit.
    function setMaxTxPerDay(uint256 _max) external onlyOwner {
        maxTxPerDay = _max;
        emit RateLimitUpdated(_max);
    }

    /// @notice Deposit CELO into the EntryPoint to fund sponsorship.
    function depositToEntryPoint() external payable onlyOwner {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    /// @notice Withdraw CELO from the EntryPoint back to owner.
    function withdrawFromEntryPoint(uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(payable(owner()), amount);
    }

    // ─── BasePaymaster overrides ──────────────────────────────────────────────

    /**
     * @inheritdoc BasePaymaster
     * @dev Validates that:
     *   1. The UserOp targets the Chessxu contract.
     *   2. The called function selector is whitelisted.
     *   3. The sender has not exceeded the daily rate limit.
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32, /* userOpHash */
        uint256  /* maxCost */
    )
        internal
        override
        returns (bytes memory context, uint256 validationData)
    {
        // Decode callData: first 20 bytes = target, rest = inner calldata
        // For ERC-4337 simple account, callData encodes (target, value, data)
        // We decode the inner call target and selector.
        (address target, , bytes memory innerData) = abi.decode(
            userOp.callData[4:], // skip execute() selector
            (address, uint256, bytes)
        );

        require(target == chessxuContract, "Paymaster: wrong target");
        require(innerData.length >= 4, "Paymaster: no selector");

        bytes4 selector = bytes4(innerData[0]) |
            (bytes4(innerData[1]) >> 8) |
            (bytes4(innerData[2]) >> 16) |
            (bytes4(innerData[3]) >> 24);

        require(allowedSelectors[selector], "Paymaster: selector not allowed");

        // Rate limiting
        address sender = userOp.sender;
        _checkAndUpdateRateLimit(sender);

        emit Sponsored(sender, selector);

        // validationData = 0 means valid, no time range
        return (abi.encode(sender, selector), 0);
    }

    /// @dev Called after the UserOp executes (no-op here).
    function _postOp(
        PostOpMode, /* mode */
        bytes calldata, /* context */
        uint256, /* actualGasCost */
        uint256  /* actualUserOpFeePerGas */
    ) internal override {}

    // ─── Internal helpers ─────────────────────────────────────────────────────

    function _setSelector(bytes4 selector, bool allowed) internal {
        allowedSelectors[selector] = allowed;
        emit SelectorUpdated(selector, allowed);
    }

    function _checkAndUpdateRateLimit(address sender) internal {
        uint256 now_ = block.timestamp;
        if (now_ >= windowStart[sender] + ONE_DAY) {
            // New window
            windowStart[sender] = now_;
            txCountToday[sender] = 0;
        }
        require(txCountToday[sender] < maxTxPerDay, "Paymaster: rate limit exceeded");
        txCountToday[sender]++;
    }

    // ─── Receive ──────────────────────────────────────────────────────────────

    receive() external payable {}
}
