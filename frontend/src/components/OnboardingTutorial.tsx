import React, { useState, useEffect, useCallback } from 'react';
import { Swords, Bot, Puzzle, Trophy, Wallet, ArrowRight, X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import './OnboardingTutorial.css';

const STORAGE_KEY = 'chessxu-onboarding-completed';

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
  hint: string;
}

const steps: OnboardingStep[] = [
  {
    icon: Sparkles,
    title: 'Welcome to Chessxu',
    description: 'On-chain chess powered by Celo. Play against AI for free or connect a wallet to compete in ranked PvP matches with real wagers.',
    accent: 'onboarding-accent--purple',
    hint: 'No wallet needed to start playing!',
  },
  {
    icon: Bot,
    title: 'Select Your Initial Skill Level',
    description: 'Choose your starting experience level so we match you against the right AI difficulty and calibrate your starting rating correctly.',
    accent: 'onboarding-accent--blue',
    hint: 'You can adjust this anytime in your profile!',
  },
  {
    icon: Wallet,
    title: 'Connect Your Wallet',
    description: 'Link your wallet to unlock ranked PvP, wagering, leaderboards, and on-chain rewards. Works with MetaMask, MiniPay, WalletConnect, and more.',
    accent: 'onboarding-accent--emerald',
    hint: 'Zero gas fees on Celo — completely free to connect',
  },
  {
    icon: Swords,
    title: 'Stake & Battle PvP',
    description: 'Challenge real opponents in ranked matches. Wager as little as $0.10 in CELO or cUSD. The winner takes the pot — settled instantly to your wallet.',
    accent: 'onboarding-accent--amber',
    hint: 'Stake → Play → Win & Earn',
  },
  {
    icon: Trophy,
    title: 'Climb the Ranks',
    description: 'Every win boosts your on-chain ELO rating. Compete on global leaderboards, earn badges, and build your chess legacy — all recorded permanently.',
    accent: 'onboarding-accent--pink',
    hint: 'Your achievements live on the blockchain forever',
  },
];

export default function OnboardingTutorial() {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  useEffect(() => {
    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        // Small delay so the app renders first
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable — don't show
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch { /* ignore */ }
    }, 300);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection('next');
      setCurrentStep((s) => s + 1);
    } else {
      handleDismiss();
    }
  }, [currentStep, handleDismiss]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection('prev');
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    handleDismiss();
  }, [handleDismiss]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, handleNext, handlePrev, handleSkip]);

  if (!visible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const [selectedSkill, setSelectedSkill] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const handleSelectSkill = (level: 'beginner' | 'intermediate' | 'advanced', elo: number) => {
    setSelectedSkill(level);
    try {
      localStorage.setItem('chessxu-user-skill-level', level);
      localStorage.setItem('chessxu-user-elo', elo.toString());
    } catch { /* ignore */ }
  };

  return (
    <div className={`onboarding-overlay ${exiting ? 'onboarding-overlay--exiting' : ''}`}>
      <div className="onboarding-card" role="dialog" aria-label="Onboarding tutorial">
        {/* Close button */}
        <button className="onboarding-close" onClick={handleSkip} aria-label="Skip tutorial">
          <X size={16} />
        </button>

        {/* Progress bar */}
        <div className="onboarding-progress-track">
          <div
            className="onboarding-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step content */}
        <div className={`onboarding-step onboarding-step--${direction}`} key={currentStep}>
          {/* Icon */}
          <div className={`onboarding-icon ${step.accent}`}>
            <Icon size={32} />
            <div className="onboarding-icon-ring" />
          </div>

          {/* Step counter */}
          <div className="onboarding-counter">
            {currentStep + 1} / {steps.length}
          </div>

          {/* Title & description */}
          <h2 className="onboarding-title">{step.title}</h2>
          <p className="onboarding-description">{step.description}</p>

          {/* Interactive Skill Selector on Step 2 */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-2 my-3 w-full text-left">
              <button
                type="button"
                onClick={() => handleSelectSkill('beginner', 800)}
                className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                  selectedSkill === 'beginner'
                    ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-950/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    🟢 Beginner
                    <span className="text-xs opacity-75 font-mono">(800 ELO)</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">New to chess or learning piece rules</div>
                </div>
                {selectedSkill === 'beginner' && <Sparkles size={16} className="text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectSkill('intermediate', 1200)}
                className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                  selectedSkill === 'intermediate'
                    ? 'border-amber-500/80 bg-amber-500/10 text-amber-300 shadow-lg shadow-amber-950/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    🟡 Intermediate
                    <span className="text-xs opacity-75 font-mono">(1200 ELO)</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Know standard tactics & opening principles</div>
                </div>
                {selectedSkill === 'intermediate' && <Sparkles size={16} className="text-amber-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectSkill('advanced', 1600)}
                className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                  selectedSkill === 'advanced'
                    ? 'border-rose-500/80 bg-rose-500/10 text-rose-300 shadow-lg shadow-rose-950/40'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    🔴 Advanced
                    <span className="text-xs opacity-75 font-mono">(1600 ELO)</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Experienced club player or tournament player</div>
                </div>
                {selectedSkill === 'advanced' && <Sparkles size={16} className="text-rose-400" />}
              </button>
            </div>
          )}

          {/* Hint badge */}
          <div className="onboarding-hint">
            <Sparkles size={12} />
            <span>{step.hint}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="onboarding-nav">
          <button
            className="onboarding-nav-btn onboarding-nav-btn--secondary"
            onClick={currentStep === 0 ? handleSkip : handlePrev}
          >
            {currentStep === 0 ? (
              'Skip'
            ) : (
              <>
                <ChevronLeft size={14} />
                Back
              </>
            )}
          </button>

          <button className="onboarding-nav-btn onboarding-nav-btn--primary" onClick={handleNext}>
            {isLast ? (
              <>
                Start Playing
                <Sparkles size={14} />
              </>
            ) : (
              <>
                Next
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* Dot indicators */}
        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <button
              key={i}
              className={`onboarding-dot ${i === currentStep ? 'onboarding-dot--active' : ''} ${i < currentStep ? 'onboarding-dot--done' : ''}`}
              onClick={() => { setDirection(i > currentStep ? 'next' : 'prev'); setCurrentStep(i); }}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
// Tutorial modal memoization
