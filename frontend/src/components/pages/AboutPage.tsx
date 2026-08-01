import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Zap, 
  Coins, 
  ShieldCheck, 
  Smartphone, 
  Puzzle, 
  Bot, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Layers,
  Flame,
  Award,
  Play
} from 'lucide-react';
import CartoonChessSimulation from '../landing/CartoonChessSimulation';
import './AboutPage.css';

// Interactive FAQ data
const faqs = [
  {
    question: "What is Chessxu?",
    answer: "Chessxu is a premier decentralized chess platform built natively on the Celo and Stacks blockchains. It allows players of all skill levels to play free matches against AI, solve daily chess puzzles, or compete in gasless peer-to-peer (PvP) wager battles with instant smart contract settlements."
  },
  {
    question: "How are games completely gasless on Celo?",
    answer: "Chessxu uses a custom Paymaster service on the Celo network. All transaction fees for moves, game creation, and wager settlements are automatically sponsored — allowing you to play and win without holding any gas tokens in your wallet."
  },
  {
    question: "How do cUSD and cEUR wagers work?",
    answer: "Players can create or join wager matches starting from as low as $0.10 in cUSD, cEUR, or CELO. Smart contracts hold the stakes securely during the match and instantly transfer 100% of the prize pool to the victor's wallet the moment checkmate or resignation occurs."
  },
  {
    question: "How do I play inside Opera MiniPay or Farcaster?",
    answer: "Chessxu is built from the ground up for mobile mini-apps. Open Chessxu inside Opera MiniPay or as a Farcaster Frame on Warpcast for seamless one-tap wallet connection and zero-browser setup."
  },
  {
    question: "Is my ELO rating stored on-chain?",
    answer: "Yes! Every ranked PvP match outcome updates your verifiable on-chain ELO rating. Ratings and match records are immutable, transparent, and displayed on the global Leaderboard."
  }
];

// Feature Pillars
const pillars = [
  {
    icon: Zap,
    title: "100% Gasless Gameplay",
    desc: "Every move, game creation, and payout is sponsored by the Chessxu Paymaster. Zero gas fees, zero friction.",
    badge: "Paymaster Sponsored",
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400"
  },
  {
    icon: Coins,
    title: "Stablecoin Wager Arenas",
    desc: "Wager cUSD, cEUR, or CELO in skill-based matches. No crypto volatility — win what you stake.",
    badge: "cUSD & cEUR Native",
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400"
  },
  {
    icon: Smartphone,
    title: "MiniPay & Farcaster Built-In",
    desc: "One-tap wallet connect and instant mobile access inside Opera MiniPay and Warpcast frames.",
    badge: "Mobile-First",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400"
  },
  {
    icon: Trophy,
    title: "On-Chain Verified ELO",
    desc: "Immutably tracked rating system on Celo & Stacks. Climb global leaderboards and earn verified badges.",
    badge: "Verifiable Rating",
    color: "from-purple-500/20 to-indigo-500/20",
    iconColor: "text-purple-400"
  },
  {
    icon: Bot,
    title: "Play vs AI Engine (Free)",
    desc: "Practice against intelligent AI difficulties with zero setup and zero wallet requirement to get started.",
    badge: "Unlimited Practice",
    color: "from-rose-500/20 to-pink-500/20",
    iconColor: "text-rose-400"
  },
  {
    icon: Puzzle,
    title: "Daily Tactical Puzzles",
    desc: "Sharpen your tactical vision with curated daily chess puzzles and earn streak rewards.",
    badge: "Tactics Training",
    color: "from-violet-500/20 to-fuchsia-500/20",
    iconColor: "text-violet-400"
  }
];

export default function AboutPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedTab, setSelectedTab] = useState<'pvp' | 'ai' | 'puzzles' | 'ranks'>('pvp');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-bg">
          <div className="about-hero-glow glow-1" />
          <div className="about-hero-glow glow-2" />
        </div>

        <div className="about-container relative z-10">
          <div className="about-hero-badge">
            <span className="badge-dot" />
            <span>The Next-Gen Web3 Chess Engine • Powered by Celo</span>
          </div>

          <h1 className="about-hero-title">
            Master the Board. <br />
            <span className="gradient-text">Own Your Victory On-Chain.</span>
          </h1>

          <p className="about-hero-subtitle">
            Chessxu combines classic chess mastery with gasless Web3 technology. 
            Enjoy sub-second moves, skill-based stablecoin wagers, AI practice, and verifiable on-chain ratings.
          </p>

          <div className="about-hero-cta">
            <button onClick={() => navigate('/')} className="cta-btn primary">
              <Play size={18} fill="currentColor" />
              <span>Play Game Now</span>
            </button>
            <button onClick={() => navigate('/pvp')} className="cta-btn secondary">
              <Zap size={18} />
              <span>Enter Wager Arena</span>
            </button>
            <button onClick={() => navigate('/puzzle')} className="cta-btn outline">
              <Puzzle size={18} />
              <span>Try Puzzles</span>
            </button>
          </div>

          {/* Key Metrics Strip */}
          <div className="metrics-strip">
            <div className="metric-item">
              <span className="metric-value">$0.00</span>
              <span className="metric-label">Gas Fees (Paymaster)</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-value">&lt; 1 sec</span>
              <span className="metric-label">Block Settlement</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-value">100%</span>
              <span className="metric-label">On-Chain Verified</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-value">cUSD/cEUR</span>
              <span className="metric-label">Stablecoin Wagers</span>
            </div>
          </div>

          {/* Cartoon Live Match Background Simulation */}
          <CartoonChessSimulation />
        </div>
      </section>

      {/* Interactive Tactics Showcase Section */}
      <section className="tactics-showcase-section">
        <div className="about-container">
          <div className="section-header text-center">
            <div className="section-tag">
              <Sparkles size={14} />
              <span>Interactive Experience</span>
            </div>
            <h2>Tactical Precision Meets Blockchain Speed</h2>
            <p>See how every move is executed, validated, and recorded in real time.</p>
          </div>

          <div className="tactics-card">
            <div className="tactics-board-container">
              {/* Decorative Mini Chess Board Grid */}
              <div className="mini-chess-board">
                {Array.from({ length: 64 }).map((_, i) => {
                  const row = Math.floor(i / 8);
                  const col = i % 8;
                  const isDark = (row + col) % 2 === 1;
                  
                  // Demo piece placements
                  let piece = null;
                  if (i === 4) piece = '♔';
                  if (i === 60) piece = '♚';
                  if (i === 27) piece = '♘';
                  if (i === 36) piece = '♟';
                  if (i === 11) piece = '♙';
                  if (i === 18) piece = '♗';

                  return (
                    <div 
                      key={i} 
                      className={`board-square ${isDark ? 'dark-sq' : 'light-sq'} ${i === 27 ? 'highlight-sq' : ''}`}
                    >
                      {piece && <span className={`square-piece ${row > 3 ? 'piece-black' : 'piece-white'}`}>{piece}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="tactics-details">
              <div className="tactics-badge">
                <ShieldCheck size={16} />
                <span>Verified Match #4092</span>
              </div>

              <h3>Knight's Gambit & Instant Settlement</h3>
              <p className="tactics-desc">
                When a player delivers checkmate or opponent resigns, the Celo smart contract automatically executes payout distribution within 800 milliseconds.
              </p>

              <div className="tactics-features-list">
                <div className="feature-check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span><strong>Gasless Execution:</strong> Sponsored by Paymaster</span>
                </div>
                <div className="feature-check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span><strong>FEN Board State:</strong> Immutable on-chain storage</span>
                </div>
                <div className="feature-check-item">
                  <CheckCircle2 size={18} className="check-icon" />
                  <span><strong>Anti-Cheat Verification:</strong> Server-side move arbiter</span>
                </div>
              </div>

              <div className="tactics-actions">
                <button onClick={() => navigate('/puzzle')} className="showcase-btn">
                  <span>Solve Daily Puzzle</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="pillars-section">
        <div className="about-container">
          <div className="section-header text-center">
            <div className="section-tag">
              <Flame size={14} />
              <span>Why Chessxu?</span>
            </div>
            <h2>Engineered for Serious Chess Players</h2>
            <p>Everything you need for an unmatched competitive chess experience.</p>
          </div>

          <div className="pillars-grid">
            {pillars.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="pillar-card">
                  <div className={`pillar-icon-wrapper ${item.color}`}>
                    <Icon className={item.iconColor} size={24} />
                  </div>
                  <span className="pillar-badge">{item.badge}</span>
                  <h3 className="pillar-title">{item.title}</h3>
                  <p className="pillar-desc">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Game Modes Tabbed Showcase */}
      <section className="modes-showcase-section">
        <div className="about-container">
          <div className="section-header text-center">
            <div className="section-tag">
              <Layers size={14} />
              <span>Game Modes</span>
            </div>
            <h2>Choose Your Arena</h2>
            <p>Whether you want to relax vs AI or wager in high-stakes arenas, Chessxu has a mode for you.</p>
          </div>

          <div className="modes-tab-bar">
            <button 
              className={`mode-tab ${selectedTab === 'pvp' ? 'active' : ''}`}
              onClick={() => setSelectedTab('pvp')}
            >
              <Zap size={16} />
              <span>PvP Wager Arenas</span>
            </button>
            <button 
              className={`mode-tab ${selectedTab === 'ai' ? 'active' : ''}`}
              onClick={() => setSelectedTab('ai')}
            >
              <Bot size={16} />
              <span>Play vs AI</span>
            </button>
            <button 
              className={`mode-tab ${selectedTab === 'puzzles' ? 'active' : ''}`}
              onClick={() => setSelectedTab('puzzles')}
            >
              <Puzzle size={16} />
              <span>Daily Puzzles</span>
            </button>
            <button 
              className={`mode-tab ${selectedTab === 'ranks' ? 'active' : ''}`}
              onClick={() => setSelectedTab('ranks')}
            >
              <Trophy size={16} />
              <span>Leaderboards</span>
            </button>
          </div>

          <div className="mode-content-card">
            {selectedTab === 'pvp' && (
              <div className="mode-detail">
                <div className="mode-info">
                  <span className="mode-pill">Real-Time Multiplayer</span>
                  <h3>Stake & Battle in PvP Arenas</h3>
                  <p>
                    Challenge opponents worldwide in 3min, 5min, or 10min blitz matches. Wager cUSD, cEUR, or CELO. 
                    The winner takes 100% of the prize pool directly to their wallet.
                  </p>
                  <button onClick={() => navigate('/pvp')} className="mode-action-btn">
                    <span>Enter PvP Arena</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="mode-preview-box pvp-box">
                  <div className="preview-stat">
                    <span className="stat-num">$0.10 - $100</span>
                    <span className="stat-lbl">Flexible Wagers</span>
                  </div>
                  <div className="preview-stat">
                    <span className="stat-num">Sub-second</span>
                    <span className="stat-lbl">Settlement</span>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'ai' && (
              <div className="mode-detail">
                <div className="mode-info">
                  <span className="mode-pill">Unlimited Free Matches</span>
                  <h3>Train Against Stockfish AI</h3>
                  <p>
                    Test your tactical vision against multiple AI difficulty levels. No wallet connection needed — 
                    jump straight into a match anytime to hone your openings and endgames.
                  </p>
                  <button onClick={() => navigate('/')} className="mode-action-btn">
                    <span>Play vs AI Now</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="mode-preview-box ai-box">
                  <div className="preview-stat">
                    <span className="stat-num">5 Levels</span>
                    <span className="stat-lbl">AI Difficulty</span>
                  </div>
                  <div className="preview-stat">
                    <span className="stat-num">Free</span>
                    <span className="stat-lbl">No Gas Needed</span>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'puzzles' && (
              <div className="mode-detail">
                <div className="mode-info">
                  <span className="mode-pill">Daily Challenge</span>
                  <h3>Solve Curated Tactical Puzzles</h3>
                  <p>
                    Daily tactical chess puzzles designed to test pattern recognition, mate in 2/3 combinations, and endgame techniques.
                  </p>
                  <button onClick={() => navigate('/puzzle')} className="mode-action-btn">
                    <span>Solve Puzzles</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="mode-preview-box puzzle-box">
                  <div className="preview-stat">
                    <span className="stat-num">Daily</span>
                    <span className="stat-lbl">Fresh Puzzles</span>
                  </div>
                  <div className="preview-stat">
                    <span className="stat-num">Streak Rewards</span>
                    <span className="stat-lbl">Track Progress</span>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'ranks' && (
              <div className="mode-detail">
                <div className="mode-info">
                  <span className="mode-pill">On-Chain Rankings</span>
                  <h3>Climb Global ELO Leaderboards</h3>
                  <p>
                    Compete for top positions on the transparent ELO leaderboard. Every rating update is recorded on-chain, proving your skills to the world.
                  </p>
                  <button onClick={() => navigate('/leaderboard')} className="mode-action-btn">
                    <span>View Leaderboards</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="mode-preview-box rank-box">
                  <div className="preview-stat">
                    <span className="stat-num">1200+ ELO</span>
                    <span className="stat-lbl">Pro Division</span>
                  </div>
                  <div className="preview-stat">
                    <span className="stat-num">Verifiable</span>
                    <span className="stat-lbl">On-Chain Proof</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="about-container max-w-4xl">
          <div className="section-header text-center">
            <div className="section-tag">
              <HelpCircle size={14} />
              <span>Questions & Answers</span>
            </div>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about playing on Chessxu.</p>
          </div>

          <div className="faq-accordion">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className={`faq-item ${isOpen ? 'open' : ''}`}
                  onClick={() => toggleFaq(idx)}
                >
                  <div className="faq-question">
                    <span>{faq.question}</span>
                    <ChevronDown className={`faq-chevron ${isOpen ? 'rotate' : ''}`} size={18} />
                  </div>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section className="about-bottom-cta">
        <div className="about-container text-center">
          <div className="cta-inner-card">
            <div className="cta-glow" />
            <Award className="cta-icon" size={48} />
            <h2>Ready to make your first move?</h2>
            <p>Join thousands of players competing in gasless, verifiable chess battles.</p>
            
            <div className="cta-buttons">
              <button onClick={() => navigate('/')} className="cta-btn primary lg">
                <Play size={20} fill="currentColor" />
                <span>Play Free Game</span>
              </button>
              <button onClick={() => navigate('/pvp')} className="cta-btn secondary lg">
                <Zap size={20} />
                <span>Start PvP Wager</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
// Hero section layout structure
// Key metrics strip component
// Interactive tactical preview board
