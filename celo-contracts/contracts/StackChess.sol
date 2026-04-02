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
