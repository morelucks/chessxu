import { useState, useCallback, useEffect } from 'react';
import { playChessSound, initAudioContext } from '../audio';
import { SOUND_MUTED_KEY, SOUND_VOLUME_KEY, DEFAULT_VOLUME } from '../audio/constants';

/**
