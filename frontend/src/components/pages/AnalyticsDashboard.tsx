/**
 * Analytics Dashboard Page
 *
 * Embeds the Dune Analytics dashboard for Chessxu and provides a
 * local overview of the 10 core queries grouped into 6 sections:
 *
 *   1. Overview   – Key counters (Total Games, Volume, Players, Avg Wager)
 *   2. Activity   – Daily games + daily volume time-series
 *   3. Players    – Unique players trend + top players table
 *   4. Outcomes   – Game resolution pie chart
 *   5. Token/Gas  – CHESS token + Paymaster stats
 *   6. Chain Cmp  – Side-by-side Stacks vs Celo metrics
 *
 * @see https://github.com/morelucks/chessxu/issues/163
 */

import { useState } from 'react';
import {
  BarChart3,
  ExternalLink,
  Activity,
  Users,
  Trophy,
  Coins,
  TrendingUp,
  Gamepad2,
  Target,
} from 'lucide-react';
import {
  DUNE_DASHBOARD_URL,
  DUNE_QUERIES,
  type DuneQueryDef,
} from '../../config/duneQueries';
import './AnalyticsDashboard.css';

// ── Section metadata ────────────────────────────────────────────────
interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SECTIONS: Section[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <BarChart3 size={14} />,
    description:
      'High-level platform health — total games created, cumulative wager volume, unique wallet count, and average wager size.',
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: <Activity size={14} />,
    description:
      'Daily and cumulative time-series charts for game creation and wager volume on Celo.',
  },
  {
    id: 'players',
    label: 'Players',
    icon: <Users size={14} />,
    description:
      'Unique player growth over time and a leaderboard of the most active wallets by games played.',
  },
  {
    id: 'outcomes',
    label: 'Outcomes',
    icon: <Trophy size={14} />,
    description:
      'Distribution of game results — White Wins, Black Wins, Draws, and Resignations — plus average wager trend.',
  },
  {
    id: 'token_gas',
    label: 'Gas Sponsorship',
    icon: <Coins size={14} />,
    description:
      'Gas sponsorship stats from the ChessxuPaymaster on Celo.',
  },
];

// ── KPI card data ───────────────────────────────────────────────────
interface KpiCard {
  icon: React.ReactNode;
  iconClass: string;
  value: string;
  label: string;
  chainClass: string;
  chainLabel: string;
}

const KPI_CARDS: KpiCard[] = [
  {
    icon: <Gamepad2 size={20} />,
    iconClass: 'analytics-kpi__icon--games',
    value: '—',
    label: 'Total Games',
    chainClass: 'analytics-kpi__chain--celo',
    chainLabel: 'Celo',
  },
  {
    icon: <TrendingUp size={20} />,
    iconClass: 'analytics-kpi__icon--volume',
    value: '—',
    label: 'Total Volume',
    chainClass: 'analytics-kpi__chain--celo',
    chainLabel: 'Celo',
  },
  {
    icon: <Users size={20} />,
    iconClass: 'analytics-kpi__icon--players',
    value: '—',
    label: 'Unique Players',
    chainClass: 'analytics-kpi__chain--celo',
    chainLabel: 'Celo',
  },
  {
    icon: <Target size={20} />,
    iconClass: 'analytics-kpi__icon--wager',
    value: '—',
    label: 'Avg Wager',
    chainClass: 'analytics-kpi__chain--celo',
    chainLabel: 'Celo',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────

/** Group queries by their section key. */
function queriesBySection(sectionId: string): DuneQueryDef[] {
  return Object.values(DUNE_QUERIES).filter((q) => q.section === sectionId);
}

/** Pretty chain label. */
function chainBadge() {
  const cls = `analytics-query-item__chain analytics-query-item__chain--celo`;
  return <span className={cls}>Celo</span>;
}

// ── Component ───────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="analytics-page" id="analytics-dashboard">
      <div className="analytics-page__inner">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="analytics-header">
          <h1 className="analytics-header__title">
            📊 Analytics Dashboard
          </h1>
          <p className="analytics-header__subtitle">
            Real-time on-chain metrics for Chessxu on Celo.
            Powered by{' '}
            <a
              href="https://dune.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#818cf8', textDecoration: 'underline' }}
            >
              Dune Analytics
            </a>
            .
          </p>
        </header>

        {/* ── KPI Cards ──────────────────────────────────────────── */}
        <div className="analytics-kpis">
          {KPI_CARDS.map((kpi, i) => (
            <div className="analytics-kpi" key={i} id={`analytics-kpi-${i}`}>
              <div className={`analytics-kpi__icon ${kpi.iconClass}`}>
                {kpi.icon}
              </div>
              <span className="analytics-kpi__value">{kpi.value}</span>
              <span className="analytics-kpi__label">{kpi.label}</span>
              <span className={`analytics-kpi__chain ${kpi.chainClass}`}>
                {kpi.chainLabel}
              </span>
            </div>
          ))}
        </div>

        {/* ── Section Tabs ───────────────────────────────────────── */}
        <div className="analytics-tabs" role="tablist" aria-label="Dashboard sections">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              role="tab"
              aria-selected={activeSection === sec.id}
              className={`analytics-tab ${activeSection === sec.id ? 'analytics-tab--active' : ''}`}
              onClick={() => setActiveSection(sec.id)}
              id={`analytics-tab-${sec.id}`}
            >
              <span className="analytics-tab__dot" />
              {sec.icon}
              {sec.label}
            </button>
          ))}
        </div>

        {/* ── Dune Embed Grid ─────────────────────────────────────── */}
        <div className="analytics-embed-grid">
          {queriesBySection(activeSection).map((query) => {
            const hasEmbed = query.queryId > 0 && query.vizId && query.vizId > 0;
            const embedUrl = hasEmbed
              ? `https://dune.com/embeds/${query.queryId}/${query.vizId}`
              : null;

            return (
              <div className="analytics-embed-card" key={query.label} id={`analytics-card-${query.queryId}`}>
                <div className="analytics-embed-card__header">
                  <h3 className="analytics-embed-card__title">{query.label}</h3>
                  <p className="analytics-embed-card__description">{query.description}</p>
                </div>
                <div className="analytics-embed-card__body">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="analytics-embed__iframe"
                      title={query.label}
                      sandbox="allow-scripts allow-same-origin allow-popups"
                      loading="lazy"
                    />
                  ) : (
                    <div className="analytics-embed__pending">
                      <div className="analytics-embed__pending-icon">⏳</div>
                      <h4 className="analytics-embed__pending-title">Query Configuration Pending</h4>
                      <p className="analytics-embed__pending-text">
                        This visualization is currently being set up on Dune Analytics. Please check back soon!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── External Links ─────────────────────────────────────── */}
        <div className="analytics-actions">
          <a
            href={DUNE_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="analytics-actions__link"
            id="analytics-open-dune"
          >
            <ExternalLink size={16} />
            Open on Dune
          </a>
          <div className="analytics-actions__chain-badges">
            <span className="analytics-chain-badge analytics-chain-badge--celo">
              ◈ Celo
            </span>
          </div>
        </div>

        {/* ── Section Cards ──────────────────────────────────────── */}
        <div className="analytics-sections">
          {SECTIONS.map((sec) => {
            const queries = queriesBySection(sec.id);
            const isActive = activeSection === sec.id;

            return (
              <div
                key={sec.id}
                className="analytics-section-card"
                style={{
                  order: isActive ? -1 : 0,
                  borderColor: isActive
                    ? 'rgba(99, 102, 241, 0.3)'
                    : undefined,
                }}
                id={`analytics-section-${sec.id}`}
              >
                <div className="analytics-section-card__header">
                  <div className="analytics-section-card__icon">
                    {sec.icon}
                  </div>
                  <h2 className="analytics-section-card__title">
                    {sec.label}
                  </h2>
                </div>
                <p className="analytics-section-card__description">
                  {sec.description}
                </p>
                {queries.length > 0 && (
                  <div className="analytics-section-card__queries">
                    {queries.map((q) => (
                      <div className="analytics-query-item" key={q.label}>
                        <span className="analytics-query-item__name">
                          {q.label}
                        </span>
                        {chainBadge()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
