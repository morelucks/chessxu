/**
 * TxStepper
 *
 * Visual stepper showing the four transaction stages:
 *   Initiated → Pending → Confirmed | Reverted
 */

import React from 'react';
import { CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react';
import { TxStage } from '../../../zustand/txHudStore';

interface TxStepperProps {
  stage: TxStage;
}

interface Step {
  key: TxStage | 'confirmed' | 'reverted';
  label: string;
}

const STEPS: Step[] = [
  { key: TxStage.Initiated, label: 'Initiated' },
  { key: TxStage.Pending, label: 'Pending' },
  { key: TxStage.Confirmed, label: 'Confirmed' },
];

function getStepIndex(stage: TxStage): number {
  switch (stage) {
    case TxStage.Initiated:
      return 0;
    case TxStage.Pending:
      return 1;
    case TxStage.Confirmed:
      return 2;
    case TxStage.Reverted:
      return 2; // reverted replaces confirmed at position 2
    default:
      return 0;
  }
}

function StepIcon({
  stepIndex,
  currentIndex,
  isReverted,
  isLast,
}: {
  stepIndex: number;
  currentIndex: number;
  isReverted: boolean;
  isLast: boolean;
}) {
  const isDone = stepIndex < currentIndex;
  const isActive = stepIndex === currentIndex;

  if (isLast && isReverted) {
    return (
      <AlertCircle
        size={18}
        className="text-red-400 shrink-0"
        aria-label="Reverted"
      />
    );
  }
  if (isLast && isActive) {
    return (
      <CheckCircle
        size={18}
        className="text-emerald-400 shrink-0"
        aria-label="Confirmed"
      />
    );
  }
  if (isDone) {
    return (
      <CheckCircle
        size={18}
        className="text-emerald-400 shrink-0"
        aria-label="Done"
      />
    );
  }
  if (isActive) {
    return (
      <Clock
        size={18}
        className="text-blue-400 animate-pulse shrink-0"
        aria-label="In progress"
      />
    );
  }
  return (
    <Zap
      size={18}
      className="text-slate-600 shrink-0"
      aria-label="Waiting"
    />
  );
}

export const TxStepper: React.FC<TxStepperProps> = ({ stage }) => {
  const currentIndex = getStepIndex(stage);
  const isReverted = stage === TxStage.Reverted;

  const displaySteps = STEPS.map((s, i) => {
    if (i === 2 && isReverted) {
      return { ...s, label: 'Reverted' };
    }
    return s;
  });

  return (
    <ol
      className="flex items-center gap-0 w-full"
      aria-label="Transaction progress"
    >
      {displaySteps.map((step, i) => {
        const isLast = i === displaySteps.length - 1;
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;

        const labelColor = isLast && isReverted
          ? 'text-red-400'
          : isActive
            ? 'text-white'
            : isDone
              ? 'text-emerald-400'
              : 'text-slate-500';

        return (
          <React.Fragment key={step.key}>
            <li className="flex flex-col items-center gap-1 min-w-0">
              <StepIcon
                stepIndex={i}
                currentIndex={currentIndex}
                isReverted={isReverted}
                isLast={isLast}
              />
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${labelColor}`}
              >
                {step.label}
              </span>
            </li>
            {!isLast && (
              <div
                className={`flex-1 h-px mx-1 mb-4 transition-colors duration-500 ${
                  isDone ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
};
