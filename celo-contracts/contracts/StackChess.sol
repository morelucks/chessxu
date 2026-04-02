// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract StackChess {
    address public owner;

    uint256 public nextGameId = 1;

    struct Game {
        address playerW;
        address playerB;
        uint256 wager;
        bool isNative;
        string boardState;
        string turn; // "w" or "b"
        uint8 status; // 0 = Waiting, 1 = Ongoing, 2 = White Wins, 3 = Black Wins, 4 = Draw, 5 = Cancelled
    }

    mapping(uint256 => Game) public games;

    // Optional Token (for token wagers)
    IERC20 public stackchessToken;

    // Errors
    error NotOwner();
    error GameNotFound();
    error NotWaiting();
    error AlreadyJoined();
    error InvalidWager();
    error NotPlayer();
    error NotYourTurn();
    error GameNotActive();
    error InvalidStatus();
    error TransferFailed();

    constructor(address _tokenAddress) {
        owner = msg.sender;
        if (_tokenAddress != address(0)) {
            stackchessToken = IERC20(_tokenAddress);
        }
    }

    function createGame(uint256 wager, bool isNative) external payable returns (uint256) {
        uint256 gameId = nextGameId;

        if (isNative) {
            if (wager > 0) {
                if (msg.value != wager) revert InvalidWager();
            }
        } else {
            if (msg.value > 0) revert InvalidWager();
            if (wager > 0) {
                bool success = stackchessToken.transferFrom(msg.sender, address(this), wager);
                if (!success) revert TransferFailed();
            }
        }

        games[gameId] = Game({
            playerW: msg.sender,
            playerB: address(0),
            wager: wager,
