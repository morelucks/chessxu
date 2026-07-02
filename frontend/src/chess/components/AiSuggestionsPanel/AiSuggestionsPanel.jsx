/**
 * AiSuggestionsPanel — AI hint sidebar panel for #187
 */

import useAppStore from '../../../zustand/store';
import './AiSuggestionsPanel.css';

/**
 * @param {{ appState: object }} props
 */
const AiSuggestionsPanel = ({ appState }) => {
    const isAiHintsEnabled   = useAppStore((s) => s.isAiHintsEnabled);
    const setAiHintsEnabled  = useAppStore((s) => s.setAiHintsEnabled);
    const showHintOnBoard    = useAppStore((s) => s.showHintOnBoard);
    const setShowHintOnBoard = useAppStore((s) => s.setShowHintOnBoard);
    const activeAiHint       = useAppStore((s) => s.activeAiHint);

    const isOngoing    = appState?.status === 'Ongoing';
    const isPlayerTurn = appState?.turn === (appState?.playerColor ?? 'w');

    return (
        <div className="ai-panel" role="region" aria-label="AI Suggestions">
            {/* Header */}
            <div className="ai-panel__header">
                <span className="ai-panel__icon" aria-hidden="true">🧠</span>
                <h3 className="ai-panel__title">AI Suggestions</h3>
            </div>

            {/* Enable / disable toggle */}
            <div className="ai-panel__controls">
                <label className="ai-toggle-row" htmlFor="ai-hints-toggle">
                    <span className="ai-toggle-label">Enable AI Hints</span>
                    <span className="ai-switch">
                        <input id="ai-hints-toggle" type="checkbox"
                            checked={isAiHintsEnabled}
                            onChange={(e) => setAiHintsEnabled(e.target.checked)}
                            aria-checked={isAiHintsEnabled} />
                        <span className="ai-switch__track" />
                    </span>
                </label>

                {isAiHintsEnabled && (
                    <label className="ai-toggle-row" htmlFor="ai-board-overlay-toggle">
                        <span className="ai-toggle-label">Highlight on Board</span>
                        <span className="ai-switch">
                            <input id="ai-board-overlay-toggle" type="checkbox"
                                checked={showHintOnBoard}
                                onChange={(e) => setShowHintOnBoard(e.target.checked)}
                                aria-checked={showHintOnBoard} />
                            <span className="ai-switch__track" />
                        </span>
                    </label>
                )}
            </div>

            {/* Suggestion content */}
            {isAiHintsEnabled && (
                <div className="ai-panel__content">
                    {!isOngoing ? (
                        <p className="ai-panel__status">Start a game to see suggestions.</p>
                    ) : !isPlayerTurn ? (
                        <p className="ai-panel__status">Waiting for your turn… ⏱️</p>
                    ) : !activeAiHint ? (
                        <div className="ai-panel__loading" aria-live="polite">
                            <span className="ai-spinner" aria-hidden="true" />
                            <span>Analysing board…</span>
                        </div>
                    ) : (
                        <div className="ai-card" aria-live="polite">
                            <div className="ai-card__header">
                                <span className="ai-badge">Best Move</span>
                                <span className={`ai-eval ${activeAiHint.evaluation >= 0 ? 'ai-eval--pos' : 'ai-eval--neg'}`}>
                                    {activeAiHint.evaluation >= 0 ? `+${activeAiHint.evaluation.toFixed(2)}` : activeAiHint.evaluation.toFixed(2)}
                                </span>
                            </div>
                            <div className="ai-card__notation">{activeAiHint.notation}</div>
                            <div className="ai-card__description">{activeAiHint.description}</div>
                            <div className="ai-card__tip">
                                {activeAiHint.evaluation >= 2
                                    ? '✨ Strong advantage — keep the pressure on.'
                                    : activeAiHint.evaluation <= -2
                                    ? '⚠️ Opponent has the edge — play defensively.'
                                    : '⚖️ Equal position — control the centre carefully.'}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AiSuggestionsPanel;
    // aria-live on ai-card ensures screen readers announce hint changes
    // isPlayerTurn check prevents showing stale hint for opponent moves
    // Evaluation displayed in pawns (centipawns / 100) for readability
    // Spinner replaced by ai-card once hint computation completes
    // Controls always rendered so user can toggle hints mid-game
