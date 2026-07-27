/**
 * Frontend Improvement Roadmap 2025 Metadata & Task Tracker Configuration
 */

export type RoadmapPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type RoadmapCategory =
  | 'Security & Stability'
  | 'Architecture & Code Quality'
  | 'Testing & Performance'
  | 'UX & Features'
  | 'Monitoring';

export interface RoadmapTask {
  id: number;
  issueNumber: number;
  title: string;
  priority: RoadmapPriority;
  category: RoadmapCategory;
  estimatedHours: string;
  completed: boolean;
  prUrl?: string;
  description: string;
}

export interface RoadmapSummary {
  totalTasks: number;
  completedTasks: number;
  totalEstimatedHours: string;
  p0Count: number;
  p1Count: number;
  p2Count: number;
  p3Count: number;
}

export const FRONTEND_ROADMAP_TASKS: RoadmapTask[] = [
  {
    id: 1,
    issueNumber: 208,
    title: 'Add Error Boundary to Chess Game',
    priority: 'P0',
    category: 'Security & Stability',
    estimatedHours: '4-6',
    completed: false,
    description: 'Prevent game crashes from unhandled component or web worker render errors.',
  },
  {
    id: 2,
    issueNumber: 209,
    title: "Replace 'any' types with proper TypeScript types",
    priority: 'P0',
    category: 'Security & Stability',
    estimatedHours: '6-10',
    completed: true,
    prUrl: 'https://github.com/morelucks/chessxu/pull/226',
    description: 'Eliminate any types across services, hooks, components, and enforce noImplicitAny.',
  },
  {
    id: 3,
    issueNumber: 210,
    title: 'Add Accessibility (ARIA) Support to Chess Board',
    priority: 'P0',
    category: 'Security & Stability',
    estimatedHours: '5-6',
    completed: false,
    description: 'WCAG 2.1 AA keyboard navigation and screen reader grid roles.',
  },
  {
    id: 4,
    issueNumber: 211,
    title: 'Migrate JavaScript Files to TypeScript',
    priority: 'P1',
    category: 'Architecture & Code Quality',
    estimatedHours: '12-18',
    completed: false,
    description: 'Migrate remaining legacy JS/JSX components and helpers to TS/TSX.',
  },
  {
    id: 5,
    issueNumber: 212,
    title: 'Consolidate State Management (Zustand + Context → Zustand Only)',
    priority: 'P1',
    category: 'Architecture & Code Quality',
    estimatedHours: '12-16',
    completed: false,
    description: 'Unify AppContext state into Zustand slices to prevent dual state drift.',
  },
  {
    id: 6,
    issueNumber: 213,
    title: 'Split celoService into Focused Service Modules',
    priority: 'P1',
    category: 'Architecture & Code Quality',
    estimatedHours: '10-16',
    completed: false,
    description: 'Decompose monolithic celoService into paymaster, contract, and wallet modules.',
  },
  {
    id: 7,
    issueNumber: 214,
    title: 'Add Comprehensive Test Coverage for Chess Logic',
    priority: 'P2',
    category: 'Testing & Performance',
    estimatedHours: '14-20',
    completed: false,
    description: 'Unit tests for arbiter, FEN parsers, minimax evaluation, and game state transitions.',
  },
  {
    id: 8,
    issueNumber: 215,
    title: 'Implement Code Splitting and Bundle Optimization',
    priority: 'P2',
    category: 'Testing & Performance',
    estimatedHours: '8-12',
    completed: false,
    description: 'Dynamic imports and Rollup manual chunking to keep main bundle under 350KB.',
  },
  {
    id: 9,
    issueNumber: 216,
    title: 'Optimize React Re-renders with Memoization',
    priority: 'P2',
    category: 'Testing & Performance',
    estimatedHours: '8-12',
    completed: false,
    description: 'Wrap 64 board squares with React.memo and custom equality comparators.',
  },
  {
    id: 10,
    issueNumber: 217,
    title: 'Fix Incomplete TODO Items and Remove Stub Code',
    priority: 'P2',
    category: 'Testing & Performance',
    estimatedHours: '6-14',
    completed: false,
    description: 'Clean up inline TODOs, dummy balance mocks, and unused helper functions.',
  },
  {
    id: 11,
    issueNumber: 218,
    title: 'Add Loading Skeletons and Improve Loading States',
    priority: 'P3',
    category: 'UX & Features',
    estimatedHours: '4-6',
    completed: false,
    description: 'UI Skeleton placeholders for leaderboards, profile statistics, and history cards.',
  },
  {
    id: 12,
    issueNumber: 219,
    title: 'Implement Retry Mechanism for Failed Transactions',
    priority: 'P3',
    category: 'UX & Features',
    estimatedHours: '5-8',
    completed: false,
    description: 'Automated exponential backoff retries for Celo & Stacks network calls.',
  },
  {
    id: 13,
    issueNumber: 220,
    title: 'Add E2E Tests with Playwright',
    priority: 'P3',
    category: 'Testing & Performance',
    estimatedHours: '8-12',
    completed: false,
    description: 'Playwright test suite for matchmaking, game moves, and wallet connection.',
  },
  {
    id: 14,
    issueNumber: 221,
    title: 'Update README and Documentation',
    priority: 'P3',
    category: 'UX & Features',
    estimatedHours: '3-5',
    completed: false,
    description: 'Update project documentation, architecture diagrams, and setup instructions.',
  },
  {
    id: 15,
    issueNumber: 222,
    title: 'Add Move Animation for Smooth Piece Transitions',
    priority: 'P3',
    category: 'UX & Features',
    estimatedHours: '4-8',
    completed: false,
    description: 'Framer motion / CSS animations for smooth piece movements on board.',
  },
  {
    id: 16,
    issueNumber: 223,
    title: 'Add Game History Filters and Search',
    priority: 'P3',
    category: 'UX & Features',
    estimatedHours: '4-8',
    completed: false,
    description: 'Search & filter controls by result, wager currency, and blockchain network.',
  },
  {
    id: 17,
    issueNumber: 224,
    title: 'Add Sentry Error Tracking',
    priority: 'P3',
    category: 'Monitoring',
    estimatedHours: '4-6',
    completed: false,
    description: 'Sentry client SDK integration for error logging and session replay.',
  },
];

export const ROADMAP_SUMMARY: RoadmapSummary = {
  totalTasks: FRONTEND_ROADMAP_TASKS.length,
  completedTasks: FRONTEND_ROADMAP_TASKS.filter((t) => t.completed).length,
  totalEstimatedHours: '117-183',
  p0Count: FRONTEND_ROADMAP_TASKS.filter((t) => t.priority === 'P0').length,
  p1Count: FRONTEND_ROADMAP_TASKS.filter((t) => t.priority === 'P1').length,
  p2Count: FRONTEND_ROADMAP_TASKS.filter((t) => t.priority === 'P2').length,
  p3Count: FRONTEND_ROADMAP_TASKS.filter((t) => t.priority === 'P3').length,
};
