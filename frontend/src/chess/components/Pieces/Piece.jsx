import arbiter from '../../arbiter/arbiter';
import { useAppContext }from '../../contexts/Context'
import { generateCandidates, clearCandidates, selectPiece, makeNewMove } from '../../reducer/actions/move';
import { openPromotion } from '../../reducer/actions/popup';
import { getCastlingDirections } from '../../arbiter/getMoves';
import { updateCastling, detectStalemate, detectInsufficientMaterial, detectCheckmate } from '../../reducer/actions/game';
import { getNewMoveNotation } from '../../helper';

const Piece = ({
    rank,
    file,
    piece,
}) => {

    const { appState, dispatch } = useAppContext();
    const { turn, castleDirection, position : currentPosition, gameMode, playerColor, selectedPiece, candidateMoves } = appState

    // In PvP mode, only allow dragging pieces that match the player's assigned color
    const isMyPiece = gameMode === 'pvp' ? piece[0] === playerColor : true;
    const canDrag = isMyPiece && turn === piece[0];

    const isSelected = selectedPiece 
        && selectedPiece.piece === piece 
        && selectedPiece.rank === rank 
        && selectedPiece.file === file;

    const showCandidates = () => {
        const moves = 
            arbiter.getValidMoves({
                position : currentPosition[currentPosition.length - 1],
                prevPosition : currentPosition[currentPosition.length - 2],
                castleDirection : castleDirection[turn],
                piece,
                file,
                rank
            })
        dispatch(generateCandidates({candidateMoves: moves}))
        dispatch(selectPiece({piece, rank, file}))
    }

    const executeMove = (x, y) => {
        const position = currentPosition[currentPosition.length - 1];
        const sp = selectedPiece;
        const opponent = sp.piece.startsWith('b') ? 'w' : 'b';
        const castleDir = castleDirection[`${sp.piece.startsWith('b') ? 'white' : 'black'}`];

        // Handle promotion
        if ((sp.piece === 'wp' && x === 7) || (sp.piece === 'bp' && x === 0)) {
            dispatch(openPromotion({
                rank: Number(sp.rank),
                file: Number(sp.file),
                x,
                y
            }))
            return
        }

        // Handle castling state update
        if (sp.piece.endsWith('r') || sp.piece.endsWith('k')) {
            const direction = getCastlingDirections({
                castleDirection: appState.castleDirection,
                piece: sp.piece,
                file: sp.file,
                rank: sp.rank
            })
            if (direction) {
                dispatch(updateCastling(direction))
            }
        }

        // Perform the move
        const newPosition = arbiter.performMove({
            position,
            piece: sp.piece, rank: sp.rank, file: sp.file,
            x, y
        })
        const newMove = getNewMoveNotation({
            piece: sp.piece,
            rank: sp.rank,
            file: sp.file,
            x,
            y,
            position,
        })
        dispatch(makeNewMove({ newPosition, newMove }))

        if (arbiter.insufficientMaterial(newPosition))
            dispatch(detectInsufficientMaterial())
        else if (arbiter.isStalemate(newPosition, opponent, castleDir)) {
            dispatch(detectStalemate())
        }
        else if (arbiter.isCheckMate(newPosition, opponent, castleDir)) {
            dispatch(detectCheckmate(sp.piece[0]))
        }

        dispatch(clearCandidates())
    }

    const onClick = e => {
        e.stopPropagation();

        // If a piece is already selected and THIS piece's square is a valid capture target
        if (selectedPiece && candidateMoves?.find(m => m[0] === rank && m[1] === file)) {
            executeMove(rank, file);
            return;
        }

        if (!canDrag) return;

        if (isSelected) {
            // Clicking same piece again deselects it
            dispatch(clearCandidates())
        } else {
            // Select this piece and show candidate moves
            showCandidates()
        }
    }

    const onDragStart = e => {
        if (!canDrag) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain",`${piece},${rank},${file}`)
        setTimeout(() => {
            e.target.style.display = 'none'
        },0)

        showCandidates()
    }
    const onDragEnd = e => {
       e.target.style.display = 'block'
     }
 
    return (
        <div 
            className={`piece ${piece} p-${file}${rank}${isSelected ? ' selected' : ''}`}
            draggable={canDrag}   
            onDragStart={onDragStart} 
            onDragEnd={onDragEnd}
            onClick={onClick}
            style={{ cursor: canDrag ? 'pointer' : 'default', opacity: canDrag ? 1 : 0.7 }}
        />)
}

export default Piece