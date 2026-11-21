import React, { useEffect } from 'react';
import { BookOpen, Edit3, Play, RotateCcw, Trophy } from 'lucide-react';
import { PixelBackground } from '../art/PixelBackground';
import { PWAInstallButton } from '../PWAInstallButton';
import { useGameStore } from '../../store/gameStore';
import { usePWA } from '../../hooks/usePWA';
import { soundFX } from '../../engine/audio';

export const TitleScreen: React.FC = () => {
  const {
    hasAutoSave,
    save,
    unlockedEndings,
    setScreen,
    continueAutoSave,
    settings,
    updateSettings,
  } = useGameStore();
  const { offlineReady } = usePWA();

  const handleStartNew = () => {
    soundFX.setBgmStyle(settings.bgmStyle ?? 'lofi');
    soundFX.setRainAmbience(Boolean(settings.rainAmbience));
    soundFX.unlockAndStart('chill');
    soundFX.playClick();
    setScreen('char_create');
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
        e.preventDefault();
        if (hasAutoSave) {
          continueAutoSave();
        } else {
          handleStartNew();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasAutoSave]);

  const isTL = settings.language === 'taglish';

  return (
    <main className="relative min-h-screen w-full overflow-x-clip flex flex-col justify-between bg-[#18110c]">
      {/* Live Animated HD Pixel-Art Philippines Campus & Jeepney Backdrop */}
      <div className="absolute inset-0 z-0">
        <PixelBackground backgroundId="bg_school_gate" animated />
        <div className="absolute inset-0 bg-gradient-to-b from-[#120b07]/85 via-[#18110c]/45 to-[#120b07]/95" />
      </div>

      {/* Top Subtle Utility Row (Language & Offline Ready) */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-3.5 sm:px-5 pt-4 sm:pt-5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="text-[11px] sm:text-xs font-mono text-amber-200/85">
          {offlineReady ? 'Offline Ready' : '100% Local Build'} · {unlockedEndings.length}/8 Endings
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              updateSettings({ language: isTL ? 'english' : 'taglish' });
            }}
            className="min-h-[40px] px-3 rounded-lg bg-[#241912]/90 hover:bg-[#332319] border border-amber-700/50 text-xs font-semibold text-amber-100 whitespace-nowrap"
          >
            {isTL ? 'Taglish' : 'English'}
          </button>
          <PWAInstallButton variant="primary" showFallbackTrigger />
        </div>
      </div>

      {/* Center Stage: Custom Inline SVG Title Lockup & Primary Actions */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-3.5 sm:px-5 py-6 sm:py-8 my-auto grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
        <div
          className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left bg-[#160e09]/85 border border-amber-900/50 rounded-2xl p-4 sm:p-6 pixel-frame anim-fade-up"
        >
          {/* Custom Inline Pixel-Art Emblem SVG */}
          <div className="inline-flex items-center justify-center lg:justify-start w-full">
            <svg
              viewBox="0 0 360 112"
              className="w-full max-w-[340px] sm:max-w-[360px] h-auto drop-shadow-[0_2px_0_rgba(14,8,4,0.95)]"
              role="img"
              aria-label="Barya Lang: Road to Graduation"
            >
              {/* Peso Coin + Graduation Cap Pixel Emblem */}
              <g shapeRendering="crispEdges">
                <rect x="8" y="24" width="68" height="68" fill="#92400e" />
                <rect x="12" y="20" width="60" height="76" fill="#d97706" />
                <rect x="16" y="24" width="52" height="68" fill="#f59e0b" />
                <rect x="20" y="28" width="44" height="60" fill="#fbbf24" />
                {/* ₱ sign */}
                <rect x="30" y="34" width="8" height="46" fill="#78350f" />
                <rect x="38" y="34" width="14" height="8" fill="#78350f" />
                <rect x="48" y="38" width="8" height="16" fill="#78350f" />
                <rect x="38" y="50" width="14" height="8" fill="#78350f" />
                <rect x="24" y="42" width="36" height="4" fill="#78350f" />
                <rect x="24" y="48" width="36" height="4" fill="#78350f" />
                {/* Toga Cap */}
                <rect x="4" y="10" width="76" height="10" fill="#1e3a8a" />
                <rect x="16" y="4" width="52" height="8" fill="#2563eb" />
                <rect x="74" y="16" width="5" height="22" fill="#facc15" />
                <rect x="72" y="36" width="9" height="8" fill="#eab308" />
              </g>
              {/* Lockup Typography */}
              <text
                x="96"
                y="54"
                fill="#fef3c7"
                fontFamily="Pixelify Sans, sans-serif"
                fontWeight="700"
                fontSize="42"
                letterSpacing="1"
              >
                BARYA LANG
              </text>
              <rect x="96" y="64" width="248" height="4" fill="#f59e0b" />
              <text
                x="96"
                y="88"
                fill="#fde68a"
                fontFamily="Pixelify Sans, sans-serif"
                fontWeight="600"
                fontSize="20"
                letterSpacing="1.5"
              >
                ROAD TO GRADUATION
              </text>
            </svg>
          </div>

          <p className="text-sm sm:text-lg text-amber-100/90 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {isTL
              ? 'Mula Grade 11 hanggang College Graduation — survive araw-araw sa mabilis na 24-hour life-sim, 190+ story events, daily challenges, at part-time raket sa Pilipinas.'
              : 'From Grade 11 to College Graduation — survive day-by-day in a fast 24-hour life-sim with 190+ story events, daily challenges, and part-time hustles.'}
          </p>
        </div>

        {/* Right Column: Focused Game Menu Panel */}
        <div
          className="lg:col-span-5 bg-[#1f150f]/95 border border-amber-700/50 rounded-2xl p-4 sm:p-6 space-y-3 pixel-frame anim-fade-up"
        >
          {hasAutoSave && save && (
            <button
              type="button"
              onClick={continueAutoSave}
              data-start="true"
              className="w-full min-h-[54px] px-4 sm:px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1b110a] font-bold text-sm sm:text-base flex items-center justify-between gap-2 pixel-btn"
            >
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5 fill-current shrink-0" />
                {isTL ? 'Ituloy ang Kwento' : 'Continue Story'}
              </span>
              <span className="text-xs font-mono opacity-85 truncate max-w-[130px]">
                {save.profile.name} · Day {save.week}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStartNew}
            data-start={!hasAutoSave ? 'true' : undefined}
            className={`w-full min-h-[52px] px-4 sm:px-5 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 pixel-btn ${
              hasAutoSave
                ? 'bg-[#2e2017] hover:bg-[#3d2b1f] border border-amber-600/60 text-amber-100'
                : 'bg-amber-500 hover:bg-amber-400 text-[#1b110a]'
            }`}
          >
            {hasAutoSave ? <RotateCcw className="w-4 h-4" /> : <Play className="w-5 h-5 fill-current" />}
            {isTL ? 'Bagong Kwento (New Game)' : 'Start New Story'}
          </button>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-amber-900/50">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setScreen('gallery');
              }}
              className="min-h-[46px] px-3 py-2 rounded-xl bg-[#271b13] hover:bg-[#35251a] border border-amber-900/60 text-amber-100 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Endings ({unlockedEndings.length}/8)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setScreen('editor');
              }}
              className="min-h-[46px] px-3 py-2 rounded-xl bg-[#271b13] hover:bg-[#35251a] border border-amber-900/60 text-amber-100 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Story Editor</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Flat Control Hint */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-4 sm:pb-5 text-center text-[11px] sm:text-xs text-amber-200/75 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          Fast 24h Daily Cycle · 190+ Story Events
        </span>
        <span aria-hidden="true">·</span>
        <span>7 Playable Minigames</span>
        <span aria-hidden="true">·</span>
        <span>Relaxing Lo-Fi Audio</span>
      </footer>

    </main>
  );
};
