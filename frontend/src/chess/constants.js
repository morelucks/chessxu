import { createPosition } from './helper'

export const Status = {
    'ongoing' : 'Ongoing',
    'promoting' : 'Promoting',
    'white' : 'White wins',
    'black' : 'Black wins',
    'stalemate' : 'Game draws due to stalemate',
    'insufficient' : 'Game draws due to insufficient material',
}

export const initGameState = {
    position : [createPosition()],
    turn : 'w',
    candidateMoves : [],
    movesList : [],

    promotionSquare : null,
    status : Status.ongoing,
    castleDirection : {
        w : 'both',
        b : 'both'
    }, 
    points : {
        w : 0,
        b : 0,
    },
    gameMode : 'pvc', // Default to pvc (Player vs Computer)
    playerColor : 'w', // The color the logged-in player controls (relevant for PvP)
}