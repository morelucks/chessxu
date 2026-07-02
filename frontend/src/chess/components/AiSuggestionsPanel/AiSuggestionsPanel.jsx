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
