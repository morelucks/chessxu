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
    // Mobile sidebar visibility
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);

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
            {/* Mobile hamburger buttons */}
            <div className="md:hidden flex items-center justify-between px-2 py-2 gap-2">
                <button
                    className="px-3 py-2 rounded bg-slate-700 text-white text-sm border border-slate-600"
                    onClick={() => setLeftOpen(v => !v)}
                >
                    {leftOpen ? 'Hide Menu' : 'Menu'}
                </button>
                <button
                    className="px-3 py-2 rounded bg-slate-700 text-white text-sm border border-slate-600"
                    onClick={() => setRightOpen(v => !v)}
                >
                    {rightOpen ? 'Hide Moves' : 'Moves'}
                </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-visible">
                {/* Left Sidebar - Chess Game Controls */}
                <div className={`w-full md:w-80 flex-shrink-0 bg-slate-800/30 border-b md:border-b-0 md:border-r border-slate-700 p-4 overflow-y-auto ${leftOpen ? 'block' : 'hidden'} md:block`}>
                    <ChessSidebar />
                </div>

                {/* Chess Board Area */}
                <div className="flex-1 flex items-center justify-center p-2 md:p-4 overflow-auto">
                    <div className="bg-slate-800/60 rounded-lg p-2 md:p-4 shadow-lg border border-slate-700 max-w-full">
                        <ChessBoardOnly />
                    </div>
                </div>

                {/* Right Sidebar - Move History */}
                <div
                    className={`w-full md:w-64 flex-shrink-0 bg-slate-800/30 border-t md:border-t-0 md:border-l border-slate-700 p-4 overflow-hidden ${rightOpen ? 'block' : 'hidden'} md:block`}
                    style={{ height: 'calc(100vh - 64px)' }}
                >
                    <MoveHistorySidebar />
                </div>
            </div>
        </AppContext.Provider>
    );
}
