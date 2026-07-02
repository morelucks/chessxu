/**
 * Chess Analysis Engine — #187 AI Hints
 */

import arbiter from '../arbiter/arbiter';
import { getPieces } from '../arbiter/getMoves';

// ── Piece values (centipawns) ──────────────────────────────────────────────
const PIECE_VALUES: Record<string, number> = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000,
};

// ── Piece-Square Tables ────────────────────────────────────────────────────
const pawnPST = [
    [  0,  0,  0,  0,  0,  0,  0,  0],
    [ 50, 50, 50, 50, 50, 50, 50, 50],
    [ 10, 10, 20, 30, 30, 20, 10, 10],
    [  5,  5, 10, 25, 25, 10,  5,  5],
    [  0,  0,  0, 20, 20,  0,  0,  0],
    [  5, -5,-10,  0,  0,-10, -5,  5],
    [  5, 10, 10,-20,-20, 10, 10,  5],
    [  0,  0,  0,  0,  0,  0,  0,  0],
];

const knightPST = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
];

const bishopPST = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
];

const rookPST = [
    [  0,  0,  0,  0,  0,  0,  0,  0],
    [  5, 10, 10, 10, 10, 10, 10,  5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [  0,  0,  0,  5,  5,  0,  0,  0],
];

const queenPST = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  5,-10],
    [-10,  0,  5,  0,  0,  5,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20],
];

const kingPST = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20],
];

// ── PST lookup helper ───────────────────────────────────────────────────────
function getPstValue(piece: string, x: number, y: number): number {
    const type = piece[1];
    const isWhite = piece[0] === 'w';
    const row = isWhite ? (7 - x) : x;
    switch (type) {
        case 'p': return pawnPST[row][y];
        case 'n': return knightPST[row][y];
        case 'b': return bishopPST[row][y];
        case 'r': return rookPST[row][y];
        case 'q': return queenPST[row][y];
        case 'k': return kingPST[row][y];
        default:  return 0;
    }
}

// ── Static board evaluator ──────────────────────────────────────────────────
export function evaluateBoard(position: string[][]): number {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const piece = position[r][f];
            if (!piece) continue;
            const sign = piece[0] === 'w' ? 1 : -1;
            score += sign * ((PIECE_VALUES[piece[1]] ?? 0) + getPstValue(piece, r, f));
        }
    }
    return score;
}

// ── Algebraic notation helpers ──────────────────────────────────────────────
export function toAlgebraic(x: number, y: number): string {
    const files = ['a','b','c','d','e','f','g','h'];
    const ranks = ['1','2','3','4','5','6','7','8'];
    return `${files[y] ?? '?'}${ranks[x] ?? '?'}`;
}

// ── Public types ────────────────────────────────────────────────────────────
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

export interface SearchOptions {
    position: string[][];
    turn: string;
    castleDirection: { w: string; b: string };
    prevPosition?: string[][];
}

export function getMoveDescription(piece: string, fromX: number, fromY: number, toX: number, toY: number): string {
    const from = toAlgebraic(fromX, fromY);
    const to   = toAlgebraic(toX,   toY);
    if (piece.endsWith('k') && Math.abs(fromY - toY) === 2) {
        return toY > fromY ? 'Castles Kingside' : 'Castles Queenside';
    }
    const names: Record<string,string> = { p:'Pawn',n:'Knight',b:'Bishop',r:'Rook',q:'Queen',k:'King' };
    return `${names[piece[1]] ?? 'Piece'} to ${to} (${from} → ${to})`;
}

export function getStandardNotation(piece: string, fromX: number, fromY: number, toX: number, toY: number, isCapture: boolean): string {
