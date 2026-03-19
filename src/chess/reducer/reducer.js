import { Status } from "../constants";
import actionTypes from "./actionTypes";
import { getComputerMove } from '../ai/chessAI';
import arbiter from '../arbiter/arbiter';
import { saveGameResult } from '../helper/localStorage';
import { createPosition } from '../helper';

export const reducer = (state, action) => {

    switch (action.type) {
        case actionTypes.NEW_MOVE : {
            let {position,movesList,turn} = state 
            position = [
                ...position,
                action.payload.newPosition
            ]
            movesList = [
                ...movesList,
                action.payload.newMove
            ]
            turn = turn === 'w' ? 'b' : 'w'

            // After player's move, if in PvC mode and it's computer's turn, trigger computer move
            // This will be handled by dispatching COMPUTER_MOVE from App.js after this action

            return {
                ...state,
                position,
                movesList,
                turn,
            }
        }

        case actionTypes.GENERATE_CANDIDATE_MOVES : {
            const {candidateMoves} = action.payload
            return {
                ...state,
                candidateMoves
            }
        } 

        case actionTypes.CLEAR_CANDIDATE_MOVES : {
            return {
                ...state,
                candidateMoves : []
            }
        }
    
        case actionTypes.PROMOTION_OPEN : {
            return {
                ...state,
                status : Status.promoting,
                promotionSquare : {...action.payload},
            }
        }

        case actionTypes.PROMOTION_CLOSE : {
            return {
                ...state,
                status : Status.ongoing,
                promotionSquare : null,
            }
        }

        case actionTypes.CAN_CASTLE : {
            let {turn,castleDirection} = state 
        
            castleDirection[turn] = action.payload
            
            return {
                ...state,
                castleDirection,
            }
        }
        
        case actionTypes.STALEMATE : {
            const newPoints = { ...state.points };
            newPoints.w += 1; // 1 point for white in a draw
            newPoints.b += 1; // 1 point for black in a draw
            return {
                ...state,
                status : Status.stalemate,
                points: newPoints,
            }
        }

        case actionTypes.INSUFFICIENT_MATERIAL : {
            const newPoints = { ...state.points };
            newPoints.w += 1; // 1 point for white in a draw
            newPoints.b += 1; // 1 point for black in a draw
            return {
                ...state,
                status : Status.insufficient,
                points: newPoints,
            }
        }

        case actionTypes.WIN : {
            const winner = action.payload === 'w' ? 'w' : 'b';
            const newPoints = { ...state.points };
            newPoints[winner] += 3; // 3 points for a win
            return {
                ...state,
                status : action.payload === 'w' ? Status.white : Status.black,
                points: newPoints,
            }
        }
         
        case actionTypes.NEW_GAME : {
            return {
                position: [createPosition()],
                turn: 'w',
                candidateMoves: [],
                movesList: [],
                promotionSquare: null,
                status: Status.ongoing,
                castleDirection: {
                    w: 'both',
                    b: 'both'
                },
                points: {
                    w: 0,
                    b: 0,
                },
                gameMode: action.payload.gameMode || 'pvc',
            }
        }

        case actionTypes.TAKE_BACK : {
            let {position,movesList,turn} = state 
            if (position.length > 1){
                position = position.slice(0,position.length-1)
                movesList = movesList.slice(0,movesList.length-1)
                turn = turn === 'w' ? 'b' : 'w'
            }

            return {
                ...state,
                position,
                movesList,
                turn,
            }
        }

        case actionTypes.COMPUTER_MOVE : {
            let { position, turn, castleDirection, movesList } = state;
            const computerMove = getComputerMove({ position: position[position.length - 1], turn, castleDirection });

            if (computerMove) {
                const { piece, rank, file, x, y } = computerMove;
                const newPosition = arbiter.performMove({ position: position[position.length - 1], piece, rank, file, x, y });
                position = [...position, newPosition];
                movesList = [...movesList, `${piece[1]}${file}${rank}-${y}${x}`]; // Simplified move notation
                turn = turn === 'w' ? 'b' : 'w';
            }

            return {
                ...state,
                position,
                movesList,
                turn,
            };
        }

        case actionTypes.SAVE_GAME_RESULT : {
            const { gameMode, points, status } = state;
            const result = {
                mode: gameMode,
                winner: status === Status.white ? 'white' : status === Status.black ? 'black' : 'draw',
                whitePoints: points.w,
                blackPoints: points.b,
                date: new Date().toISOString(),
            };
            saveGameResult(result);
            return state;
        }

        default : 
            return state
    }
};
