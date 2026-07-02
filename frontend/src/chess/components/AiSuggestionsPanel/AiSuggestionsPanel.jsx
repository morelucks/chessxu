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
