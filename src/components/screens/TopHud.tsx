import React, { useEffect, useState } from 'react';
import { Clock, CloudRain, Home, Volume2, VolumeX } from 'lucide-react';
import { CHAPTER_LABELS, DAY_START_MINUTE, WEEKS_PER_SEMESTER } from '../../data/config';
import { formatClockTime, getWeekdayInfo } from '../../engine/storyEngine';
import { useGameStore } from '../../store/gameStore';
import { soundFX } from '../../engine/audio';

export const TopHud: React.FC = () => {
  const { save, settings, lastStatDeltas, setScreen, updateSettings } = useGameStore();
  const [visibleDeltaId, setVisibleDeltaId] = useState<number | null>(null);

  useEffect(() => {
    if (!lastStatDeltas) return;
    setVisibleDeltaId(lastStatDeltas.id);
    const t = window.setTimeout(() => {
      setVisibleDeltaId((cur) => (cur === lastStatDeltas.id ? null : cur));
    }, 2400);
    return () => window.clearTimeout(t);
  }, [lastStatDeltas]);

  if (!save) return null;

  const isMuted = settings.bgmVolume <= 0.01 && settings.sfxVolume <= 0.01;
  const toggleMute = () => {
    if (isMuted) {
      updateSettings({ bgmVolume: 0.28, sfxVolume: 0.55 });
      soundFX.unlockAndStart('chill');
    } else {
      updateSettings({ bgmVolume: 0, sfxVolume: 0 });
    }
  };

  const toggleRain = () => {
    const next = !settings.rainAmbience;
    updateSettings({ rainAmbience: next });
    soundFX.unlockAndStart('chill');
    soundFX.playClick();
  };

  const moneyNeg = save.stats.money < 0;
  const lowEnergy = save.stats.energy <= 20;
  const lowMental = save.stats.mental <= 20;
  const isHardcore = save.profile.difficulty === 'hardcore';

  const deltaItems: { key: string; text: string; tone: string }[] = [];
  if (lastStatDeltas && visibleDeltaId === lastStatDeltas.id) {
    if (lastStatDeltas.money) {
      deltaItems.push({
        key: 'money',
        text: `${lastStatDeltas.money > 0 ? '+' : '-'}₱${Math.abs(lastStatDeltas.money)}`,
        tone: lastStatDeltas.money > 0 ? 'text-emerald-300 border-emerald-700/60' : 'text-rose-300 border-rose-700/60',
      });
    }
    if (lastStatDeltas.gwa) {
      deltaItems.push({
        key: 'gwa',
        text: `GWA ${lastStatDeltas.gwa < 0 ? '↑' : '↓'} ${Math.abs(lastStatDeltas.gwa).toFixed(2)}`,
        tone: lastStatDeltas.gwa < 0 ? 'text-sky-300 border-sky-700/60' : 'text-rose-300 border-rose-700/60',
      });
    }
    if (lastStatDeltas.energy) {
      deltaItems.push({
        key: 'en',
        text: `EN ${lastStatDeltas.energy > 0 ? '+' : ''}${lastStatDeltas.energy}`,
        tone: lastStatDeltas.energy > 0 ? 'text-amber-300 border-amber-700/60' : 'text-orange-300 border-orange-700/60',
      });
    }
    if (lastStatDeltas.mental) {
      deltaItems.push({
        key: 'mh',
        text: `MH ${lastStatDeltas.mental > 0 ? '+' : ''}${lastStatDeltas.mental}`,
        tone: lastStatDeltas.mental > 0 ? 'text-pink-300 border-pink-700/60' : 'text-rose-300 border-rose-700/60',
      });
    }
    if (lastStatDeltas.social) {
      deltaItems.push({
        key: 'soc',
        text: `SOC ${lastStatDeltas.social > 0 ? '+' : ''}${lastStatDeltas.social}`,
        tone: lastStatDeltas.social > 0 ? 'text-indigo-300 border-indigo-700/60' : 'text-rose-300 border-rose-700/60',
      });
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-[#1c130e]/95 border-b border-amber-800/50">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-5 py-2 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Compact Date & Profile */}
        <div className="min-w-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScreen('title')}
            aria-label="Return to Title Screen"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[#2a1d15] hover:bg-[#38271c] border border-amber-900/60 text-amber-200 shrink-0"
          >
            <Home className="w-4 h-4" />
          </button>
          <div className="min-w-0 leading-tight">
            <div className="font-pixel text-[13px] sm:text-base text-amber-200 truncate flex items-center gap-1.5">
              <span>
                {CHAPTER_LABELS[save.chapter].short} · S{save.semester} · D{save.week}/{WEEKS_PER_SEMESTER} ({getWeekdayInfo(save.totalWeeks).short})
              </span>
            </div>
            <div className="text-[11px] text-amber-300/80 truncate flex items-center gap-1.5 font-mono tabular-nums">
              <span className="inline-flex items-center gap-0.5 text-amber-200">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                {formatClockTime(save.minuteOfDay ?? DAY_START_MINUTE).time12}
              </span>
              <span className="truncate">
                · {save.profile.name}
                {isHardcore ? ' · HC' : ''}
                {save.cheated ? ' · SANDBOX' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Crisp Tabular Stats Strip */}
        <div className="flex items-center gap-1.5 sm:gap-3.5 font-mono tabular-nums text-[11px] sm:text-sm shrink-0">
          <div className="text-right shrink-0">
            <div className="text-[9px] sm:text-[10px] text-amber-300/65 leading-none">
              {moneyNeg ? 'UTANG' : 'CASH'}
            </div>
            <div
              className={`font-bold ${
                moneyNeg ? 'text-rose-400' : 'text-emerald-300'
              }`}
            >
              ₱{save.stats.money.toLocaleString()}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[9px] sm:text-[10px] text-amber-300/65 leading-none">GWA</div>
            <div
              className={`font-bold ${
                save.stats.gwa <= 1.75
                  ? 'text-sky-300'
                  : save.stats.gwa <= 2.5
                    ? 'text-amber-200'
                    : 'text-rose-400'
              }`}
            >
              {save.stats.gwa.toFixed(2)}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[9px] sm:text-[10px] text-amber-300/65 leading-none">EN</div>
            <div className={`font-bold ${lowEnergy ? 'text-rose-400' : 'text-amber-200'}`}>
              {save.stats.energy}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[9px] sm:text-[10px] text-amber-300/65 leading-none">MH</div>
            <div className={`font-bold ${lowMental ? 'text-rose-400' : 'text-pink-200'}`}>
              {save.stats.mental}
            </div>
          </div>

          <div className="text-right shrink-0 hidden md:block">
            <div className="text-[10px] text-amber-300/65 leading-none">SOC</div>
            <div className="font-bold text-indigo-200">{save.stats.social}</div>
          </div>

          <button
            type="button"
            onClick={toggleRain}
            aria-label={settings.rainAmbience ? 'Turn off rain ambience' : 'Turn on relaxing rain ambience'}
            title={settings.rainAmbience ? 'Rain Ambience: ON' : 'Rain Ambience: OFF'}
            className={`hidden sm:flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border shrink-0 transition-colors ${
              settings.rainAmbience
                ? 'bg-sky-900/60 border-sky-500/70 text-sky-300'
                : 'bg-[#2a1d15] hover:bg-[#38271c] border-amber-900/60 text-amber-200/70'
            }`}
          >
            <CloudRain className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-[#2a1d15] hover:bg-[#38271c] border border-amber-900/60 text-amber-200 shrink-0"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          </button>
        </div>
      </div>

      {/* Animated Floating Stat Delta Feedback Bar (non-blocking bottom pill) */}
      {deltaItems.length > 0 && (
        <div
          key={visibleDeltaId}
          className="pointer-events-none fixed bottom-16 lg:bottom-5 left-1/2 -translate-x-1/2 z-40 px-3 max-w-[95vw] anim-delta-pop"
        >
          <div className="flex flex-wrap items-center justify-center gap-1.5 bg-[#1b120d]/95 border border-amber-700/80 rounded-xl px-3 py-1.5 shadow-xl">
            {deltaItems.map((d) => (
              <span
                key={d.key}
                className={`text-[11px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded border bg-[#120c08] ${d.tone}`}
              >
                {d.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
