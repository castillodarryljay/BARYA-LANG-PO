import React, { useEffect, useState } from 'react';
import { soundFX } from '../../engine/audio';

interface Props {
  onFinish: (scoreRatio: number) => void;
  language: 'taglish' | 'english';
}

interface Layer {
  id: string;
  label: string;
  bg: string;
}

const LAYERS: Layer[] = [
  { id: 'bottom_bun', label: 'Bottom Bun', bg: '#b45309' },
  { id: 'patty', label: 'Beef Patty', bg: '#5c2d16' },
  { id: 'cheese', label: 'Cheese', bg: '#ca8a04' },
  { id: 'lettuce', label: 'Lettuce', bg: '#15803d' },
  { id: 'top_bun', label: 'Top Bun', bg: '#d97706' },
  { id: 'fries', label: 'Fries', bg: '#a16207' },
];

const RECIPES: { name: string; steps: string[] }[] = [
  { name: 'Yum Classic', steps: ['bottom_bun', 'patty', 'top_bun'] },
  { name: 'Cheesy Deluxe', steps: ['bottom_bun', 'patty', 'cheese', 'top_bun'] },
  { name: 'TLC Meal', steps: ['bottom_bun', 'patty', 'lettuce', 'top_bun', 'fries'] },
  { name: 'Double Champ', steps: ['bottom_bun', 'patty', 'cheese', 'patty', 'top_bun'] },
];

function randomRecipe() {
  return RECIPES[Math.floor(Math.random() * RECIPES.length)];
}

export const FastfoodCrew: React.FC<Props> = ({ onFinish, language }) => {
  const [timeLeft, setTimeLeft] = useState(35);
  const [recipe, setRecipe] = useState(() => randomRecipe());
  const [stack, setStack] = useState<string[]>([]);
  const [completed, setCompleted] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  const addLayer = (layerId: string) => {
    if (done) return;
    const expected = recipe.steps[stack.length];
    if (layerId === expected) {
      soundFX.playClick();
      const next = [...stack, layerId];
      if (next.length === recipe.steps.length) {
        soundFX.playCoin();
        setCompleted((c) => c + 1);
        setStack([]);
        setRecipe(randomRecipe());
      } else {
        setStack(next);
      }
    } else {
      soundFX.playError();
      setStack([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-mono tabular-nums bg-[#251a13] border border-amber-900/50 rounded-xl px-4 py-3">
        <div>
          <span className="text-amber-300/70 mr-2">TIME</span>
          <span className="text-lg font-bold text-amber-200">{timeLeft}s</span>
        </div>
        <div>
          <span className="text-amber-300/70 mr-2">ORDERS UP</span>
          <span className="text-lg font-bold text-emerald-300">{completed}</span>
        </div>
      </div>

      {!done ? (
        <>
          <div className="bg-[#2c1f16] border border-amber-800/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-lg text-amber-300">{recipe.name}</span>
              <span className="text-xs text-amber-200/75">
                {language === 'taglish' ? 'Buuin mula 1 hanggang dulo:' : 'Build from step 1 up:'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipe.steps.map((stepId, idx) => {
                const layer = LAYERS.find((l) => l.id === stepId)!;
                const doneStep = idx < stack.length;
                const current = idx === stack.length;
                return (
                  <div
                    key={`${stepId}-${idx}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      doneStep
                        ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200'
                        : current
                          ? 'bg-amber-500/25 border-amber-400 text-amber-100'
                          : 'bg-[#1f1610] border-amber-900/50 text-amber-200/65'
                    }`}
                  >
                    {idx + 1}. {layer.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {LAYERS.map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => addLayer(layer.id)}
                className="min-h-[56px] rounded-xl border border-amber-600/60 px-3 py-3 font-semibold text-sm text-white pixel-btn"
                style={{ backgroundColor: layer.bg }}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-[#2c1f16] border border-amber-600/50 rounded-2xl p-6 text-center space-y-4">
          <h3 className="font-pixel text-2xl text-amber-300">
            {language === 'taglish' ? 'Shift Completed!' : 'Crew Shift Done!'}
          </h3>
          <p className="text-sm text-amber-100/85">
            {language === 'taglish'
              ? `Naka-assemble ka ng ${completed} fastfood orders nang walang reklamo!`
              : `Assembled ${completed} fastfood orders with crispy accuracy!`}
          </p>
          <button
            type="button"
            onClick={() => onFinish(Math.min(1, completed / 9))}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1c120b] font-bold text-base pixel-btn"
          >
            {language === 'taglish' ? 'Kunin ang Crew Pay (₱)' : 'Collect Crew Pay (₱)'}
          </button>
        </div>
      )}
    </div>
  );
};
