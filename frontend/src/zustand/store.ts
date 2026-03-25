import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppConfig, UserSession } from '@stacks/auth';

// Stacks Configuration
const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export interface AuthState {
  address: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface GameState {
  activeGameId: number | null;
  isGameStarted: boolean;
}

export interface AppStore extends AuthState, GameState {
  // Actions
  setAddress: (address: string | null) => void;
  setIsLoading: (isLoading) => void;
  setActiveGameId: (gameId: number | null) => void;
  setGameStarted: (started: boolean) => void;
  logout: () => void;
}

const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Authentication State
      address: null,
      isAuthenticated: false,
      isLoading: false,

      // Game State
      activeGameId: null,
      isGameStarted: false,

      // Actions
      setAddress: (address) => set({ address, isAuthenticated: !!address }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setActiveGameId: (activeGameId) => set({ activeGameId }),
      setGameStarted: (isGameStarted) => set({ isGameStarted }),
      logout: () => {
        userSession.signUserOut();
        set({ address: null, isAuthenticated: false, activeGameId: null, isGameStarted: false });
      },
    }),
    {
      name: 'stackchess-storage',
    }
  )
);

export default useAppStore;