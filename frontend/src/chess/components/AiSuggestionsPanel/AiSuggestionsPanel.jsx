/**
 * AiSuggestionsPanel — AI hint sidebar panel for #187
 */

import useAppStore from '../../../zustand/store';
import './AiSuggestionsPanel.css';

/**
 * @param {{ appState: object }} props
 */
const AiSuggestionsPanel = ({ appState }) => {
