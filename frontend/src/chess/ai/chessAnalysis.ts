import arbiter from '../arbiter/arbiter';
import { getPieces } from '../arbiter/getMoves';

// Standard values for pieces
const PIECE_VALUES: Record<string, number> = {
    'p': 100,
    'n': 320,
    'b': 330,
    'r': 500,
    'q': 900,
    'k': 20000
};

// Piece-Square Tables (PST) from White's perspective
const pawnPST = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
];

const knightPST = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];

const bishopPST = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
];

const rookPST = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
];

const queenPST = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  5,-10],
    [-10,  0,  5,  0,  0,  5,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
];

const kingPST = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
];

// Helper to get PST value for a piece
function getPstValue(piece: string, x: number, y: number): number {
    const type = piece[1];
    const isWhite = piece[0] === 'w';
    const row = isWhite ? x : 7 - x;

    switch (type) {
        case 'p': return pawnPST[row][y];
        case 'n': return knightPST[row][y];
        case 'b': return bishopPST[row][y];
        case 'r': return rookPST[row][y];
        case 'q': return queenPST[row][y];
        case 'k': return kingPST[row][y];
        default: return 0;
    }
}

// Static evaluation of the board state
export function evaluateBoard(position: any[][]): number {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const piece = position[r][f];
            if (piece) {
                const colorMultiplier = piece[0] === 'w' ? 1 : -1;
                const value = PIECE_VALUES[piece[1]] || 0;
                const pstBonus = getPstValue(piece, r, f);
                score += colorMultiplier * (value + pstBonus);
            }
        }
    }
    return score;
}

// Convert row and file indices to standard algebraic notation (e.g. e4)
export function toAlgebraic(x: number, y: number): string {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    return `${files[y]}${ranks[x]}`;
}

export interface SuggestedMove {
    piece: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    notation: string;
    description: string;
    evaluation: number;
}

// Get descriptive helper text for a suggestion
export function getMoveDescription(piece: string, fromX: number, fromY: number, toX: number, toY: number): string {
    const fromSquare = toAlgebraic(fromX, fromY);
    const toSquare = toAlgebraic(toX, toY);

    // Special moves detection
    if (piece.endsWith('k') && Math.abs(fromY - toY) === 2) {
        return toY > fromY ? 'Castles Kingside' : 'Castles Queenside';
    }

    const pieceNames: Record<string, string> = {
        'p': 'Pawn',
        'n': 'Knight',
        'b': 'Bishop',
        'r': 'Rook',
        'q': 'Queen',
        'k': 'King'
    };
    const pName = pieceNames[piece[1]] || 'Piece';
    return `${pName} to ${toSquare} (${fromSquare} → ${toSquare})`;
}

// Generate the standard chess notation (e.g. Nf3, O-O)
export function getStandardNotation(piece: string, fromX: number, fromY: number, toX: number, toY: number, isCapture: boolean): string {
    if (piece.endsWith('k') && Math.abs(fromY - toY) === 2) {
        return toY > fromY ? 'O-O' : 'O-O-O';
    }

    const type = piece[1].toUpperCase();
    const targetSquare = toAlgebraic(toX, toY);

    if (type === 'P') {
        if (isCapture) {
            const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            return `${files[fromY]}x${targetSquare}`;
        }
        return targetSquare;
    }

    return `${type}${isCapture ? 'x' : ''}${targetSquare}`;
}

// Interface for search options
export interface SearchOptions {
    position: any[][];
    turn: string;
    castleDirection: { w: string; b: string };
    prevPosition?: any[][];
}

// Get all possible moves for a player
function getAllValidMoves(position: any[][], turn: string, castleDirection: { w: string; b: string }, prevPosition?: any[][]) {
    const pieces = getPieces(position, turn);
    const moves: Array<{ piece: string; rank: number; file: number; x: number; y: number }> = [];

    pieces.forEach(p => {
        const valid = arbiter.getValidMoves({
            position,
            castleDirection: castleDirection[turn === 'w' ? 'white' : 'black'] || castleDirection[turn],
            prevPosition,
            piece: p.piece,
            rank: p.rank,
            file: p.file
        });

        valid.forEach(([x, y]) => {
            moves.push({
                piece: p.piece,
                rank: p.rank,
                file: p.file,
                x,
                y
            });
        });
    });

    return moves;
}

// Minimax with Alpha-Beta pruning
export function getBestMove(options: SearchOptions, depth = 3): SuggestedMove | null {
    const { position, turn, castleDirection, prevPosition } = options;
    const isWhite = turn === 'w';

    const moves = getAllValidMoves(position, turn, castleDirection, prevPosition);
    if (moves.length === 0) return null;

    let bestMove: { piece: string; rank: number; file: number; x: number; y: number } | null = null;
    let bestValue = isWhite ? -Infinity : Infinity;

    // Shuffle moves slightly to prevent playing the exact same move in equal positions
    moves.sort(() => Math.random() - 0.5);

    for (const move of moves) {
        const nextPosition = arbiter.performMove({
            position,
            piece: move.piece,
            rank: move.rank,
            file: move.file,
            x: move.x,
            y: move.y
        });

        // Minimax evaluation
        const value = minimax(
            nextPosition,
            depth - 1,
            -Infinity,
            Infinity,
            !isWhite,
            castleDirection,
            position
        );

        if (isWhite) {
            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        } else {
            if (value < bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }
    }

    if (!bestMove) return null;

    const isCapture = !!position[bestMove.x][bestMove.y];
    const notation = getStandardNotation(bestMove.piece, bestMove.rank, bestMove.file, bestMove.x, bestMove.y, isCapture);
    const description = getMoveDescription(bestMove.piece, bestMove.rank, bestMove.file, bestMove.x, bestMove.y);

    // Normalize evaluation relative to the active player (+ means player is better, - means worse)
    const relativeEval = isWhite ? bestValue / 100 : -bestValue / 100;

    return {
        piece: bestMove.piece,
        fromX: bestMove.rank,
        fromY: bestMove.file,
        toX: bestMove.x,
        toY: bestMove.y,
        notation,
        description,
        evaluation: relativeEval
    };
}

function minimax(
    position: any[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean,
    castleDirection: { w: string; b: string },
    prevPosition?: any[][]
): number {
    const turn = isMaximizingPlayer ? 'w' : 'b';
    const moves = getAllValidMoves(position, turn, castleDirection, prevPosition);

    // Terminal states
    if (moves.length === 0) {
        const opponent = turn === 'w' ? 'b' : 'w';
        const isCheck = arbiter.isPlayerInCheck({
            positionAfterMove: position,
            player: turn
        });

        if (isCheck) {
            // Checkmate: return large positive/negative values based on who gets checkmated
            return isMaximizingPlayer ? -150000 - depth : 150000 + depth;
        } else {
            // Stalemate (Draw)
            return 0;
        }
    }

    if (depth === 0) {
        return evaluateBoard(position);
    }

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const nextPosition = arbiter.performMove({
                position,
                piece: move.piece,
                rank: move.rank,
                file: move.file,
                x: move.x,
                y: move.y
            });
            const evaluation = minimax(nextPosition, depth - 1, alpha, beta, false, castleDirection, position);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break; // Beta prune
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const nextPosition = arbiter.performMove({
                position,
                piece: move.piece,
                rank: move.rank,
                file: move.file,
                x: move.x,
                y: move.y
            });
            const evaluation = minimax(nextPosition, depth - 1, alpha, beta, true, castleDirection, position);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break; // Alpha prune
        }
        return minEval;
    }
}
