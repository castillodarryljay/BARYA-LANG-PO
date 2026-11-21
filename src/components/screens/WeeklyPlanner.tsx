import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Cloud,
  CloudRain,
  Flame,
  Gamepad2,
  Languages,
  Lock,
  Moon,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from 'lucide-react';
import {
  DAY_START_MINUTE,
  MAX_PAID_SHIFTS_PER_DAY,
} from '../../data/config';
import { getCalendarDayInfo, normalizeDayOfYear } from '../../engine/dailyScenes';
import {
  BEAT_META,
  buildDailyStoryScene,
  DAILY_BEATS_ORDER,
} from '../../engine/dailyStoryFlow';
import {
  formatClockTime,
  getTimeOfDayPhase,
  getWeekdayInfo,
  interpolateText,
} from '../../engine/storyEngine';
import { soundFX } from '../../engine/audio';
import { useGameStore } from '../../store/gameStore';
import { PixelBackground } from '../art/PixelBackground';
import { PixelSprite } from '../art/PixelSprite';
import type { DailyStoryChoice, TimeOfDayPhase, WeatherId } from '../../types/game';

function isCharacterSpeaking(charId: string, speakerRaw: string, playerName: string): boolean {
  const s = speakerRaw.toLowerCase();
  if (s === 'narrator' || s === 'system') return false;
  if (charId === 'player') {
    return s === playerName.toLowerCase() || s === '{name}' || s === 'you' || s === 'ikaw';
  }
  if (charId === 'nena' && s.includes('nena')) return true;
  if (charId === 'prof' && (s.includes('prof') || s.includes('reyes'))) return true;
  if (charId === 'crush' && (s.includes('jamie') || s.includes('crush'))) return true;
  return s.includes(charId.toLowerCase());
}

const PHASE_OVERLAY: Record<TimeOfDayPhase, string> = {
  dawn: 'from-amber-400/18 via-orange-950/10 to-[#120b07]/65',
  morning: 'from-amber-200/8 via-transparent to-[#120b07]/55',
  afternoon: 'from-orange-400/12 via-transparent to-[#120b07]/60',
  evening: 'from-indigo-950/40 via-purple-950/20 to-[#120b07]/75',
  night: 'from-slate-950/60 via-indigo-950/35 to-[#120b07]/85',
};

const WEATHER_ICON: Record<WeatherId, React.ReactNode> = {
  sunny: <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />,
  breezy: <Wind className="w-3.5 h-3.5 text-sky-300 shrink-0" />,
  cloudy: <Cloud className="w-3.5 h-3.5 text-slate-300 shrink-0" />,
  rainy: <CloudRain className="w-3.5 h-3.5 text-cyan-300 shrink-0" />,
  hot: <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />,
};

export const WeeklyPlanner: React.FC = () => {
  const {
    save,
    settings,
    lastWeekFeedback,
    chooseDailyStoryChoice,
    updateSettings,
  } = useGameStore();

  const [showJobPicker, setShowJobPicker] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const scene = useMemo(() => {
    if (!save) return null;
    return buildDailyStoryScene(save, { showJobPicker });
  }, [save, showJobPicker]);

  // Reset job picker when day or beat changes
  const beatKey = `${save?.totalWeeks ?? 0}_${save?.dayBeat ?? 'wake_up'}`;
  useEffect(() => {
    setShowJobPicker(false);
  }, [beatKey]);

  // Reset dialogue typewriter whenever scene ID changes
  const sceneId = scene?.id ?? '';
  useEffect(() => {
    setLineIndex(0);
    setCharCount(0);
  }, [sceneId]);

  const isTL = settings.language === 'taglish';
  const currentLine = scene?.lines[Math.min(lineIndex, (scene?.lines.length ?? 1) - 1)];

  const fullText = useMemo(() => {
    if (!save || !currentLine) return '';
    const raw = isTL ? currentLine.text : currentLine.textEn || currentLine.text;
    return interpolateText(raw, save.profile);
  }, [currentLine, isTL, save]);

  const speakerName = useMemo(() => {
    if (!save || !currentLine) return '';
    return interpolateText(currentLine.speaker, save.profile);
  }, [currentLine, save]);

  const speedMs =
    settings.textSpeed === 'instant'
      ? 0
      : settings.textSpeed === 'fast'
        ? 10
        : settings.textSpeed === 'slow'
          ? 30
          : 16;

  useEffect(() => {
    if (!fullText) return;
    if (speedMs === 0) {
      setCharCount(fullText.length);
      return;
    }
    if (charCount >= fullText.length) return;
    const timer = window.setTimeout(() => {
      setCharCount((c) => c + 1);
      if (charCount % 6 === 0) soundFX.playBlip();
    }, speedMs);
    return () => window.clearTimeout(timer);
  }, [charCount, fullText, speedMs]);

  if (!save || !scene) return null;

  const isTyping = charCount < fullText.length;
  const isLastLine = lineIndex >= scene.lines.length - 1;
  const visibleText = fullText.slice(0, charCount);

  const dayOfYear = normalizeDayOfYear(save.dayOfYear ?? save.totalWeeks);
  const cal = getCalendarDayInfo(dayOfYear, save.totalWeeks);
  const weekday = getWeekdayInfo(save.totalWeeks);
  const minuteOfDay = save.minuteOfDay ?? DAY_START_MINUTE;
  const clock = formatClockTime(minuteOfDay);
  const phase = getTimeOfDayPhase(minuteOfDay);
  const beatInfo = BEAT_META[scene.beat];
  const currentBeatIdx = DAILY_BEATS_ORDER.indexOf(scene.beat);

  const phaseIcon =
    phase === 'dawn' ? (
      <Sunrise className="w-3.5 h-3.5 text-amber-300 shrink-0" />
    ) : phase === 'morning' || phase === 'afternoon' ? (
      <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
    ) : phase === 'evening' ? (
      <Sunset className="w-3.5 h-3.5 text-orange-300 shrink-0" />
    ) : (
      <Moon className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
    );

  const handleAdvanceDialogue = () => {
    if (isTyping) {
      setCharCount(fullText.length);
      return;
    }
    if (!isLastLine) {
      soundFX.playClick();
      setLineIndex((i) => i + 1);
      setCharCount(0);
    }
  };

  const handleSelectChoice = (choice: DailyStoryChoice) => {
    if (choice.openJobPicker) {
      soundFX.playClick();
      setShowJobPicker(true);
      return;
    }
    if (choice.id === 'close_job_picker') {
      soundFX.playClick();
      setShowJobPicker(false);
      return;
    }
    chooseDailyStoryChoice(choice);
  };

  const hasSpecificSpeaker =
    speakerName.toLowerCase() !== 'narrator' &&
    scene.characters.some((c) =>
      isCharacterSpeaking(c.id, currentLine?.speaker ?? '', save.profile.name)
    );

  const renderSlotCharacters = (pos: 'left' | 'center' | 'right') => {
    const enterClass =
      pos === 'left'
        ? 'anim-enter-left'
        : pos === 'right'
          ? 'anim-enter-right'
          : 'anim-fade-up';
    return scene.characters
      .filter((c) => c.position === pos)
      .map((c) => {
        const speaking = isCharacterSpeaking(c.id, currentLine?.speaker ?? '', save.profile.name);
        const isWorried = c.sprite.endsWith('_worried') || c.sprite.endsWith('_sad');
        const spriteAnim = speaking ? 'speaking' : isWorried ? 'worried' : 'idle';
        return (
          <div key={`${scene.id}-${c.id}-${c.sprite}`} className={enterClass}>
            <PixelSprite
              spriteId={c.sprite}
              playerGender={save.profile.gender}
              appearance={save.profile.appearance}
              animation={spriteAnim}
              dimmed={hasSpecificSpeaker && !speaking}
              size="lg"
            />
          </div>
        );
      });
  };

  return (
    <div
      key={scene.id}
      data-testid="continuous-daily-story"
      className="space-y-3 sm:space-y-3.5 anim-fade-up"
    >
      {/* BAND 1 + BAND 2: Unobstructed 3-part Story Frame */}
      <section className="rounded-2xl overflow-hidden border border-amber-700/60 bg-[#18100c] pixel-frame">
        {/* Band 1: Clean Calendar, Weather, Clock & 7-Beat Story Progress Header */}
        <div className="px-3 sm:px-4 py-2 bg-[#1d140f] border-b border-amber-900/50 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2 text-[11px] font-mono">
              <span className="text-amber-300 font-bold tabular-nums truncate">
                {cal.monthShort} {cal.dayOfMonth} · Day {cal.dayOfYear}/365 ({isTL ? weekday.tl : weekday.short})
              </span>
              <span className="hidden sm:inline text-amber-500/50">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-amber-100/85 truncate">
                {WEATHER_ICON[cal.weather]}
                <span className="truncate">{isTL ? cal.weatherLabelTl : cal.weatherLabelEn}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Compact 7-Beat Day Arc Indicator */}
              <div className="hidden sm:flex items-center gap-1.5 pr-1" aria-label="Daily story progress">
                <span className="text-[11px] font-mono text-amber-200/75">
                  {beatInfo.index}/7 {isTL ? scene.beatLabelTl : scene.beatLabelEn}
                </span>
                <div className="flex items-center gap-1">
                  {DAILY_BEATS_ORDER.map((b, idx) => (
                    <span
                      key={b}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentBeatIdx
                          ? 'w-4 bg-amber-400'
                          : idx < currentBeatIdx
                            ? 'w-1.5 bg-emerald-400/80'
                            : 'w-1.5 bg-amber-900/80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Digital Clock */}
              <div className="flex items-center gap-1 text-xs sm:text-sm font-mono font-bold text-[#fff6e5] tabular-nums">
                {phaseIcon}
                <span data-testid="daily-clock-readout">{clock.time12}</span>
              </div>

              {/* Taglish / English Toggle */}
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  updateSettings({ language: isTL ? 'english' : 'taglish' });
                }}
                aria-label="Toggle Taglish or English"
                className="min-h-[28px] sm:min-h-[32px] px-2 sm:px-2.5 rounded-lg bg-[#2a1d14] hover:bg-[#38271b] border border-amber-700/60 text-[11px] font-semibold text-amber-100 inline-flex items-center gap-1"
              >
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                {isTL ? 'TL' : 'EN'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs text-amber-100/80">
            <div className="min-w-0 flex items-center gap-1.5 truncate">
              <span className="font-semibold text-[#fff4de] truncate">
                {isTL ? scene.locationTl : scene.locationEn}
              </span>
              {cal.specialDayTl && (
                <span className="text-amber-300 font-semibold inline-flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-none">
                    {isTL ? cal.specialDayTl : cal.specialDayEn}
                  </span>
                </span>
              )}
            </div>
            <span className="sm:hidden inline-flex items-center gap-1 text-[10px] font-mono text-amber-200/80 shrink-0">
              {WEATHER_ICON[cal.weather]}
              <span>{(isTL ? cal.weatherLabelTl : cal.weatherLabelEn).split('·')[0].trim()}</span>
            </span>
          </div>
        </div>

        {/* Band 2: Unobstructed 16:9 Pixel Art Scene & Speaking Characters */}
        <div className="relative w-full h-[clamp(185px,33vh,350px)] sm:h-auto sm:aspect-[16/9] sm:max-h-[45vh] overflow-hidden bg-[#120b07]">
          <PixelBackground backgroundId={scene.background} animated />

          {/* Atmospheric Time-of-Day Tint */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${PHASE_OVERLAY[phase]} pointer-events-none transition-colors duration-700`}
          />

          {/* Subtle Rain Streaks on Rainy Days */}
          {cal.weather === 'rainy' && (
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(115deg, transparent 0px, transparent 14px, rgba(186,230,253,0.45) 14px, rgba(186,230,253,0.45) 15px)',
              }}
            />
          )}

          {/* Bottom Scrim for Character Grounding */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#120b07]/90 via-[#120b07]/25 to-transparent pointer-events-none" />

          {/* Animated Character Sprites */}
          <div className="absolute inset-x-2 sm:inset-x-5 bottom-0 z-10 flex items-end justify-between pointer-events-none">
            <div className="w-1/3 flex justify-start">{renderSlotCharacters('left')}</div>
            <div className="w-1/3 flex justify-center">{renderSlotCharacters('center')}</div>
            <div className="w-1/3 flex justify-end">{renderSlotCharacters('right')}</div>
          </div>
        </div>
      </section>

      {/* BAND 3: Interactive Typewriter Dialogue Box */}
      <button
        type="button"
        data-vn-advance="true"
        onClick={handleAdvanceDialogue}
        className="w-full text-left bg-[#231812] hover:bg-[#291c15] border border-amber-700/60 rounded-2xl p-3.5 sm:p-5 space-y-2 pixel-frame transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-pixel text-base sm:text-lg text-amber-300 tracking-wide truncate">
              {speakerName}
            </span>
            <span className="sm:hidden text-[11px] font-mono text-amber-200/65 shrink-0">
              · {beatInfo.index}/7 {isTL ? scene.beatLabelTl : scene.beatLabelEn}
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-200/60 tabular-nums shrink-0">
            {lineIndex + 1}/{scene.lines.length}
          </span>
        </div>

        <p className="text-[14px] sm:text-base text-[#faf2e3] leading-relaxed min-h-[3.25rem]">
          {visibleText}
          {isTyping && (
            <span className="inline-block w-2 h-4 bg-amber-400 ml-1 align-middle caret-blink" />
          )}
        </p>

        {(!isLastLine || isTyping) && (
          <div className="flex items-center justify-end gap-1 text-xs font-semibold text-amber-400 pt-0.5">
            <span>
              {isTyping
                ? isTL
                  ? 'I-tap para tapusin'
                  : 'Tap to skip'
                : isTL
                  ? 'Magpatuloy'
                  : 'Continue'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </button>

      {/* Staggered Continuous Story Choices */}
      {isLastLine && !isTyping && (
        <div className="space-y-2" role="group" aria-label="Daily story choices">
          {scene.choices.map((choice, idx) => {
            const label = interpolateText(
              isTL ? choice.text : choice.textEn || choice.text,
              save.profile
            );
            const hint = isTL ? choice.hint : choice.hintEn || choice.hint;
            const disabledReason = isTL ? choice.disabledReasonTl : choice.disabledReasonEn;
            const isMinigame = Boolean(choice.triggerMinigame || choice.openJobPicker);

            return (
              <button
                key={choice.id}
                type="button"
                data-vn-choice="true"
                data-choice-id={choice.id}
                onClick={() => handleSelectChoice(choice)}
                style={{ animationDelay: `${idx * 45}ms` }}
                className={`w-full min-h-[52px] text-left px-3.5 sm:px-4 py-3 rounded-xl border pixel-btn anim-choice-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 transition-colors ${
                  choice.disabled
                    ? 'bg-[#1a120e] border-amber-950/70 text-amber-200/45 cursor-not-allowed'
                    : isMinigame
                      ? 'bg-[#1f261b] hover:bg-[#273322] border-emerald-600/60 hover:border-emerald-400 text-[#f3ffe9]'
                      : choice.nextBeat === 'NEXT_DAY'
                        ? 'bg-[#2c1f12] hover:bg-[#3c2a17] border-amber-500/75 hover:border-amber-300 text-[#fff7e6]'
                        : 'bg-[#2d1f16] hover:bg-[#3a281c] border-amber-600/60 hover:border-amber-400 text-[#fff6e5]'
                }`}
              >
                <span className="text-sm sm:text-[15px] font-semibold leading-snug flex items-start gap-2">
                  <span
                    className={`font-mono shrink-0 ${
                      choice.disabled
                        ? 'text-amber-500/40'
                        : isMinigame
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                    }`}
                  >
                    {choice.disabled ? (
                      <Lock className="w-3.5 h-3.5 mt-1" />
                    ) : isMinigame ? (
                      <Gamepad2 className="w-4 h-4 mt-0.5" />
                    ) : (
                      `${idx + 1}.`
                    )}
                  </span>
                  <span>{label}</span>
                </span>

                <span
                  className={`text-[11px] sm:text-xs font-mono shrink-0 ${
                    choice.disabled
                      ? 'text-rose-300/80'
                      : isMinigame
                        ? 'text-emerald-300/90'
                        : 'text-amber-300/85'
                  }`}
                >
                  {choice.disabled && disabledReason ? disabledReason : hint}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Subtle Unboxed 1-Line Story Metadata Footer (Daily Goal + Shifts + Yesterday's Summary) */}
      <div className="pt-1 px-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-amber-200/70 font-mono">
        {save.activeChallenge && (
          <span className="truncate">
            <span className="text-amber-400 font-semibold">
              {isTL ? 'Goal:' : 'Goal:'}
            </span>{' '}
            {isTL ? save.activeChallenge.desc : save.activeChallenge.descEn} (+₱
            {save.activeChallenge.rewardMoney})
          </span>
        )}
        <div className="flex items-center gap-3 shrink-0 tabular-nums">
          <span>
            {isTL ? 'Raket' : 'Shifts'}: {save.workJobsCompletedThisWeek}/{MAX_PAID_SHIFTS_PER_DAY}
          </span>
          {scene.beat === 'wake_up' && lastWeekFeedback && (
            <span className="text-emerald-300/85">
              {isTL ? 'Baon' : 'Allowance'} +₱{lastWeekFeedback.allowanceReceived} ·{' '}
              {isTL ? 'Gastos' : 'Bills'} -₱{lastWeekFeedback.livingCosts}
              {lastWeekFeedback.debtInterest > 0
                ? ` · Utang -₱${lastWeekFeedback.debtInterest}`
                : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
