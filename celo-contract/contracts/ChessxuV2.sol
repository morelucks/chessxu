// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ChessxuV2
 * @dev Chessxu smart contract with ERC-2771 meta-transaction support.
 * Allows sponsored transactions via a Trusted Forwarder.
 */

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ChessxuV2 is ERC2771Context {
    address public owner;
    uint256 public nextGameId = 1;

    struct Game {
        address playerW; // Address of the white player
        address playerB; // Address of the black player (zero address if waiting)
        uint256 wager; // Amount staked for the game
        bool isNative; // True if wagered in native currency (CELO), false for ERC20
        string boardState; // Current board FEN string
        string turn; // Current turn: "w" or "b"
        uint8 status; // 0=Wait, 1=Live, 2=W, 3=B, 4=D, 5=X
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

    /**
     * @notice Create a new chess game
     * @param wager Amount to wager
     * @param isNative True for CELO, false for ChessxuToken
     * @return gameId The ID of the newly created game
     */
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

    /**
     * @notice Join an existing chess game
     * @param gameId The ID of the game to join
     */
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

    /**
     * @notice Submit a chess move
     * @param gameId The ID of the game
     * @param newBoardState The new board FEN string after the move
     */
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

    function resolveGame(uint256 gameId, uint8 newStatus) external {
        if (_msgSender() != owner) revert NotOwner();
        Game storage game = games[gameId];
        if (game.playerW == address(0)) revert GameNotFound();
        if (game.status != 0 && game.status != 1) revert GameNotActive();
        if (newStatus < 2 || newStatus > 5) revert InvalidStatus();

        uint256 prize = game.wager * 2;
        uint256 wager = game.wager;

        if (newStatus == 2) {
            // White wins
            if (game.isNative) {
                if (prize > 0) payable(game.playerW).transfer(prize);
            } else {
                if (prize > 0) {
                    bool success = chessxuToken.transfer(game.playerW, prize);
                    if (!success) revert TransferFailed();
                }
            }
        } else if (newStatus == 3) {
            // Black wins
            if (game.playerB != address(0) && prize > 0) {
                if (game.isNative) {
                    payable(game.playerB).transfer(prize);
                } else {
                    bool success = chessxuToken.transfer(game.playerB, prize);
                    if (!success) revert TransferFailed();
                }
            }
        } else {
            // Draw or Cancel - Refund wagers
            if (game.isNative) {
                if (wager > 0) {
                    payable(game.playerW).transfer(wager);
                    if (game.playerB != address(0)) {
                        payable(game.playerB).transfer(wager);
                    }
                }
            } else {
                if (wager > 0) {
                    bool curSuccess = chessxuToken.transfer(game.playerW, wager);
                    if (!curSuccess) revert TransferFailed();

                    if (game.playerB != address(0)) {
                        bool successB = chessxuToken.transfer(game.playerB, wager);
                        if (!successB) revert TransferFailed();
                    }
                }
            }
        }

        game.status = newStatus;
    }

    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    function getLastGameId() external view returns (uint256) {
        return nextGameId - 1;
    }
}
