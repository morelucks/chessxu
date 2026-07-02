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
