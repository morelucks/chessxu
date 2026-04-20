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
