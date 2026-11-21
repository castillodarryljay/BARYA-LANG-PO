import {
  buildSubjectsForStage,
  CHAPTER_LABELS,
  CHAPTER_ORDER,
  COLLEGE_COURSES,
  DAY_END_MINUTE,
  DAY_START_MINUTE,
  DAYS_PER_YEAR,
  FAMILY_BACKGROUNDS,
  getDefaultAppearance,
  HOMETOWN_OPTIONS,
  MAX_PAID_SHIFTS_PER_DAY,
  MIN_STRENUOUS_ENERGY,
  MINIGAME_CONFIGS,
  SEM1_DAYS,
  WAKE_UP_OPTIONS,
  WEEKDAYS,
  WEEKLY_ACTIONS,
  WEEKLY_CHALLENGES,
  WEEKS_PER_SEMESTER,
} from '../data/config';
import {
  buildActionMoment,
  buildMorningWakeUpMoment,
  buildWakeUpResultMoment,
  getCalendarDayInfo,
  getMealLabelForTime,
  getSemesterAndPeriodFromDay,
  normalizeDayOfYear,
} from './dailyScenes';
import type {
  ChoiceEffects,
  DailyScheduleBlock,
  EndingDefinition,
  GameStats,
  MinigameId,
  NpcId,
  NumericCondition,
  PlayerProfile,
  SaveData,
  SchoolChapterId,
  StoryConditions,
  StoryNode,
  TimeOfDayPhase,
  WakeUpChoiceId,
  WeeklyActionId,
  WeeklyChallenge,
} from '../types/game';

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function roundGwa(gwa: number): number {
  return Number(clamp(gwa, 1.0, 5.0).toFixed(2));
}

export function matchNumeric(value: number, cond?: NumericCondition): boolean {
  if (!cond) return true;
  if (cond.lt !== undefined && !(value < cond.lt)) return false;
  if (cond.lte !== undefined && !(value <= cond.lte)) return false;
  if (cond.gt !== undefined && !(value > cond.gt)) return false;
  if (cond.gte !== undefined && !(value >= cond.gte)) return false;
  if (cond.eq !== undefined && value !== cond.eq) return false;
  return true;
}

export function evaluateConditions(
  cond: StoryConditions | undefined,
  state: Pick<
    SaveData,
    'profile' | 'chapter' | 'semester' | 'week' | 'stats' | 'flags' | 'relationships'
  >
): boolean {
  if (!cond) return true;
  if (cond.chapter && !cond.chapter.includes(state.chapter)) return false;
  if (cond.course && !cond.course.includes(state.profile.course)) return false;
  if (cond.strand && !cond.strand.includes(state.profile.strand)) return false;
  if (cond.familyBg && !cond.familyBg.includes(state.profile.familyBg)) return false;
  if (cond.gender && !cond.gender.includes(state.profile.gender)) return false;
  if (cond.isProvincial !== undefined && cond.isProvincial !== state.profile.isProvincial) {
    return false;
  }

  const flagSet = new Set(state.flags);
  if (cond.flagsAll && !cond.flagsAll.every((f) => flagSet.has(f))) return false;
  if (cond.flagsAny && !cond.flagsAny.some((f) => flagSet.has(f))) return false;
  if (cond.flagsNone && cond.flagsNone.some((f) => flagSet.has(f))) return false;

  if (!matchNumeric(state.stats.money, cond.money)) return false;
  if (!matchNumeric(state.stats.gwa, cond.gwa)) return false;
  if (!matchNumeric(state.stats.energy, cond.energy)) return false;
  if (!matchNumeric(state.stats.mental, cond.mental)) return false;
  if (!matchNumeric(state.stats.social, cond.social)) return false;
  if (!matchNumeric(state.week, cond.week)) return false;
  if (!matchNumeric(state.semester, cond.semester)) return false;

  if (cond.relationships) {
    for (const [npc, numCond] of Object.entries(cond.relationships) as [
      NpcId,
      NumericCondition,
    ][]) {
      if (!matchNumeric(state.relationships[npc] ?? 0, numCond)) return false;
    }
  }

  return true;
}

export function interpolateText(raw: string, profile: PlayerProfile): string {
  const pronoun = profile.gender === 'female' ? 'siya' : 'siya';
  const honorific = profile.gender === 'female' ? 'iha' : 'iho';
  return raw
    .replaceAll('{name}', profile.name)
    .replaceAll('{hometown}', profile.hometown)
    .replaceAll('{strand}', profile.strand)
    .replaceAll('{course}', profile.course)
    .replaceAll('{pronoun}', pronoun)
    .replaceAll('{honorific}', honorific);
}

export function getWeekdayInfo(totalDays: number): (typeof WEEKDAYS)[number] {
  const idx = Math.max(0, totalDays - 1) % WEEKDAYS.length;
  return WEEKDAYS[idx];
}

export function formatClockTime(minuteOfDay: number): { time12: string; time24: string } {
  const clamped = clamp(Math.floor(minuteOfDay), 0, DAY_END_MINUTE);
  if (clamped >= DAY_END_MINUTE) {
    return { time12: '12:00 AM', time24: '24:00' };
  }
  const h24 = Math.floor(clamped / 60);
  const mins = clamped % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(mins).padStart(2, '0');
  const hh24 = String(h24).padStart(2, '0');
  const hh12 = String(h12).padStart(2, '0');
  return {
    time12: `${hh12}:${mm} ${suffix}`,
    time24: `${hh24}:${mm}`,
  };
}

export function getTimeOfDayPhase(minuteOfDay: number): TimeOfDayPhase {
  if (minuteOfDay < 420) return 'dawn'; // 05:30 - 06:59
  if (minuteOfDay < 720) return 'morning'; // 07:00 - 11:59
  if (minuteOfDay < 1080) return 'afternoon'; // 12:00 - 17:59
  if (minuteOfDay < 1320) return 'evening'; // 18:00 - 21:59
  return 'night'; // 22:00 - 24:00
}

export function getSleepBonus(
  minuteOfDay: number,
  actionsDoneToday: number = 2
): {
  energyBonus: number;
  isAbsentSkip: boolean;
  labelTl: string;
  labelEn: string;
} {
  if (actionsDoneToday === 0 && minuteOfDay < 720) {
    return {
      energyBonus: 0,
      isAbsentSkip: true,
      labelTl: 'Absent Penalty (-50% Baon · +0.08 GWA)',
      labelEn: 'Skip-Day Penalty (-50% Allowance · +0.08 GWA)',
    };
  }
  if (minuteOfDay < 1320) {
    if (actionsDoneToday >= 2 || minuteOfDay >= 1080) {
      return {
        energyBonus: 14,
        isAbsentSkip: false,
        labelTl: 'Maagang Tulog (+14 EN)',
        labelEn: 'Early Sleep (+14 EN)',
      };
    }
    return {
      energyBonus: 6,
      isAbsentSkip: false,
      labelTl: 'Maikling Pahinga (+6 EN)',
      labelEn: 'Light Rest (+6 EN)',
    };
  }
  if (minuteOfDay < 1410) {
    return {
      energyBonus: 7,
      isAbsentSkip: false,
      labelTl: 'Sakto lang (+7 EN)',
      labelEn: 'Normal Sleep (+7 EN)',
    };
  }
  return {
    energyBonus: -4,
    isAbsentSkip: false,
    labelTl: 'Puyat Penalty (-4 EN)',
    labelEn: 'Late Night Puyat (-4 EN)',
  };
}

const SAVE_SEAL_SALT = 'BLRTG_ANTI_TAMPER_V3_PH_2026';

export function computeSaveIntegrityHash(save: SaveData): string {
  const sortedFlags = [...(save.flags ?? [])].sort().join(',');
  const payload = [
    SAVE_SEAL_SALT,
    save.profile?.name ?? '',
    save.profile?.difficulty ?? 'classic',
    save.chapter,
    save.semester,
    save.week,
    save.dayOfYear ?? 1,
    save.totalWeeks,
    Math.round(save.stats?.money ?? 0),
    Math.round(save.stats?.debtLimit ?? 0),
    Number((save.stats?.gwa ?? 2).toFixed(2)),
    Math.round(save.stats?.energy ?? 0),
    Math.round(save.stats?.mental ?? 0),
    Math.round(save.stats?.social ?? 0),
    save.challengesCompleted ?? 0,
    save.cheated ? '1' : '0',
    sortedFlags,
  ].join('|');

  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + (i & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

export function signSaveData(save: SaveData): SaveData {
  return {
    ...save,
    integrityHash: computeSaveIntegrityHash(save),
  };
}

export function verifySaveIntegrity(save: SaveData): { valid: boolean; reason?: string } {
  if (!save?.profile?.name || !save?.stats) {
    return { valid: false, reason: 'Corrupted save structure' };
  }
  const { money, debtLimit, gwa, energy, mental, social } = save.stats;
  if (
    !Number.isFinite(money) ||
    !Number.isFinite(gwa) ||
    !Number.isFinite(energy) ||
    !Number.isFinite(mental) ||
    !Number.isFinite(social)
  ) {
    return { valid: false, reason: 'Invalid stat values' };
  }
  if (money > 50000 || money < -(debtLimit + 500)) {
    return { valid: false, reason: 'Cash outside legitimate gameplay bounds' };
  }
  if (gwa < 1.0 || gwa > 5.0 || energy < 0 || energy > 100 || mental < 0 || mental > 100 || social < 0 || social > 100) {
    return { valid: false, reason: 'Stats outside valid bounds' };
  }
  const dayOfYear = save.dayOfYear ?? 1;
  if (
    save.week < 1 ||
    save.week > WEEKS_PER_SEMESTER ||
    dayOfYear < 1 ||
    dayOfYear > DAYS_PER_YEAR ||
    save.totalWeeks < 1 ||
    save.totalWeeks > 2500
  ) {
    return { valid: false, reason: 'Calendar tampered' };
  }
  if (save.integrityHash) {
    const expected = computeSaveIntegrityHash(save);
    if (save.integrityHash !== expected) {
      return { valid: false, reason: 'Save integrity signature mismatch' };
    }
  }
  return { valid: true };
}

export function getScholarshipSemesterFlag(chapter: SchoolChapterId, semester: 1 | 2): string {
  return `sch_tried_${chapter}_s${semester}`;
}

export function formatDateLabel(
  chapter: SchoolChapterId,
  semester: 1 | 2,
  week: number,
  dayOfYear?: number
): string {
  if (chapter === 'prologue') return 'Prologue';
  const short = CHAPTER_LABELS[chapter].short;
  if (dayOfYear !== undefined) {
    const cal = getCalendarDayInfo(dayOfYear);
    return `${short} · ${cal.monthShort} ${cal.dayOfMonth} (Day ${cal.dayOfYear}/365)`;
  }
  return `${short} · Sem ${semester} · Period ${week}`;
}

export function pickWeeklyChallenge(totalWeeks: number): WeeklyChallenge {
  const base = WEEKLY_CHALLENGES[totalWeeks % WEEKLY_CHALLENGES.length];
  return { ...base, completed: false };
}

export function createInitialSave(profile: PlayerProfile): SaveData {
  const fam =
    FAMILY_BACKGROUNDS.find((f) => f.id === profile.familyBg) ?? FAMILY_BACKGROUNDS[2];
  const isHardcore = profile.difficulty === 'hardcore';
  const baseGwa = isHardcore ? 2.1 : 1.95;
  const startingMoney = isHardcore
    ? Math.round(fam.startingMoney * 0.85)
    : fam.startingMoney;

  const normalizedProfile: PlayerProfile = {
    ...profile,
    difficulty: profile.difficulty ?? 'classic',
    appearance: profile.appearance ?? getDefaultAppearance(profile.gender),
  };

  const initial: SaveData = {
    version: 4,
    savedAt: new Date().toISOString(),
    label: `${normalizedProfile.name} · ${normalizedProfile.strand} / ${normalizedProfile.course}`,
    profile: normalizedProfile,
    chapter: 'shs_year1',
    semester: 1,
    week: 1,
    dayOfYear: 1,
    totalWeeks: 1,
    minuteOfDay: DAY_START_MINUTE,
    dayBeat: 'wake_up',
    dayContextTags: [],
    hasWokenUpToday: false,
    currentMoment: null,
    dayActions: [],
    stats: {
      money: startingMoney,
      debtLimit: fam.debtLimit,
      gwa: baseGwa,
      energy: isHardcore ? 82 : 88,
      mental: isHardcore ? 78 : 84,
      social: 52,
    },
    subjects: buildSubjectsForStage('shs_year1', normalizedProfile.strand, normalizedProfile.course, baseGwa),
    scholarship: null,
    relationships: {
      family: 55 + fam.familyRelBonus,
      miggy: 20,
      bea: 20,
      carlo: 15,
      crush: 18,
      prof_reyes: 25,
      aling_nena: 25,
    },
    flags: [...fam.startingFlags, ...(isHardcore ? ['hardcore_mode'] : [])],
    visitedNodes: [],
    journal: [],
    currentNodeId: 'prologue_morning',
    activeEndingId: null,
    phase: 'vn',
    pendingWeeklyActions: [],
    pendingMinigameId: null,
    workJobsCompletedThisWeek: 0,
    tuitionDueAmount: 0,
    tuitionPaidThisSem: true,
    activeChallenge: pickWeeklyChallenge(0),
    challengesCompleted: 0,
    studyStreak: 0,
    cheated: false,
  };

  initial.currentMoment = buildMorningWakeUpMoment(initial);
  return signSaveData(initial);
}

export function applyChoiceEffects(state: SaveData, effects?: ChoiceEffects): SaveData {
  if (!effects) return state;

  const stats: GameStats = { ...state.stats };
  if (effects.money !== undefined) {
    stats.money = Math.max(-stats.debtLimit, Math.round(stats.money + effects.money));
  }
  if (effects.energy !== undefined) {
    stats.energy = clamp(Math.round(stats.energy + effects.energy), 0, 100);
  }
  if (effects.mental !== undefined) {
    stats.mental = clamp(Math.round(stats.mental + effects.mental), 0, 100);
  }
  if (effects.social !== undefined) {
    stats.social = clamp(Math.round(stats.social + effects.social), 0, 100);
  }
  if (effects.gwa !== undefined) {
    stats.gwa = roundGwa(stats.gwa + effects.gwa);
  }

  const relationships = { ...state.relationships };
  if (effects.relationships) {
    for (const [npc, delta] of Object.entries(effects.relationships) as [NpcId, number][]) {
      relationships[npc] = clamp((relationships[npc] ?? 0) + delta, 0, 100);
    }
  }

  const flagSet = new Set(state.flags);
  if (effects.flagsAdd) {
    for (const f of effects.flagsAdd) flagSet.add(f);
  }
  if (effects.flagsRemove) {
    for (const f of effects.flagsRemove) flagSet.delete(f);
  }

  let scholarship = state.scholarship;
  if (effects.grantScholarship) {
    scholarship = { ...effects.grantScholarship, active: true };
    flagSet.add('active_scholar');
    flagSet.delete('scholarship_lost');
  }
  if (effects.loseScholarship && scholarship) {
    scholarship = { ...scholarship, active: false };
    flagSet.delete('active_scholar');
    flagSet.add('scholarship_lost');
  }

  let profile = state.profile;
  let subjects = state.subjects.map((sub, i) => ({
    ...sub,
    grade: roundGwa(stats.gwa + ((i % 3) - 1) * 0.08),
  }));

  if (effects.shiftCourse && effects.shiftCourse !== profile.course) {
    profile = {
      ...profile,
      shiftedFrom: profile.course,
      course: effects.shiftCourse,
    };
    subjects = buildSubjectsForStage(state.chapter, profile.strand, profile.course, stats.gwa);
  }

  const journal = [...state.journal];
  if (effects.journal) {
    journal.unshift({
      id: `j_${Date.now()}_${journal.length}`,
      dateLabel: formatDateLabel(state.chapter, state.semester, state.week),
      title: interpolateText(effects.journal.title, profile),
      titleEn: interpolateText(effects.journal.titleEn, profile),
      summary: interpolateText(effects.journal.summary, profile),
      summaryEn: interpolateText(effects.journal.summaryEn, profile),
      category: effects.journal.category ?? 'choice',
    });
  }

  return {
    ...state,
    profile,
    stats,
    subjects,
    scholarship,
    relationships,
    flags: Array.from(flagSet),
    journal,
  };
}

export interface ActionAvailability {
  allowed: boolean;
  reasonTl?: string;
  reasonEn?: string;
}

export function canPerformDailyAction(
  state: SaveData,
  actId: WeeklyActionId
): ActionAvailability {
  const cfg = WEEKLY_ACTIONS.find((a) => a.id === actId);
  if (!cfg) return { allowed: false, reasonTl: 'Invalid action', reasonEn: 'Invalid action' };

  const startMinute = clamp(state.minuteOfDay ?? DAY_START_MINUTE, DAY_START_MINUTE, DAY_END_MINUTE);
  const durationMins = Math.round(cfg.durationHours * 60);

  if (startMinute + durationMins > DAY_END_MINUTE) {
    return {
      allowed: false,
      reasonTl: `Kulang sa oras (${cfg.durationHours}h kailangan bago 12:00 AM)`,
      reasonEn: `Not enough time left (${cfg.durationHours}h needed before 12:00 AM)`,
    };
  }

  const countToday = (state.dayActions ?? []).filter((b) => b.actionId === actId).length;
  if (countToday >= cfg.maxPerDay) {
    return {
      allowed: false,
      reasonTl: `Tapos na ngayong araw (${countToday}/${cfg.maxPerDay})`,
      reasonEn: `Daily limit reached (${countToday}/${cfg.maxPerDay})`,
    };
  }

  if (actId === 'work' && state.workJobsCompletedThisWeek >= MAX_PAID_SHIFTS_PER_DAY) {
    return {
      allowed: false,
      reasonTl: `Max ${MAX_PAID_SHIFTS_PER_DAY} raket shifts/day naabot na`,
      reasonEn: `Max ${MAX_PAID_SHIFTS_PER_DAY} paid shifts/day reached`,
    };
  }

  if (cfg.strenuous && state.stats.energy < MIN_STRENUOUS_ENERGY) {
    return {
      allowed: false,
      reasonTl: `Pagod na pagod (kailangan ng ${MIN_STRENUOUS_ENERGY}+ Energy)`,
      reasonEn: `Too exhausted (requires ${MIN_STRENUOUS_ENERGY}+ Energy)`,
    };
  }

  return { allowed: true };
}

export interface DailyActionResult {
  nextState: SaveData;
  block: DailyScheduleBlock;
  reachedMidnight: boolean;
}

export function performMorningWakeUp(
  state: SaveData,
  choiceId: WakeUpChoiceId
): SaveData | null {
  if (state.hasWokenUpToday) return null;
  const opt = WAKE_UP_OPTIONS.find((o) => o.id === choiceId);
  if (!opt) return null;

  const startMinute = clamp(state.minuteOfDay ?? DAY_START_MINUTE, DAY_START_MINUTE, DAY_END_MINUTE);
  const endMinute = Math.min(DAY_END_MINUTE, startMinute + opt.durationMins);
  const livesAtHome = !state.chapter.startsWith('college') || !state.profile.isProvincial;
  const mealCost = choiceId === 'breakfast' && livesAtHome ? 0 : opt.moneyDelta;

  const nextStats: GameStats = {
    ...state.stats,
    money: Math.max(-state.stats.debtLimit, Math.round(state.stats.money + mealCost)),
    energy: clamp(Math.round(state.stats.energy + opt.energyDelta), 0, 100),
    mental: clamp(Math.round(state.stats.mental + opt.mentalDelta), 0, 100),
    gwa: roundGwa(state.stats.gwa + opt.gwaDelta),
  };

  const block: DailyScheduleBlock = {
    id: `wake_${Date.now()}`,
    actionId: 'wakeup',
    label: opt.labelTl.split('·')[0].trim(),
    labelEn: opt.labelEn.split('·')[0].trim(),
    startMinute,
    endMinute,
  };

  const moment = buildWakeUpResultMoment(state, choiceId, endMinute);

  return signSaveData({
    ...state,
    minuteOfDay: endMinute,
    hasWokenUpToday: true,
    currentMoment: moment,
    dayActions: [...(state.dayActions ?? []), block],
    stats: nextStats,
  });
}

export function performDailyAction(
  state: SaveData,
  actId: WeeklyActionId
): DailyActionResult | null {
  const cfg = WEEKLY_ACTIONS.find((a) => a.id === actId);
  if (!cfg) return null;

  const check = canPerformDailyAction(state, actId);
  if (!check.allowed) return null;

  const startMinute = clamp(state.minuteOfDay ?? DAY_START_MINUTE, DAY_START_MINUTE, DAY_END_MINUTE);
  const durationMins = Math.round(cfg.durationHours * 60);
  const endMinute = Math.min(DAY_END_MINUTE, startMinute + durationMins);
  const isHardcore = state.profile.difficulty === 'hardcore';
  const weekday = getWeekdayInfo(state.totalWeeks);
  const cal = getCalendarDayInfo(state.dayOfYear ?? state.totalWeeks, state.totalWeeks);
  const countToday = (state.dayActions ?? []).filter((b) => b.actionId === actId).length;
  const livesAtHome = !state.chapter.startsWith('college') || !state.profile.isProvincial;

  let eMod = cfg.energyDelta;
  let mMod = cfg.mentalDelta;
  let gMod = cfg.gwaDelta;
  let moneyMod = cfg.moneyDelta;

  // Realistic home-cooked savings vs boarding carinderia meals
  if (actId === 'eat_meal' && livesAtHome && (startMinute < 630 || startMinute >= 1080)) {
    moneyMod = -15; // Tipid bahay meal
  }

  // Realistic Philippine weather modifiers
  if (cal.weather === 'rainy' && actId === 'attend_class') {
    moneyMod -= 15; // Extra tricycle/payong commute
  } else if (cal.weather === 'hot' && actId === 'work') {
    eMod -= 2; // Summer heat fatigue
  } else if (cal.weather === 'breezy' && (actId === 'socialize' || actId === 'rest')) {
    mMod += 2; // Cool Amihan comfort
  }

  // Anti-loophole diminishing returns on repeated actions in the same day
  if (actId === 'work' && state.workJobsCompletedThisWeek >= 1) {
    moneyMod = Math.round(moneyMod * 0.8); // -20% overtime fatigue pay
    eMod -= 4;
  }
  if (actId === 'study' && countToday >= 1) {
    gMod = Number((gMod * 0.65).toFixed(2));
    mMod -= 3;
  }
  if (actId === 'rest' && countToday >= 1) {
    eMod = Math.round(eMod * 0.6);
    mMod = Math.round(mMod * 0.65);
  }
  if (actId === 'eat_meal' && countToday >= 2) {
    eMod = Math.round(eMod * 0.7);
  }

  if (isHardcore && eMod < 0) {
    eMod = Math.round(eMod * 1.15);
  }
  if (state.profile.course === 'Criminology' && eMod < 0) {
    eMod = Math.round(eMod * 0.9);
  }
  if ((state.profile.course === 'Psychology' || state.profile.strand === 'GAS') && mMod < 0) {
    mMod = Math.round(mMod * 0.8);
  }
  if (actId === 'study' && state.flags.includes('has_org_reviewers')) {
    gMod -= 0.02;
  }
  if (actId === 'work' && weekday.isWeekend && moneyMod > 0) {
    moneyMod = Math.round(moneyMod * 1.15);
  }
  if (startMinute >= 1320 && eMod < 0) {
    eMod -= 4;
  }

  const nextStats: GameStats = {
    ...state.stats,
    money: Math.max(-state.stats.debtLimit, Math.round(state.stats.money + moneyMod)),
    energy: clamp(Math.round(state.stats.energy + eMod), 0, 100),
    mental: clamp(Math.round(state.stats.mental + mMod), 0, 100),
    social: clamp(Math.round(state.stats.social + cfg.socialDelta), 0, 100),
    gwa: roundGwa(state.stats.gwa + gMod),
  };

  const nextRelationships = { ...state.relationships };
  if (actId === 'attend_class') {
    nextRelationships.prof_reyes = clamp((nextRelationships.prof_reyes ?? 0) + 2, 0, 100);
  } else if (actId === 'socialize') {
    nextRelationships.miggy = clamp((nextRelationships.miggy ?? 0) + 4, 0, 100);
    nextRelationships.bea = clamp((nextRelationships.bea ?? 0) + 3, 0, 100);
    nextRelationships.crush = clamp((nextRelationships.crush ?? 0) + 3, 0, 100);
  } else if (actId === 'org') {
    nextRelationships.carlo = clamp((nextRelationships.carlo ?? 0) + 5, 0, 100);
  } else if (actId === 'family') {
    nextRelationships.family = clamp((nextRelationships.family ?? 0) + 5, 0, 100);
  } else if (actId === 'work') {
    nextRelationships.aling_nena = clamp((nextRelationships.aling_nena ?? 0) + 2, 0, 100);
  }

  const mealLabel = actId === 'eat_meal' ? getMealLabelForTime(startMinute) : null;
  const block: DailyScheduleBlock = {
    id: `blk_${Date.now()}_${(state.dayActions?.length ?? 0) + 1}`,
    actionId: actId,
    label: mealLabel ? mealLabel.tl : cfg.label,
    labelEn: mealLabel ? mealLabel.en : cfg.labelEn,
    startMinute,
    endMinute,
  };

  const subjects = state.subjects.map((sub, i) => ({
    ...sub,
    grade: roundGwa(nextStats.gwa + ((i % 3) - 1) * 0.08),
  }));

  const moment = buildActionMoment(state, actId, startMinute, endMinute);

  const nextState = signSaveData({
    ...state,
    minuteOfDay: endMinute,
    hasWokenUpToday: true,
    currentMoment: moment,
    dayActions: [...(state.dayActions ?? []), block],
    pendingWeeklyActions: [...state.pendingWeeklyActions, actId],
    workJobsCompletedThisWeek:
      actId === 'work' ? state.workJobsCompletedThisWeek + 1 : state.workJobsCompletedThisWeek,
    stats: nextStats,
    subjects,
    relationships: nextRelationships,
  });

  return {
    nextState,
    block,
    reachedMidnight: endMinute >= DAY_END_MINUTE,
  };
}

export interface WeekResolutionSummary {
  nextState: SaveData;
  allowanceReceived: number;
  livingCosts: number;
  debtInterest: number;
  sleepBonus: number;
  absentPenalty: boolean;
  scholarshipAlert: 'maintained' | 'lost' | null;
  challengeCompleted?: WeeklyChallenge | null;
}

export function finishDayAndAdvance(state: SaveData): WeekResolutionSummary {
  const fam =
    FAMILY_BACKGROUNDS.find((f) => f.id === state.profile.familyBg) ?? FAMILY_BACKGROUNDS[2];
  const town =
    HOMETOWN_OPTIONS.find((h) => h.id === state.profile.hometown) ?? HOMETOWN_OPTIONS[0];
  const isCollege = state.chapter.startsWith('college');
  const isHardcore = state.profile.difficulty === 'hardcore';
  const actionsDoneToday = state.pendingWeeklyActions.length;

  const sleepMeta = getSleepBonus(state.minuteOfDay ?? DAY_START_MINUTE, actionsDoneToday);
  const sleepBonus = sleepMeta.energyBonus;
  const absentPenalty = sleepMeta.isAbsentSkip;

  const stipend = state.scholarship?.active ? state.scholarship.weeklyStipend : 0;
  const rawBaseAllowance = isHardcore
    ? Math.round(fam.weeklyAllowance * 0.85)
    : fam.weeklyAllowance;
  // Anti-sleep-spam: skipping the day in the morning with 0 actions cuts daily baon by 50%
  const allowanceReceived = absentPenalty
    ? Math.round((rawBaseAllowance + stipend) * 0.5)
    : rawBaseAllowance + stipend;

  const boardCost = isCollege && town.isProvincial ? town.weeklyBoardCost : 0;
  const discountFromNena = state.relationships.aling_nena >= 65 ? 70 : 0;
  const rawLiving = Math.max(95, town.farePerWeek + boardCost - discountFromNena);
  const livingCosts = isHardcore ? Math.round(rawLiving * 1.2) : rawLiving;

  // Daily utang interest penalty when ending the day in negative cash
  const debtInterest =
    state.stats.money < 0
      ? Math.max(25, Math.round(Math.abs(state.stats.money) * 0.05))
      : 0;

  // Advance 365-day Philippine School Year Calendar (Jun 1 = Day 1 .. May 31 = Day 365)
  const currentDayOfYear = normalizeDayOfYear(state.dayOfYear ?? 1);
  let nextDayOfYear = currentDayOfYear + 1;
  let nextChapter = state.chapter;
  let semesterEnded = false;

  if (currentDayOfYear === SEM1_DAYS) {
    // Crossing Day 182 -> Day 183 ends Semester 1
    semesterEnded = true;
  } else if (nextDayOfYear > DAYS_PER_YEAR) {
    // Crossing Day 365 -> Day 1 ends Semester 2 and advances School Year
    semesterEnded = true;
    nextDayOfYear = 1;
    const curIdx = CHAPTER_ORDER.indexOf(state.chapter);
    if (curIdx >= 0 && curIdx < CHAPTER_ORDER.length - 1) {
      nextChapter = CHAPTER_ORDER[curIdx + 1];
    }
  }

  const semInfo = getSemesterAndPeriodFromDay(nextDayOfYear);
  const nextSemester = semInfo.semester;
  const nextWeek = semInfo.week;

  const nextStats: GameStats = {
    ...state.stats,
    money: Math.max(
      -state.stats.debtLimit,
      Math.round(state.stats.money + allowanceReceived - livingCosts - debtInterest)
    ),
    energy: clamp(Math.round(state.stats.energy + sleepBonus), 0, 100),
    mental: clamp(
      Math.round(
        state.stats.mental +
          (sleepBonus > 0 ? 4 : -3) -
          (debtInterest > 0 ? 4 : 0)
      ),
      0,
      100
    ),
    gwa: absentPenalty ? roundGwa(state.stats.gwa + 0.08) : state.stats.gwa,
  };

  let scholarship = state.scholarship;
  const flagSet = new Set(state.flags);
  const journal = [...state.journal];
  let scholarshipAlert: 'maintained' | 'lost' | null = null;

  if (semesterEnded && scholarship?.active) {
    if (nextStats.gwa <= scholarship.minGwa) {
      scholarshipAlert = 'maintained';
      journal.unshift({
        id: `j_sch_ok_${Date.now()}`,
        dateLabel: formatDateLabel(state.chapter, state.semester, state.week, currentDayOfYear),
        title: 'Scholarship Maintained!',
        titleEn: 'Scholarship Maintained!',
        summary: `Naabot mo ang maintaining GWA (${nextStats.gwa.toFixed(2)} ≤ ${scholarship.minGwa.toFixed(2)}) para sa ${scholarship.name}!`,
        summaryEn: `Met the maintaining GWA (${nextStats.gwa.toFixed(2)} ≤ ${scholarship.minGwa.toFixed(2)}) for ${scholarship.name}!`,
        category: 'milestone',
      });
    } else {
      scholarshipAlert = 'lost';
      scholarship = { ...scholarship, active: false };
      flagSet.delete('active_scholar');
      flagSet.add('scholarship_lost');
      journal.unshift({
        id: `j_sch_lost_${Date.now()}`,
        dateLabel: formatDateLabel(state.chapter, state.semester, state.week, currentDayOfYear),
        title: 'Scholarship Lost',
        titleEn: 'Scholarship Lost',
        summary: `Lumagpas ang GWA mo (${nextStats.gwa.toFixed(2)}) sa required na ${scholarship.minGwa.toFixed(2)}. Kailangan bumawi sa raket o mag-apply ulit.`,
        summaryEn: `Your GWA (${nextStats.gwa.toFixed(2)}) missed the ${scholarship.minGwa.toFixed(2)} cutoff. Time to hustle or re-apply.`,
        category: 'crisis',
      });
    }
  }

  const todayActions = state.pendingWeeklyActions;
  const studyActions = todayActions.filter((a) => a === 'study' || a === 'attend_class').length;
  const nextStudyStreak = studyActions > 0 ? (state.studyStreak ?? 0) + 1 : 0;
  if (nextStudyStreak >= 3) {
    nextStats.gwa = roundGwa(nextStats.gwa - 0.03);
  }

  let challengeCompleted: WeeklyChallenge | null = null;
  let challengesCompleted = state.challengesCompleted ?? 0;
  const activeChallenge = state.activeChallenge ?? null;
  if (activeChallenge && !activeChallenge.completed) {
    let met = false;
    switch (activeChallenge.kind) {
      case 'gwa_lte':
        met = nextStats.gwa <= activeChallenge.target;
        break;
      case 'money_gte':
        met = nextStats.money >= activeChallenge.target;
        break;
      case 'energy_mental_gte':
        met = nextStats.energy >= activeChallenge.target && nextStats.mental >= activeChallenge.target;
        break;
      case 'social_gte':
        met = nextStats.social >= activeChallenge.target;
        break;
      case 'work_shift':
        met = state.workJobsCompletedThisWeek >= activeChallenge.target || todayActions.includes('work');
        break;
      case 'study_two':
        met = studyActions >= activeChallenge.target;
        break;
    }
    if (met) {
      challengeCompleted = { ...activeChallenge, completed: true };
      challengesCompleted += 1;
      nextStats.money = Math.max(
        -state.stats.debtLimit,
        nextStats.money + activeChallenge.rewardMoney
      );
      nextStats.mental = clamp(nextStats.mental + activeChallenge.rewardMental, 0, 100);
      if (activeChallenge.rewardGwa) {
        nextStats.gwa = roundGwa(nextStats.gwa + activeChallenge.rewardGwa);
      }
      journal.unshift({
        id: `j_chal_${Date.now()}`,
        dateLabel: formatDateLabel(state.chapter, state.semester, state.week, currentDayOfYear),
        title: `Challenge Clear: ${activeChallenge.title}`,
        titleEn: `Challenge Clear: ${activeChallenge.titleEn}`,
        summary: `Naabot mo ang daily goal! Reward: +₱${activeChallenge.rewardMoney}, +${activeChallenge.rewardMental} Mental Health.`,
        summaryEn: `Completed the daily challenge! Reward: +₱${activeChallenge.rewardMoney}, +${activeChallenge.rewardMental} Mental Health.`,
        category: 'milestone',
      });
    }
  }

  const subjects = buildSubjectsForStage(
    nextChapter,
    state.profile.strand,
    state.profile.course,
    nextStats.gwa
  );

  const nextSaveBase: SaveData = {
    ...state,
    chapter: nextChapter,
    semester: nextSemester,
    week: nextWeek,
    dayOfYear: nextDayOfYear,
    totalWeeks: state.totalWeeks + 1,
    minuteOfDay: DAY_START_MINUTE,
    dayBeat: 'wake_up',
    dayContextTags: [],
    hasWokenUpToday: false,
    currentMoment: null,
    dayActions: [],
    stats: nextStats,
    subjects,
    scholarship,
    flags: Array.from(flagSet),
    journal,
    pendingWeeklyActions: [],
    workJobsCompletedThisWeek: 0,
    activeChallenge: pickWeeklyChallenge(state.totalWeeks + 1),
    challengesCompleted,
    studyStreak: nextStudyStreak,
  };
  nextSaveBase.currentMoment = buildMorningWakeUpMoment(nextSaveBase);

  return {
    nextState: signSaveData(nextSaveBase),
    allowanceReceived,
    livingCosts,
    debtInterest,
    sleepBonus,
    absentPenalty,
    scholarshipAlert,
    challengeCompleted,
  };
}

export function shouldTriggerStoryEventOnNewDay(prev: SaveData, next: SaveData): boolean {
  if (next.stats.energy <= 0 || next.stats.mental <= 0) return true;
  if (prev.chapter !== next.chapter || prev.semester !== next.semester || prev.week !== next.week) {
    return true;
  }
  const cal = getCalendarDayInfo(next.dayOfYear ?? 1, next.totalWeeks);
  if (cal.specialDayTl) return true;
  return next.totalWeeks % 3 === 0;
}

export function resolveWeeklyPlan(
  state: SaveData,
  actions: WeeklyActionId[]
): WeekResolutionSummary {
  let working = state;
  for (const actId of actions) {
    const res = performDailyAction(working, actId);
    if (res) {
      working = res.nextState;
    }
  }
  return finishDayAndAdvance(working);
}

export function selectNextEvent(
  state: SaveData,
  allNodes: StoryNode[],
  rng: () => number = Math.random
): StoryNode | null {
  // 1. Crisis checks take absolute precedence
  if (state.stats.energy <= 0) {
    const crisis = allNodes.find((n) => n.id === 'crisis_energy_collapse');
    if (crisis) return crisis;
  }
  if (state.stats.mental <= 0) {
    const crisis = allNodes.find((n) => n.id === 'crisis_mental_burnout');
    if (crisis) return crisis;
  }

  const visited = new Set(state.visitedNodes);

  // 2. Exact Milestone for current (chapter, semester, week)
  const milestone = allNodes.find(
    (n) =>
      n.milestoneWeek &&
      n.milestoneWeek.chapter === state.chapter &&
      n.milestoneWeek.semester === state.semester &&
      n.milestoneWeek.week === state.week &&
      !(n.once && visited.has(n.id)) &&
      evaluateConditions(n.conditions, state)
  );
  if (milestone) return milestone;

  // 3. Weighted pool from current chapter (non-milestone), course arcs, side arcs, and random pool
  const eligible = allNodes.filter((n) => {
    if (n.chapter === 'crisis' || n.chapter === 'prologue') return false;
    if (n.milestoneWeek) return false;
    if (n.once && visited.has(n.id)) return false;

    const validChapterBucket =
      n.chapter === state.chapter ||
      n.chapter === 'random' ||
      n.chapter === 'side' ||
      n.chapter === 'course';
    if (!validChapterBucket) return false;

    return evaluateConditions(n.conditions, state);
  });

  if (eligible.length === 0) {
    // Fallback to any non-once random event
    const fallback = allNodes.filter((n) => n.chapter === 'random');
    if (fallback.length === 0) return null;
    return fallback[Math.floor(rng() * fallback.length)];
  }

  const totalWeight = eligible.reduce((sum, n) => sum + (n.weight ?? 1), 0);
  let pick = rng() * totalWeight;
  for (const node of eligible) {
    pick -= node.weight ?? 1;
    if (pick <= 0) return node;
  }
  return eligible[eligible.length - 1];
}

export function evaluateEnding(
  state: SaveData,
  endings: EndingDefinition[],
  forcedEndingId?: string
): EndingDefinition {
  if (forcedEndingId && forcedEndingId !== 'AUTO') {
    const forced = endings.find((e) => e.id === forcedEndingId);
    if (forced) return forced;
  }

  const sorted = [...endings].sort((a, b) => b.priority - a.priority);
  for (const ending of sorted) {
    if (!ending.conditions) continue;
    if (evaluateConditions(ending.conditions, state)) {
      return ending;
    }
  }

  // Fallback ending if player graduated cleanly with moderate stats
  return (
    endings.find((e) => e.id === 'graduate_with_debts') ??
    endings[0]
  );
}

export function isMinigameUnlocked(minigameId: MinigameId, state: SaveData): boolean {
  if (minigameId === 'freelance') {
    const techOrBizStrand = state.profile.strand === 'TVL-ICT' || state.profile.strand === 'ABM';
    const techOrBizCourse =
      state.profile.course === 'BSIT' ||
      state.profile.course === 'BSCS' ||
      state.profile.course === 'BSBA';
    const hasFlag =
      state.flags.includes('owns_laptop') ||
      state.flags.includes('ict_freelancer') ||
      state.flags.includes('abm_bookkeeper');
    return techOrBizStrand || techOrBizCourse || hasFlag;
  }
  if (minigameId === 'scholarship') {
    return state.stats.gwa <= 2.25;
  }
  return true;
}

export function canStartMinigame(
  minigameId: MinigameId,
  state: SaveData,
  fromStoryEvent: boolean = false
): ActionAvailability {
  const cfg = MINIGAME_CONFIGS.find((m) => m.id === minigameId);
  if (!cfg) return { allowed: false, reasonTl: 'Invalid job', reasonEn: 'Invalid job' };

  if (!isMinigameUnlocked(minigameId, state)) {
    return {
      allowed: false,
      reasonTl: cfg.unlockHint ?? 'Locked',
      reasonEn: cfg.unlockHintEn ?? 'Locked',
    };
  }

  if (minigameId === 'scholarship') {
    if (state.scholarship?.active) {
      return {
        allowed: false,
        reasonTl: 'May active scholarship ka na!',
        reasonEn: 'You already hold an active scholarship!',
      };
    }
    const semFlag = getScholarshipSemesterFlag(state.chapter, state.semester);
    if (state.flags.includes(semFlag)) {
      return {
        allowed: false,
        reasonTl: 'Nag-apply ka na ngayong semester (1×/sem)',
        reasonEn: 'Already applied this semester (1×/sem)',
      };
    }
  } else if (!fromStoryEvent && state.workJobsCompletedThisWeek >= MAX_PAID_SHIFTS_PER_DAY) {
    return {
      allowed: false,
      reasonTl: `Max ${MAX_PAID_SHIFTS_PER_DAY} raket shifts/day naabot na`,
      reasonEn: `Daily cap reached (${MAX_PAID_SHIFTS_PER_DAY} shifts/day)`,
    };
  }

  if (state.stats.energy < cfg.energyCost) {
    return {
      allowed: false,
      reasonTl: `Kulang sa Energy (${cfg.energyCost} kailangan)`,
      reasonEn: `Not enough Energy (${cfg.energyCost} required)`,
    };
  }

  if (!fromStoryEvent) {
    const startMin = state.minuteOfDay ?? DAY_START_MINUTE;
    if (startMin + 120 > DAY_END_MINUTE) {
      return {
        allowed: false,
        reasonTl: 'Kulang sa oras (2h shift bago 12:00 AM)',
        reasonEn: 'Not enough hours left (2h needed before 12:00 AM)',
      };
    }
  }

  return { allowed: true };
}

export function computeMinigamePayout(
  minigameId: MinigameId,
  scoreRatio: number, // 0.0 to 1.0
  state: SaveData
): { payout: number; bonusLabel?: string } {
  const cfg = MINIGAME_CONFIGS.find((m) => m.id === minigameId) ?? MINIGAME_CONFIGS[0];
  const clamped = clamp(Number.isFinite(scoreRatio) ? scoreRatio : 0, 0, 1);

  let pay: number;
  let bonusLabel: string | undefined;

  if (clamped < 0.35 && minigameId !== 'scholarship') {
    // Low performance shift gets mistake deduction from boss
    pay = cfg.basePay * 0.45;
    bonusLabel = 'Low Score Deduction';
  } else {
    // Harder skill curve (ratio^1.25): requires real accuracy for top pay
    const curved = Math.pow(clamped, 1.25);
    pay = cfg.basePay + (cfg.maxPay - cfg.basePay) * curved;
  }

  if (clamped >= 0.35) {
    if (
      (minigameId === 'carinderia' || minigameId === 'fastfood') &&
      (state.profile.strand === 'TVL-HE' || state.profile.course === 'Hospitality')
    ) {
      pay *= 1.2;
      bonusLabel = '+20% Culinary/HM Bonus';
    } else if (
      minigameId === 'tutoring' &&
      (state.profile.course === 'Education' ||
        state.profile.strand === 'STEM' ||
        state.profile.course === 'Engineering')
    ) {
      pay *= 1.25;
      bonusLabel = '+25% Educ/STEM Bonus';
    } else if (
      minigameId === 'tusok' &&
      (state.profile.strand === 'ABM' ||
        state.profile.course === 'BSBA' ||
        state.profile.familyBg === 'tindera')
    ) {
      pay *= 1.2;
      bonusLabel = '+20% Business/Tindera Bonus';
    } else if (
      minigameId === 'freelance' &&
      (state.profile.course === 'BSCS' ||
        state.profile.course === 'BSIT' ||
        state.profile.strand === 'TVL-ICT')
    ) {
      pay *= 1.18;
      bonusLabel = '+18% Tech Freelance Bonus';
    }

    if (state.profile.difficulty === 'hardcore' && clamped >= 0.75) {
      pay *= 1.2;
      bonusLabel = bonusLabel ? `${bonusLabel} + Hardcore Skill` : '+20% Hardcore Mastery';
    }
  }

  // Overtime fatigue penalty on 2nd paid shift in the same day
  if (minigameId !== 'scholarship' && state.workJobsCompletedThisWeek >= 1) {
    pay *= 0.8;
    bonusLabel = bonusLabel ? `${bonusLabel} (-20% Overtime)` : '-20% Overtime Fatigue';
  }

  return { payout: Math.round(pay), bonusLabel };
}

export function getCourseTuition(state: SaveData): number {
  const course =
    COLLEGE_COURSES.find((c) => c.id === state.profile.course) ?? COLLEGE_COURSES[0];
  const discount = state.scholarship?.active ? state.scholarship.tuitionDiscount : 0;
  const inflation = state.profile.difficulty === 'hardcore' ? 1.2 : 1.0;
  return Math.round(course.tuitionPerSem * inflation * (1 - discount));
}
