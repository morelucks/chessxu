/**
 * Chess Analysis Engine — #187 AI Hints
 */

import arbiter from '../arbiter/arbiter';
import { getPieces } from '../arbiter/getMoves';

// ── Piece values (centipawns) ──────────────────────────────────────────────
const PIECE_VALUES: Record<string, number> = {
    p: 100,
