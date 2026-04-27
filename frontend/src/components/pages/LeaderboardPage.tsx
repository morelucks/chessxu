import OnChainLeaderboard from '../OnChainLeaderboard';
import { useGlobalStats } from '../../chess/hooks/useLeaderboard';
import './LeaderboardPage.css';

export default function LeaderboardPage() {
  const { globalStats } = useGlobalStats();

  const getDisplayValue = (val: any) => {
    if (val && typeof val === 'object' && 'value' in val) return String(val.value);
    return String(val ?? 0);
  };

  return (
    <div className="lb-page">
      <div className="lb-page__inner">
        <h1 className="lb-page__title">Chessxu Leaderboard</h1>
        {globalStats && (
          <div className="lb-page__global">
            <div className="lb-page__stat">
              <span className="lb-page__stat-value">
                {getDisplayValue((globalStats as any)['total-games'])}
              </span>
              <span className="lb-page__stat-label">Total Games</span>
            </div>
            <div className="lb-page__stat">
              <span className="lb-page__stat-value">
                {getDisplayValue((globalStats as any)['total-players'])}
              </span>
              <span className="lb-page__stat-label">Players</span>
            </div>
            <div className="lb-page__stat">
              <span className="lb-page__stat-value">
                {getDisplayValue((globalStats as any)['total-decisive'])}
              </span>
              <span className="lb-page__stat-label">Decisive Games</span>
            </div>
          </div>
        )}
        <OnChainLeaderboard />
      </div>
    </div>
  );
}
