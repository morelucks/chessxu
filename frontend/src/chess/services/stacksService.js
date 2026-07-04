/**
 * Stub service — Stacks blockchain integration has been removed.
 * All methods return safe defaults so existing consumers don't crash.
 */
const stacksService = {
  network: null,
  isMainnet: false,
  appDetails: {
    name: 'Chessxu',
    icon: window.location.origin + '/vite.svg',
  },

  connectWallet: () => {},
  createGame: () => {},
  joinGame: () => {},
  submitMove: () => {},
  resignGame: () => {},

  getLastGameId: async () => 0,
  getGameState: async () => null,
  getPlayerStats: async () => null,
  getGameCount: async () => 0,
  getPlayerElo: async () => 1200,
  getGlobalStats: async () => null,
  getExpectedScore: async () => 500,
};

export default stacksService;
