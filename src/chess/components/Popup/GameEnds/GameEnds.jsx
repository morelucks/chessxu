import { Status } from '../../../constants';
import { useAppContext }from '../../../contexts/Context'
import { setupNewGame } from '../../../reducer/actions/game';
import './GameEnds.css'

const GameEnds = ({onClosePopup}) => {

    const { appState : {status, gameMode} , dispatch } = useAppContext();
    
    if (status === Status.ongoing || status === Status.promoting)
        return null

    const newGame = () => {
        dispatch(setupNewGame(gameMode)); // Pass gameMode when setting up new game
    }

    const isWin = status.endsWith('wins')
    const message = gameMode === 'pvc'
        ? status === Status.white
            ? 'You win!'
            : status === Status.black
                ? 'You lost!'
                : 'Draw!'
        : isWin ? status : 'Draw!';

    return <div className="popup--inner popup--inner__center">
        <h1>{message}</h1>
        <p>{!isWin && status}</p> {/* Only display original status if it's a draw and not pvc */}
        <div className={`${status}`}/>
        <button onClick={newGame}>New Game</button>
    </div>
   
}

export default GameEnds