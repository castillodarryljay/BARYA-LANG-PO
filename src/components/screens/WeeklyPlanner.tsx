import React, { useEffect, useState } from 'react';
import {
  AlarmClock,
  Briefcase,
  Calendar,
  Clock,
  Cloud,
  CloudRain,
  FastForward,
  Flame,
  Lock,
  MapPin,
  Moon,
  Pause,
  Play,
  Sun,
  Sunrise,
  Sunset,
  Target,
  Wind,
} from 'lucide-react';
import {
  CHAPTER_LABELS,
  DAY_END_MINUTE,
  DAY_START_MINUTE,
  DAYS_PER_YEAR,
  MAX_PAID_SHIFTS_PER_DAY,
  MINIGAME_CONFIGS,
  WAKE_UP_OPTIONS,
  WEEKLY_ACTIONS,
} from '../../data/config';
import {
  buildIdleMomentForTime,
  getCalendarDayInfo,
  getMealLabelForTime,
} from '../../engine/dailyScenes';
import {
  canPerformDailyAction,
  canStartMinigame,
  formatClockTime,
  getSleepBonus,
  getTimeOfDayPhase,
  getWeekdayInfo,
} from '../../engine/storyEngine';
import { soundFX } from '../../engine/audio';
import { useGameStore } from '../../store/gameStore';
import { PixelBackground } from '../art/PixelBackground';
import { PixelSprite } from '../art/PixelSprite';
import type { ClockSpeed, MinigameId, WakeUpChoiceId, WeatherId, WeeklyActionId } from '../../types/game';

const SPEED_OPTIONS: { speed: ClockSpeed; label: string }[] = [
  { speed: 0, label: 'Pause' },
  { speed: 1, label: '1×' },
  { speed: 2, label: '2×' },
  { speed: 4, label: '4×' },
];

function getWeatherIcon(weather: WeatherId) {
  switch (weather) {
    case 'rainy':
      return CloudRain;
    case 'cloudy':
      return Cloud;
    case 'breezy':
      return Wind;
    default:
      return Sun;
  }
}

export const WeeklyPlanner: React.FC = () => {
  const {
    save,
    settings,
    lastWeekFeedback,
    updateSettings,
    tickDayClock,
    doMorningWakeUp,
    doDailyAction,
    finishCurrentDay,
    startMinigame,
  } = useGameStore();

  const [showJobs, setShowJobs] = useState(false);
  const [recentActionId, setRecentActionId] = useState<WeeklyActionId | null>(null);

  const clockSpeed: ClockSpeed = settings.clockSpeed ?? 1;
  const isPlannerActive = save?.phase === 'planner';
  const hasWokenUp = Boolean(save?.hasWokenUpToday);

  // Calm, realistic live 24-hour clock ticker:
  // 1x = 1 game min per 1200ms (real chill pace), 2x = 2m/800ms, 4x = 5m/400ms
  // Automatically pauses during the Morning Wake-Up scene or while browsing the Job Board.
  useEffect(() => {
    if (!isPlannerActive || !hasWokenUp || clockSpeed === 0 || showJobs) return;
    const intervalMs = clockSpeed === 1 ? 1200 : clockSpeed === 2 ? 800 : 400;
    const stepMins = clockSpeed === 1 ? 1 : clockSpeed === 2 ? 2 : 5;
    const timer = window.setInterval(() => {
      tickDayClock(stepMins);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isPlannerActive, hasWokenUp, clockSpeed, showJobs, tickDayClock]);

  if (!save) return null;

  const isTL = settings.language === 'taglish';
  const minuteOfDay = save.minuteOfDay ?? DAY_START_MINUTE;
  const { time12, time24 } = formatClockTime(minuteOfDay);
  const phase = getTimeOfDayPhase(minuteOfDay);
  const weekday = getWeekdayInfo(save.totalWeeks);
  const cal = getCalendarDayInfo(save.dayOfYear ?? 1, save.totalWeeks);
  const dayBlocks = save.dayActions ?? [];
  const sleepBonus = getSleepBonus(minuteOfDay, save.pendingWeeklyActions.length);
  const activeChallenge = save.activeChallenge;
  const streak = save.studyStreak ?? 0;
  const isHardcore = save.profile.difficulty === 'hardcore';
  const shiftsToday = save.workJobsCompletedThisWeek;
  const livesAtHome = !save.chapter.startsWith('college') || !save.profile.isProvincial;
  const moment = buildIdleMomentForTime(save);
  const WeatherIcon = getWeatherIcon(cal.weather);

  const totalWakingMins = DAY_END_MINUTE - DAY_START_MINUTE; // 1110 mins (05:30 -> 24:00)
  const elapsedWakingMins = Math.max(0, minuteOfDay - DAY_START_MINUTE);
  const remainingMins = Math.max(0, DAY_END_MINUTE - minuteOfDay);
  const remHours = Math.floor(remainingMins / 60);
  const remMinsPart = remainingMins % 60;
  const progressPct = Math.min(100, Math.max(0, (elapsedWakingMins / totalWakingMins) * 100));
  const yearProgressPct = Math.min(100, Math.max(1, (cal.dayOfYear / DAYS_PER_YEAR) * 100));

  const phaseMeta =
    phase === 'dawn'
      ? {
          icon: Sunrise,
          label: isTL ? 'Bukang-Liwayway · Dawn' : 'Dawn',
          tint: 'bg-amber-950/35',
          iconColor: 'text-amber-300',
        }
      : phase === 'morning'
        ? {
            icon: Sunrise,
            label: isTL ? 'Umaga · Morning' : 'Morning',
            tint: 'bg-amber-500/5',
            iconColor: 'text-amber-200',
          }
        : phase === 'afternoon'
          ? {
              icon: Sun,
              label: isTL ? 'Tanghali · Afternoon' : 'Afternoon',
              tint: 'bg-orange-500/10',
              iconColor: 'text-orange-300',
            }
          : phase === 'evening'
            ? {
                icon: Sunset,
                label: isTL ? 'Takipsilim · Evening' : 'Evening',
                tint: 'bg-purple-950/35',
                iconColor: 'text-purple-300',
              }
            : {
                icon: Moon,
                label: isTL ? 'Hatinggabi · Puyat Hours' : 'Late Night',
                tint: 'bg-indigo-950/55',
                iconColor: 'text-indigo-300',
              };

  const PhaseIcon = phaseMeta.icon;

  const handleWakeUp = (choiceId: WakeUpChoiceId) => {
    doMorningWakeUp(choiceId);
  };

  const handlePerformAction = (id: WeeklyActionId) => {
    const res = doDailyAction(id);
    if (!res) return;
    setRecentActionId(id);
    window.setTimeout(() => {
      setRecentActionId((cur) => (cur === id ? null : cur));
    }, 320);
    if (res.reachedMidnight) {
      window.setTimeout(() => {
        finishCurrentDay();
      }, 340);
    }
  };

  const handleLaunchJob = (id: MinigameId) => {
    soundFX.playClick();
    setShowJobs(false);
    startMinigame(id);
  };

  return (
    <div className="space-y-4 anim-fade-up">
      {/* FOCAL ANCHOR: Realistic Living-Day Scene Viewport */}
      <section className="rounded-2xl overflow-hidden border border-amber-700/60 bg-[#1a120d] pixel-frame">
        {/* Clean Unobstructed Scene Header Bar: 365-Day Date, Weather, Location & Live Clock */}
        <div className="px-3.5 sm:px-5 py-3 bg-[#1c130e] border-b border-amber-800/50 flex flex-wrap items-start justify-between gap-2.5">
          <div className="min-w-0 space-y-0.5 flex-1">
            <div className="text-[11px] sm:text-xs font-mono text-amber-200/95 flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
              <span className="inline-flex items-center gap-1 font-semibold text-amber-100">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {cal.monthName} {cal.dayOfMonth} · Day {cal.dayOfYear}/{DAYS_PER_YEAR} ({isTL ? weekday.tl : weekday.short})
              </span>
              <span className="text-amber-400/60">·</span>
              <span className="inline-flex items-center gap-1 text-sky-200/95">
                <WeatherIcon className="w-3.5 h-3.5 shrink-0" />
                {isTL ? cal.weatherLabelTl : cal.weatherLabelEn}
              </span>
            </div>
            <div className="text-[11px] font-mono text-amber-300/80 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                {isTL ? moment.locationTl : moment.locationEn}
              </span>
              <span>· {CHAPTER_LABELS[save.chapter].tl} (Sem {save.semester})</span>
              {weekday.isWeekend && (
                <span className="text-emerald-300 font-bold">· Weekend +15% Raket</span>
              )}
              {isHardcore && <span className="text-rose-300 font-bold">· Hardcore</span>}
              {streak >= 2 && (
                <span className="inline-flex items-center gap-0.5 text-orange-300 font-bold">
                  <Flame className="w-3 h-3" />
                  {streak}d Streak
                </span>
              )}
            </div>
          </div>

          {/* Live Digital Clock Readout */}
          <div className="text-right shrink-0">
            <div
              data-testid="daily-clock-readout"
              className="font-pixel text-xl sm:text-2xl text-amber-50 flex items-center justify-end gap-1.5 tabular-nums"
            >
              <PhaseIcon className={`w-5 h-5 shrink-0 ${phaseMeta.iconColor}`} />
              <span>{time12}</span>
            </div>
            <div className="text-[10px] font-mono text-amber-200/75 tabular-nums">
              {time24} · {phaseMeta.label}
            </div>
          </div>
        </div>

        {/* Unobstructed 16:9 Animated Pixel Scene & Character Sprites */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#120c08]">
          <PixelBackground backgroundId={moment.backgroundId} animated />

          {/* Atmospheric Time-of-Day Light Overlay */}
          <div
            className={`pointer-events-none absolute inset-0 transition-colors duration-700 ${phaseMeta.tint}`}
          />

          {/* Subtle Rain Ambience Overlay on Rainy Philippine Days */}
          {cal.weather === 'rainy' && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-30 bg-[repeating-linear-gradient(108deg,transparent_0,transparent_18px,rgba(186,230,253,0.45)_18px,rgba(186,230,253,0.45)_19px)]"
            />
          )}

          {/* Character & Companion Sprites Standing Cleanly in the Scene */}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 sm:bottom-5 flex items-end justify-center gap-8 sm:gap-16 px-4">
            <div className="anim-sprite-idle drop-shadow-[0_6px_12px_rgba(0,0,0,0.75)]">
              <PixelSprite
                spriteId={`player_${moment.playerEmotion}`}
                playerGender={save.profile.gender}
                appearance={save.profile.appearance}
                animation="idle"
                size="md"
              />
            </div>
            {moment.companionSpriteId && (
              <div className="anim-sprite-idle drop-shadow-[0_6px_12px_rgba(0,0,0,0.75)]">
                <PixelSprite spriteId={moment.companionSpriteId} animation="idle" size="md" />
              </div>
            )}
          </div>
        </div>

        {/* Dedicated Narrative Caption Strip Below the Art (Zero Overlap on Any Device) */}
        <div className="px-3.5 sm:px-5 py-3 bg-[#150e0a] border-t border-amber-900/50 space-y-1">
          {cal.specialDayTl && (
            <div className="text-[11px] font-mono font-bold text-amber-300">
              {isTL ? `Ngayong Araw: ${cal.specialDayTl}` : `Special Day: ${cal.specialDayEn}`}
            </div>
          )}
          <p className="text-xs sm:text-sm text-amber-50/95 leading-relaxed">
            {isTL ? moment.narrationTl : moment.narrationEn}
          </p>
        </div>

        {/* Interactive Morning Waking Up Routine (05:30 AM before the day begins) */}
        {!hasWokenUp ? (
          <div
            data-testid="morning-wakeup-panel"
            className="p-4 sm:p-5 bg-[#201610] border-t border-amber-800/50 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlarmClock className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="font-pixel text-lg sm:text-xl text-amber-100">
                  {isTL ? '05:30 AM · Paggising! Paano mo sisimulan ang araw?' : '05:30 AM · Wake Up! How do you start your morning?'}
                </h2>
              </div>
              <span className="text-[11px] font-mono text-amber-300/75">
                {isTL ? cal.seasonLabelTl : cal.seasonLabelEn}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {WAKE_UP_OPTIONS.map((opt) => {
                const effectiveCost = opt.id === 'breakfast' && livesAtHome ? 0 : opt.moneyDelta;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`wakeup-${opt.id}`}
                    onClick={() => handleWakeUp(opt.id)}
                    className="text-left p-3.5 rounded-xl bg-[#2a1d15] hover:bg-[#36251b] border border-amber-700/60 hover:border-amber-400 transition-colors flex flex-col justify-between gap-2 min-h-[108px]"
                  >
                    <div className="space-y-1">
                      <div className="font-pixel text-base text-amber-100">
                        {isTL ? opt.labelTl : opt.labelEn}
                      </div>
                      <p className="text-xs text-amber-200/80 leading-snug">
                        {isTL ? opt.descTl : opt.descEn}
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-amber-300/90 tabular-nums">
                      +{opt.durationMins}m · EN {opt.energyDelta >= 0 ? '+' : ''}
                      {opt.energyDelta} · MH +{opt.mentalDelta}
                      {effectiveCost !== 0
                        ? ` · -₱${Math.abs(effectiveCost)}`
                        : opt.id === 'breakfast'
                          ? isTL
                            ? ' · Libre sa Bahay'
                            : ' · Free at Home'
                          : ''}
                    </div>
                  </button>
                );
              })}
            </div>

            {lastWeekFeedback && (
              <div className="text-[11px] font-mono text-amber-200/80 pt-1 flex flex-wrap gap-x-3 gap-y-1 tabular-nums border-t border-amber-900/40">
                <span className="text-emerald-300">
                  {isTL ? 'Kahapon Baon:' : 'Yesterday Allowance:'} +₱{lastWeekFeedback.allowanceReceived}
                </span>
                <span className="text-rose-300">Bills -₱{lastWeekFeedback.livingCosts}</span>
                {lastWeekFeedback.debtInterest > 0 && (
                  <span className="text-rose-400 font-bold">
                    Utang Interest -₱{lastWeekFeedback.debtInterest}
                  </span>
                )}
                {lastWeekFeedback.absentPenalty && (
                  <span className="text-rose-400 font-bold">Absent Penalty (-50% Baon)</span>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Post-Wake-Up Controls: Calm Speed Selector, 24h Timeline, Year Progress, Sleep & Raket */
          <div className="p-4 sm:p-5 bg-[#201610] border-t border-amber-800/50 space-y-3.5">
            {/* Clock Speed Bar & 365-Day Year Progress */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="text-xs font-mono text-amber-200/85 tabular-nums flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {remHours}h {String(remMinsPart).padStart(2, '0')}m {isTL ? 'natitira ngayon' : 'left today'}
                </span>
                <span className="text-amber-400/50">·</span>
                <span>
                  {isTL ? 'Taon:' : 'Year:'} {Math.round(yearProgressPct)}% ({cal.dayOfYear}/{DAYS_PER_YEAR})
                </span>
              </div>

              <div className="flex items-center gap-1 bg-[#150e0a] border border-amber-900/60 rounded-xl p-1">
                {SPEED_OPTIONS.map((opt) => {
                  const active = clockSpeed === opt.speed;
                  return (
                    <button
                      key={opt.speed}
                      type="button"
                      aria-label={opt.speed === 0 ? 'Pause 24-hour clock' : `Set clock speed ${opt.label}`}
                      onClick={() => {
                        soundFX.playClick();
                        updateSettings({ clockSpeed: opt.speed });
                      }}
                      className={`min-h-[34px] px-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-amber-500 text-[#1b110a]'
                          : 'text-amber-200/80 hover:bg-[#2a1d15]'
                      }`}
                    >
                      {opt.speed === 0 ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : opt.speed === 1 ? (
                        <Play className="w-3 h-3 fill-current" />
                      ) : (
                        <FastForward className="w-3 h-3" />
                      )}
                      <span>{opt.speed === 0 ? '' : opt.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    tickDayClock(30);
                  }}
                  aria-label="Advance 30 minutes"
                  className="min-h-[34px] px-2 rounded-lg text-xs font-mono font-semibold text-amber-300 hover:bg-[#2a1d15] border-l border-amber-900/50 ml-0.5 whitespace-nowrap shrink-0"
                >
                  +30m
                </button>
              </div>
            </div>

            {/* 24-Hour Day Timeline Bar (05:30 AM -> 12:00 AM) */}
            <div className="space-y-1.5">
              <div className="relative h-4 w-full rounded-lg bg-[#140e0a] border border-amber-900/70 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-500/15 transition-[width] duration-300"
                  style={{ width: `${progressPct}%` }}
                />
                {dayBlocks.map((blk) => {
                  const leftPct = ((blk.startMinute - DAY_START_MINUTE) / totalWakingMins) * 100;
                  const widthPct = Math.max(
                    2,
                    ((blk.endMinute - blk.startMinute) / totalWakingMins) * 100
                  );
                  const cfg = WEEKLY_ACTIONS.find((a) => a.id === blk.actionId);
                  const color =
                    blk.actionId === 'wakeup'
                      ? '#fde68a'
                      : blk.actionId === 'minigame'
                        ? '#34d399'
                        : cfg?.timelineColor ?? '#f59e0b';
                  return (
                    <div
                      key={blk.id}
                      title={`${formatClockTime(blk.startMinute).time12} – ${formatClockTime(blk.endMinute).time12}: ${isTL ? blk.label : blk.labelEn}`}
                      className="absolute inset-y-0.5 rounded-sm border border-black/30"
                      style={{
                        left: `${Math.max(0, leftPct)}%`,
                        width: `${Math.min(100 - Math.max(0, leftPct), widthPct)}%`,
                        backgroundColor: color,
                      }}
                    />
                  );
                })}
                <div
                  className="absolute inset-y-0 w-0.5 bg-amber-100 shadow-[0_0_6px_rgba(254,243,199,0.9)] transition-[left] duration-300"
                  style={{ left: `${progressPct}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-amber-300/60 tabular-nums">
                <span>05:30 AM</span>
                <span>12:00 PM</span>
                <span>06:00 PM</span>
                <span>10:00 PM</span>
                <span>12:00 AM</span>
              </div>

              {/* Chronological Daily Log (Clean Unboxed Typographic List) */}
              {dayBlocks.length > 0 && (
                <div className="text-[11px] font-mono text-amber-200/80 pt-0.5 flex flex-wrap gap-x-2.5 gap-y-1 tabular-nums">
                  {dayBlocks.map((blk, i) => (
                    <span key={blk.id}>
                      {i > 0 && <span className="text-amber-500/50 mr-2">→</span>}
                      <span className="text-amber-300/80">{formatClockTime(blk.startMinute).time24}</span>{' '}
                      {isTL ? blk.label : blk.labelEn}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Actions: Sleep & End Day + Job Minigames */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={finishCurrentDay}
                className="min-h-[46px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1b110a] font-bold text-sm flex items-center justify-center gap-2 pixel-btn"
              >
                <Moon className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {isTL ? 'Matulog Na · Bukas Ulit' : 'Go to Sleep · Next Morning'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setShowJobs((v) => !v);
                }}
                className="min-h-[46px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 pixel-btn"
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {showJobs
                    ? isTL
                      ? 'Isara ang Raket Board'
                      : 'Hide Job Board'
                    : isTL
                      ? 'Raket Minigames (2h · Big ₱)'
                      : 'Job Minigames (2h · Big ₱)'}
                </span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-amber-200/80 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span>
                Sleep Status:{' '}
                <strong
                  className={
                    sleepBonus.isAbsentSkip || sleepBonus.energyBonus < 0
                      ? 'text-rose-300'
                      : 'text-emerald-300'
                  }
                >
                  {isTL ? sleepBonus.labelTl : sleepBonus.labelEn}
                </strong>
              </span>
              <span
                className={`tabular-nums font-bold ${
                  shiftsToday >= MAX_PAID_SHIFTS_PER_DAY ? 'text-rose-300' : 'text-amber-300'
                }`}
              >
                {isTL ? 'Raket Shifts:' : 'Paid Shifts:'} {shiftsToday}/{MAX_PAID_SHIFTS_PER_DAY}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Active Daily Challenge Card */}
      {hasWokenUp && activeChallenge && (
        <div className="bg-[#211912] border border-amber-700/50 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400">
              <Target className="w-3.5 h-3.5 shrink-0" />
              Daily Challenge · {save.challengesCompleted ?? 0} Cleared
            </div>
            <div className="font-pixel text-base sm:text-lg text-amber-100">
              {isTL ? activeChallenge.title : activeChallenge.titleEn}
            </div>
            <p className="text-xs text-amber-200/85 leading-relaxed">
              {isTL ? activeChallenge.desc : activeChallenge.descEn}
            </p>
          </div>
          <div className="font-mono text-xs text-emerald-300 shrink-0 tabular-nums">
            Reward: +₱{activeChallenge.rewardMoney} · +{activeChallenge.rewardMental} MH
            {activeChallenge.rewardGwa ? ' · GWA ↑' : ''}
          </div>
        </div>
      )}

      {/* Expandable Playable Job / Minigame Board */}
      {hasWokenUp && showJobs && (
        <div className="bg-[#1e1510] border border-emerald-700/50 rounded-2xl p-4 sm:p-5 space-y-3 anim-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-pixel text-lg sm:text-xl text-emerald-300">
              {isTL ? 'Part-Time Raket Board (7 Playable Games)' : 'Part-Time Job Board (7 Playable Games)'}
            </h3>
            <span className="text-xs font-mono text-amber-200/70 tabular-nums">
              Clock Paused · Energy: {save.stats.energy}/100
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MINIGAME_CONFIGS.map((m) => {
              const gate = canStartMinigame(m.id, save, false);
              const disabled = !gate.allowed;
              const isOvertime = m.id !== 'scholarship' && shiftsToday >= 1;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleLaunchJob(m.id)}
                  className={`text-left p-3.5 rounded-xl border transition-colors ${
                    disabled
                      ? 'bg-[#17110d] border-amber-950/80 opacity-60 cursor-not-allowed'
                      : 'bg-[#261b14] hover:bg-[#32231a] border-emerald-700/50 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-pixel text-base text-amber-100">
                      {isTL ? m.title : m.titleEn}
                    </span>
                    {!disabled ? (
                      <span className="text-xs font-mono font-bold text-emerald-300 tabular-nums">
                        ₱{m.basePay}–{m.maxPay}
                      </span>
                    ) : (
                      <Lock className="w-4 h-4 text-amber-500/70 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-amber-200/75 mt-1 leading-snug">
                    {disabled
                      ? isTL
                        ? gate.reasonTl
                        : gate.reasonEn
                      : isTL
                        ? m.subtitle
                        : m.subtitleEn}
                  </p>
                  <div className="text-[11px] font-mono text-amber-300/75 mt-2">
                    2h Shift · -{m.energyCost + (isOvertime ? 4 : 0)} Energy · ~{m.durationSec}s
                    {isOvertime ? ' · -20% OT' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 8 Realistic Daily Routine Activities (Shown once awake) */}
      {hasWokenUp && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-pixel text-base sm:text-lg text-amber-200">
              {isTL ? 'Gawain Ngayong Araw' : 'Today’s Activities'}
            </h3>
            <span className="text-[11px] font-mono text-amber-300/70">
              {isTL ? 'Live scene bawat gawain · Auto-tulog 12:00 AM' : 'Live scene per activity · Auto-sleep 12:00 AM'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {WEEKLY_ACTIONS.map((act) => {
              const countToday = dayBlocks.filter((b) => b.actionId === act.id).length;
              const gate = canPerformDailyAction(save, act.id);
              const justDid = recentActionId === act.id;
              const isOvertimeWork = act.id === 'work' && shiftsToday >= 1;
              const mealInfo = act.id === 'eat_meal' ? getMealLabelForTime(minuteOfDay) : null;

              let moneyShow = act.moneyDelta;
              if (act.id === 'work') {
                if (isOvertimeWork) moneyShow = Math.round(moneyShow * 0.8);
                if (weekday.isWeekend) moneyShow = Math.round(moneyShow * 1.15);
              } else if (act.id === 'eat_meal' && livesAtHome && (minuteOfDay < 630 || minuteOfDay >= 1080)) {
                moneyShow = -15;
              } else if (act.id === 'attend_class' && cal.weather === 'rainy') {
                moneyShow -= 15;
              }

              const durationLabel =
                act.durationHours < 1
                  ? `${Math.round(act.durationHours * 60)}m`
                  : `${act.durationHours}h`;

              return (
                <button
                  key={act.id}
                  type="button"
                  disabled={!gate.allowed}
                  onClick={() => handlePerformAction(act.id)}
                  className={`text-left p-3.5 sm:p-4 rounded-xl border transition-all ${
                    justDid
                      ? 'bg-amber-500/25 border-amber-300 scale-[0.99]'
                      : !gate.allowed
                        ? 'bg-[#17110d] border-amber-950/70 text-amber-200/60 cursor-not-allowed opacity-65'
                        : countToday > 0
                          ? 'bg-[#2a1e16] hover:bg-[#35261c] border-amber-600/70 text-amber-50'
                          : 'bg-[#201610] hover:bg-[#2a1d15] border-amber-900/50 text-amber-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-pixel text-base sm:text-lg text-amber-200 truncate">
                      {mealInfo
                        ? isTL
                          ? `Kain: ${mealInfo.tl}`
                          : `Eat: ${mealInfo.en}`
                        : isTL
                          ? act.label
                          : act.labelEn}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300/90 shrink-0 tabular-nums">
                      +{durationLabel} · {countToday}/{act.maxPerDay}
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/75 mt-1 leading-relaxed">
                    {gate.allowed
                      ? isTL
                        ? act.desc
                        : act.descEn
                      : isTL
                        ? gate.reasonTl
                        : gate.reasonEn}
                  </p>
                  <div className="text-[11px] font-mono text-amber-300/85 mt-2 tabular-nums">
                    EN {act.energyDelta >= 0 ? '+' : ''}
                    {act.energyDelta - (isOvertimeWork ? 4 : 0)} · MH {act.mentalDelta >= 0 ? '+' : ''}
                    {act.mentalDelta} · SOC {act.socialDelta >= 0 ? '+' : ''}
                    {act.socialDelta}
                    {act.gwaDelta !== 0 ? ` · GWA ${act.gwaDelta < 0 ? '▲' : '▼'}` : ''}
                    {moneyShow !== 0
                      ? ` · ${moneyShow > 0 ? `+₱${moneyShow}` : `-₱${Math.abs(moneyShow)}`}`
                      : ''}
                    {isOvertimeWork && gate.allowed ? ' · OT' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
