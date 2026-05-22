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

    function createGame(uint256 wager, bool isNative) external payable returns (uint256) {
        uint256 gameId = nextGameId;

        if (isNative) {
            if (wager > 0) {
                if (msg.value != wager) revert InvalidWager();
            }
        } else {
            if (msg.value > 0) revert InvalidWager();
            if (wager > 0) {
                bool success = chessxuToken.transferFrom(_msgSender(), address(this), wager);
                if (!success) revert TransferFailed();
            }
        }

        games[gameId] = Game({
            playerW: _msgSender(),
            playerB: address(0),
            wager: wager,
            isNative: isNative,
            boardState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
            turn: "w",
            status: 0
        });

        nextGameId = gameId + 1;
        return gameId;
    }

    function joinGame(uint256 gameId) external payable {
        Game storage game = games[gameId];
        if (game.playerW == address(0)) revert GameNotFound();
        if (game.status != 0) revert NotWaiting();
        if (_msgSender() == game.playerW) revert AlreadyJoined();

        if (game.isNative) {
            if (game.wager > 0) {
                if (msg.value != game.wager) revert InvalidWager();
            }
        } else {
            if (msg.value > 0) revert InvalidWager();
            if (game.wager > 0) {
                bool success = chessxuToken.transferFrom(_msgSender(), address(this), game.wager);
                if (!success) revert TransferFailed();
            }
        }

        game.playerB = _msgSender();
        game.status = 1;
    }

    function submitMove(uint256 gameId, string calldata /* moveStr */, string calldata newBoardState) external {
        Game storage game = games[gameId];
        if (game.playerW == address(0)) revert GameNotFound();
        if (game.status != 1) revert GameNotActive();

        if (keccak256(abi.encodePacked(game.turn)) == keccak256(abi.encodePacked("w"))) {
            if (_msgSender() != game.playerW) revert NotYourTurn();
            game.turn = "b";
        } else {
            if (_msgSender() != game.playerB) revert NotYourTurn();
            game.turn = "w";
        }

        game.boardState = newBoardState;
    }

    function resign(uint256 gameId) external {
        Game storage game = games[gameId];
        if (game.playerW == address(0)) revert GameNotFound();
        if (game.status != 1) revert GameNotActive();
        if (_msgSender() != game.playerW && _msgSender() != game.playerB) revert NotPlayer();

        uint256 prize = game.wager * 2;

        if (_msgSender() == game.playerW) {
            // P1 resigned, P2 wins
            game.status = 3;
            if (prize > 0) {
                if (game.isNative) {
                    payable(game.playerB).transfer(prize);
                } else {
                    bool success = chessxuToken.transfer(game.playerB, prize);
                    if (!success) revert TransferFailed();
                }
            }
        } else {
            // P2 resigned, P1 wins
            game.status = 2;
            if (prize > 0) {
                if (game.isNative) {
                    payable(game.playerW).transfer(prize);
                } else {
                    bool success = chessxuToken.transfer(game.playerW, prize);
                    if (!success) revert TransferFailed();
                }
            }
        }
    }
}
