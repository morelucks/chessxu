import './App.css';
import Board from './components/Board/Board';
import { reducer } from './reducer/reducer'
import { useReducer, useEffect, useState } from 'react'
import { initGameState, Status } from './constants';
import AppContext from './contexts/Context'
import Control from './components/Control/Control';
import TakeBack from './components/Control/bits/TakeBack';
import MovesList from './components/Control/bits/MovesList';
import SoundToggle from './components/Control/bits/SoundToggle';
import actionTypes from './reducer/actionTypes';
import { loadGameResults, clearGameResults } from './helper/localStorage';
import Popup from './components/Popup/Popup';
import StakingModal from './components/Popup/StakingModal/StakingModal';
import { getStakeData } from './helper/stakeStorage';
import ConnectWallet from './components/Control/bits/ConnectWallet';
import { useUser } from './contexts/UserContext';
import useAppStore from '../zustand/store';
import useSoundSettings from './hooks/useSoundSettings';
import useChessSound from './hooks/useChessSound';
import AiSuggestionsPanel from './components/AiSuggestionsPanel/AiSuggestionsPanel';
import useAiHint from './hooks/useAiHint';

// Leaderboard Component
const Leaderboard = ({ results, onClear }) => {
    const [stake, setStake] = useState(null);

    useEffect(() => {
        const current = getStakeData();
        setStake(current);

        const onStorage = () => setStake(getStakeData());
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    return (
        <div className="leaderboard">
            <h2>Leaderboard</h2>

            <div className={`stake-display ${stake && stake.amount ? '' : 'stake-display--empty'}`}>
                {stake && stake.amount ? (
                    <div className="stake-badge">
                        <span className="stake-badge__label">Current Stake</span>
                        <span className="stake-badge__amount">{Number(stake.amount).toFixed(2)} CELO</span>
                        {stake.status && (
                            <span className={`stake-badge__status stake-badge__status--${stake.status}`}>
                                {stake.status}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="stake-empty-text">No active stake</span>
                )}
            </div>

            {results.length === 0 ? (
                <p>No scores yet.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((result, index) => (
                            <tr key={index}>
                                <td>{result.name}</td>
                                <td>{result.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {results.length > 0 && (
                <button onClick={onClear}>Clear Leaderboard</button>
            )}
        </div>
    );
};

function App() {

    const [appState, dispatch ] = useReducer(reducer,initGameState);
    const [gameMode, setGameMode] = useState('pvc'); // 'pvp' or 'pvc'
    const [leaderboardResults, setLeaderboardResults] = useState([]);
    const [showStakingModal, setShowStakingModal] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Sound feedback system
    const { isMuted, volume, toggleMute, setVolume, play: playSound } = useSoundSettings();
    useChessSound(appState, playSound);

    // AI hint computation — writes result to the global Zustand store
    useAiHint(appState);

    const providerState = {
        appState,
        dispatch
    }

    // Load leaderboard results on component mount
    useEffect(() => {
        setLeaderboardResults(loadGameResults());
    }, []);

    // Swipe gesture detection to open the drawer
    useEffect(() => {
        let startX = 0;
        const handleTouchStart = (e) => {
            const edgeThreshold = window.innerWidth - 40;
            if (e.touches[0].clientX > edgeThreshold) {
                startX = e.touches[0].clientX;
            } else {
                startX = 0;
            }
        };
        const handleTouchMove = (e) => {
            if (!startX) return;
            const diffX = startX - e.touches[0].clientX;
            if (diffX > 50) {
                setIsDrawerOpen(true);
                startX = 0;
            }
        };
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove);
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    const timeControlMs = useAppStore((state) => state.timeControlMs);
    const handleNewGame = (mode) => {
        setGameMode(mode);
        dispatch({ type: actionTypes.NEW_GAME, payload: { ...initGameState, gameMode: mode, timeControlMs } });
    };

    const handlePlayerVsComputer = () => {
        // Start pvc immediately without staking
        handleNewGame('pvc');
    };

    const handleCloseStakingModal = () => {
        setShowStakingModal(false);
    };

    const handleClearLeaderboard = () => {
        clearGameResults();
        setLeaderboardResults([]);
    };

    useEffect(() => {
        if (appState.gameMode === 'pvc' && appState.turn === 'b' && appState.status === 'Ongoing') {
            // Simulate computer thinking time
            const timeout = setTimeout(() => {
                dispatch({ type: actionTypes.COMPUTER_MOVE });
            }, 500); // 500ms delay

            return () => clearTimeout(timeout);
        }
    }, [appState.turn, appState.gameMode, appState.status, dispatch]);

    // Save game result when game status changes to a terminal state (win/draw)
    useEffect(() => {
        if ([
            Status.white,
            Status.black,
            Status.stalemate,
            Status.insufficient
        ].includes(appState.status)) {
            dispatch({ type: actionTypes.SAVE_GAME_RESULT });
            setLeaderboardResults(loadGameResults()); // Reload to show updated results
        }
    }, [appState.status, dispatch]);

    const { isSignedIn } = useUser();

    return (
        <AppContext.Provider value={providerState} >
            <div className="App">
                <div className="game-area">
                    <div className="game-mode-selection">
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => setShowStakingModal(true)} 
                            disabled={gameMode === 'pvp' || !isSignedIn}
                            title={!isSignedIn ? "Connect wallet to play PvP" : ""}
                        >
                            Player vs Player
                        </button>
                        <button className="btn btn-secondary" onClick={handlePlayerVsComputer} disabled={gameMode === 'pvc'}>Player vs Computer</button>
                        <button className="btn" onClick={() => handleNewGame(gameMode)}>New Game</button>
                        <button className="btn btn-secondary mobile-only-btn" onClick={() => setIsDrawerOpen(true)}>
                            Stats & History
                        </button>
                    </div>
                    <Board/>
                </div>
                <Control isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
                    <ConnectWallet />
                    <SoundToggle
                        isMuted={isMuted}
                        volume={volume}
                        onToggle={toggleMute}
                        onVolumeChange={setVolume}
                    />
                    <MovesList/>
                    <TakeBack/>
                    <AiSuggestionsPanel appState={appState} />
                    <Leaderboard results={leaderboardResults} onClear={handleClearLeaderboard} />
                </Control>
                
                {/* Staking Modal */}
                {showStakingModal && (
                    <div className="popup">
                        <StakingModal onClosePopup={handleCloseStakingModal} />
                    </div>
                )}
            </div>
        </AppContext.Provider>
    ); 
}

export default App;
    // useAiHint is a side-effect hook -- no returned value needed
    // AiSuggestionsPanel: default isAiHintsEnabled=false so feature is opt-in
