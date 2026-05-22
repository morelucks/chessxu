import { useEffect, useState } from 'react';
import './ChessClock.css';

interface Props {
  color: 'w' | 'b';
  timeMs: number | null;
  isActive: boolean;
  onTimeout: (color: 'w' | 'b') => void;
}

export default function ChessClock({ color, timeMs, isActive, onTimeout }: Props) {
  const [timeLeft, setTimeLeft] = useState<number | null>(timeMs);

  useEffect(() => {
    setTimeLeft(timeMs);
  }, [timeMs]);

  useEffect(() => {
    if (!isActive || timeLeft === null || timeLeft <= 0) return;
    
    let lastTime = Date.now();
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        const now = Date.now();
        const delta = now - lastTime;
        lastTime = now;
        
        const newTime = prev - delta;
        if (newTime <= 0) {
          clearInterval(interval);
          onTimeout(color);
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, color, onTimeout]); // Exclude timeLeft to avoid interval thrashing

  if (timeLeft === null) return null;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (ms < 10000 && ms > 0) {
        const s = Math.floor(ms / 1000);
        const tenths = Math.floor((ms % 1000) / 100);
        return `${s}.${tenths}`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft !== null && timeLeft <= 10000 && timeLeft > 0;
  const isDanger = timeLeft !== null && timeLeft === 0;

  return (
    <div className={`chess-clock ${isActive ? 'chess-clock--active' : ''} ${isWarning ? 'chess-clock--warning' : ''} ${isDanger ? 'chess-clock--danger' : ''}`}>
      {formatTime(timeLeft)}
    </div>
  );
}
