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
} from "lucide-react";
import useAppStore from "../../zustand/store";

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
