import { useState } from "react";
import "./ProfilePage.css";
import {
  User,
  Copy,
  CheckCheck,
  ExternalLink,
  Shield,
  Swords,
  TrendingUp,
  Wallet,
  Link2,
  ChevronRight,
  Crown,
  Coins,
  LogOut,
} from "lucide-react";
import useAppStore from "../../zustand/store";
import { useWalletAuth } from "../../hooks/useWalletAuth";

// ─── Helpers ────────────────────────────────────────────────────────────────

function shortenAddr(addr: string | null | undefined, pre = 6, suf = 4) {
  if (!addr) return "—";
  if (addr.startsWith("fc:")) return `fid:${addr.slice(3)}`;
  return `${addr.slice(0, pre)}…${addr.slice(-suf)}`;
}

function eloRank(elo: number) {
  if (elo >= 2200) return { label: "Master", color: "#facc15", icon: "👑" };
  if (elo >= 1800) return { label: "Expert", color: "#a78bfa", icon: "💜" };
  if (elo >= 1500) return { label: "Advanced", color: "#60a5fa", icon: "🔵" };
  if (elo >= 1200) return { label: "Intermediate", color: "#34d399", icon: "🟢" };
  return { label: "Beginner", color: "#94a3b8", icon: "⚪" };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CopyBadge({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="profile-copy-badge" onClick={copy} title={`Copy ${label}`}>
      <span className="profile-copy-value">{shortenAddr(value)}</span>
      <span className="profile-copy-icon">
        {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
      </span>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="profile-stat-card" style={{ "--accent": accent } as React.CSSProperties}>
      <div className="profile-stat-icon">{icon}</div>
      <div className="profile-stat-body">
        <p className="profile-stat-label">{label}</p>
        <p className="profile-stat-value">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { disconnect } = useWalletAuth();
  const farcasterUser = useAppStore((s) => s.farcasterUser);
  const address = useAppStore((s) => s.address);
  const celoAddress = useAppStore((s) => s.celoAddress);
  const stacksAddress = useAppStore((s) => s.stacksAddress);
  const activeChain = useAppStore((s) => s.activeChain);
  const elo = useAppStore((s) => s.elo);
  const chessBalance = useAppStore((s) => s.chessBalance);
  const isFarcaster = useAppStore((s) => s.isFarcaster);

  const rank = eloRank(elo);
  const displayName = farcasterUser?.displayName || farcasterUser?.username || "Anonymous";
  const username = farcasterUser?.username ? `@${farcasterUser.username}` : null;
  const pfp = farcasterUser?.pfpUrl;
  const fid = farcasterUser?.fid;

  const getAvatarFallback = (eloVal: number) => {
    let piece = "♟";
    let bg = "radial-gradient(circle, rgba(148, 163, 184, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)";

    if (eloVal >= 2200) {
      piece = "👑";
      bg = "radial-gradient(circle, rgba(250, 204, 21, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%)";
    } else if (eloVal >= 1800) {
      piece = "♕";
      bg = "radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%)";
    } else if (eloVal >= 1500) {
      piece = "♖";
      bg = "radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%)";
    } else if (eloVal >= 1200) {
      piece = "♘";
      bg = "radial-gradient(circle, rgba(52, 211, 153, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%)";
    }

    return (
      <div 
        className="profile-avatar-fallback-chess" 
        style={{ 
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          fontSize: '2.4rem'
        }}
      >
        {piece}
      </div>
    );
  };

  return (
    <div className="profile-root">
      {/* Ambient glow background */}
      <div className="profile-bg-glow glow-purple" />
      <div className="profile-bg-glow glow-blue" />

      <div className="profile-container">

        {/* ── Avatar + Identity ── */}
        <div className="profile-hero-card">
          <div className="profile-avatar-ring" style={{ borderColor: rank.color }}>
            {pfp ? (
              <img src={pfp} alt={displayName} className="profile-avatar-img" />
            ) : (
              getAvatarFallback(elo)
            )}
            <span className="profile-rank-badge" title={rank.label}>
              {rank.icon}
            </span>
          </div>

          <div className="profile-identity">
            <h1 className="profile-display-name">{displayName}</h1>
            {username && <p className="profile-username">{username}</p>}
            {fid && (
              <div className="profile-fid-row">
                <Shield size={12} className="text-purple-400" />
                <span>FID #{fid}</span>
                {isFarcaster && (
                  <a
                    href={`https://warpcast.com/${farcasterUser?.username || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-fid-link"
                  >
                    Warpcast <ExternalLink size={11} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Rank pill */}
          <div
            className="profile-rank-pill"
            style={{ backgroundColor: `${rank.color}20`, color: rank.color, borderColor: `${rank.color}40` }}
          >
            <Crown size={13} />
            {rank.label}
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="profile-stats-grid">
          <StatCard
            icon={<TrendingUp size={18} />}
            label="ELO Rating"
            value={elo}
            accent="#a78bfa"
          />
          <StatCard
            icon={<Coins size={18} />}
            label="Chess Balance"
            value={`${chessBalance} CHESS`}
            accent="#facc15"
          />
          <StatCard
            icon={<Swords size={18} />}
            label="Active Chain"
            value="🟡 Celo"
            accent="#60a5fa"
          />
          <StatCard
            icon={<Wallet size={18} />}
            label="Wallet"
            value={address ? shortenAddr(address) : "Not connected"}
            accent="#34d399"
          />
        </div>

        {/* ── Wallet Addresses ── */}
        <div className="profile-section-card">
          <div className="profile-section-header">
            <Wallet size={16} className="text-indigo-400" />
            <h2 className="profile-section-title">Wallet Addresses</h2>
          </div>

          <div className="profile-address-list">
            {celoAddress && (
              <div className="profile-address-row">
                <div className="profile-address-label">
                  <span className="profile-chain-dot" style={{ background: "#FCFF52" }} />
                  Celo / EVM
                </div>
                <CopyBadge value={celoAddress} label="Celo address" />
                <a
                  href={`https://celoscan.io/address/${celoAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-scan-link"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            )}

            {!celoAddress && (
              <p className="profile-empty-msg">No wallet connected yet.</p>
            )}
          </div>
        </div>

        {/* ── Farcaster Identity ── */}
        {isFarcaster && farcasterUser && (
          <div className="profile-section-card">
            <div className="profile-section-header">
              <Link2 size={16} className="text-purple-400" />
              <h2 className="profile-section-title">Farcaster Identity</h2>
            </div>

            <div className="profile-fc-grid">
              <div className="profile-fc-field">
                <p className="profile-fc-key">FID</p>
                <p className="profile-fc-val">#{farcasterUser.fid}</p>
              </div>
              {farcasterUser.username && (
                <div className="profile-fc-field">
                  <p className="profile-fc-key">Username</p>
                  <p className="profile-fc-val">@{farcasterUser.username}</p>
                </div>
              )}
              {farcasterUser.displayName && (
                <div className="profile-fc-field">
                  <p className="profile-fc-key">Display Name</p>
                  <p className="profile-fc-val">{farcasterUser.displayName}</p>
                </div>
              )}
            </div>

            <a
              href={`https://warpcast.com/${farcasterUser.username || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-warpcast-btn"
            >
              <span>View on Warpcast</span>
              <ChevronRight size={16} />
            </a>
          </div>
        )}

        {/* ── Guest / not connected nudge ── */}
        {!farcasterUser && !address && (
          <div className="profile-guest-card">
            <User size={32} className="text-slate-500 mb-3" />
            <p className="text-slate-300 font-semibold mb-1">No profile found</p>
            <p className="text-slate-500 text-sm">
              Open Chessxu inside Warpcast or connect a wallet to see your profile here.
            </p>
          </div>
        )}

        {address && (
          <button
            onClick={disconnect}
            className="profile-disconnect-btn"
          >
            <LogOut size={16} />
            <span>Disconnect Wallet</span>
          </button>
        )}
      </div>
    </div>
  );
}
