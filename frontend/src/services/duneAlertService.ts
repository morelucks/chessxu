/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { getLatestResults } from './duneService';
import { useNotificationStore } from '../zustand/notificationStore';
import { DUNE_ALERTS_CONFIG } from '../config/duneAlerts';

// ---------------------------------------------------------------------------
// Types & Interface for Event Rows
// ---------------------------------------------------------------------------

export interface DuneEventRow {
  event_id: string; // Used for deduplication
  timestamp: string;
