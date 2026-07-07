import './Board.css'
import { useAppContext }from '../../contexts/Context'
import useAppStore from '../../../zustand/store'

import Ranks from './bits/Ranks'
import Files from './bits/Files'
import Pieces from '../Pieces/Pieces'
import PromotionBox from '../Popup/PromotionBox/PromotionBox'
import Popup from '../Popup/Popup'
import GameEnds from '../Popup/GameEnds/GameEnds'

import arbiter from '../../arbiter/arbiter'
import { getKingPosition } from '../../arbiter/getMoves'
import { makeNewMove, clearCandidates } from '../../reducer/actions/move'
import { openPromotion } from '../../reducer/actions/popup'
import { getCastlingDirections } from '../../arbiter/getMoves'
import { updateCastling, detectStalemate, detectInsufficientMaterial, detectCheckmate } from '../../reducer/actions/game'
import { getNewMoveNotation } from '../../helper'

const Board = () => {
    const ranks = Array(8).fill().map((x,i) => 8-i)
    const files = Array(8).fill().map((x,i) => i+1)

    const { appState, dispatch } = useAppContext();
    const boardTheme = useAppStore((state) => state.boardTheme);
    const position = appState.position[appState.position.length - 1]

    const lastMoveSquares = (() => {
        const prev = appState.position[appState.position.length - 2]
        if (!prev) return [];
        const changed = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (position[r][c] !== prev[r][c]) {
                    changed.push([r, c]);
                }
            }
        }

        // Detect castling: if a king moved ≥2 files, only highlight king src/dst
        // This matches the Lichess/chess.com convention of showing 2 squares, not 4
        if (changed.length >= 3) {
            let kingSrc = null;
            let kingDst = null;
            for (const [r, c] of changed) {
                // Find where a king disappeared from (prev had king, current doesn't)
                if (prev[r][c] && prev[r][c].endsWith('k') && position[r][c] !== prev[r][c]) {
                    kingSrc = [r, c];
                }
                // Find where a king appeared (current has king, prev didn't have this king)
                if (position[r][c] && position[r][c].endsWith('k') && prev[r][c] !== position[r][c]) {
                    kingDst = [r, c];
                }
            }
            if (kingSrc && kingDst && Math.abs(kingSrc[1] - kingDst[1]) >= 2) {
                return [kingSrc, kingDst];
            }
        }

        return changed;
    })()

    const checkTile = (() => {
        const isInCheck =  (arbiter.isPlayerInCheck({
            positionAfterMove : position,
            player : appState.turn
        }))

        if (isInCheck)
            return getKingPosition (position, appState.turn) || null

        return null
    })()

    const getClassName = (i,j) => {
        let c = 'tile'
        c+= (i+j)%2 === 0 ? ' tile--dark ' : ' tile--light '
        if (appState.candidateMoves?.find(m => m[0] === i && m[1] === j)){
            if (position[i][j])
                c+= ' attacking'
            else 
                c+= ' highlight'
        }

        if (checkTile && checkTile[0] === i && checkTile[1] === j) {
            c+= ' checked'
        }

        if (lastMoveSquares.some(([r, c]) => r === i && c === j)) {
            c+= ' last-move'
        }

        return c
    }

    const handleTileClick = (x, y) => {
        const { selectedPiece, candidateMoves, castleDirection } = appState;

        // If no piece is selected or no candidate moves, do nothing
        if (!selectedPiece || !candidateMoves?.length) return;

        // Check if this tile is a valid candidate move
        if (!candidateMoves.find(m => m[0] === x && m[1] === y)) {
            // Clicked on a non-valid square, deselect
            dispatch(clearCandidates())
            return;
        }

        const { piece, rank, file } = selectedPiece;
        const opponent = piece.startsWith('b') ? 'w' : 'b'
        const castleDir = castleDirection[`${piece.startsWith('b') ? 'white' : 'black'}`]

        // Handle promotion
        if ((piece === 'wp' && x === 7) || (piece === 'bp' && x === 0)) {
            dispatch(openPromotion({
                rank: Number(rank),
                file: Number(file),
                x,
                y
            }))
            return
        }

        // Handle castling state update
        if (piece.endsWith('r') || piece.endsWith('k')) {
            const direction = getCastlingDirections({
                castleDirection: appState.castleDirection,
                piece,
                file,
                rank
            })
            if (direction) {
                dispatch(updateCastling(direction))
            }
        }

        // Perform the move
        const newPosition = arbiter.performMove({
            position,
            piece, rank, file,
            x, y
        })
        const newMove = getNewMoveNotation({
            piece,
            rank,
            file,
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
            dispatch(detectCheckmate(piece[0]))
        }

        dispatch(clearCandidates())
    }

    return <div className={`board theme-${boardTheme}`}>

        <Ranks ranks={ranks}/>

        <div className='tiles'>
            {ranks.map((rank,i) => 
                files.map((file,j) => 
                    <div 
                        key={file+''+rank} 
                        i={i}
                        j={j}
                        className={`${getClassName(7-i,j)}`}
                        onClick={() => handleTileClick(7-i, j)}>
                    </div>
                ))}
        </div>

        <Pieces/>

        <Popup>
            <PromotionBox />
            <GameEnds />
        </Popup>

        <Files files={files}/>

    </div>
    
}

export default Board