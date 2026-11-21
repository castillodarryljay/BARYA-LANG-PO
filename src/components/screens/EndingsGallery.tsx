import React from 'react';
import { ArrowLeft, Lock, Trophy } from 'lucide-react';
import { ALL_ENDINGS } from '../../data/story';
import { useGameStore } from '../../store/gameStore';
import { PixelBackground } from '../art/PixelBackground';

export const EndingsGallery: React.FC = () => {
  const { unlockedEndings, settings, setScreen } = useGameStore();
  const isTL = settings.language === 'taglish';

  return (
    <main className="min-h-screen bg-[#18110c] text-[#f7eedd] py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4 border-b border-amber-900/50 pb-4">
          <button
            type="button"
            onClick={() => setScreen('title')}
            className="min-h-[44px] px-4 rounded-xl bg-[#251a13] hover:bg-[#34251b] border border-amber-900/60 text-sm font-medium text-amber-100 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Title
          </button>
          <div className="text-right">
            <h1 className="font-pixel text-2xl sm:text-3xl text-amber-200 flex items-center gap-2 justify-end">
              <Trophy className="w-6 h-6 text-amber-400" />
              Endings Gallery
            </h1>
            <p className="text-xs font-mono text-amber-300/75">
              {unlockedEndings.length} / {ALL_ENDINGS.length} Collected
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ALL_ENDINGS.map((end, idx) => {
            const unlocked = unlockedEndings.includes(end.id);
            return (
              <article
                key={end.id}
                className={`rounded-2xl overflow-hidden border ${
                  unlocked
                    ? 'bg-[#231812] border-amber-600/60'
                    : 'bg-[#1c140f] border-amber-950/80 opacity-80'
                }`}
              >
                <div className="relative h-36 bg-[#120b07]">
                  {unlocked ? (
                    <PixelBackground backgroundId={end.background} animated={false} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#140e0a]">
                      <Lock className="w-8 h-8 text-amber-700/60" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c140f] via-transparent to-transparent" />
                </div>
                <div className="p-4 space-y-1.5">
                  <div className="text-[11px] font-mono text-amber-400/85">
                    0{idx + 1}. {end.badge} · {unlocked ? 'UNLOCKED' : 'LOCKED'}
                  </div>
                  <h2 className="font-pixel text-xl text-amber-100">
                    {unlocked ? (isTL ? end.title : end.titleEn) : '???'}
                  </h2>
                  <p className="text-xs text-amber-200/75 leading-relaxed">
                    {unlocked
                      ? isTL
                        ? end.subtitle
                        : end.subtitleEn
                      : isTL
                        ? `Hint: ${end.subtitle}`
                        : `Hint: ${end.subtitleEn}`}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
};
