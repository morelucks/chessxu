import arbiter from "../arbiter/arbiter";
import { getPieces } from "../arbiter/getMoves";

export const getComputerMove = ({ position, turn, castleDirection }) => {
    const computerPieces = getPieces(position, turn);
    let allPossibleMoves = [];

    computerPieces.forEach(p => {
        const validMoves = arbiter.getValidMoves({
            position,
            castleDirection,
            piece: p.piece,
            rank: p.rank,
            file: p.file,
        });

        validMoves.forEach(([x, y]) => {
            allPossibleMoves.push({
                piece: p.piece,
                rank: p.rank,
                file: p.file,
                x,
                y,
            });
        });
    });

    if (allPossibleMoves.length === 0) {
        return null; // No moves available
    }

    // For now, pick a random valid move
    const randomIndex = Math.floor(Math.random() * allPossibleMoves.length);
    const chosenMove = allPossibleMoves[randomIndex];
    return chosenMove;
};
