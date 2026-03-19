import arbiter from '../../arbiter/arbiter';
import { useAppContext }from '../../contexts/Context'
import { generateCandidates } from '../../reducer/actions/move';

const Piece = ({
    rank,
    file,
    piece,
}) => {

    const { appState, dispatch } = useAppContext();
    const { turn, castleDirection, position : currentPosition, gameMode, playerColor } = appState

    // In PvP mode, only allow dragging pieces that match the player's assigned color
    const isMyPiece = gameMode === 'pvp' ? piece[0] === playerColor : true;
    const canDrag = isMyPiece && turn === piece[0];

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

        const candidateMoves = 
            arbiter.getValidMoves({
                position : currentPosition[currentPosition.length - 1],
                prevPosition : currentPosition[currentPosition.length - 2],
                castleDirection : castleDirection[turn],
                piece,
                file,
                rank
            })
        dispatch(generateCandidates({candidateMoves}))
    }
    const onDragEnd = e => {
       e.target.style.display = 'block'
     }
 
    return (
        <div 
            className={`piece ${piece} p-${file}${rank}`}
            draggable={canDrag}   
            onDragStart={onDragStart} 
            onDragEnd={onDragEnd}
            style={{ cursor: canDrag ? 'grab' : 'default', opacity: canDrag ? 1 : 0.7 }}
        />)
}

export default Piece