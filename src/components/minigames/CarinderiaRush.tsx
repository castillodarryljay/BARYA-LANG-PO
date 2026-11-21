import React, { useEffect, useState } from 'react';
import { soundFX } from '../../engine/audio';

interface Props {
  onFinish: (scoreRatio: number) => void;
  language: 'taglish' | 'english';
}

interface Dish {
  id: string;
  label: string;
  color: string;
  accent: string;
}

const DISHES: Dish[] = [
  { id: 'adobo', label: 'Adobo', color: '#78350f', accent: '#f59e0b' },
  { id: 'sinigang', label: 'Sinigang', color: '#9a3412', accent: '#fb923c' },
  { id: 'lumpia', label: 'Lumpia', color: '#b45309', accent: '#fde047' },
  { id: 'kanin', label: 'Kanin', color: '#475569', accent: '#f8fafc' },
  { id: 'sisig', label: 'Sisig', color: '#7f1d1d', accent: '#f87171' },
  { id: 'gulaman', label: 'Gulaman', color: '#1e3a8a', accent: '#38bdf8' },
];

function randomOrder(): string[] {
  const count = Math.random() > 0.45 ? 3 : 2;
  const picks: string[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(DISHES[Math.floor(Math.random() * DISHES.length)].id);
  }
  return picks;
}

export const CarinderiaRush: React.FC<Props> = ({ onFinish, language }) => {
  const [timeLeft, setTimeLeft] = useState(35);
  const [order, setOrder] = useState<string[]>(() => randomOrder());
  const [tray, setTray] = useState<string[]>([]);
  const [served, setServed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [done]);

  const tapDish = (dishId: string) => {
    if (done) return;
    const nextIdx = tray.length;
    if (order[nextIdx] === dishId) {
      soundFX.playClick();
      const nextTray = [...tray, dishId];
      if (nextTray.length === order.length) {
        soundFX.playCoin();
        setServed((s) => s + 1);
        setStreak((k) => k + 1);
        setTray([]);
        setOrder(randomOrder());
        setFeedback(language === 'taglish' ? 'Bilis! Next customer!' : 'Served! Next diner!');
      } else {
        setTray(nextTray);
      }
    } else {
      soundFX.playError();
      setStreak(0);
      setTray([]);
      setFeedback(language === 'taglish' ? 'Mali ang ulam! Ulitin ang tray!' : 'Wrong dish! Tray reset!');
    }
  };

  const scoreRatio = Math.min(1, served / 11);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-mono tabular-nums bg-[#251a13] border border-amber-900/50 rounded-xl px-4 py-3">
        <div>
          <span className="text-amber-300/70 mr-2">TIME</span>
          <span className={`text-lg font-bold ${timeLeft <= 8 ? 'text-rose-400' : 'text-amber-200'}`}>
            {timeLeft}s
          </span>
        </div>
        <div>
          <span className="text-amber-300/70 mr-2">SERVED</span>
          <span className="text-lg font-bold text-emerald-300">{served}</span>
        </div>
        <div>
          <span className="text-amber-300/70 mr-2">STREAK</span>
          <span className="text-lg font-bold text-amber-400">x{streak}</span>
        </div>
      </div>

      {!done ? (
        <>
          <div className="bg-[#2c1f16] border border-amber-800/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-amber-200/80">
                {language === 'taglish'
                  ? 'Order ng Customer (i-tap nang sunod-sunod):'
                  : 'Customer Order (tap in exact sequence):'}
              </p>
              {feedback && <span className="text-xs font-medium text-amber-300">{feedback}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {order.map((dishId, idx) => {
                const dish = DISHES.find((d) => d.id === dishId)!;
                const filled = idx < tray.length;
                const active = idx === tray.length;
                return (
                  <div
                    key={`${dishId}-${idx}`}
                    className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-transform ${
                      filled
                        ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200'
                        : active
                          ? 'bg-amber-600/30 border-amber-400 text-amber-100 scale-[1.03]'
                          : 'bg-[#1f1610] border-amber-900/50 text-amber-200/70'
                    }`}
                  >
                    {idx + 1}. {dish.label} {filled ? '✓' : ''}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DISHES.map((dish) => (
              <button
                key={dish.id}
                type="button"
                onClick={() => tapDish(dish.id)}
                className="min-h-[60px] rounded-xl border border-amber-700/60 px-4 py-3 text-left pixel-btn focus-visible:outline-2 focus-visible:outline-amber-400"
                style={{ backgroundColor: dish.color }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-lg text-[#fff7ed]">{dish.label}</span>
                  <span
                    className="w-3.5 h-3.5 rounded-sm border border-black/40"
                    style={{ backgroundColor: dish.accent }}
                  />
                </div>
                <span className="text-[11px] text-amber-100/75">Tap to serve</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-[#2c1f16] border border-amber-600/50 rounded-2xl p-6 text-center space-y-4">
          <h3 className="font-pixel text-2xl text-amber-300">
            {language === 'taglish' ? 'Tapos na ang Lunch Rush!' : 'Lunch Rush Complete!'}
          </h3>
          <p className="text-sm text-amber-100/85">
            {language === 'taglish'
              ? `Naka-serve ka ng ${served} orders kay Aling Nena!`
              : `You served ${served} meals at Aling Nena’s carinderia!`}
          </p>
          <button
            type="button"
            onClick={() => onFinish(scoreRatio)}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1c120b] font-bold text-base pixel-btn"
          >
            {language === 'taglish' ? 'Kunin ang Sahod (₱)' : 'Collect Shift Pay (₱)'}
          </button>
        </div>
      )}
    </div>
  );
};
