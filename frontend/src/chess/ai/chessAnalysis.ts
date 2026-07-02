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
