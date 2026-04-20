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
