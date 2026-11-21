import { create } from 'zustand';
import {
  ALL_BASE_STORY_NODES,
  ALL_ENDINGS,
  getStoryMap,
} from '../data/story';
import {
  applyChoiceEffects,
  canStartMinigame,
  clamp,
  computeMinigamePayout,
  createInitialSave,
  evaluateEnding,
  finishDayAndAdvance,
  formatDateLabel,
  getScholarshipSemesterFlag,
  performDailyAction,
  performMorningWakeUp,
  resolveWeeklyPlan,
  roundGwa,
  selectNextEvent,
  shouldTriggerStoryEventOnNewDay,
  signSaveData,
  verifySaveIntegrity,
} from '../engine/storyEngine';
import { buildMorningWakeUpMoment } from '../engine/dailyScenes';
import { soundFX } from '../engine/audio';
import {
  DAY_END_MINUTE,
  DAY_START_MINUTE,
  DAYS_PER_YEAR,
  MINIGAME_CONFIGS,
  getDefaultAppearance,
} from '../data/config';
import type {
  CharacterAppearance,
  DailyScheduleBlock,
  GameSettings,
  MinigameId,
  NpcId,
  PlayerProfile,
  SaveData,
  SchoolChapterId,
  StoryChoice,
  StoryNode,
  WakeUpChoiceId,
  WeeklyActionId,
} from '../types/game';

const STORAGE_KEYS = {
  AUTOSAVE: 'barya_lang_autosave_v1',
  SLOT_PREFIX: 'barya_lang_slot_v1_',
  ENDINGS: 'barya_lang_endings_v1',
  SETTINGS: 'barya_lang_settings_v1',
  CUSTOM_NODES: 'barya_lang_custom_nodes_v1',
};

export type AppScreen =
  | 'title'
  | 'char_create'
  | 'playing'
  | 'gallery'
  | 'editor';

export type PlayPanelTab =
  | 'scene'
  | 'stats'
  | 'relationships'
  | 'journal'
  | 'saves'
  | 'settings';

export interface SaveSlotMeta {
  slot: 1 | 2 | 3;
  data: SaveData | null;
}

export interface StatDeltaFeedback {
  id: number;
  money?: number;
  energy?: number;
  mental?: number;
  social?: number;
  gwa?: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  language: 'taglish',
  textSpeed: 'normal',
  bgmVolume: 0.28,
  sfxVolume: 0.55,
  bgmStyle: 'lofi',
  rainAmbience: false,
  clockSpeed: 1,
  debugMode: false,
};

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, val: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore storage quota issues gracefully
  }
}

function readManualSlots(): SaveSlotMeta[] {
  return ([1, 2, 3] as const).map((slot) => ({
    slot,
    data: safeReadJson<SaveData | null>(`${STORAGE_KEYS.SLOT_PREFIX}${slot}`, null),
  }));
}

function computeStatDelta(before: SaveData, after: SaveData): StatDeltaFeedback | null {
  const money = Math.round(after.stats.money - before.stats.money);
  const energy = Math.round(after.stats.energy - before.stats.energy);
  const mental = Math.round(after.stats.mental - before.stats.mental);
  const social = Math.round(after.stats.social - before.stats.social);
  const gwa = Number((after.stats.gwa - before.stats.gwa).toFixed(2));
  if (!money && !energy && !mental && !social && !gwa) return null;
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    money: money || undefined,
    energy: energy || undefined,
    mental: mental || undefined,
    social: social || undefined,
    gwa: gwa || undefined,
  };
}

function pickMoodForNode(node: StoryNode | null | undefined): 'chill' | 'rainy' {
  if (!node) return 'chill';
  if (
    node.scene.background === 'bg_rainy_flood' ||
    node.id.startsWith('crisis_') ||
    node.id.includes('typhoon') ||
    node.id.includes('rain')
  ) {
    return 'rainy';
  }
  return 'chill';
}

function sanitizeTamperedSave(raw: SaveData): SaveData {
  const debtLimit = clamp(Math.round(raw.stats?.debtLimit ?? 3600), 1500, 6000);
  const clamped: SaveData = {
    ...raw,
    cheated: true,
    flags: Array.from(new Set([...(raw.flags ?? []), 'tampered_save'])),
    week: clamp(Math.round(raw.week ?? 1), 1, 8),
    dayOfYear: clamp(Math.round(raw.dayOfYear ?? 1), 1, DAYS_PER_YEAR),
    totalWeeks: clamp(Math.round(raw.totalWeeks ?? 1), 1, 2500),
    stats: {
      money: clamp(Math.round(raw.stats?.money ?? 500), -debtLimit, 15000),
      debtLimit,
      gwa: roundGwa(raw.stats?.gwa ?? 2.25),
      energy: clamp(Math.round(raw.stats?.energy ?? 60), 0, 100),
      mental: clamp(Math.round(raw.stats?.mental ?? 60), 0, 100),
      social: clamp(Math.round(raw.stats?.social ?? 50), 0, 100),
    },
  };
  return signSaveData(clamped);
}

interface LastWeekFeedback {
  allowanceReceived: number;
  livingCosts: number;
  debtInterest: number;
  sleepBonus: number;
  absentPenalty: boolean;
  scholarshipAlert: 'maintained' | 'lost' | null;
  challengeCompleted: boolean;
  actions: WeeklyActionId[];
}

interface GameStoreState {
  screen: AppScreen;
  activeTab: PlayPanelTab;
  save: SaveData | null;
  settings: GameSettings;
  unlockedEndings: string[];
  manualSlots: SaveSlotMeta[];
  customNodes: StoryNode[];
  hasAutoSave: boolean;
  lastWeekFeedback: LastWeekFeedback | null;
  lastStatDeltas: StatDeltaFeedback | null;
  toastMessage: string | null;

  // Navigation
  setScreen: (screen: AppScreen) => void;
  setActiveTab: (tab: PlayPanelTab) => void;
  showToast: (msg: string) => void;

  // New Game / Continue
  startNewGame: (profile: PlayerProfile) => void;
  startAutostartDemo: () => void;
  continueAutoSave: () => void;
  updateProfileAppearance: (appearance: CharacterAppearance) => void;

  // Story & Daily 24h Core Loop
  getAllNodes: () => StoryNode[];
  getCurrentNode: () => StoryNode | null;
  chooseStoryChoice: (choice: StoryChoice) => void;
  startMinigame: (id: MinigameId) => void;
  completeMinigame: (id: MinigameId, scoreRatio: number, passedScholarship?: boolean) => void;
  cancelMinigame: () => void;
  tickDayClock: (deltaMinutes: number) => void;
  doMorningWakeUp: (choiceId: WakeUpChoiceId) => void;
  doDailyAction: (actionId: WeeklyActionId) => { reachedMidnight: boolean } | null;
  finishCurrentDay: () => void;
  commitWeeklyPlan: (actions: WeeklyActionId[]) => void;

  // Saves & Export/Import
  saveToSlot: (slot: 1 | 2 | 3) => void;
  loadFromSlot: (slot: 1 | 2 | 3) => void;
  deleteSlot: (slot: 1 | 2 | 3) => void;
  exportSaveJson: () => string | null;
  importSaveJson: (raw: string) => boolean;
  resetAllSaves: () => void;

  // Settings
  updateSettings: (partial: Partial<GameSettings>) => void;

  // Debug Tools
  debugJumpToNode: (nodeId: string) => void;
  debugJumpToChapter: (chapter: SchoolChapterId) => void;
  debugAdjustStat: (stat: keyof SaveData['stats'], delta: number) => void;
  debugToggleFlag: (flag: string) => void;
  debugForceRandomEvent: () => void;
  debugTriggerEnding: (endingId: string) => void;

  // Story Editor
  saveCustomNode: (node: StoryNode) => void;
  deleteCustomNode: (nodeId: string) => void;
  exportAllNodesJson: () => string;
}

const initialAutoSave = safeReadJson<SaveData | null>(STORAGE_KEYS.AUTOSAVE, null);
const initialSettings: GameSettings = {
  ...DEFAULT_SETTINGS,
  ...safeReadJson<Partial<GameSettings>>(STORAGE_KEYS.SETTINGS, {}),
};
const initialEndings = safeReadJson<string[]>(STORAGE_KEYS.ENDINGS, []);
const initialCustomNodes = safeReadJson<StoryNode[]>(STORAGE_KEYS.CUSTOM_NODES, []);

export const useGameStore = create<GameStoreState>((set, get) => ({
  screen: 'title',
  activeTab: 'scene',
  save: initialAutoSave,
  settings: initialSettings,
  unlockedEndings: initialEndings,
  manualSlots: readManualSlots(),
  customNodes: initialCustomNodes,
  hasAutoSave: !!initialAutoSave,
  lastWeekFeedback: null,
  lastStatDeltas: null,
  toastMessage: null,

  setScreen: (screen) => set({ screen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  showToast: (msg) => {
    set({ toastMessage: msg });
    window.setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 3400);
  },

  startNewGame: (profile) => {
    const fresh = createInitialSave(profile);
    const { settings } = get();
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, fresh);
    soundFX.setBgmStyle(settings.bgmStyle ?? 'lofi');
    soundFX.setRainAmbience(Boolean(settings.rainAmbience));
    soundFX.unlockAndStart('chill');
    soundFX.playSuccess();
    set({
      save: fresh,
      hasAutoSave: true,
      screen: 'playing',
      activeTab: 'scene',
      lastWeekFeedback: null,
      lastStatDeltas: null,
    });
  },

  startAutostartDemo: () => {
    const demoProfile: PlayerProfile = {
      name: 'Marco',
      gender: 'male',
      hometown: 'Pangasinan',
      isProvincial: true,
      familyBg: 'tindera',
      strand: 'TVL-ICT',
      course: 'BSIT',
      difficulty: 'classic',
      appearance: getDefaultAppearance('male'),
    };
    const fresh = createInitialSave(demoProfile);
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, fresh);
    set({
      save: fresh,
      hasAutoSave: true,
      screen: 'playing',
      activeTab: 'scene',
      lastWeekFeedback: null,
      lastStatDeltas: null,
    });
  },

  continueAutoSave: () => {
    const raw = safeReadJson<SaveData | null>(STORAGE_KEYS.AUTOSAVE, null);
    if (!raw) return;
    const check = verifySaveIntegrity(raw);
    const existing = check.valid ? raw : sanitizeTamperedSave(raw);
    if (!check.valid) {
      safeWriteJson(STORAGE_KEYS.AUTOSAVE, existing);
    }
    const { settings } = get();
    soundFX.setBgmStyle(settings.bgmStyle ?? 'lofi');
    soundFX.setRainAmbience(Boolean(settings.rainAmbience));
    soundFX.unlockAndStart('chill');
    soundFX.playClick();
    set({
      save: existing,
      hasAutoSave: true,
      screen: 'playing',
      activeTab: 'scene',
    });
    if (!check.valid) {
      get().showToast('Save tampering detected — switched to Sandbox mode (Endings locked).');
    }
  },

  updateProfileAppearance: (appearance) => {
    const { save } = get();
    if (!save) return;
    const updated = signSaveData({
      ...save,
      profile: {
        ...save.profile,
        appearance,
      },
      savedAt: new Date().toISOString(),
    });
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    soundFX.playSuccess();
    set({ save: updated });
    get().showToast(
      get().settings.language === 'taglish'
        ? 'Updated na ang look ng karakter mo!'
        : 'Character appearance updated!'
    );
  },

  getAllNodes: () => {
    const custom = get().customNodes;
    if (custom.length === 0) return ALL_BASE_STORY_NODES;
    const map = getStoryMap(custom);
    return Array.from(map.values());
  },

  getCurrentNode: () => {
    const { save, customNodes } = get();
    if (!save?.currentNodeId) return null;
    return getStoryMap(customNodes).get(save.currentNodeId) ?? null;
  },

  chooseStoryChoice: (choice) => {
    const { save, customNodes, unlockedEndings } = get();
    if (!save || save.phase !== 'vn' || !save.currentNodeId) return;

    soundFX.playPageTurn();
    let updated = applyChoiceEffects(save, choice.effects);
    const delta = computeStatDelta(save, updated);
    const visited = new Set(updated.visitedNodes);
    if (save.currentNodeId) visited.add(save.currentNodeId);
    updated = {
      ...updated,
      visitedNodes: Array.from(visited),
      savedAt: new Date().toISOString(),
    };

    if (choice.triggerMinigame) {
      updated = signSaveData({
        ...updated,
        phase: 'minigame',
        pendingMinigameId: choice.triggerMinigame,
        currentNodeId: choice.next && choice.next !== 'PLANNER' ? choice.next : null,
      });
      safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
      soundFX.unlockAndStart('minigame');
      set({ save: updated, activeTab: 'scene', lastStatDeltas: delta });
      return;
    }

    if (choice.next?.startsWith('END:')) {
      const target = choice.next.slice(4);
      const ending = evaluateEnding(updated, ALL_ENDINGS, target);
      const canUnlock = !updated.cheated;
      const nextUnlocked =
        canUnlock && !unlockedEndings.includes(ending.id)
          ? [...unlockedEndings, ending.id]
          : unlockedEndings;
      if (canUnlock) {
        safeWriteJson(STORAGE_KEYS.ENDINGS, nextUnlocked);
      }
      updated = signSaveData({
        ...updated,
        phase: 'ending',
        activeEndingId: ending.id,
        currentNodeId: null,
      });
      safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
      soundFX.playFanfare();
      set({ save: updated, unlockedEndings: nextUnlocked, activeTab: 'scene', lastStatDeltas: delta });
      return;
    }

    if (!choice.next || choice.next === 'PLANNER') {
      updated = signSaveData({
        ...updated,
        phase: 'planner',
        currentNodeId: null,
      });
      safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
      soundFX.unlockAndStart('chill');
      set({ save: updated, activeTab: 'scene', lastStatDeltas: delta });
      return;
    }

    const nextNode = getStoryMap(customNodes).get(choice.next);
    if (nextNode) {
      updated = signSaveData({
        ...updated,
        phase: 'vn',
        currentNodeId: nextNode.id,
      });
      soundFX.unlockAndStart(pickMoodForNode(nextNode));
    } else {
      updated = signSaveData({
        ...updated,
        phase: 'planner',
        currentNodeId: null,
      });
      soundFX.unlockAndStart('chill');
    }
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    set({ save: updated, activeTab: 'scene', lastStatDeltas: delta });
  },

  startMinigame: (id) => {
    const { save, settings } = get();
    if (!save || save.phase !== 'planner') return;
    const gate = canStartMinigame(id, save, false);
    if (!gate.allowed) {
      soundFX.playError();
      get().showToast(
        (settings.language === 'taglish' ? gate.reasonTl : gate.reasonEn) ?? 'Not available right now.'
      );
      return;
    }
    soundFX.unlockAndStart('minigame');
    const updated = signSaveData({
      ...save,
      phase: 'minigame',
      pendingMinigameId: id,
    });
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    set({ save: updated, activeTab: 'scene' });
  },

  completeMinigame: (id, scoreRatio, passedScholarship) => {
    const { save } = get();
    if (!save || save.phase !== 'minigame' || save.pendingMinigameId !== id) return;

    const cfg = MINIGAME_CONFIGS.find((m) => m.id === id) ?? MINIGAME_CONFIGS[0];
    const { payout, bonusLabel } = computeMinigamePayout(id, scoreRatio, save);
    const overtimeExtraEnergy = id !== 'scholarship' && save.workJobsCompletedThisWeek >= 1 ? 4 : 0;
    const energyCost = cfg.energyCost + overtimeExtraEnergy;

    const flagsToAdd: string[] = [];
    if (id === 'tusok' && scoreRatio >= 0.5) {
      flagsToAdd.push('student_hustler');
    }
    if (id === 'freelance' && scoreRatio >= 0.5) {
      flagsToAdd.push('ict_freelancer');
    }
    if (id === 'scholarship') {
      flagsToAdd.push(getScholarshipSemesterFlag(save.chapter, save.semester));
    }

    const effects: Parameters<typeof applyChoiceEffects>[1] = {
      money: payout,
      energy: -energyCost,
      flagsAdd: flagsToAdd.length > 0 ? flagsToAdd : undefined,
      journal: {
        title: `Kumita sa ${id.toUpperCase()} (+₱${payout})`,
        titleEn: `Earned from ${id.toUpperCase()} (+₱${payout})`,
        summary: bonusLabel
          ? `Nakapag-uwi ka ng ₱${payout} (${bonusLabel}) mula sa shift mo!`
          : `Nakapag-uwi ka ng ₱${payout} mula sa part-time raket mo!`,
        summaryEn: bonusLabel
          ? `Brought home ₱${payout} (${bonusLabel}) from your shift!`
          : `Brought home ₱${payout} from your part-time hustle!`,
        category: 'job',
      },
    };

    if (id === 'scholarship' && passedScholarship) {
      effects.grantScholarship = {
        id: 'iskolar_ng_bayan',
        name: 'Iskolar ng Bayan Grant',
        minGwa: 1.75,
        weeklyStipend: 210,
        tuitionDiscount: 0.5,
        active: true,
      };
      effects.journal = {
        title: 'Nakuha ang Scholarship!',
        titleEn: 'Scholarship Awarded!',
        summary: 'Pasado ka sa Iskolar ng Bayan Grant! +₱210 daily stipend at 50% tuition discount (maintain GWA ≤ 1.75).',
        summaryEn: 'Awarded the Iskolar ng Bayan Grant! +₱210 daily stipend and 50% tuition discount (maintain GWA ≤ 1.75).',
        category: 'milestone',
      };
    }

    let updated = applyChoiceEffects(save, effects);
    const delta = computeStatDelta(save, updated);
    const curMin = updated.minuteOfDay ?? DAY_START_MINUTE;
    const endMin = Math.min(DAY_END_MINUTE, curMin + 120);
    const mgBlock: DailyScheduleBlock = {
      id: `mg_${Date.now()}`,
      actionId: 'minigame',
      label: cfg.title,
      labelEn: cfg.titleEn,
      startMinute: curMin,
      endMinute: endMin,
    };

    updated = signSaveData({
      ...updated,
      minuteOfDay: endMin,
      hasWokenUpToday: true,
      currentMoment: {
        backgroundId:
          id === 'jeepney'
            ? 'bg_jeepney_interior'
            : id === 'tutoring'
              ? 'bg_library'
              : id === 'freelance'
                ? 'bg_computer_lab'
                : id === 'scholarship'
                  ? 'bg_school_gate'
                  : 'bg_carinderia',
        playerEmotion: 'happy',
        locationTl: `Tapos sa Shift · ${cfg.title}`,
        locationEn: `Shift Complete · ${cfg.titleEn}`,
        narrationTl: `Tapos na ang 2-hour shift mo sa ${cfg.title}! Hawak mo na ang +₱${payout} na pinaghirapan mo ngayong araw.`,
        narrationEn: `Wrapped up your 2-hour ${cfg.titleEn} shift! You earned +₱${payout} through pure grit today.`,
        time12: `${String(Math.floor(endMin / 60) % 12 || 12).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')} ${endMin >= 720 && endMin < 1440 ? 'PM' : 'AM'}`,
      },
      dayActions: [...(updated.dayActions ?? []), mgBlock],
      phase: updated.currentNodeId ? 'vn' : 'planner',
      pendingMinigameId: null,
      workJobsCompletedThisWeek:
        id === 'scholarship'
          ? updated.workJobsCompletedThisWeek
          : updated.workJobsCompletedThisWeek + 1,
      savedAt: new Date().toISOString(),
    });
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    soundFX.unlockAndStart('chill');
    soundFX.playCoin();

    set({ save: updated, activeTab: 'scene', lastStatDeltas: delta });
    get().showToast(
      passedScholarship
        ? `Scholarship Granted! +₱${payout} stipend!`
        : `+₱${payout} earned!${bonusLabel ? ` (${bonusLabel})` : ''}`
    );
  },

  cancelMinigame: () => {
    const { save, settings } = get();
    if (!save || save.phase !== 'minigame') return;
    soundFX.unlockAndStart('chill');
    soundFX.playError();
    // Anti-scum walk-out penalty: aborting a shift costs 6 Energy and 30 mins
    const curMin = save.minuteOfDay ?? DAY_START_MINUTE;
    const nextMin = Math.min(DAY_END_MINUTE, curMin + 30);
    const penalized = applyChoiceEffects(save, { energy: -6 });
    const updated = signSaveData({
      ...penalized,
      minuteOfDay: nextMin,
      phase: save.currentNodeId ? 'vn' : 'planner',
      pendingMinigameId: null,
      savedAt: new Date().toISOString(),
    });
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    set({ save: updated, lastStatDeltas: computeStatDelta(save, updated) });
    get().showToast(
      settings.language === 'taglish'
        ? 'Nag-walk out sa shift (-6 EN · +30m)'
        : 'Left shift early (-6 EN · +30m)'
    );
  },

  tickDayClock: (deltaMinutes) => {
    const { save, screen } = get();
    if (!save || screen !== 'playing' || save.phase !== 'planner') return;
    // Pause ambient clock until the player finishes the morning Waking Up scene
    if (!save.hasWokenUpToday) return;
    const cur = save.minuteOfDay ?? DAY_START_MINUTE;
    const nextMin = Math.min(DAY_END_MINUTE, cur + deltaMinutes);
    if (nextMin === cur) return;
    set({
      save: {
        ...save,
        minuteOfDay: nextMin,
      },
    });
    if (nextMin >= DAY_END_MINUTE) {
      get().finishCurrentDay();
    }
  },

  doMorningWakeUp: (choiceId) => {
    const { save } = get();
    if (!save || save.phase !== 'planner' || save.hasWokenUpToday) return;
    const next = performMorningWakeUp(save, choiceId);
    if (!next) return;
    const delta = computeStatDelta(save, next);
    soundFX.playSuccess();
    const stamped = signSaveData({
      ...next,
      savedAt: new Date().toISOString(),
    });
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, stamped);
    set({ save: stamped, lastStatDeltas: delta });
  },

  doDailyAction: (actionId) => {
    const { save } = get();
    if (!save || save.phase !== 'planner') return null;

    const result = performDailyAction(save, actionId);
    if (!result) return null;

    const delta = computeStatDelta(save, result.nextState);
    if ((delta?.money ?? 0) > 0) {
      soundFX.playCoin();
    } else {
      soundFX.playClick();
    }

    const stamped = signSaveData({
      ...result.nextState,
      savedAt: new Date().toISOString(),
    });
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, stamped);
    set({ save: stamped, lastStatDeltas: delta });

    return { reachedMidnight: result.reachedMidnight };
  },

  finishCurrentDay: () => {
    const { save, customNodes, settings } = get();
    if (!save || save.phase !== 'planner') return;

    soundFX.playPageTurn();
    const actionsDone = [...save.pendingWeeklyActions];
    const {
      nextState,
      allowanceReceived,
      livingCosts,
      debtInterest,
      sleepBonus,
      absentPenalty,
      scholarshipAlert,
      challengeCompleted,
    } = finishDayAndAdvance(save);

    const delta = computeStatDelta(save, nextState);
    const shouldFireStory = shouldTriggerStoryEventOnNewDay(save, nextState);
    const allNodes = getStoryMap(customNodes);
    const nextEvent = shouldFireStory
      ? selectNextEvent(nextState, Array.from(allNodes.values()))
      : null;

    const updated = signSaveData({
      ...nextState,
      phase: nextEvent ? 'vn' : 'planner',
      currentNodeId: nextEvent ? nextEvent.id : null,
      savedAt: new Date().toISOString(),
    });

    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    soundFX.unlockAndStart(pickMoodForNode(nextEvent));

    if (challengeCompleted) {
      soundFX.playChallengeWin();
      const chTitle =
        settings.language === 'taglish'
          ? challengeCompleted.title
          : challengeCompleted.titleEn;
      get().showToast(
        `${chTitle} Cleared! +₱${challengeCompleted.rewardMoney} & +${challengeCompleted.rewardMental} MH!`
      );
    } else if (absentPenalty) {
      soundFX.playError();
      get().showToast(
        settings.language === 'taglish'
          ? 'Absent / Skip-Day Penalty: -50% Baon & +0.08 GWA!'
          : 'Skip-Day Penalty: -50% Allowance & +0.08 GWA!'
      );
    } else if (debtInterest > 0) {
      get().showToast(
        settings.language === 'taglish'
          ? `Utang Interest: -₱${debtInterest} & -4 Mental Health`
          : `Debt Interest charged: -₱${debtInterest} & -4 Mental Health`
      );
    }

    set({
      save: updated,
      activeTab: 'scene',
      lastStatDeltas: delta,
      lastWeekFeedback: {
        allowanceReceived,
        livingCosts,
        debtInterest,
        sleepBonus,
        absentPenalty,
        scholarshipAlert,
        challengeCompleted: Boolean(challengeCompleted),
        actions: actionsDone,
      },
    });
  },

  commitWeeklyPlan: (actions) => {
    const { save, customNodes, settings } = get();
    if (!save) return;

    soundFX.playClick();
    const {
      nextState,
      allowanceReceived,
      livingCosts,
      debtInterest,
      sleepBonus,
      absentPenalty,
      scholarshipAlert,
      challengeCompleted,
    } = resolveWeeklyPlan(save, actions);

    const delta = computeStatDelta(save, nextState);
    const allNodes = getStoryMap(customNodes);
    const nextEvent = selectNextEvent(nextState, Array.from(allNodes.values()));

    const updated = signSaveData({
      ...nextState,
      phase: nextEvent ? 'vn' : 'planner',
      currentNodeId: nextEvent ? nextEvent.id : null,
      savedAt: new Date().toISOString(),
    });

    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    soundFX.unlockAndStart(pickMoodForNode(nextEvent));

    if (challengeCompleted) {
      soundFX.playChallengeWin();
      const chTitle =
        settings.language === 'taglish'
          ? challengeCompleted.title
          : challengeCompleted.titleEn;
      get().showToast(
        `${chTitle} Cleared! +₱${challengeCompleted.rewardMoney} & +${challengeCompleted.rewardMental} MH!`
      );
    }

    set({
      save: updated,
      activeTab: 'scene',
      lastStatDeltas: delta,
      lastWeekFeedback: {
        allowanceReceived,
        livingCosts,
        debtInterest,
        sleepBonus,
        absentPenalty,
        scholarshipAlert,
        challengeCompleted: Boolean(challengeCompleted),
        actions,
      },
    });
  },

  saveToSlot: (slot) => {
    const { save } = get();
    if (!save) return;
    const stamped = signSaveData({
      ...save,
      savedAt: new Date().toISOString(),
      label: `${save.profile.name} · ${formatDateLabel(save.chapter, save.semester, save.week)}`,
    });
    safeWriteJson(`${STORAGE_KEYS.SLOT_PREFIX}${slot}`, stamped);
    soundFX.playSuccess();
    set({ manualSlots: readManualSlots() });
    get().showToast(`Saved to Slot ${slot}`);
  },

  loadFromSlot: (slot) => {
    const raw = safeReadJson<SaveData | null>(`${STORAGE_KEYS.SLOT_PREFIX}${slot}`, null);
    if (!raw) return;
    const check = verifySaveIntegrity(raw);
    const data = check.valid ? raw : sanitizeTamperedSave(raw);
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, data);
    soundFX.playClick();
    set({
      save: data,
      hasAutoSave: true,
      screen: 'playing',
      activeTab: 'scene',
    });
    get().showToast(
      check.valid
        ? `Loaded Slot ${slot}`
        : `Tampered Slot ${slot} detected — loaded in Sandbox mode`
    );
  },

  deleteSlot: (slot) => {
    localStorage.removeItem(`${STORAGE_KEYS.SLOT_PREFIX}${slot}`);
    set({ manualSlots: readManualSlots() });
    get().showToast(`Cleared Slot ${slot}`);
  },

  exportSaveJson: () => {
    const { save, unlockedEndings, settings } = get();
    if (!save) return null;
    return JSON.stringify({ save: signSaveData(save), unlockedEndings, settings }, null, 2);
  },

  importSaveJson: (raw) => {
    try {
      const parsed = JSON.parse(raw) as {
        save?: SaveData;
        unlockedEndings?: string[];
      };
      const candidate = parsed.save ?? (parsed as unknown as SaveData);
      const check = verifySaveIntegrity(candidate);
      if (!check.valid) {
        soundFX.playError();
        get().showToast(`Anti-Cheat: ${check.reason ?? 'Tampered save rejected.'}`);
        return false;
      }
      const signed = signSaveData(candidate);
      safeWriteJson(STORAGE_KEYS.AUTOSAVE, signed);
      set({
        save: signed,
        hasAutoSave: true,
        screen: 'playing',
        activeTab: 'scene',
      });
      get().showToast('Verified save imported successfully!');
      return true;
    } catch {
      return false;
    }
  },

  resetAllSaves: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTOSAVE);
    ([1, 2, 3] as const).forEach((s) =>
      localStorage.removeItem(`${STORAGE_KEYS.SLOT_PREFIX}${s}`)
    );
    set({
      save: null,
      hasAutoSave: false,
      manualSlots: readManualSlots(),
      screen: 'title',
      activeTab: 'scene',
    });
    get().showToast('All saves cleared.');
  },

  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    safeWriteJson(STORAGE_KEYS.SETTINGS, next);
    soundFX.setVolumes(next.bgmVolume, next.sfxVolume);
    if (partial.bgmStyle !== undefined) {
      soundFX.setBgmStyle(next.bgmStyle ?? 'lofi');
    }
    if (partial.rainAmbience !== undefined) {
      soundFX.setRainAmbience(Boolean(next.rainAmbience));
    }
    set({ settings: next });
  },

  debugJumpToNode: (nodeId) => {
    const { save, customNodes } = get();
    if (!save) return;
    if (!getStoryMap(customNodes).has(nodeId)) return;
    const updated = signSaveData({ ...save, cheated: true, phase: 'vn', currentNodeId: nodeId });
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    set({ save: updated, activeTab: 'scene' });
  },

  debugJumpToChapter: (chapter) => {
    const { save } = get();
    if (!save) return;
    const base: SaveData = {
      ...save,
      cheated: true,
      chapter,
      semester: 1,
      week: 1,
      dayOfYear: 1,
      minuteOfDay: DAY_START_MINUTE,
      hasWokenUpToday: false,
      currentMoment: null,
      dayActions: [],
      phase: 'planner',
      currentNodeId: null,
    };
    base.currentMoment = buildMorningWakeUpMoment(base);
    const updated = signSaveData(base);
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    set({ save: updated, activeTab: 'scene' });
  },

  debugAdjustStat: (stat, delta) => {
    const { save } = get();
    if (!save) return;
    const updated = signSaveData({
      ...applyChoiceEffects(save, { [stat]: delta }),
      cheated: true,
    });
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    set({ save: updated });
  },

  debugToggleFlag: (flag) => {
    const { save } = get();
    if (!save) return;
    const has = save.flags.includes(flag);
    const updated = signSaveData({
      ...applyChoiceEffects(
        save,
        has ? { flagsRemove: [flag] } : { flagsAdd: [flag] }
      ),
      cheated: true,
    });
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    set({ save: updated });
  },

  debugForceRandomEvent: () => {
    const { save } = get();
    if (!save) return;
    const randoms = get()
      .getAllNodes()
      .filter((n) => n.chapter === 'random');
    if (randoms.length === 0) return;
    const pick = randoms[Math.floor(Math.random() * randoms.length)];
    const updated = signSaveData({ ...save, cheated: true, phase: 'vn', currentNodeId: pick.id });
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    set({ save: updated, activeTab: 'scene' });
  },

  debugTriggerEnding: (endingId) => {
    const { save } = get();
    if (!save) return;
    const ending = evaluateEnding(save, ALL_ENDINGS, endingId);
    // Debug ending preview does NOT unlock the ending in the permanent Endings Gallery
    const updated = signSaveData({
      ...save,
      cheated: true,
      phase: 'ending',
      activeEndingId: ending.id,
      currentNodeId: null,
    });
    safeWriteJson(STORAGE_KEYS.AUTOSAVE, updated);
    set({ save: updated, activeTab: 'scene' });
    get().showToast('Sandbox Preview — Debug runs do not unlock Endings Gallery.');
  },

  saveCustomNode: (node) => {
    const existing = get().customNodes.filter((n) => n.id !== node.id);
    const next = [...existing, node];
    safeWriteJson(STORAGE_KEYS.CUSTOM_NODES, next);
    set({ customNodes: next });
    get().showToast(`Saved story node "${node.id}"`);
  },

  deleteCustomNode: (nodeId) => {
    const next = get().customNodes.filter((n) => n.id !== nodeId);
    safeWriteJson(STORAGE_KEYS.CUSTOM_NODES, next);
    set({ customNodes: next });
    get().showToast(`Deleted custom node "${nodeId}"`);
  },

  exportAllNodesJson: () => {
    return JSON.stringify(get().getAllNodes(), null, 2);
  },
}));

export const NPC_LIST: NpcId[] = [
  'family',
  'miggy',
  'bea',
  'carlo',
  'crush',
  'prof_reyes',
  'aling_nena',
];
