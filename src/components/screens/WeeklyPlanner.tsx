import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Clock,
  FastForward,
  Flame,
  Lock,
  Moon,
  Pause,
  Play,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Target,
} from 'lucide-react';
import {
  CHAPTER_LABELS,
  DAY_END_MINUTE,
  DAY_START_MINUTE,
  MAX_PAID_SHIFTS_PER_DAY,
  MINIGAME_CONFIGS,
  WEEKLY_ACTIONS,
  WEEKS_PER_SEMESTER,
} from '../../data/config';
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
import type { ClockSpeed, MinigameId, WeeklyActionId } from '../../types/game';

const SPEED_OPTIONS: { speed: ClockSpeed; label: string }[] = [
  { speed: 0, label: 'Pause' },
  { speed: 1, label: '1×' },
  { speed: 2, label: '2×' },
  { speed: 4, label: '4×' },
];

export const WeeklyPlanner: React.FC = () => {
  const {
    save,
    settings,
    lastWeekFeedback,
    updateSettings,
    tickDayClock,
    doDailyAction,
    finishCurrentDay,
    startMinigame,
  } = useGameStore();

  const [showJobs, setShowJobs] = useState(false);
  const [recentActionId, setRecentActionId] = useState<WeeklyActionId | null>(null);

  const clockSpeed: ClockSpeed = settings.clockSpeed ?? 2;
  const isPlannerActive = save?.phase === 'planner';

  // Fast live 24-hour clock ticker (pauses automatically when browsing jobs modal or paused)
  useEffect(() => {
    if (!isPlannerActive || clockSpeed === 0 || showJobs) return;
    const stepMins = clockSpeed === 1 ? 2 : clockSpeed === 2 ? 4 : 10;
    const timer = window.setInterval(() => {
      tickDayClock(stepMins);
    }, 150);
    return () => window.clearInterval(timer);
  }, [isPlannerActive, clockSpeed, showJobs, tickDayClock]);

  if (!save) return null;

  const isTL = settings.language === 'taglish';
  const minuteOfDay = save.minuteOfDay ?? DAY_START_MINUTE;
  const { time12, time24 } = formatClockTime(minuteOfDay);
  const phase = getTimeOfDayPhase(minuteOfDay);
  const weekday = getWeekdayInfo(save.totalWeeks);
  const dayBlocks = save.dayActions ?? [];
  const sleepBonus = getSleepBonus(minuteOfDay, dayBlocks.length);
  const activeChallenge = save.activeChallenge;
  const streak = save.studyStreak ?? 0;
  const isHardcore = save.profile.difficulty === 'hardcore';
  const shiftsToday = save.workJobsCompletedThisWeek;

  const totalWakingMins = DAY_END_MINUTE - DAY_START_MINUTE; // 1080 mins (18h)
  const elapsedWakingMins = Math.max(0, minuteOfDay - DAY_START_MINUTE);
  const remainingMins = Math.max(0, DAY_END_MINUTE - minuteOfDay);
  const remHours = Math.floor(remainingMins / 60);
  const remMinsPart = remainingMins % 60;
  const progressPct = Math.min(100, Math.max(0, (elapsedWakingMins / totalWakingMins) * 100));

  const phaseMeta =
    phase === 'morning'
      ? {
          icon: Sunrise,
          label: isTL ? 'Umaga · Morning' : 'Morning',
          banner: 'from-amber-900/45 via-[#261a12] to-[#231812] border-amber-600/60',
          iconColor: 'text-amber-300',
        }
      : phase === 'afternoon'
        ? {
            icon: Sun,
            label: isTL ? 'Tanghali · Afternoon' : 'Afternoon',
            banner: 'from-orange-900/45 via-[#261a12] to-[#231812] border-orange-500/60',
            iconColor: 'text-orange-300',
          }
        : phase === 'evening'
          ? {
              icon: Sunset,
              label: isTL ? 'Gabi · Evening' : 'Evening',
              banner: 'from-purple-950/60 via-[#251817] to-[#211612] border-purple-500/50',
              iconColor: 'text-purple-300',
            }
          : {
              icon: Moon,
              label: isTL ? 'Puyat Hours · Late Night' : 'Late Night (Puyat)',
              banner: 'from-indigo-950/75 via-[#1c1624] to-[#1b1414] border-indigo-500/60',
              iconColor: 'text-indigo-300',
            };

  const PhaseIcon = phaseMeta.icon;

  const handlePerformAction = (id: WeeklyActionId) => {
    const res = doDailyAction(id);
    if (!res) return;
    setRecentActionId(id);
    window.setTimeout(() => {
      setRecentActionId((cur) => (cur === id ? null : cur));
    }, 350);
    if (res.reachedMidnight) {
      window.setTimeout(() => {
        finishCurrentDay();
      }, 320);
    }
  };

  const handleLaunchJob = (id: MinigameId) => {
    soundFX.playClick();
    setShowJobs(false);
    startMinigame(id);
  };

  const isMilestoneDay = save.week === 4 || save.week === 6 || save.week === WEEKS_PER_SEMESTER;
  const milestoneNote =
    save.week === 4
      ? isTL
        ? 'Midterm Exam Day — Doble kayod sa aral!'
        : 'Midterm Exam Day — Double down on your studies!'
      : save.week === 6
        ? isTL
          ? 'Tuition & Project Crunch Day — Bantayan ang budget!'
          : 'Tuition & Project Crunch Day — Watch your budget!'
        : save.week === WEEKS_PER_SEMESTER
          ? isTL
            ? 'Final Exams & Grade Deliberation Day!'
            : 'Final Exams & Grade Deliberation Day!'
          : null;

  return (
    <div className="space-y-3.5 sm:space-y-4 anim-fade-up">
      {/* 24-Hour Live Daily Clock Hero Card */}
      <div
        className={`bg-gradient-to-br ${phaseMeta.banner} border rounded-2xl p-4 sm:p-5 space-y-3.5 pixel-frame transition-colors duration-500`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="text-xs font-mono text-amber-300/90 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                {CHAPTER_LABELS[save.chapter].tl} · Sem {save.semester} · Day {save.week}/{WEEKS_PER_SEMESTER} ({isTL ? weekday.tl : weekday.short})
              </span>
              {weekday.isWeekend && (
                <span className="text-emerald-300 font-bold">· WEEKEND +15% RAKET</span>
              )}
              {isHardcore && (
                <span className="text-rose-300 font-bold">· HARDCORE</span>
              )}
              {streak >= 2 && (
                <span className="inline-flex items-center gap-1 text-orange-300 font-bold">
                  <Flame className="w-3.5 h-3.5" />
                  {streak}d Streak
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-2.5 pt-0.5">
              <div
                data-testid="daily-clock-readout"
                className="font-pixel text-2xl sm:text-3xl text-amber-50 flex items-center gap-2 tabular-nums"
              >
                <PhaseIcon className={`w-6 h-6 shrink-0 ${phaseMeta.iconColor}`} />
                <span>{time12}</span>
              </div>
              <span className="text-xs font-mono text-amber-200/75 tabular-nums">
                ({time24} / 24:00 · {phaseMeta.label})
              </span>
            </div>
          </div>

          {/* Live Clock Speed Controls */}
          <div className="flex items-center gap-1.5 bg-[#150e0a]/90 border border-amber-900/60 rounded-xl p-1">
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
                  className={`min-h-[34px] px-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 transition-colors ${
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
                tickDayClock(60);
              }}
              aria-label="Skip 1 hour forward"
              className="min-h-[34px] px-2 rounded-lg text-xs font-mono font-semibold text-amber-300 hover:bg-[#2a1d15] border-l border-amber-900/50 ml-0.5"
            >
              +1h
            </button>
          </div>
        </div>

        {/* Visual 24-Hour Day Timeline Bar (06:00 to 24:00) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-amber-200/80 tabular-nums">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {isTL ? '24-Hour Daily Timeline' : '24-Hour Daily Timeline'} ({dayBlocks.length}{' '}
              {isTL ? 'nagawa' : 'done'})
            </span>
            <span>
              {remHours}h {String(remMinsPart).padStart(2, '0')}m {isTL ? 'natitira' : 'left'}
            </span>
          </div>

          <div className="relative h-5 w-full rounded-lg bg-[#140e0a] border border-amber-900/70 overflow-hidden">
            {/* Elapsed time subtle fill */}
            <div
              className="absolute inset-y-0 left-0 bg-amber-500/15 transition-[width] duration-150"
              style={{ width: `${progressPct}%` }}
            />
            {/* Completed activity blocks */}
            {dayBlocks.map((blk) => {
              const leftPct = ((blk.startMinute - DAY_START_MINUTE) / totalWakingMins) * 100;
              const widthPct = Math.max(
                2,
                ((blk.endMinute - blk.startMinute) / totalWakingMins) * 100
              );
              const cfg = WEEKLY_ACTIONS.find((a) => a.id === blk.actionId);
              const color = blk.actionId === 'minigame' ? '#34d399' : cfg?.timelineColor ?? '#f59e0b';
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
            {/* Current time glowing needle */}
            <div
              className="absolute inset-y-0 w-0.5 bg-amber-100 shadow-[0_0_6px_rgba(254,243,199,0.9)] transition-[left] duration-150"
              style={{ left: `${progressPct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-amber-300/60 tabular-nums">
            <span>06:00 AM</span>
            <span>12:00 PM</span>
            <span>06:00 PM</span>
            <span>10:00 PM</span>
            <span>12:00 AM</span>
          </div>

          {dayBlocks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dayBlocks.map((blk) => (
                <span
                  key={blk.id}
                  className="text-[10px] font-mono bg-[#160f0b]/90 border border-amber-900/60 text-amber-200/90 px-2 py-0.5 rounded-md tabular-nums"
                >
                  {formatClockTime(blk.startMinute).time24} {isTL ? blk.label : blk.labelEn}
                </span>
              ))}
            </div>
          )}
        </div>

        {isMilestoneDay && milestoneNote && (
          <div className="text-xs font-semibold bg-amber-500/15 border border-amber-500/50 text-amber-200 rounded-xl px-3.5 py-2">
            {milestoneNote}
          </div>
        )}

        {/* Primary Action Row: Sleep & End Day + Jobs & Minigames */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
          <button
            type="button"
            onClick={finishCurrentDay}
            className="min-h-[48px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1b110a] font-bold text-sm flex items-center justify-center gap-2 pixel-btn"
          >
            <Moon className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {isTL ? 'Tulog Na · Next Day Story' : 'Sleep & End Day · Story'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setShowJobs((v) => !v);
            }}
            className="min-h-[48px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 pixel-btn"
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span>
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
            {isTL ? 'Sleep Status:' : 'Sleep Status:'}{' '}
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

        {lastWeekFeedback && (
          <div className="text-[11px] font-mono bg-[#140e0a]/90 border border-amber-900/50 rounded-xl px-3 py-2 text-amber-200/85 flex flex-wrap gap-x-3 gap-y-1 tabular-nums">
            <span className="text-emerald-300">
              {isTL ? 'Kahapon Baon:' : 'Yesterday Allowance:'} +₱{lastWeekFeedback.allowanceReceived}
            </span>
            <span className="text-rose-300">
              Bills -₱{lastWeekFeedback.livingCosts}
            </span>
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

      {/* Active Daily Challenge Card */}
      {activeChallenge && (
        <div className="bg-[#211912] border border-amber-600/60 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wide">
              <Target className="w-3.5 h-3.5" />
              {isTL ? 'Daily Challenge' : 'Daily Challenge'} · {save.challengesCompleted ?? 0} Cleared
            </div>
            <div className="font-pixel text-base sm:text-lg text-amber-100">
              {isTL ? activeChallenge.title : activeChallenge.titleEn}
            </div>
            <p className="text-xs text-amber-200/85 leading-relaxed">
              {isTL ? activeChallenge.desc : activeChallenge.descEn}
            </p>
          </div>
          <div className="font-mono text-xs text-emerald-300 bg-[#16100b] border border-emerald-800/60 rounded-xl px-3 py-2 shrink-0 tabular-nums">
            Reward: +₱{activeChallenge.rewardMoney} · +{activeChallenge.rewardMental} MH
            {activeChallenge.rewardGwa ? ' · GWA ↑' : ''}
          </div>
        </div>
      )}

      {/* Expandable Playable Job / Minigame Board */}
      {showJobs && (
        <div className="bg-[#1e1510] border border-emerald-700/50 rounded-2xl p-4 sm:p-5 space-y-3 anim-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-pixel text-lg sm:text-xl text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
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

      {/* 7 Instant Tap-to-Do Daily Actions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-pixel text-base sm:text-lg text-amber-200">
            {isTL ? 'Gawain Ngayong Araw (Tap para gawin agad!)' : 'Daily Activities (Tap to perform instantly!)'}
          </h3>
          <span className="text-[11px] font-mono text-amber-300/70">
            {isTL ? 'Auto-tulog sa 12:00 AM' : 'Auto-sleep at 12:00 AM'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {WEEKLY_ACTIONS.map((act) => {
            const countToday = dayBlocks.filter((b) => b.actionId === act.id).length;
            const gate = canPerformDailyAction(save, act.id);
            const justDid = recentActionId === act.id;
            const isOvertimeWork = act.id === 'work' && shiftsToday >= 1;
            let moneyShow = act.moneyDelta;
            if (act.id === 'work') {
              if (isOvertimeWork) moneyShow = Math.round(moneyShow * 0.8);
              if (weekday.isWeekend) moneyShow = Math.round(moneyShow * 1.15);
            }
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
                  <span className="font-pixel text-base sm:text-lg text-amber-200 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: act.timelineColor }}
                    />
                    {isTL ? act.label : act.labelEn}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#150e0a] border border-amber-800/60 text-amber-300 shrink-0 tabular-nums">
                    +{act.durationHours}h · {countToday}/{act.maxPerDay}
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
    </div>
  );
};
