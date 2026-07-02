import { describe, it, expect } from 'vitest';
import { evaluateBoard, toAlgebraic, getMoveDescription, getStandardNotation, getBestMove } from '../chessAnalysis';
import { createPosition } from '../../helper';

describe('chessAnalysis', () => {
    describe('toAlgebraic', () => {
        it('converts (0,0) to a1', () => {
            expect(toAlgebraic(0, 0)).toBe('a1');
        });

        it('converts (7,7) to h8', () => {
            expect(toAlgebraic(7, 7)).toBe('h8');
        });

        it('converts (3,4) to e4', () => {
            expect(toAlgebraic(3, 4)).toBe('e4');
        });
    });

    describe('evaluateBoard', () => {
        it('evaluates the initial starting board to 0 due to symmetry', () => {
            const initialBoard = createPosition();
            expect(evaluateBoard(initialBoard)).toBe(0);
        });

        it('gives white a positive evaluation advantage if black loses a queen', () => {
            const initialBoard = createPosition();
            // Remove Black queen at rank 7, file 3
            initialBoard[7][3] = '';
            expect(evaluateBoard(initialBoard)).toBeGreaterThan(500);
        });

        it('gives black a positive evaluation advantage (negative overall score) if white loses a rook', () => {
            const initialBoard = createPosition();
            // Remove White rook at rank 0, file 0
            initialBoard[0][0] = '';
            expect(evaluateBoard(initialBoard)).toBeLessThan(-400);
        });
    });

    describe('getMoveDescription', () => {
        it('describes pawn move', () => {
            expect(getMoveDescription('wp', 1, 4, 3, 4)).toBe('Pawn to e4 (e2 → e4)');
        });

        it('describes castling kingside', () => {
            expect(getMoveDescription('wk', 0, 4, 0, 6)).toBe('Castles Kingside');
        });

        it('describes castling queenside', () => {
            expect(getMoveDescription('bk', 7, 4, 7, 2)).toBe('Castles Queenside');
        });
    });

    describe('getStandardNotation', () => {
        it('formats pawn move to e4', () => {
            expect(getStandardNotation('wp', 1, 4, 3, 4, false)).toBe('e4');
        });

        it('formats pawn capture', () => {
            expect(getStandardNotation('wp', 3, 4, 4, 5, true)).toBe('exf5');
        });

        it('formats knight move', () => {
            expect(getStandardNotation('wn', 0, 6, 2, 5, false)).toBe('Nf3');
        });

        it('formats knight capture', () => {
            expect(getStandardNotation('wn', 0, 6, 2, 5, true)).toBe('Nxf3');
        });

        it('formats kingside castling', () => {
            expect(getStandardNotation('wk', 0, 4, 0, 6, false)).toBe('O-O');
        });
    });

    describe('getBestMove', () => {
        it('finds a valid suggestion for the starting position', () => {
            const position = createPosition();
            const suggestion = getBestMove({
                position,
                turn: 'w',
                castleDirection: { w: 'both', b: 'both' }
            }, 2); // Depth 2 is fast

            expect(suggestion).not.toBeNull();
            expect(suggestion?.piece).toBeDefined();
            expect(suggestion?.fromX).toBeDefined();
            expect(suggestion?.toX).toBeDefined();
            expect(suggestion?.notation).toBeDefined();
            expect(suggestion?.evaluation).toBeDefined();
        });
    });
});
