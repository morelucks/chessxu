import React, { useState } from 'react';
import { HelpCircle, ChevronDown, MessageSquare, Shield, Zap, Swords, Coins, ArrowRight, ExternalLink } from 'lucide-react';
import './SupportPage.css';

interface FAQItem {
  id: string;
  category: 'general' | 'pvp' | 'tokens' | 'troubleshooting';
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'general',
    question: 'What is Chessxu?',
    answer: 'Chessxu is a decentralized, multi-chain crypto chess application built on Celo and Stacks. You can play against Stockfish AI for free or wager tokens in real-time PvP matches.',
  },
  {
    id: 'faq-2',
    category: 'general',
    question: 'Do I need a crypto wallet to play?',
    answer: 'No! You can play against the AI, solve daily puzzles, and practice for free without connecting a wallet. Connecting a wallet is only required if you want to play ranked PvP games with token wagers.',
  },
  {
    id: 'faq-3',
    category: 'pvp',
    question: 'How do PvP wagers and payouts work?',
    answer: 'When you create or join a PvP match, your wager (in CELO, cUSD, or STX) is held securely in an on-chain escrow contract. When the match ends via checkmate, resignation, or timeout, the winner automatically receives the pot.',
  },
  {
    id: 'faq-4',
    category: 'pvp',
    question: 'What happens if a player disconnects or abandons?',
    answer: 'If a player disconnects or stops making moves, the clock countdown continues. If their time runs out, the remaining active player can claim a win by timeout.',
  },
  {
    id: 'faq-5',
    category: 'tokens',
    question: 'What are Gasless Transactions / Paymaster?',
    answer: 'On Celo, Chessxu sponsors transaction gas fees via Account Abstraction (Paymaster). This means you can create games, submit moves, and claim rewards with zero gas fees!',
  },
  {
    id: 'faq-6',
    category: 'troubleshooting',
    question: 'My transaction is pending or failed. What should I do?',
    answer: 'If a transaction fails or stalls, check your network connection and ensure your wallet is connected to Celo Mainnet or Stacks Mainnet. You can also view real-time status in the Transaction HUD at the bottom of the screen.',
  },
];

export default function SupportPage() {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredFaqs = activeCategory === 'all' 
    ? FAQS 
    : FAQS.filter(f => f.category === activeCategory);

  return (
    <div className="support-page max-w-4xl mx-auto px-4 py-8 text-slate-100">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
          <HelpCircle size={14} />
          <span>Support & Help Center</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
          How can we help you?
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
          Find instant answers about PvP matchmaking, token wagers, gasless transactions, and account rules.
        </p>
      </div>

      {/* Quick Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {[
          { id: 'all', label: 'All Questions' },
          { id: 'general', label: 'General & Basics' },
          { id: 'pvp', label: 'PvP & Wagers' },
          { id: 'tokens', label: 'Gas & Rewards' },
          { id: 'troubleshooting', label: 'Troubleshooting' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3 mb-12">
        {filteredFaqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen 
                  ? 'bg-slate-900/90 border-indigo-500/40 shadow-lg shadow-indigo-950/30' 
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left gap-4"
              >
                <span className="font-bold text-sm md:text-base text-slate-100">
                  {faq.question}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-indigo-400 transition-transform duration-200 flex-shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-sm text-slate-300 border-t border-slate-800/50 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Community & Direct Support Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/20 text-center relative overflow-hidden">
        <div className="relative z-10">
          <MessageSquare size={32} className="mx-auto text-indigo-400 mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Still have questions?</h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto mb-5">
            Join our community on Farcaster or GitHub to get help directly from the developers and community.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://farcaster.xyz/miniapps/nRpKP2ahbJIm/chessxu"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-purple-600/30"
            >
              <span>Farcaster MiniApp</span>
              <ExternalLink size={14} />
            </a>
            <a
              href="https://github.com/morelucks/chessxu/issues"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
            >
              <span>Report an Issue</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
