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
import './CapturedPieces.css';

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

    const position = appState.position[appState.position.length - 1];

    // Helper to calculate captured pieces
    const getCapturedPieces = (pos: string[][]) => {
        if (!pos) return { w: [], b: [] };
        const currentCount: Record<string, number> = {};
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = pos[r]?.[c];
                if (piece) {
                    currentCount[piece] = (currentCount[piece] || 0) + 1;
                }
            }
        }

        const startingSet: Record<string, number> = {
            wp: 8, wr: 2, wn: 2, wb: 2, wq: 1,
            bp: 8, br: 2, bn: 2, bb: 2, bq: 1
        };

        const captured: { w: string[]; b: string[] } = {
            w: [],
            b: []
        };

        Object.keys(startingSet).forEach(piece => {
            const count = startingSet[piece];
            const current = currentCount[piece] || 0;
            const capturedCount = count - current;
            if (capturedCount > 0) {
                for (let i = 0; i < capturedCount; i++) {
                    if (piece.startsWith('w')) {
                        captured.w.push(piece);
                    } else {
                        captured.b.push(piece);
                    }
                }
            }
        });

        const pieceOrder: Record<string, number> = { p: 1, n: 2, b: 3, r: 4, q: 5 };
        const sortFunc = (a: string, b: string) => pieceOrder[a[1]] - pieceOrder[b[1]];
        captured.w.sort(sortFunc);
        captured.b.sort(sortFunc);

        return captured;
    };

    const getPieceValue = (p: string) => {
        const type = p[1];
        if (type === 'p') return 1;
        if (type === 'n') return 3;
        if (type === 'b') return 3;
        if (type === 'r') return 5;
        if (type === 'q') return 9;
        return 0;
    };

    const captured = getCapturedPieces(position);
    const whiteScore = captured.b.reduce((sum, p) => sum + getPieceValue(p), 0);
    const blackScore = captured.w.reduce((sum, p) => sum + getPieceValue(p), 0);

    const whiteAdvantage = whiteScore - blackScore;
    const blackAdvantage = blackScore - whiteScore;

    const opponentCapturedPieces = appState.playerColor === 'w' ? captured.w : captured.b;
    const opponentAdvantage = appState.playerColor === 'w' ? blackAdvantage : whiteAdvantage;

    const playerCapturedPieces = appState.playerColor === 'w' ? captured.b : captured.w;
    const playerAdvantage = appState.playerColor === 'w' ? whiteAdvantage : blackAdvantage;

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

    // PvP is locked in offline mode — show lock indicator
    const opponentName = appState.gameMode === 'pvc' ? 'Stockfish AI' : (isOfflineMode ? 'Connect Wallet for PvP' : 'Opponent');
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
                                    {opponentCapturedPieces.length > 0 && (
                                        <div className="captured-pieces-container">
                                            {opponentCapturedPieces.map((piece, idx) => (
                                                <div key={idx} className={`captured-piece ${piece}`} />
                                            ))}
                                            {opponentAdvantage > 0 && (
                                                <span className="material-advantage">+{opponentAdvantage}</span>
                                            )}
                                        </div>
                                    )}
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
                                    {playerCapturedPieces.length > 0 && (
                                        <div className="captured-pieces-container">
                                            {playerCapturedPieces.map((piece, idx) => (
                                                <div key={idx} className={`captured-piece ${piece}`} />
                                            ))}
                                            {playerAdvantage > 0 && (
                                                <span className="material-advantage">+{playerAdvantage}</span>
                                            )}
                                        </div>
                                    )}
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
    // onGameComplete increments offlineGamesPlayed for upgrade prompt tracking
    // isOfflineMode shows Offline in player profile sub-label
    // canPlayOnChain used to gate PvP lobby access from wrapper
    // Offline mode: PvC and pass-and-play work without any wallet
    // Game complete tracking only runs in offline mode to avoid double-counting
    // playerSub shows ELO in all modes for consistent profile display
    // isOfflineMode read from freemium hook, not directly from store
    // FreemiumUpgradeSection in sidebar gives persistent visibility on desktop
    // Freemium design: show what on-chain play looks like before requiring wallet
    // Offline player name shows 'You' — no address to truncate
