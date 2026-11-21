import React from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import { ALL_ENDINGS } from '../../data/story';
import { interpolateText } from '../../engine/storyEngine';
import { useGameStore } from '../../store/gameStore';
import { PixelBackground } from '../art/PixelBackground';
import { PixelSprite } from '../art/PixelSprite';

export const EndingScreen: React.FC = () => {
  const { save, settings, unlockedEndings, setScreen } = useGameStore();
  if (!save) return null;

  const ending =
    ALL_ENDINGS.find((e) => e.id === save.activeEndingId) ?? ALL_ENDINGS[0];
  const isTL = settings.language === 'taglish';
  const paragraphs = isTL ? ending.epilogue : ending.epilogueEn;

  return (
    <div className="space-y-5">
      <div className="relative w-full h-[clamp(210px,36vh,380px)] sm:h-auto sm:aspect-[16/9] rounded-2xl overflow-hidden border border-amber-600/70 pixel-frame">
        <PixelBackground backgroundId={ending.background} animated />
        <div className="absolute inset-0 bg-gradient-to-t from-[#160f0a] via-[#160f0a]/45 to-transparent" />
        <div className="absolute right-4 sm:right-8 bottom-0 z-10 pointer-events-none">
          <PixelSprite
            spriteId="player_happy"
            playerGender={save.profile.gender}
            appearance={save.profile.appearance}
            animation="idle"
            size="lg"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7 pr-28 sm:pr-44 space-y-1 z-20">
          <div className="text-[11px] sm:text-xs font-mono tracking-wider text-amber-300">
            {save.cheated
              ? `SANDBOX PREVIEW (GALLERY LOCKED) · ${ending.badge}`
              : `ENDING UNLOCKED · ${ending.badge} · ${unlockedEndings.length}/${ALL_ENDINGS.length} COLLECTED`}
          </div>
          <h1 className="font-pixel text-2xl sm:text-4xl text-amber-100">
            {isTL ? ending.title : ending.titleEn}
          </h1>
          <p className="text-xs sm:text-base text-amber-200/85">
            {isTL ? ending.subtitle : ending.subtitleEn}
          </p>
        </div>
      </div>

      {/* Epilogue Story */}
      <div className="bg-[#231812] border border-amber-800/50 rounded-2xl p-4 sm:p-6 space-y-4">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="text-[15px] sm:text-base text-[#faf2e3] leading-relaxed">
            {interpolateText(p, save.profile)}
          </p>
        ))}
      </div>

      {/* Final Run Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
        <div className="bg-[#231812] border border-amber-800/50 rounded-xl p-3.5">
          <div className="text-[11px] text-amber-300/70">FINAL CASH</div>
          <div className={`text-xl font-bold ${save.stats.money < 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
            ₱{save.stats.money.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#231812] border border-amber-800/50 rounded-xl p-3.5">
          <div className="text-[11px] text-amber-300/70">FINAL GWA</div>
          <div className="text-xl font-bold text-sky-300">{save.stats.gwa.toFixed(2)}</div>
        </div>
        <div className="bg-[#231812] border border-amber-800/50 rounded-xl p-3.5">
          <div className="text-[11px] text-amber-300/70">DAYS SURVIVED</div>
          <div className="text-xl font-bold text-amber-200">{save.totalWeeks}</div>
        </div>
        <div className="bg-[#231812] border border-amber-800/50 rounded-xl p-3.5">
          <div className="text-[11px] text-amber-300/70">CHALLENGES WON</div>
          <div className="text-xl font-bold text-amber-200">{save.challengesCompleted ?? 0}</div>
        </div>
      </div>

      {save.journal.length > 0 && (
        <div className="bg-[#231812] border border-amber-800/50 rounded-2xl p-4 space-y-2">
          <h2 className="font-pixel text-lg text-amber-200">
            {isTL ? 'Highlights ng Paglalakbay Mo' : 'Journey Highlights'}
          </h2>
          <ul className="space-y-1.5 text-xs sm:text-sm text-amber-100/80">
            {save.journal.slice(0, 6).map((j) => (
              <li key={j.id}>
                <span className="font-mono text-amber-400 mr-2">{j.dateLabel}</span>
                {isTL ? j.title : j.titleEn}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          data-start="true"
          onClick={() => setScreen('char_create')}
          className="flex-1 min-h-[52px] px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1b110a] font-bold text-base flex items-center justify-center gap-2 pixel-btn"
        >
          <RotateCcw className="w-4 h-4" />
          {isTL ? 'Maglaro Muli (New Playthrough)' : 'Play Again'}
        </button>
        <button
          type="button"
          onClick={() => setScreen('gallery')}
          className="min-h-[52px] px-5 rounded-xl bg-[#2c1f16] hover:bg-[#3a281c] border border-amber-700/60 text-amber-100 font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          {isTL ? 'Endings Gallery' : 'Endings Gallery'}
        </button>
      </div>
    </div>
  );
};
