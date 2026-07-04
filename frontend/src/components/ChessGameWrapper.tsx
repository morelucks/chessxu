/*
npm
Npm: Npm download concentration
NPM Package Downloads
Npm: Npm download uniform
Npm: Npm excluded packages quality
Npm: Npm monorepo collapsed
Npm: Npm download sparse burst
Npm: Npm excluded packages
*/
import { GameState } from '../types/chess';

interface ChessAction {
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
}
import React, { useReducer, useEffect, useState } from 'react';
import { reducer } from '../chess/reducer/reducer';
import { Status } from '../chess/constants';
import { createPosition, createPuzzlePosition } from '../chess/helper';
import actionTypes from '../chess/reducer/actionTypes';
import AppContext from '../chess/contexts/Context';
import ChessBoardOnly from './ChessBoardOnly';
import ChessSidebar from './ChessSidebar';
import MoveHistorySidebar from './MoveHistorySidebar';
import ChessClock from './ChessClock';
import useAppStore from '../zustand/store';
import { useFreemium } from '../hooks/useFreemium';

/**
 * Wrapper providing AppContext with typed reducer for the chess board UI.
 */
export default function ChessGameWrapper({ isPuzzle = false }) {
    const timeControlMs = useAppStore((state) => state.timeControlMs);
    const address = useAppStore((state) => state.address);
    const activeChain = useAppStore((state) => state.activeChain);
    const farcasterUser = useAppStore((state) => state.farcasterUser);
    const elo = useAppStore((state) => state.elo);
    const { onGameComplete, isOfflineMode, canPlayOnChain } = useFreemium();

    // Create initial state directly to avoid any import issues
    const initialGameState: GameState = {
        position: [isPuzzle ? createPuzzlePosition() : createPosition()],
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
        gameMode: isPuzzle ? 'puzzle' : 'pvc',
        playerColor: 'w',
        whiteTimeMs: timeControlMs,
        blackTimeMs: timeControlMs,
    };

    // Cast reducer: JS implementation satisfies the GameState+ChessAction contract
    const [appState, dispatch] = useReducer(
        reducer as unknown as React.Reducer<GameState, ChessAction>,
        initialGameState
    );
    const [isReady, setIsReady] = useState(false);

    // Save game mode to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('currentGameMode', appState.gameMode);
    }, [appState.gameMode]);

    // Ensure the state is properly initialized before rendering
    useEffect(() => {
        if (appState && appState.position && Array.isArray(appState.position) && appState.position.length > 0) {
            setIsReady(true);
        }
    }, [appState]);

    const providerState = {
        appState,
        dispatch
    };

    // Handle computer moves for PvC mode and Puzzle mode
    useEffect(() => {
        if ((appState.gameMode === 'pvc' || appState.gameMode === 'puzzle') && appState.turn === 'b' && appState.status === 'Ongoing') {
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
            // Track completed game for freemium upgrade prompt
            onGameComplete();
        }
    }, [appState.status, dispatch]);

    const handleTimeout = (color: 'w' | 'b') => {
        dispatch({ type: actionTypes.TIMEOUT, payload: color });
    };

    // Show loading state until the chess game is ready
    if (!isReady) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-white text-lg">Loading chess game...</div>
            </div>
        );
    }


    const formatAddress = (addr: string | null) => {
        if (!addr) return '';
        return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
    };

    let playerName = 'You';
    let playerAvatarUrl = '';
    let playerSub = 'Local Player';

    if (farcasterUser) {
        playerName = farcasterUser.displayName || `@${farcasterUser.username}` || 'You';
        playerAvatarUrl = farcasterUser.pfpUrl || '';
        playerSub = `Farcaster • ${elo} ELO`;
    } else if (address) {
        playerName = formatAddress(address);
        playerSub = `Celo • ${elo} ELO`;
    } else {
        playerSub = isOfflineMode ? `Offline • ${elo} ELO` : `Local Player • ${elo} ELO`;
    }

    const opponentName = appState.gameMode === 'pvc' ? 'Stockfish AI' : 'Opponent';
    const opponentSub = appState.gameMode === 'pvc' ? 'Engine Level 5 • 1500 ELO' : 'Waiting...';
    const opponentAvatar = appState.gameMode === 'pvc' ? '🤖' : '👤';

    return (
        <AppContext.Provider value={providerState}>
            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
                {/* Left Sidebar - Chess Game Controls (Desktop only, mobile moved below board) */}
                <div className={`hidden md:flex w-80 flex-shrink-0 bg-slate-900/40 backdrop-blur-md border-r border-slate-800 p-4 overflow-y-auto shadow-inner`}>
                    <ChessSidebar />
                </div>

                {/* Main Chess Area (Mobile: Board -> Profiles -> Controls) */}
                <div className="flex-1 min-h-0 flex flex-col items-center justify-start p-1.5 md:p-4 overflow-y-auto">
                    <div className="w-full max-w-[500px] flex flex-col gap-1.5 md:gap-3">
                        
                        {/* Top: Opponent Profile — compact on mobile */}
                        <div className="flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-900/60 border border-white/5 shadow-md">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-7 h-7 md:w-10 md:h-10 bg-slate-800 rounded-md md:rounded-lg flex items-center justify-center text-base md:text-xl shadow-inner border border-white/5">
                                    {opponentAvatar}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-xs md:text-sm">
                                        {opponentName}
                                    </span>
                                    <span className="text-[10px] md:text-xs text-slate-400">
                                        {opponentSub}
                                    </span>
                                </div>
                            </div>
                            <ChessClock 
                                color={appState.playerColor === 'w' ? 'b' : 'w'} 
                                timeMs={appState.playerColor === 'w' ? (appState.blackTimeMs ?? null) : (appState.whiteTimeMs ?? null)} 
                                isActive={appState.status === Status.ongoing && appState.turn === (appState.playerColor === 'w' ? 'b' : 'w')} 
                                onTimeout={handleTimeout} 
                            />
                        </div>

                        {/* The Board Container */}
                        <div className="w-full aspect-square bg-slate-950/40 backdrop-blur-md rounded-lg md:rounded-xl shadow-2xl relative flex items-center justify-center border border-white/5 overflow-hidden">
                            <ChessBoardOnly />
                        </div>

                        {/* Bottom: Player Profile — compact on mobile */}
                        <div className="flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-900/60 border border-white/5 shadow-md">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-7 h-7 md:w-10 md:h-10 bg-slate-800 rounded-md md:rounded-lg flex items-center justify-center text-base md:text-xl shadow-inner border border-white/5 overflow-hidden">
                                    {playerAvatarUrl ? (
                                        <img src={playerAvatarUrl} alt={playerName} className="w-full h-full object-cover" />
                                    ) : (
                                        '♟️'
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-xs md:text-sm text-indigo-200">
                                        {playerName}
                                    </span>
                                    <span className="text-[10px] md:text-xs text-slate-400">
                                        {playerSub}
                                    </span>
                                </div>
                            </div>
                            <ChessClock 
                                color={appState.playerColor ?? 'w'} 
                                timeMs={appState.playerColor === 'w' ? (appState.whiteTimeMs ?? null) : (appState.blackTimeMs ?? null)} 
                                isActive={appState.status === Status.ongoing && appState.turn === appState.playerColor} 
                                onTimeout={handleTimeout} 
                            />
                        </div>

                        {/* Mobile Action Controls (Under the board on mobile) */}
                        <div className="md:hidden flex flex-col gap-3 mt-1">
                            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-white/5">
                                <ChessSidebar />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right Sidebar - Move History (Desktop only) */}
                <div className={`hidden md:block w-64 flex-shrink-0 bg-slate-800/30 border-l border-slate-700 p-4 overflow-hidden`}>
                    <MoveHistorySidebar />
                </div>
            </div>
        </AppContext.Provider>
    );
}
