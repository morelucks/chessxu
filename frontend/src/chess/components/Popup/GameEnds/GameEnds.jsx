import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Status } from '../../../constants';
import { useAppContext } from '../../../contexts/Context'
import { setupNewGame } from '../../../reducer/actions/game';
import './GameEnds.css'

const GameEnds = ({ onClosePopup }) => {
    const { appState: { status, gameMode, playerColor }, dispatch } = useAppContext();

    if (status === Status.ongoing || status === Status.promoting)
        return null;

    const isPuzzle = gameMode === 'puzzle';
    const isWin = status.endsWith('wins');

    const newGame = () => {
        dispatch(setupNewGame(gameMode)); // Pass gameMode when setting up new game
    };

    const rawMessage = isPuzzle
        ? status === Status.white
            ? '🎉 Puzzle Solved!'
            : status === Status.black
                ? 'Puzzle Failed'
                : 'Draw!'
        : gameMode === 'pvc'
            ? status === Status.white
                ? 'You win!'
                : status === Status.black
                    ? 'You lost!'
                    : 'Draw!'
            : isWin
                ? status
                : 'Draw!';

    // Extract emoji and text for premium styling without breaking emoji rendering
    const hasEmoji = rawMessage.startsWith('🎉');
    const message = hasEmoji ? rawMessage.replace('🎉', '').trim() : rawMessage;

    // Determine the outcome type: success, failed, draw
    let outcome = 'draw';
    if (isPuzzle) {
        if (status === Status.white) outcome = 'success';
        else if (status === Status.black) outcome = 'failed';
    } else if (gameMode === 'pvc') {
        if (status === Status.white) outcome = 'success';
        else if (status === Status.black) outcome = 'failed';
    } else {
        // For PvP or other modes, check if playerColor matches the winning color
        const winningColor = status === Status.white ? 'w' : (status === Status.black ? 'b' : null);
        if (winningColor) {
            outcome = playerColor === winningColor ? 'success' : 'failed';
        }
    }

    // Trigger celebration confetti for successful outcome
    useEffect(() => {
        if (outcome === 'success') {
            // Main burst
            confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.65 },
                colors: ['#10b981', '#34d399', '#059669', '#3b82f6', '#60a5fa', '#f59e0b']
            });

            // Side bursts
            const duration = 1.2 * 1000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 },
                    colors: ['#10b981', '#34d399', '#3b82f6']
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 },
                    colors: ['#10b981', '#34d399', '#3b82f6']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    }, [outcome]);

    return (
        <div className="popup--inner popup--inner__center game-ends-popup" data-outcome={outcome}>
            <div className="game-ends-header">
                {hasEmoji && <div className="game-ends-emoji-glow">🎉</div>}
                
                <div className="outcome-icon-wrapper">
                    <div className={`status-icon ${status}`} />
                </div>
                
                <h1 className="game-ends-title">{message}</h1>
                
                {(!isWin && status) && (
                    <p className="game-ends-subtitle">
                        {status}
                    </p>
                )}
            </div>

            <div className="game-ends-actions">
                <button className="game-ends-btn" onClick={newGame}>
                    {isPuzzle ? 'Next Puzzle' : 'New Game'}
                </button>
            </div>
        </div>
    );
};

export default GameEnds;