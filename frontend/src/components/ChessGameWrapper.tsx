import React, { useReducer, useEffect, useState } from 'react';
import { reducer } from '../chess/reducer/reducer';
import { Status } from '../chess/constants';
import { createPosition } from '../chess/helper';
import actionTypes from '../chess/reducer/actionTypes';
import AppContext from '../chess/contexts/Context';
import ChessBoardOnly from './ChessBoardOnly';
import ChessSidebar from './ChessSidebar';
import MoveHistorySidebar from './MoveHistorySidebar';

export default function ChessGameWrapper() {
    // Create initial state directly to avoid any import issues
    const initialGameState = {
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
        gameMode: 'pvc',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [appState, dispatch] = useReducer<React.Reducer<any, any>>(reducer as any, initialGameState);
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

    // Handle computer moves for PvC mode
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
        }
    }, [appState.status, dispatch]);

    // Show loading state until the chess game is ready
    if (!isReady) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-white text-lg">Loading chess game...</div>
            </div>
        );
    }

    return (
        <AppContext.Provider value={providerState}>
            <div className="flex-1 flex flex-col md:flex-row overflow-visible">
                {/* Left Sidebar - Chess Game Controls (Desktop only, mobile moved below board) */}
                <div className={`hidden md:flex w-80 flex-shrink-0 bg-slate-900/40 backdrop-blur-md border-r border-slate-800 p-4 overflow-y-auto shadow-inner`}>
                    <ChessSidebar />
                </div>

                {/* Main Chess Area (Mobile: Board -> Profiles -> Controls) */}
                <div className="flex-1 flex flex-col items-center justify-start p-2 md:p-4 overflow-y-auto">
                    <div className="w-full max-w-[500px] flex flex-col gap-1.5 md:gap-2">
                        
                        {/* Top: Opponent Profile */}
                        <div className="flex items-center justify-between p-2 rounded-t-lg bg-black/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-700/80 rounded flex items-center justify-center text-2xl shadow-inner border border-white/5">
                                    {appState.gameMode === 'pvc' ? '💻' : '👤'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">
                                        {appState.gameMode === 'pvc' ? 'Computer' : 'Opponent'}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {appState.gameMode === 'pvc' ? 'Stockfish Engine' : 'Waiting...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* The Board Container */}
                        <div className="w-full aspect-square bg-[#ebecd0] rounded-sm shadow-2xl relative overflow-hidden">
                            <ChessBoardOnly />
                        </div>

                        {/* Bottom: Player Profile */}
                        <div className="flex items-center justify-between p-2 rounded-b-lg bg-black/20 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-700/80 rounded flex items-center justify-center text-xl shadow-inner border border-white/5 overflow-hidden">
                                    {/* Usually we'd pull this from zustand store, but since we are inside the Wrapper we will just show a generic avatar or piece */}
                                    ♟️
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">
                                        You
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        Local Player
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Action Controls (Under the board on mobile) */}
                        <div className="md:hidden flex flex-col gap-4 mt-2">
                            {/* We re-use ChessSidebar here on mobile so it sits naturally below the board like chess.com */}
                            <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5">
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
