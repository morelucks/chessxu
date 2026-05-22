// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ChessxuV2 is ERC2771Context {
    address public owner;
    uint256 public nextGameId = 1;

    struct Game {
        address playerW;
        address playerB;
        uint256 wager;
        bool isNative;
        string boardState;
        string turn;
        uint8 status;
    }

    mapping(uint256 => Game) public games;
    IERC20 public chessxuToken;

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

    constructor(address _tokenAddress, address _trustedForwarder)
        ERC2771Context(_trustedForwarder)
    {
        owner = _msgSender();
        if (_tokenAddress != address(0)) {
            chessxuToken = IERC20(_tokenAddress);
        }
    }
}
