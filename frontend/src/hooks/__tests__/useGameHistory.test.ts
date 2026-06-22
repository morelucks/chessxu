/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameHistory } from '../useGameHistory';
import { gameHistoryDB } from '../../services/gameHistoryDB';
import { gameSyncService } from '../../services/gameSyncService';
