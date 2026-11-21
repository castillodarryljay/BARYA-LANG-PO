/**
 * Core TypeScript schemas for "Barya Lang: Road to Graduation".
 * All story JSON files, save states, minigames, and condition evaluations
 * validate strictly against these types.
 */

export type Gender = 'male' | 'female';

export type HometownId =
  | 'Pangasinan'
  | 'Iloilo'
  | 'Davao del Sur'
  | 'Batangas'
  | 'Metro Manila';

export type FamilyBackgroundId =
  | 'ofw'
  | 'farmer'
  | 'tindera'
  | 'single_parent'
  | 'employed_low';

export type ShsStrandId =
  | 'STEM'
  | 'ABM'
  | 'HUMSS'
  | 'GAS'
  | 'TVL-ICT'
  | 'TVL-HE';

export type CollegeCourseId =
  | 'BSIT'
  | 'BSCS'
  | 'Nursing'
  | 'Education'
  | 'Engineering'
  | 'Criminology'
  | 'BSBA'
  | 'Hospitality'
  | 'Psychology';

export type SchoolChapterId =
  | 'prologue'
  | 'shs_year1'
  | 'shs_year2'
  | 'college_year1'
  | 'college_year2'
  | 'college_year3'
  | 'college_year4';

export type NpcId =
  | 'family'
  | 'miggy'
  | 'bea'
  | 'carlo'
  | 'crush'
  | 'prof_reyes'
  | 'aling_nena';

export type EmotionId =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'worried'
  | 'surprised';

export type WeeklyActionId =
  | 'study'
  | 'attend_class'
  | 'work'
  | 'rest'
  | 'socialize'
  | 'org'
  | 'family';

export type MinigameId =
  | 'carinderia'
  | 'jeepney'
  | 'tutoring'
  | 'fastfood'
  | 'freelance'
  | 'tusok'
  | 'scholarship';

export type LanguageMode = 'taglish' | 'english';
export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant';
export type DifficultyMode = 'classic' | 'hardcore';
export type BgmStyle = 'lofi' | 'rainy' | 'chiptune';
export type ClockSpeed = 0 | 1 | 2 | 4;
export type TimeOfDayPhase = 'morning' | 'afternoon' | 'evening' | 'night';

export interface DailyScheduleBlock {
  id: string;
  actionId: WeeklyActionId | 'minigame';
  label: string;
  labelEn: string;
  startMinute: number; // 0..1440
  endMinute: number; // 0..1440
}

export type SkinToneId = 'moreno' | 'kayumanggi' | 'fair' | 'tan' | 'deep';
export type HairStyleId = 'short' | 'curtain' | 'spiky' | 'long' | 'ponytail' | 'curly';
export type HairColorId = 'black' | 'espresso' | 'chestnut' | 'burgundy' | 'midnight' | 'ash';
export type AccessoryId = 'none' | 'glasses' | 'headphones' | 'cap' | 'bandana';
export type UniformAccentId = 'royal' | 'maroon' | 'forest' | 'gold' | 'crimson';

export interface CharacterAppearance {
  skinTone: SkinToneId;
  hairStyle: HairStyleId;
  hairColor: HairColorId;
  accessory: AccessoryId;
  uniformAccent: UniformAccentId;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  kind: 'gwa_lte' | 'money_gte' | 'energy_mental_gte' | 'social_gte' | 'work_shift' | 'study_two';
  target: number;
  rewardMoney: number;
  rewardMental: number;
  rewardGwa?: number;
  completed?: boolean;
}

export interface PlayerProfile {
  name: string;
  gender: Gender;
  hometown: HometownId;
  isProvincial: boolean;
  familyBg: FamilyBackgroundId;
  strand: ShsStrandId;
  course: CollegeCourseId;
  shiftedFrom?: CollegeCourseId;
  appearance?: CharacterAppearance;
  difficulty?: DifficultyMode;
}

export interface SubjectGrade {
  code: string;
  name: string;
  grade: number; // 1.00 (highest) to 5.00 (fail)
  units: number;
}

export interface ScholarshipState {
  id: string;
  name: string;
  minGwa: number; // e.g., 1.75 (must be <= minGwa)
  weeklyStipend: number;
  tuitionDiscount: number; // 0.0 to 1.0
  active: boolean;
}

export interface GameStats {
  money: number; // PHP pesos (can be negative up to -debtLimit)
  debtLimit: number;
  gwa: number; // 1.00 (best) to 5.00 (worst)
  energy: number; // 0 to 100
  mental: number; // 0 to 100
  social: number; // 0 to 100
}

export interface JournalEntry {
  id: string;
  dateLabel: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  category: 'milestone' | 'choice' | 'crisis' | 'job' | 'relationship' | 'ending';
}

export interface NumericCondition {
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
  eq?: number;
}

export interface StoryConditions {
  chapter?: SchoolChapterId[];
  course?: CollegeCourseId[];
  strand?: ShsStrandId[];
  familyBg?: FamilyBackgroundId[];
  gender?: Gender[];
  isProvincial?: boolean;
  flagsAll?: string[];
  flagsAny?: string[];
  flagsNone?: string[];
  money?: NumericCondition;
  gwa?: NumericCondition;
  energy?: NumericCondition;
  mental?: NumericCondition;
  social?: NumericCondition;
  week?: NumericCondition;
  semester?: NumericCondition;
  relationships?: Partial<Record<NpcId, NumericCondition>>;
}

export interface SceneCharacter {
  id: string;
  sprite: string; // e.g., "mama_worried", "player_happy"
  position: 'left' | 'center' | 'right';
}

export interface DialogueLine {
  speaker: string;
  text: string; // Natural Taglish
  textEn?: string; // English translation
  emotion?: EmotionId;
}

export interface ChoiceEffects {
  money?: number;
  gwa?: number; // negative improves GWA (e.g., -0.15 moves 2.00 -> 1.85), positive worsens it
  energy?: number;
  mental?: number;
  social?: number;
  flagsAdd?: string[];
  flagsRemove?: string[];
  relationships?: Partial<Record<NpcId, number>>;
  grantScholarship?: ScholarshipState;
  loseScholarship?: boolean;
  shiftCourse?: CollegeCourseId;
  journal?: {
    title: string;
    titleEn: string;
    summary: string;
    summaryEn: string;
    category?: JournalEntry['category'];
  };
}

export interface StoryChoice {
  text: string;
  textEn?: string;
  hint?: string;
  hintEn?: string;
  conditions?: StoryConditions;
  effects?: ChoiceEffects;
  next?: string; // Node ID, or "PLANNER" to return to weekly planner, or "END:<ending_id>"
  triggerMinigame?: MinigameId;
}

export interface StoryNode {
  id: string;
  chapter: SchoolChapterId | 'random' | 'side' | 'course' | 'crisis';
  weight?: number;
  once?: boolean;
  milestoneWeek?: {
    chapter: SchoolChapterId;
    semester: 1 | 2;
    week: number;
  };
  conditions?: StoryConditions;
  scene: {
    background: string;
    characters: SceneCharacter[];
    lines: DialogueLine[];
  };
  choices: StoryChoice[];
}

export interface EndingDefinition {
  id: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  badge: string;
  accentColor: string;
  background: string;
  epilogue: string[];
  epilogueEn: string[];
  priority: number;
  conditions?: StoryConditions;
}

export interface GameSettings {
  language: LanguageMode;
  textSpeed: TextSpeed;
  bgmVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  bgmStyle?: BgmStyle;
  rainAmbience?: boolean;
  clockSpeed?: ClockSpeed;
  debugMode: boolean;
}

export interface SaveData {
  version: number;
  savedAt: string;
  label: string;
  profile: PlayerProfile;
  chapter: SchoolChapterId;
  semester: 1 | 2;
  week: number; // Semester day index 1..8 (kept named 'week' for story JSON compatibility)
  totalWeeks: number; // Total days survived across the whole playthrough
  minuteOfDay?: number; // 360 (06:00 AM) to 1440 (12:00 AM midnight)
  dayActions?: DailyScheduleBlock[];
  stats: GameStats;
  subjects: SubjectGrade[];
  scholarship: ScholarshipState | null;
  relationships: Record<NpcId, number>;
  flags: string[];
  visitedNodes: string[];
  journal: JournalEntry[];
  currentNodeId: string | null;
  activeEndingId: string | null;
  phase: 'vn' | 'planner' | 'minigame' | 'ending';
  pendingWeeklyActions: WeeklyActionId[];
  pendingMinigameId: MinigameId | null;
  workJobsCompletedThisWeek: number;
  tuitionDueAmount: number;
  tuitionPaidThisSem: boolean;
  activeChallenge?: WeeklyChallenge | null;
  challengesCompleted?: number;
  studyStreak?: number;
  cheated?: boolean; // Set true if Debug/Sandbox tools or tampered storage were used (disables Ending Gallery unlocks)
  integrityHash?: string; // Deterministic anti-tamper seal over critical save fields
}

export interface AssetManifestEntry {
  id: string;
  category: 'background' | 'sprite';
  filename: string;
  width: number;
  height: number;
  palette: string[];
  prompt: string;
}

export interface AssetManifest {
  stylePrefix: string;
  backgrounds: AssetManifestEntry[];
  sprites: AssetManifestEntry[];
}
