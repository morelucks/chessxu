/**
 * useAiHint — React hook that computes and stores the AI best-move hint.
 * Part of feat #187: AI recommendations during gameplay.
 */

import { useEffect, useRef } from 'react';
import useAppStore from '../../zustand/store';
import { getBestMove } from '../ai/chessAnalysis';
