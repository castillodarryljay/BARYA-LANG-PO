import {
  DAY_END_MINUTE,
  DAY_START_MINUTE,
  MAX_PAID_SHIFTS_PER_DAY,
  MIN_STRENUOUS_ENERGY,
  MINIGAME_CONFIGS,
} from '../data/config';
import { getDailyRealWorldEncounter } from '../data/philippineEvents';
import {
  getCalendarDayInfo,
  normalizeDayOfYear,
} from './dailyScenes';
import {
  applyChoiceEffects,
  canStartMinigame,
  clamp,
  getSleepBonus,
  getWeekdayInfo,
  signSaveData,
} from './storyEngine';
import type {
  ChoiceEffects,
  DailyScheduleBlock,
  DailyStoryBeat,
  DailyStoryChoice,
  DailyStoryScene,
  DialogueLine,
  MinigameId,
  SaveData,
  SceneCharacter,
} from '../types/game';

export const DAILY_BEATS_ORDER: DailyStoryBeat[] = [
  'wake_up',
  'commute',
  'morning_campus',
  'lunch',
  'afternoon',
  'evening',
  'bedtime',
];

export const BEAT_META: Record<
  DailyStoryBeat,
  { index: number; tl: string; en: string; defaultMinute: number }
> = {
  wake_up: { index: 1, tl: 'Paggising', en: 'Wake Up', defaultMinute: 330 },
  commute: { index: 2, tl: 'Umaga', en: 'Morning', defaultMinute: 375 },
  morning_campus: { index: 3, tl: 'Klase / Campus', en: 'Class / Campus', defaultMinute: 450 },
  lunch: { index: 4, tl: 'Tanghalian', en: 'Lunch', defaultMinute: 720 },
  afternoon: { index: 5, tl: 'Hapon', en: 'Afternoon', defaultMinute: 840 },
  evening: { index: 6, tl: 'Gabi', en: 'Evening', defaultMinute: 1110 },
  bedtime: { index: 7, tl: 'Tulog', en: 'Bedtime', defaultMinute: 1320 },
};

function getHomeBackground(state: SaveData): string {
  const isCollege = state.chapter.startsWith('college');
  if (isCollege && state.profile.isProvincial) {
    return 'bg_boarding_house';
  }
  return 'bg_provincial_house';
}

function getFeaturedMinigame(state: SaveData): MinigameId {
  const { strand, course, familyBg } = state.profile;
  const seed = (state.dayOfYear ?? 1) % 3;
  if (
    seed === 0 &&
    (strand === 'TVL-ICT' ||
      strand === 'ABM' ||
      course === 'BSIT' ||
      course === 'BSCS' ||
      course === 'BSBA' ||
      state.flags.includes('owns_laptop'))
  ) {
    return 'freelance';
  }
  if (
    seed === 1 &&
    (course === 'Education' || strand === 'STEM' || course === 'Engineering')
  ) {
    return 'tutoring';
  }
  if (strand === 'TVL-HE' || course === 'Hospitality') {
    return seed === 0 ? 'fastfood' : 'carinderia';
  }
  if (familyBg === 'tindera' || strand === 'ABM' || course === 'BSBA') {
    return 'tusok';
  }
  const rotation: MinigameId[] = ['carinderia', 'fastfood', 'tusok', 'tutoring', 'jeepney'];
  return rotation[(state.totalWeeks + (state.dayOfYear ?? 1)) % rotation.length];
}

function buildJobPickerScene(
  state: SaveData,
  beat: DailyStoryBeat,
  nextBeat: DailyStoryBeat,
  advanceToMinute: number
): DailyStoryScene {
  const isEvening = beat === 'evening';
  const shiftsLeft = Math.max(0, MAX_PAID_SHIFTS_PER_DAY - state.workJobsCompletedThisWeek);
  const bg = isEvening ? 'bg_manila_street' : 'bg_barangay_street';
  const characters: SceneCharacter[] = [
    { id: 'player', sprite: 'player_neutral', position: 'left' },
    { id: 'miggy', sprite: 'miggy_happy', position: 'right' },
  ];

  const lines: DialogueLine[] = [
    {
      speaker: 'Miggy',
      text:
        shiftsLeft > 0
          ? `Uy {name}! May ${shiftsLeft} raket shift ka pa na kaya ngayong araw. Alin sa mga part-time o scholarship quest ang papasukan mo?`
          : `Whoa {name}, sagad na ang ${MAX_PAID_SHIFTS_PER_DAY} raket shifts mo ngayong araw — baka himatayin ka sa pagod! Scholarship Quest na lang o balik muna tayo sa kwento.`,
      textEn:
        shiftsLeft > 0
          ? `Hey {name}! You still have ${shiftsLeft} paid shift(s) left for today. Which side-hustle or scholarship mission are you taking on?`
          : `Whoa {name}, you already hit today’s ${MAX_PAID_SHIFTS_PER_DAY}-shift limit — don’t collapse! Check Scholarship Quest or head back to the story.`,
    },
  ];

  const choices: DailyStoryChoice[] = MINIGAME_CONFIGS.map((cfg) => {
    const gate = canStartMinigame(cfg.id, state, false);
    const overtime = cfg.id !== 'scholarship' && state.workJobsCompletedThisWeek >= 1;
    return {
      id: `job_${cfg.id}`,
      text: `${cfg.title} (${cfg.id === 'scholarship' ? '1×/Sem' : `₱${cfg.basePay}–₱${cfg.maxPay}`})`,
      textEn: `${cfg.titleEn} (${cfg.id === 'scholarship' ? '1×/Sem' : `₱${cfg.basePay}–₱${cfg.maxPay}`})`,
      hint: overtime
        ? `-${cfg.energyCost + 4} EN · -20% OT`
        : `-${cfg.energyCost} EN · ${cfg.durationSec}s`,
      hintEn: overtime
        ? `-${cfg.energyCost + 4} EN · -20% OT`
        : `-${cfg.energyCost} EN · ${cfg.durationSec}s`,
      nextBeat,
      advanceToMinute,
      triggerMinigame: cfg.id,
      contextTag: cfg.id === 'scholarship' ? 'tried_scholarship' : 'worked_shift',
      disabled: !gate.allowed,
      disabledReasonTl: gate.reasonTl,
      disabledReasonEn: gate.reasonEn,
    };
  });

  choices.push({
    id: 'close_job_picker',
    text: 'Bumalik sa kwento — mamaya na lang ang raket',
    textEn: 'Go back to the story — maybe later',
    hint: 'Return',
    hintEn: 'Return',
    nextBeat: beat,
  });

  return {
    id: `daily_${state.totalWeeks}_${beat}_jobs`,
    beat,
    beatLabelTl: 'Pili ng Raket',
    beatLabelEn: 'Pick a Side-Hustle',
    locationTl: 'Campus Avenue · Raket Bulletin',
    locationEn: 'Campus Avenue · Job Board',
    background: bg,
    characters,
    lines,
    choices,
  };
}

export function buildDailyStoryScene(
  state: SaveData,
  options?: { showJobPicker?: boolean }
): DailyStoryScene {
  const beat: DailyStoryBeat = state.dayBeat ?? 'wake_up';
  const day = normalizeDayOfYear(state.dayOfYear ?? state.totalWeeks);
  const cal = getCalendarDayInfo(day, state.totalWeeks);
  const weekday = getWeekdayInfo(state.totalWeeks);
  const homeBg = getHomeBackground(state);
  const isBoarding = homeBg === 'bg_boarding_house';
  const tags = new Set(state.dayContextTags ?? []);
  const isTech =
    state.profile.strand === 'TVL-ICT' ||
    state.profile.course === 'BSIT' ||
    state.profile.course === 'BSCS';
  const exhausted = state.stats.energy < MIN_STRENUOUS_ENERGY;
  const lowMoney = state.stats.money < 120;
  const inDebt = state.stats.money < 0;
  const seed = (day + state.totalWeeks) % 3;
  const isNoClassDay = Boolean(weekday.isWeekend || cal.isHolidayOrBreak);

  if (options?.showJobPicker && (beat === 'afternoon' || beat === 'evening')) {
    return buildJobPickerScene(
      state,
      beat,
      beat === 'afternoon' ? 'evening' : 'bedtime',
      beat === 'afternoon' ? 1110 : 1320
    );
  }

  // Inject authentic real-world Filipino student problem / daily encounter when scheduled for this beat!
  const realEncounter = getDailyRealWorldEncounter(state, cal, beat, weekday.isWeekend);
  if (realEncounter) {
    return {
      id: realEncounter.id,
      beat,
      beatLabelTl: BEAT_META[beat].tl,
      beatLabelEn: BEAT_META[beat].en,
      locationTl: realEncounter.locationTl,
      locationEn: realEncounter.locationEn,
      encounterTagTl: realEncounter.tagTl,
      encounterTagEn: realEncounter.tagEn,
      background: realEncounter.background,
      characters: realEncounter.characters,
      lines: realEncounter.lines,
      choices: realEncounter.choices,
    };
  }

  // 1. WAKE UP (05:30 AM) — Unique Philippine Date, Weather, Temperature & Slice-of-Life Buzz
  if (beat === 'wake_up') {
    const characters: SceneCharacter[] = [
      {
        id: 'player',
        sprite: state.stats.energy < 30 ? 'player_worried' : 'player_neutral',
        position: 'left',
      },
      ...(!isBoarding
        ? [{ id: 'mama', sprite: 'mama_happy', position: 'right' as const }]
        : []),
    ];

    const openingLine: DialogueLine = cal.specialDayTl
      ? {
          speaker: 'Narrator',
          text: `05:30 AM — ${cal.monthName} ${cal.dayOfMonth} (${weekday.tl}, ${cal.tempC}°C). ${cal.specialDayTl}! ${cal.dailyBuzzTl}`,
          textEn: `05:30 AM — ${cal.monthName} ${cal.dayOfMonth} (${weekday.short}, ${cal.tempC}°C). ${cal.specialDayEn}! ${cal.dailyBuzzEn}`,
        }
      : cal.weather === 'rainy'
        ? {
            speaker: 'Narrator',
            text: isBoarding
              ? `05:30 AM — ${cal.tempC}°C at patak ng ulan sa yero ng boarding house (${cal.monthThemeTl}). ${cal.dailyBuzzTl}`
              : `05:30 AM — ${cal.tempC}°C, mahinang ambon sa labas ng bintana (${cal.monthThemeTl}). ${cal.dailyBuzzTl}`,
            textEn: isBoarding
              ? `05:30 AM — ${cal.tempC}°C with rain pattering on the boarding house tin roof (${cal.monthThemeEn}). ${cal.dailyBuzzEn}`
              : `05:30 AM — ${cal.tempC}°C with soft morning rain outside (${cal.monthThemeEn}). ${cal.dailyBuzzEn}`,
          }
        : cal.weather === 'hot'
          ? {
              speaker: 'Narrator',
              text: `05:30 AM — Maalinsangan na agad (PAGASA forecast: ${cal.tempC}°C Heat Index!). Umiikot ang electric fan sa number 3. ${cal.dailyBuzzTl}`,
              textEn: `05:30 AM — Warm summer air already lingers (PAGASA forecast: ${cal.tempC}°C Heat Index!). Your fan hums on setting 3. ${cal.dailyBuzzEn}`,
            }
          : {
              speaker: 'Narrator',
              text: isBoarding
                ? `05:30 AM — ${cal.monthName} ${cal.dayOfMonth} (${weekday.tl}, ${cal.tempC}°C · ${cal.monthThemeTl}). ${cal.dailyBuzzTl}`
                : `05:30 AM — ${cal.monthName} ${cal.dayOfMonth} (${weekday.tl}, ${cal.tempC}°C · ${cal.monthThemeTl}). ${cal.dailyBuzzTl}`,
              textEn: isBoarding
                ? `05:30 AM — ${cal.monthName} ${cal.dayOfMonth} (${weekday.short}, ${cal.tempC}°C · ${cal.monthThemeEn}). ${cal.dailyBuzzEn}`
                : `05:30 AM — ${cal.monthName} ${cal.dayOfMonth} (${weekday.short}, ${cal.tempC}°C · ${cal.monthThemeEn}). ${cal.dailyBuzzEn}`,
            };

    const secondLine: DialogueLine = !isBoarding
      ? {
          speaker: 'Mama',
          text: inDebt
            ? `Gising na {name}! Huwag ka munang ma-stress sa budget, kain muna tayo ng mainit na sinangag bago ka umalis.`
            : cal.isHolidayOrBreak
              ? `Magandang umaga {name}! Walang pasok ngayon (${cal.specialDayTl ?? weekday.tl}) — sulitin natin ang araw na ’to!`
              : weekday.isWeekend
                ? `Magandang umaga {name}! Walang pasok ngayon (${weekday.tl}), ano ang plano mo ngayong umaga?`
                : `Gising na {name}, may nakahanda nang kape at pandesal sa mesa! Huwag magpapagutom sa eskwela ha?`,
          textEn: inDebt
            ? `Wake up {name}! Don’t stress too much about the budget yet — eat some warm garlic rice before heading out.`
            : cal.isHolidayOrBreak
              ? `Good morning {name}! No classes today (${cal.specialDayEn ?? weekday.short}) — let’s make the most of it!`
              : weekday.isWeekend
                ? `Good morning {name}! It’s ${weekday.short} — no classes today. How do you want to start your morning?`
                : `Time to wake up {name}, hot coffee and pandesal are on the table! Don’t skip meals at school, okay?`,
        }
      : {
          speaker: '{name}',
          text: inDebt
            ? `Hays... negative ₱${Math.abs(state.stats.money)} pa ang wallet ko. Kailangan ng matinding diskarte ngayong ${cal.monthShort} ${cal.dayOfMonth}.`
            : cal.isHolidayOrBreak
              ? `Walang pasok ngayon (${cal.specialDayTl})! Magandang pagkakataon para magpahinga, mag-review, o mag-raket.`
              : state.stats.energy < 35
                ? `Ang bigat pa ng talukap ng mata ko... pero laban lang, Day ${day} of 365 na!`
                : `Okay {name}, bagong araw (${cal.monthShort} ${cal.dayOfMonth})! Paano natin sisimulan ang umaga?`,
          textEn: inDebt
            ? `Sigh... still down ₱${Math.abs(state.stats.money)} in debt. Gotta hustle smart this ${cal.monthShort} ${cal.dayOfMonth}.`
            : cal.isHolidayOrBreak
              ? `No classes today (${cal.specialDayEn})! Great window to rest, catch up on notes, or earn extra cash.`
              : state.stats.energy < 35
                ? `My eyelids still feel heavy... but we keep going, Day ${day} of 365!`
                : `Alright {name}, fresh morning (${cal.monthShort} ${cal.dayOfMonth})! How do we kick off today?`,
        };

    const breakfastCost = isBoarding ? -30 : 0;

    return {
      id: `daily_${state.totalWeeks}_wake_up`,
      beat: 'wake_up',
      beatLabelTl: 'Paggising',
      beatLabelEn: 'Wake Up',
      locationTl: isBoarding ? 'Boarding House · Kwarto' : 'Bahay · Kwarto',
      locationEn: isBoarding ? 'Boarding House · Bedroom' : 'Home · Bedroom',
      background: homeBg,
      characters,
      lines: [openingLine, secondLine],
      choices: [
        {
          id: 'wake_early',
          text: 'Bangon agad — malamig na ligo sa tabo at maayos na bihis',
          textEn: 'Get up immediately — brisk cold shower and crisp uniform',
          hint: '+4 MH · -2 EN · -0.01 GWA',
          hintEn: '+4 MH · -2 EN · -0.01 GWA',
          nextBeat: 'commute',
          advanceToMinute: 375,
          effects: { energy: -2, mental: 4, gwa: -0.01 },
          contextTag: 'woke_early',
        },
        {
          id: 'wake_breakfast',
          text: isBoarding
            ? 'Magtimpla ng 3-in-1 kape at bumili ng mainit na pandesal'
            : 'Sabay mag-almusal kay Mama ng kape, sinangag, at pandesal',
          textEn: isBoarding
            ? 'Brew 3-in-1 coffee and grab warm pandesal outside'
            : 'Eat warm breakfast with Mama — coffee, rice, and pandesal',
          hint: breakfastCost === 0 ? 'Libreng Almusal · +12 EN · +5 MH' : '-₱30 · +12 EN · +5 MH',
          hintEn: breakfastCost === 0 ? 'Free Home Meal · +12 EN · +5 MH' : '-₱30 · +12 EN · +5 MH',
          nextBeat: 'commute',
          advanceToMinute: 375,
          countsAsAction: 'eat_meal',
          effects: {
            money: breakfastCost,
            energy: 12,
            mental: 5,
            relationships: !isBoarding ? { family: 2 } : undefined,
          },
          contextTag: 'ate_breakfast',
        },
        {
          id: 'wake_snooze',
          text: 'I-snooze muna ng 30 minuto — bawi ng antok sa ilalim ng kumot',
          textEn: 'Hit snooze for 30 minutes — steal extra sleep under the blanket',
          hint: '+9 EN · +1 MH (Medyo habol sa oras)',
          hintEn: '+9 EN · +1 MH (Slightly rushed)',
          nextBeat: 'commute',
          advanceToMinute: 390,
          effects: { energy: 9, mental: 1 },
          contextTag: 'snoozed',
        },
      ],
    };
  }

  // 2. COMMUTE / HOLIDAY OR WEEKEND MORNING (06:15 AM)
  if (beat === 'commute') {
    if (isNoClassDay) {
      const holidayBg =
        cal.monthShort === 'Dec'
          ? 'bg_christmas_parol'
          : cal.weather === 'rainy'
            ? 'bg_rainy_flood'
            : 'bg_barangay_street';
      const jeepGate = canStartMinigame('jeepney', state, false);
      const isHoliday = Boolean(cal.isHolidayOrBreak);
      return {
        id: `daily_${state.totalWeeks}_commute_wknd`,
        beat: 'commute',
        beatLabelTl: isHoliday ? 'Walang Pasok!' : 'Sabado/Linggo',
        beatLabelEn: isHoliday ? 'Holiday / No Class' : 'Weekend Morning',
        locationTl: isHoliday
          ? `${cal.monthShort} ${cal.dayOfMonth} · Walang Pasok sa Campus`
          : `${weekday.tl} · Labas ng Bahay`,
        locationEn: isHoliday
          ? `${cal.monthShort} ${cal.dayOfMonth} · National Holiday / Break`
          : `${weekday.short} · Neighborhood Street`,
        encounterTagTl: isHoliday ? cal.specialDayTl : undefined,
        encounterTagEn: isHoliday ? cal.specialDayEn : undefined,
        background: holidayBg,
        characters: [
          { id: 'player', sprite: 'player_happy', position: 'left' },
          { id: 'miggy', sprite: 'miggy_happy', position: 'right' },
        ],
        lines: [
          {
            speaker: 'Narrator',
            text: isHoliday
              ? `06:30 AM — Walang regular na klase ngayong ${cal.monthName} ${cal.dayOfMonth} (${cal.specialDayTl})! Ramdam ang holiday vibe sa buong barangay.`
              : `06:30 AM — Walang regular na klase ngayong ${weekday.tl}! Mas kalmado ang kalsada (${cal.tempC}°C) at rinig ang nagtitinda ng taho sa kanto.`,
            textEn: isHoliday
              ? `06:30 AM — No regular classes on ${cal.monthName} ${cal.dayOfMonth} (${cal.specialDayEn})! A festive, unhurried holiday mood fills the barangay.`
              : `06:30 AM — No regular classes this ${weekday.short}! The street is calm (${cal.tempC}°C) and a taho vendor calls out down the corner.`,
          },
          {
            speaker: 'Miggy',
            text: `Uy {name}! Sakto, walang klase ngayon! Sasama ka ba sa morning hustle (+15% kita!), mag-taho muna, o mag-aasikaso ng gamit sa bahay?`,
            textEn: `Hey {name}, no classes today! Joining a morning hustle (+15% pay!), grabbing warm taho, or catching up on chores & rest?`,
          },
        ],
        choices: [
          {
            id: 'wknd_taho_walk',
            text: 'Bumili ng mainit na taho at mag-morning stroll kasama si Miggy',
            textEn: 'Buy warm taho and take a calm morning stroll with Miggy',
            hint: '-₱20 · +8 EN · +8 MH · +3 Social',
            hintEn: '-₱20 · +8 EN · +8 MH · +3 Social',
            nextBeat: 'morning_campus',
            advanceToMinute: 480,
            effects: { money: -20, energy: 8, mental: 8, social: 3, relationships: { miggy: 2 } },
            contextTag: 'calm_weekend',
          },
          {
            id: 'wknd_jeep_hustle',
            text: 'Mag-extra konduktor sa morning jeep! (Jeepney Fare Pass Minigame)',
            textEn: 'Work as a morning jeepney conductor! (Jeepney Fare Pass Minigame)',
            hint: 'Play Minigame · +₱80–₱310 · -14 EN',
            hintEn: 'Play Minigame · +₱80–₱310 · -14 EN',
            nextBeat: 'morning_campus',
            advanceToMinute: 540,
            triggerMinigame: 'jeepney',
            contextTag: 'worked_shift',
            disabled: !jeepGate.allowed,
            disabledReasonTl: jeepGate.reasonTl,
            disabledReasonEn: jeepGate.reasonEn,
          },
          {
            id: 'wknd_chores',
            text: 'Maglaba ng uniporme at ayusin ang study desk para handa sa susunod na pasok',
            textEn: 'Wash uniforms and organize your desk for the next school day',
            hint: '-5 EN · +6 MH · -0.02 GWA',
            hintEn: '-5 EN · +6 MH · -0.02 GWA',
            nextBeat: 'morning_campus',
            advanceToMinute: 495,
            effects: { energy: -5, mental: 6, gwa: -0.02 },
            contextTag: 'did_chores',
          },
        ],
      };
    }

    // Weekday commute scene
    const isRainy = cal.weather === 'rainy';
    const fareCost = isRainy ? -35 : -20;
    const jeepGate = canStartMinigame('jeepney', state, false);
    const rushed = tags.has('snoozed');

    return {
      id: `daily_${state.totalWeeks}_commute`,
      beat: 'commute',
      beatLabelTl: 'Biyahe',
      beatLabelEn: 'Commute',
      locationTl: isRainy ? `Kalsada · Maulang Biyahe (${cal.tempC}°C)` : `Jeepney Stop · Morning Rush (${cal.tempC}°C)`,
      locationEn: isRainy ? `Street · Rainy Commute (${cal.tempC}°C)` : `Jeepney Stop · Morning Rush (${cal.tempC}°C)`,
      background: isRainy ? 'bg_rainy_flood' : 'bg_jeepney_interior',
      characters: [
        { id: 'player', sprite: rushed ? 'player_surprised' : 'player_neutral', position: 'left' },
        { id: 'miggy', sprite: 'miggy_happy', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Narrator',
          text: rushed
            ? `06:30 AM — Hala, napasarap ang snooze mo! Mabilisang suklay at takbo palabas ng gate habang siksikan na ang mga dumadaang jeep.`
            : isRainy
              ? `06:15 AM — Buhos ang ulan sa kanto at mabagal ang daloy ng traffic. Buti na lang may dala kang payong!`
              : `06:15 AM — Maaga ka sa sakayan (${cal.monthThemeTl})! Dumadagundong ang radyo ng jeepney habang umaakyat ang mga estudyante.`,
          textEn: rushed
            ? `06:30 AM — That snooze went fast! You comb your hair on the run as packed jeepneys rumble past the corner.`
            : isRainy
              ? `06:15 AM — Rain pours down the avenue and wet streets slow traffic to a crawl. Good thing you grabbed an umbrella!`
              : `06:15 AM — Right on time at the jeepney stop (${cal.monthThemeEn})! Morning radio hums as students hop aboard.`,
        },
        {
          speaker: 'Miggy',
          text: rushed
            ? `Hoy {name}, muntik ka nang maiwan! Siksik ka dito sa dulo — "Bayad po, estudyante!"`
            : `Uy {name}, sabay na tayo! Magje-jeep ba tayo o tipid-lakad mode ka ngayong umaga?`,
          textEn: rushed
            ? `Hey {name}, you almost missed it! Squeeze in here by the step — "Student fare, please!"`
            : `Yo {name}, heading to campus! Taking the jeepney or doing the budget walk this morning?`,
        },
      ],
      choices: [
        {
          id: 'commute_jeep',
          text: isRainy
            ? 'Sumakay ng jeep at tricycle para hindi mabasa ang uniporme'
            : 'Sumakay ng jeep kasama si Miggy ("Bayad po, estudyante!")',
          textEn: isRainy
            ? 'Ride jeepney & tricycle so your uniform stays dry'
            : 'Hop on the jeepney with Miggy ("Student fare, please!")',
          hint: `${fareCost}₱ · -4 EN · +2 Social`,
          hintEn: `${fareCost}₱ · -4 EN · +2 Social`,
          nextBeat: 'morning_campus',
          advanceToMinute: 450,
          effects: { money: fareCost, energy: -4, social: 2, relationships: { miggy: 2 } },
          contextTag: 'took_jeep',
        },
        {
          id: 'commute_walk',
          text: 'Maglakad na lang papuntang campus — bawat barya mahalaga!',
          textEn: 'Walk all the way to campus — every peso counts!',
          hint: '₱0 · -10 EN · +2 MH',
          hintEn: '₱0 · -10 EN · +2 MH',
          nextBeat: 'morning_campus',
          advanceToMinute: 465,
          effects: { energy: -10, mental: 2 },
          contextTag: 'walked_school',
          disabled: exhausted,
          disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN kailangan)`,
          disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN required)`,
        },
        {
          id: 'commute_conductor',
          text: 'Tumulong mag-abot ng sukli sa barker/driver (Jeepney Fare Pass Minigame)',
          textEn: 'Help pass fares & exact change for extra coins (Jeepney Minigame)',
          hint: 'Play Minigame · +₱80–₱310 · -14 EN',
          hintEn: 'Play Minigame · +₱80–₱310 · -14 EN',
          nextBeat: 'morning_campus',
          advanceToMinute: 480,
          triggerMinigame: 'jeepney',
          contextTag: 'worked_shift',
          disabled: !jeepGate.allowed,
          disabledReasonTl: jeepGate.reasonTl,
          disabledReasonEn: jeepGate.reasonEn,
        },
      ],
    };
  }

  // 3. MORNING CAMPUS / CLASS OR HOLIDAY MORNING (07:30 AM)
  if (beat === 'morning_campus') {
    if (isNoClassDay) {
      const isHoliday = Boolean(cal.isHolidayOrBreak);
      return {
        id: `daily_${state.totalWeeks}_morning_wknd`,
        beat: 'morning_campus',
        beatLabelTl: isHoliday ? 'Holiday Morning' : 'Weekend Morning',
        beatLabelEn: isHoliday ? 'Holiday Morning' : 'Weekend Morning',
        locationTl: isHoliday
          ? `${cal.specialDayTl?.split('(')[0].trim() ?? 'Holiday'} · Free Day`
          : 'Campus Library · Weekend',
        locationEn: isHoliday
          ? `${cal.specialDayEn?.split('(')[0].trim() ?? 'Holiday'} · Free Day`
          : 'Campus Library · Weekend',
        background: isHoliday && cal.monthShort === 'Dec' ? 'bg_christmas_parol' : 'bg_library',
        characters: [
          { id: 'player', sprite: 'player_neutral', position: 'left' },
          { id: 'bea', sprite: 'bea_happy', position: 'right' },
        ],
        lines: [
          {
            speaker: 'Bea',
            text: isHoliday
              ? `Hi {name}! Walang pasok ngayon (${cal.specialDayTl?.split('(')[0].trim()}) pero nag-advance reading ako sa ${state.subjects[0]?.name ?? state.profile.course} — sabay ka o raket muna?`
              : `Hi {name}! Nagulat ako nandito ka rin kahit ${weekday.tl}. May ginawa akong color-coded reviewer para sa ${state.subjects[0]?.name ?? state.profile.course} — sabay ka?`,
            textEn: isHoliday
              ? `Hi {name}! Enjoying the day off (${cal.specialDayEn?.split('(')[0].trim()}), though I’m reading ahead on ${state.subjects[0]?.name ?? state.profile.course} — study together or hustling today?`
              : `Hi {name}! Surprised to see you here on a ${weekday.short}. I made color-coded notes for ${state.subjects[0]?.name ?? state.profile.course} — want to study together?`,
          },
          {
            speaker: '{name}',
            text: tags.has('worked_shift')
              ? `Kakatapos ko lang ng morning raket, Bea! Nakakapagod pero sulit ang kita.`
              : `Sakto Bea, magandang pagkakataon ’to para makabawi habang walang regular classes!`,
            textEn: tags.has('worked_shift')
              ? `Just wrapped up a morning hustle, Bea! Tired, but the extra pesos were worth it.`
              : `Perfect timing Bea — free days are the best time to get ahead!`,
          },
        ],
        choices: [
          {
            id: 'wknd_study_bea',
            text: 'Mag-deep review kasama si Bea gamit ang flashcards niya',
            textEn: 'Deep-review with Bea using her color-coded flashcards',
            hint: '-12 EN · -3 MH · -0.08 GWA · +4 Bea',
            hintEn: '-12 EN · -3 MH · -0.08 GWA · +4 Bea',
            nextBeat: 'lunch',
            advanceToMinute: 720,
            countsAsAction: 'study',
            effects: { energy: -12, mental: -3, gwa: -0.08, social: 3, relationships: { bea: 4 } },
            contextTag: 'studied_with_bea',
            disabled: exhausted,
            disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN kailangan)`,
            disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN required)`,
          },
          {
            id: 'wknd_quick_shift',
            text: 'Mag-3-hour Holiday/Weekend Part-Time Shift (+15% Pay!)',
            textEn: 'Take a 3-hour Holiday/Weekend Part-Time Shift (+15% Pay!)',
            hint: '+₱144 · -18 EN · -5 MH',
            hintEn: '+₱144 · -18 EN · -5 MH',
            nextBeat: 'lunch',
            advanceToMinute: 720,
            countsAsAction: 'work',
            effects: { money: 144, energy: -18, mental: -5, relationships: { aling_nena: 2 } },
            contextTag: 'worked_shift',
            disabled: exhausted || state.workJobsCompletedThisWeek >= MAX_PAID_SHIFTS_PER_DAY,
            disabledReasonTl:
              state.workJobsCompletedThisWeek >= MAX_PAID_SHIFTS_PER_DAY
                ? `Max ${MAX_PAID_SHIFTS_PER_DAY} shifts/day naabot na`
                : `Kulang sa Energy (${MIN_STRENUOUS_ENERGY}+ EN)`,
            disabledReasonEn:
              state.workJobsCompletedThisWeek >= MAX_PAID_SHIFTS_PER_DAY
                ? `Max ${MAX_PAID_SHIFTS_PER_DAY} shifts/day reached`
                : `Need ${MIN_STRENUOUS_ENERGY}+ Energy`,
          },
          {
            id: 'wknd_chill_rest',
            text: 'Magpahinga at mag-charge ng utak muna — iwas burnout!',
            textEn: 'Take a relaxed breather and recharge — prevent burnout!',
            hint: '+18 EN · +12 MH',
            hintEn: '+18 EN · +12 MH',
            nextBeat: 'lunch',
            advanceToMinute: 720,
            countsAsAction: 'rest',
            effects: { energy: 18, mental: 12 },
            contextTag: 'rested_morning',
          },
        ],
      };
    }

    // Weekday Classroom / Lab Story Scene (dynamically tailored to Philippine monthly observance & subject!)
    const subjectName = state.subjects[day % state.subjects.length]?.name ?? state.profile.course;
    const roomBg = isTech && seed === 1 ? 'bg_computer_lab' : 'bg_classroom';
    const rushed = tags.has('snoozed');
    const walked = tags.has('walked_school');
    const isMondayFlag = weekday.short === 'Mon';

    return {
      id: `daily_${state.totalWeeks}_morning_campus`,
      beat: 'morning_campus',
      beatLabelTl: 'Klase',
      beatLabelEn: 'Morning Class',
      locationTl: roomBg === 'bg_computer_lab' ? `Computer Lab · ${subjectName}` : `Classroom · ${subjectName}`,
      locationEn: roomBg === 'bg_computer_lab' ? `Computer Lab · ${subjectName}` : `Classroom · ${subjectName}`,
      background: roomBg,
      characters: [
        { id: 'player', sprite: rushed ? 'player_worried' : 'player_neutral', position: 'left' },
        { id: 'prof', sprite: rushed ? 'prof_angry' : 'prof_neutral', position: 'center' },
        { id: 'bea', sprite: 'bea_happy', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Narrator',
          text: rushed
            ? `07:38 AM — Hiningal ka pagpasok ng ${subjectName}! Sakto, nagche-check na ng attendance si Prof. Reyes.`
            : walked
              ? `07:45 AM — Medyo pawisan ka galing sa lakad (${cal.tempC}°C) pero buo pa ang barya mo sa bulsa. Nagsusulat na si Prof. Reyes sa board.`
              : isMondayFlag
                ? `07:30 AM — Katatapos lang ng Monday Flag Ceremony (Lupang Hinirang at Panatang Makabayan)! Handa ka na sa ${subjectName}.`
                : `07:30 AM — Maaga ka sa upuan mo para sa ${subjectName} (${cal.monthThemeTl}). Umiikot ang ceiling fan at handa na ang yellow pad mo.`,
          textEn: rushed
            ? `07:38 AM — You slip into ${subjectName} catching your breath right as Prof. Reyes checks attendance!`
            : walked
              ? `07:45 AM — A little sweaty from walking (${cal.tempC}°C), yet your pocket coins are untouched. Prof. Reyes starts writing on the board.`
              : isMondayFlag
                ? `07:30 AM — Fresh from the Monday Flag Ceremony! You settle into your desk for ${subjectName}.`
                : `07:30 AM — Seated early for ${subjectName} (${cal.monthThemeEn}). Ceiling fans whirr overhead as you open your notebook.`,
        },
        {
          speaker: 'Prof. Reyes',
          text:
            seed === 0
              ? `Class, surprise oral recitation tayo sa ${subjectName} ngayon! Sinong handang magpaliwanag sa harap?`
              : seed === 1
                ? `Makinig nang mabuti — ang sample problem na ito ay lalabas sa susunod na major exam.`
                : `Kalahati ng klase mukhang puyat na naman. {name}, siguraduhing kumpleto ang notes mo ngayong umaga.`,
          textEn:
            seed === 0
              ? `Class, surprise oral recitation in ${subjectName} today! Who’s brave enough to step up?`
              : seed === 1
                ? `Pay close attention — this exact sample problem will show up on the next major exam.`
                : `Half the room looks sleep-deprived again. {name}, make sure your notes are thorough this morning.`,
        },
        {
          speaker: 'Bea',
          text: `Psst {name}! Pinaghandaan ko ’to kagabi — sabihan mo lang ako kung gusto mong mag-notes sharing tayo!`,
          textEn: `Psst {name}! I prepped for this last night — let me know if you want to compare notes!`,
        },
      ],
      choices: [
        {
          id: 'class_recite',
          text: 'Magtaas ng kamay at mag-recite sa harap ni Prof. Reyes',
          textEn: 'Raise your hand and volunteer for Prof. Reyes’s recitation',
          hint: '-12 EN · -3 MH · -0.07 GWA · +3 Prof',
          hintEn: '-12 EN · -3 MH · -0.07 GWA · +3 Prof',
          nextBeat: 'lunch',
          advanceToMinute: 720,
          countsAsAction: 'attend_class',
          effects: {
            energy: -12,
            mental: -3,
            social: 3,
            gwa: -0.07,
            relationships: { prof_reyes: 3 },
          },
          contextTag: 'aced_class',
          disabled: exhausted,
          disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN kailangan)`,
          disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN required)`,
        },
        {
          id: 'class_bea_notes',
          text: 'Makinig nang tahimik at sabay kopya ng color-coded notes ni Bea',
          textEn: 'Listen steadily and copy Bea’s color-coded notes together',
          hint: '-9 EN · +2 MH · -0.05 GWA · +4 Bea',
          hintEn: '-9 EN · +2 MH · -0.05 GWA · +4 Bea',
          nextBeat: 'lunch',
          advanceToMinute: 720,
          countsAsAction: 'attend_class',
          effects: {
            energy: -9,
            mental: 2,
            social: 4,
            gwa: -0.05,
            relationships: { bea: 4, prof_reyes: 1 },
          },
          contextTag: 'studied_with_bea',
          disabled: exhausted,
          disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN kailangan)`,
          disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN required)`,
        },
        {
          id: 'class_rest_back',
          text: 'Umupo sa likod at mag-recharge muna — hindi kakayanin ang puyat',
          textEn: 'Sit quietly in the back and catch your breath — pace yourself',
          hint: '+10 EN · +5 MH · +0.02 GWA',
          hintEn: '+10 EN · +5 MH · +0.02 GWA',
          nextBeat: 'lunch',
          advanceToMinute: 720,
          countsAsAction: 'rest',
          effects: { energy: 10, mental: 5, gwa: 0.02 },
          contextTag: 'rested_morning',
        },
      ],
    };
  }

  // 4. LUNCH (12:00 PM) — Rotating Daily Filipino Ulam Menu!
  if (beat === 'lunch') {
    const hungry = !tags.has('ate_breakfast');
    const carinderiaGate = canStartMinigame('carinderia', state, false);
    const companionIsCrush = seed === 2;

    return {
      id: `daily_${state.totalWeeks}_lunch`,
      beat: 'lunch',
      beatLabelTl: 'Tanghalian',
      beatLabelEn: 'Lunch Break',
      locationTl: `Carinderia ni Aling Nena · 12:00 PM`,
      locationEn: `Aling Nena’s Carinderia · 12:00 PM`,
      background: seed === 1 ? 'bg_canteen' : 'bg_carinderia',
      characters: [
        { id: 'player', sprite: hungry ? 'player_worried' : 'player_happy', position: 'left' },
        { id: 'nena', sprite: 'nena_happy', position: 'center' },
        companionIsCrush
          ? { id: 'crush', sprite: 'crush_happy', position: 'right' }
          : { id: 'miggy', sprite: 'miggy_happy', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Narrator',
          text: hungry
            ? `12:00 PM — Kumukulo na ang tiyan mo dahil hindi ka nakapag-almusal kanina! Ulam of the day kay Aling Nena: ${cal.dailyUlamTl}!`
            : tags.has('aced_class')
              ? `12:00 PM — Ang gaan ng pakiramdam matapos ang klase kanina! Umuusok sa counter ang specialty ngayon: ${cal.dailyUlamTl}.`
              : `12:00 PM — Bell na para sa tanghalian! Amoy bagong lutong ${cal.dailyUlamTl} sa tapat ng campus.`,
          textEn: hungry
            ? `12:00 PM — Your stomach growls loudly after skipping breakfast! Today’s carinderia special: ${cal.dailyUlamEn}!`
            : tags.has('aced_class')
              ? `12:00 PM — Still smiling after morning class! Steaming on the counter today: ${cal.dailyUlamEn}.`
              : `12:00 PM — Lunch bell rings! The aroma of freshly cooked ${cal.dailyUlamEn} greets you outside campus.`,
        },
        {
          speaker: 'Aling Nena',
          text: lowMoney
            ? `Oh {name}, halika! Half-rice at ${cal.dailyUlamTl} plus libreng mainit na sabaw? O kung gusto mong kumita, kulang ako sa taga-serve ngayong lunch rush!`
            : `Magandang tanghali {name}! Bagong luto ang ${cal.dailyUlamTl} — o gusto mo bang mag-sideline muna habang dagsa ang customers?`,
          textEn: lowMoney
            ? `Hey {name}, come here! Half-rice with ${cal.dailyUlamEn} and free hot soup? Or if you need cash, I’m short-handed for the lunch rush!`
            : `Good noon {name}! Fresh ${cal.dailyUlamEn} just came off the stove — or want to help serve the lunch rush for extra pay?`,
        },
        companionIsCrush
          ? {
              speaker: 'Jamie',
              text: `Tabi tayo {name}! May extra table pa dito sa may electric fan.`,
              textEn: `Sit with me {name}! I saved a seat right beside the electric fan.`,
            }
          : {
              speaker: 'Miggy',
              text: `Tara {name}, kain tayo at kwentuhan muna bago sumabak sa hapon!`,
              textEn: `Come on {name}, let’s grab lunch and unwind before afternoon hits!`,
            },
      ],
      choices: [
        {
          id: 'lunch_munggo',
          text: `Umorder ng half-rice, ${cal.dailyUlamTl}, at libreng sabaw kay Aling Nena`,
          textEn: `Order half-rice, ${cal.dailyUlamEn}, and free hot soup from Aling Nena`,
          hint: '-₱45 · +15 EN · +6 MH · +2 Aling Nena',
          hintEn: '-₱45 · +15 EN · +6 MH · +2 Aling Nena',
          nextBeat: 'afternoon',
          advanceToMinute: 840,
          countsAsAction: 'eat_meal',
          effects: { money: -45, energy: 15, mental: 6, relationships: { aling_nena: 2 } },
          contextTag: 'ate_lunch',
        },
        {
          id: 'lunch_barkada',
          text: companionIsCrush
            ? 'Makipag-tanghalian at kwentuhan kay Jamie sa may electric fan'
            : 'Mag-siomai rice, gulaman, at tawanan kasama si Miggy',
          textEn: companionIsCrush
            ? 'Share lunch and quiet stories with Jamie by the fan'
            : 'Grab siomai rice, gulaman, and laughs with Miggy',
          hint: '-₱65 · +10 EN · +12 MH · +9 Social',
          hintEn: '-₱65 · +10 EN · +12 MH · +9 Social',
          nextBeat: 'afternoon',
          advanceToMinute: 840,
          countsAsAction: 'socialize',
          effects: {
            money: -65,
            energy: 10,
            mental: 12,
            social: 9,
            relationships: companionIsCrush ? { crush: 5 } : { miggy: 4 },
          },
          contextTag: 'lunch_barkada',
        },
        {
          id: 'lunch_carinderia_mg',
          text: 'Tumulong mag-serve kay Aling Nena sa lunch rush! (Carinderia Rush Minigame)',
          textEn: 'Jump behind the counter for Aling Nena’s lunch rush! (Carinderia Minigame)',
          hint: 'Play Minigame · +₱85–₱340 · -16 EN',
          hintEn: 'Play Minigame · +₱85–₱340 · -16 EN',
          nextBeat: 'afternoon',
          advanceToMinute: 870,
          triggerMinigame: 'carinderia',
          contextTag: 'worked_shift',
          disabled: !carinderiaGate.allowed,
          disabledReasonTl: carinderiaGate.reasonTl,
          disabledReasonEn: carinderiaGate.reasonEn,
        },
        {
          id: 'lunch_tipid',
          text: 'Biskwit at tubig na lang muna — sobrang higpit ng budget ngayon',
          textEn: 'Stick to crackers and water — budget is razor thin right now',
          hint: '-₱10 · +5 EN · -3 MH',
          hintEn: '-₱10 · +5 EN · -3 MH',
          nextBeat: 'afternoon',
          advanceToMinute: 840,
          effects: { money: -10, energy: 5, mental: -3 },
          contextTag: 'tipid_lunch',
        },
      ],
    };
  }

  // 5. AFTERNOON (02:00 PM)
  if (beat === 'afternoon') {
    const featuredId = getFeaturedMinigame(state);
    const featuredCfg = MINIGAME_CONFIGS.find((m) => m.id === featuredId) ?? MINIGAME_CONFIGS[0];
    const featuredGate = canStartMinigame(featuredId, state, false);
    const schGate = canStartMinigame('scholarship', state, false);
    const isRainy = cal.weather === 'rainy';

    return {
      id: `daily_${state.totalWeeks}_afternoon`,
      beat: 'afternoon',
      beatLabelTl: 'Hapon',
      beatLabelEn: 'Afternoon',
      locationTl: isRainy ? `Campus Walkway · Maulang Hapon (${cal.tempC}°C)` : `Campus Gate · 02:00 PM (${cal.tempC}°C)`,
      locationEn: isRainy ? `Campus Walkway · Rainy Afternoon (${cal.tempC}°C)` : `Campus Gate · 2:00 PM (${cal.tempC}°C)`,
      background: isRainy ? 'bg_rainy_flood' : 'bg_school_gate',
      characters: [
        { id: 'player', sprite: 'player_neutral', position: 'left' },
        { id: 'carlo', sprite: 'carlo_happy', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Narrator',
          text: tags.has('worked_shift')
            ? `02:00 PM — Medyo pagod na ang braso mo sa shift kanina, pero ang sarap sa pakiramdam ng hawak na dagdag kita! Mahaba pa ang hapon.`
            : tags.has('tipid_lunch')
              ? `02:00 PM — Biskwit lang ang laman ng tiyan mo pero tuloy ang laban! Abala ang campus para sa ${cal.monthThemeTl}.`
              : `02:00 PM — Tanghaling tapat hanggang hapon sa campus (${cal.monthThemeTl})! Maraming pwedeng gawin bago lumubog ang araw.`,
          textEn: tags.has('worked_shift')
            ? `02:00 PM — Your arms ache slightly from the earlier shift, yet the extra pesos in your pocket feel rewarding. Still plenty of afternoon left.`
            : tags.has('tipid_lunch')
              ? `02:00 PM — Running on crackers and determination! Campus buzzes for ${cal.monthThemeEn}.`
              : `02:00 PM — Afternoon energy around campus (${cal.monthThemeEn})! Plenty of ways to spend the next few hours before sunset.`,
        },
        {
          speaker: 'Carlo',
          text: schGate.allowed
            ? `Uy {name}! Balita ko bukas na ang Scholarship Application Quest (pasok ang GWA mo!) — at may org booth din kami para sa ${cal.monthThemeTl}. Anong lakad mo?`
            : `Uy {name}! May student org prep kami ngayong hapon para sa ${cal.monthThemeTl}, pero alam kong naghahabol ka rin ng aral o raket. Anong plano mo?`,
          textEn: schGate.allowed
            ? `Hey {name}! Word is the Scholarship Quest is open and your GWA qualifies! Plus we’ve got an org booth for ${cal.monthThemeEn}. What’s your move?`
            : `Hey {name}! We’re prepping an org booth for ${cal.monthThemeEn}, though I know you’re balancing study and hustle too. What’s the plan?`,
        },
      ],
      choices: [
        {
          id: 'aft_study',
          text: 'Dumiretso sa Library at mag-focus sa reviewer at assignments',
          textEn: 'Head to the Library for focused exam review and assignments',
          hint: '-₱20 · -14 EN · -5 MH · -0.08 GWA',
          hintEn: '-₱20 · -14 EN · -5 MH · -0.08 GWA',
          nextBeat: 'evening',
          advanceToMinute: 1110,
          countsAsAction: 'study',
          effects: { money: -20, energy: -14, mental: -5, gwa: -0.08 },
          contextTag: 'studied_afternoon',
          disabled: exhausted,
          disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN kailangan)`,
          disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN required)`,
        },
        {
          id: `aft_featured_${featuredId}`,
          text: `Sumabak sa ${featuredCfg.title} (Playable Minigame!)`,
          textEn: `Take a shift at ${featuredCfg.titleEn} (Playable Minigame!)`,
          hint: `₱${featuredCfg.basePay}–₱${featuredCfg.maxPay} · -${featuredCfg.energyCost} EN`,
          hintEn: `₱${featuredCfg.basePay}–₱${featuredCfg.maxPay} · -${featuredCfg.energyCost} EN`,
          nextBeat: 'evening',
          advanceToMinute: 1110,
          triggerMinigame: featuredId,
          contextTag: 'worked_shift',
          disabled: !featuredGate.allowed,
          disabledReasonTl: featuredGate.reasonTl,
          disabledReasonEn: featuredGate.reasonEn,
        },
        {
          id: 'aft_all_jobs',
          text: schGate.allowed
            ? 'Tignan lahat ng Raket Minigames & Scholarship Quest!'
            : 'Pumili sa iba pang Raket Minigames (Carinderia, Fastfood, Tutoring, Freelance...)',
          textEn: schGate.allowed
            ? 'Browse all Side-Hustle Minigames & Scholarship Quest!'
            : 'Pick another Side-Hustle Minigame (Carinderia, Fastfood, Tutoring, Freelance...)',
          hint: `${Math.max(0, MAX_PAID_SHIFTS_PER_DAY - state.workJobsCompletedThisWeek)}/${MAX_PAID_SHIFTS_PER_DAY} shifts left`,
          hintEn: `${Math.max(0, MAX_PAID_SHIFTS_PER_DAY - state.workJobsCompletedThisWeek)}/${MAX_PAID_SHIFTS_PER_DAY} shifts left`,
          nextBeat: 'afternoon',
          openJobPicker: true,
        },
        {
          id: 'aft_org',
          text: 'Tumulong kay Carlo sa Student Org Booth at makipag-network',
          textEn: 'Help Carlo run the Student Org Booth and build connections',
          hint: '-₱30 · -10 EN · +6 MH · +10 Social · -0.02 GWA',
          hintEn: '-₱30 · -10 EN · +6 MH · +10 Social · -0.02 GWA',
          nextBeat: 'evening',
          advanceToMinute: 1110,
          countsAsAction: 'org',
          effects: {
            money: -30,
            energy: -10,
            mental: 6,
            social: 10,
            gwa: -0.02,
            relationships: { carlo: 5 },
          },
          contextTag: 'did_org',
          disabled: exhausted,
          disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN kailangan)`,
          disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN required)`,
        },
        {
          id: 'aft_nap',
          text: 'Umuwi nang maaga at mag-power nap sa kwarto',
          textEn: 'Head home early and take a proper power nap',
          hint: '+22 EN · +12 MH · ₱0',
          hintEn: '+22 EN · +12 MH · ₱0',
          nextBeat: 'evening',
          advanceToMinute: 1110,
          countsAsAction: 'rest',
          effects: { energy: 22, mental: 12 },
          contextTag: 'napped_afternoon',
        },
      ],
    };
  }

  // 6. EVENING (06:30 PM)
  if (beat === 'evening') {
    const isDecember = cal.monthShort === 'Dec';
    const eveBg = isDecember ? 'bg_christmas_parol' : homeBg;
    const shiftsLeft = Math.max(0, MAX_PAID_SHIFTS_PER_DAY - state.workJobsCompletedThisWeek);
    const dinnerCost = isBoarding ? -35 : 0;

    return {
      id: `daily_${state.totalWeeks}_evening`,
      beat: 'evening',
      beatLabelTl: 'Gabi',
      beatLabelEn: 'Evening',
      locationTl: isDecember
        ? 'Disyembre · Gabi ng Parol'
        : isBoarding
          ? 'Boarding House · 06:30 PM'
          : 'Bahay · Hapunan (06:30 PM)',
      locationEn: isDecember
        ? 'December · Parol-Lit Evening'
        : isBoarding
          ? 'Boarding House · 6:30 PM'
          : 'Home · Dinner (6:30 PM)',
      background: eveBg,
      characters: [
        { id: 'player', sprite: state.stats.energy < 25 ? 'player_worried' : 'player_neutral', position: 'left' },
        { id: 'mama', sprite: 'mama_happy', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Narrator',
          text: isDecember
            ? `06:30 PM — Umiilaw na ang mga parol sa labas at malamig ang simoy ng Disyembre (${cal.tempC}°C)! Amoy bibingka sa kanto.`
            : tags.has('worked_shift')
              ? `06:30 PM — Ngalay ang mga paa mo galing sa raket, pero buo ang loob mo habang binibilang ang barya at papel sa pitaka.`
              : `06:30 PM — Lumubog na ang araw at tahimik na ang paligid. May oras ka pa para sa hapunan, pamilya, o huling hirit ng araw.`,
          textEn: isDecember
            ? `06:30 PM — Capiz star parols glow outside in the cool December breeze (${cal.tempC}°C)! Warm bibingka scents drift down the corner.`
            : tags.has('worked_shift')
              ? `06:30 PM — Your feet ache from today’s shift, yet counting your hard-earned pesos brings a proud smile.`
              : `06:30 PM — Sunset fades into calm evening light. You still have time for dinner, family, or one final evening push.`,
        },
        {
          speaker: 'Mama',
          text: isBoarding
            ? `Ring... ring! Video call mula kay Mama: "Kumusta araw mo {name}? Kumain ka na ba ng hapunan diyan sa boarding house?"`
            : `"Tara na {name}, nakahain na ang hapunan! Ikwento mo naman kung anong nangyari ngayong ${cal.monthShort} ${cal.dayOfMonth}."`,
          textEn: isBoarding
            ? `Ring... ring! Video call from Mama: "How was your day {name}? Did you eat dinner yet over at the boarding house?"`
            : `"Come eat {name}, dinner’s on the table! Tell me all about how ${cal.monthShort} ${cal.dayOfMonth} went."`,
        },
      ],
      choices: [
        {
          id: 'eve_dinner_mama',
          text: isBoarding
            ? 'Kumain ng hapunan habang ka-video call si Mama'
            : 'Sabay maghapunan at makipag-kwentuhan kay Mama',
          textEn: isBoarding
            ? 'Eat dinner while catching up with Mama on video call'
            : 'Share dinner and a warm heart-to-heart with Mama',
          hint:
            dinnerCost === 0
              ? 'Libreng Hapunan · +12 EN · +12 MH · +5 Pamilya'
              : '-₱35 · +12 EN · +12 MH · +5 Pamilya',
          hintEn:
            dinnerCost === 0
              ? 'Free Home Dinner · +12 EN · +12 MH · +5 Family'
              : '-₱35 · +12 EN · +12 MH · +5 Family',
          nextBeat: 'bedtime',
          advanceToMinute: 1290,
          countsAsAction: 'family',
          effects: {
            money: dinnerCost,
            energy: 12,
            mental: 12,
            social: 5,
            relationships: { family: 5 },
          },
          contextTag: 'called_mama',
        },
        {
          id: 'eve_night_study',
          text: 'Buksan ang desk lamp at mag-night review bago matulog',
          textEn: 'Switch on your desk lamp for a quiet night review session',
          hint: '-13 EN · -5 MH · -0.07 GWA',
          hintEn: '-13 EN · -5 MH · -0.07 GWA',
          nextBeat: 'bedtime',
          advanceToMinute: 1320,
          countsAsAction: 'study',
          effects: { energy: -13, mental: -5, gwa: -0.07 },
          contextTag: 'night_review',
          disabled: exhausted,
          disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN kailangan)`,
          disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN required)`,
        },
        ...(shiftsLeft > 0
          ? [
              {
                id: 'eve_late_raket',
                text: 'Habol pa ng evening raket shift! (Pili ng Minigame)',
                textEn: 'Squeeze in an evening side-hustle shift! (Pick Minigame)',
                hint: `${shiftsLeft}/${MAX_PAID_SHIFTS_PER_DAY} shifts left`,
                hintEn: `${shiftsLeft}/${MAX_PAID_SHIFTS_PER_DAY} shifts left`,
                nextBeat: 'evening' as DailyStoryBeat,
                openJobPicker: true,
              },
            ]
          : []),
        {
          id: 'eve_wind_down',
          text: 'Makinig sa lo-fi music at magpahinga nang maaga sa kama',
          textEn: 'Listen to chill lo-fi music and unwind early in bed',
          hint: '+16 EN · +10 MH · Maagang Tulog',
          hintEn: '+16 EN · +10 MH · Early Rest',
          nextBeat: 'bedtime',
          advanceToMinute: 1260,
          countsAsAction: 'rest',
          effects: { energy: 16, mental: 10 },
          contextTag: 'early_wind_down',
        },
      ],
    };
  }

  // 7. BEDTIME (10:00 PM — Daily Recap & Sleep -> NEXT_DAY)
  const sleepPreview = getSleepBonus(
    state.minuteOfDay ?? 1290,
    Math.max(2, state.pendingWeeklyActions.length)
  );
  const recapBitsTl: string[] = [];
  const recapBitsEn: string[] = [];
  if (tags.has('aced_class')) {
    recapBitsTl.push('nakapag-recite at lumaban sa klase');
    recapBitsEn.push('you powered through class');
  } else if (tags.has('studied_with_bea')) {
    recapBitsTl.push('nakapag-aral kayo ni Bea');
    recapBitsEn.push('you reviewed with Bea');
  }
  if (tags.has('survived_flood') || tags.has('helped_nena_flood')) {
    recapBitsTl.push('nalampasan mo ang baha ng Habagat');
    recapBitsEn.push('you braved the monsoon flood');
  }
  if (tags.has('worked_shift')) {
    recapBitsTl.push('kumita ka sa raket shift');
    recapBitsEn.push('you earned cash from your hustle');
  }
  if (tags.has('called_mama')) {
    recapBitsTl.push('nakausap mo si Mama');
    recapBitsEn.push('you caught up with Mama');
  }
  if (tags.has('lunch_barkada') || tags.has('did_org')) {
    recapBitsTl.push('may oras ka pa para sa barkada');
    recapBitsEn.push('you bonded with friends');
  }

  const summaryTl =
    recapBitsTl.length > 0
      ? `Ngayong ${cal.monthShort} ${cal.dayOfMonth}, ${recapBitsTl.join(', ')}. Wallet: ₱${state.stats.money.toLocaleString()} · GWA: ${state.stats.gwa.toFixed(2)}.`
      : `Natapos mo ang Day ${day}/365 (${cal.monthShort} ${cal.dayOfMonth}) nang buo ang loob! Wallet: ₱${state.stats.money.toLocaleString()} · GWA: ${state.stats.gwa.toFixed(2)}.`;
  const summaryEn =
    recapBitsEn.length > 0
      ? `On ${cal.monthShort} ${cal.dayOfMonth}, ${recapBitsEn.join(', ')}. Wallet: ₱${state.stats.money.toLocaleString()} · GWA: ${state.stats.gwa.toFixed(2)}.`
      : `You made it through Day ${day}/365 (${cal.monthShort} ${cal.dayOfMonth}) with heart! Wallet: ₱${state.stats.money.toLocaleString()} · GWA: ${state.stats.gwa.toFixed(2)}.`;

  return {
    id: `daily_${state.totalWeeks}_bedtime`,
    beat: 'bedtime',
    beatLabelTl: 'Tulog',
    beatLabelEn: 'Goodnight',
    locationTl: isBoarding ? 'Boarding House · Gabi na' : 'Bahay · Oras ng Tulog',
    locationEn: isBoarding ? 'Boarding House · Bedtime' : 'Home · Bedtime',
    background: homeBg,
    characters: [
      {
        id: 'player',
        sprite: state.stats.mental < 30 ? 'player_worried' : 'player_happy',
        position: 'center',
      },
    ],
    lines: [
      {
        speaker: 'Narrator',
        text: `10:00 PM — Tahimik na ang buong paligid. ${summaryTl}`,
        textEn: `10:00 PM — Quiet settles over the room. ${summaryEn}`,
      },
      {
        speaker: '{name}',
        text: inDebt
          ? `Hinga nang malalim... bukas babawi tayo sa utang. Isang araw na naman ang nalampasan tungo sa diploma!`
          : `Salamat sa araw na ito. Isang hakbang na naman palapit sa graduation stage!`,
        textEn: inDebt
          ? `Deep breath... tomorrow we chip away at the debt. One more day closer to that diploma!`
          : `Grateful for today. One more step closer to walking the graduation stage!`,
      },
    ],
    choices: [
      {
        id: 'bed_sleep_now',
        text: `Matulog nang maaga at simulan ang bukas (Day ${day === 365 ? 1 : day + 1}/365)`,
        textEn: `Sleep now and wake up tomorrow (Day ${day === 365 ? 1 : day + 1}/365)`,
        hint: `${sleepPreview.labelTl} · Daily Baon & Bills`,
        hintEn: `${sleepPreview.labelEn} · Daily Allowance & Bills`,
        nextBeat: 'NEXT_DAY',
        advanceToMinute: 1290,
      },
      ...(state.stats.energy >= 18
        ? [
            {
              id: 'bed_cram_then_sleep',
              text: 'Mag-puyat pa ng 1 oras para mag-memorize bago matulog',
              textEn: 'Stay up 1 extra hour to memorize notes before sleeping',
              hint: '-10 EN · -4 MH · -0.05 GWA → Next Day',
              hintEn: '-10 EN · -4 MH · -0.05 GWA → Next Day',
              nextBeat: 'NEXT_DAY' as const,
              advanceToMinute: 1410,
              countsAsAction: 'study' as const,
              effects: { energy: -10, mental: -4, gwa: -0.05 },
              contextTag: 'crammed_late',
            },
          ]
        : []),
    ],
  };
}

export interface DailyStoryTransition {
  nextState: SaveData;
  launchMinigame?: MinigameId;
  finishDay?: boolean;
}

export function applyDailyStoryChoice(
  state: SaveData,
  choice: DailyStoryChoice
): DailyStoryTransition {
  const isHardcore = state.profile.difficulty === 'hardcore';
  const weekday = getWeekdayInfo(state.totalWeeks);
  const startMin = clamp(state.minuteOfDay ?? DAY_START_MINUTE, DAY_START_MINUTE, DAY_END_MINUTE);
  const nextMin =
    choice.advanceToMinute !== undefined
      ? clamp(Math.max(startMin, choice.advanceToMinute), DAY_START_MINUTE, DAY_END_MINUTE)
      : startMin;

  let adjustedEffects: ChoiceEffects | undefined = choice.effects ? { ...choice.effects } : undefined;
  if (adjustedEffects) {
    // Hardcore energy & work overtime modifiers
    if (isHardcore && adjustedEffects.energy !== undefined && adjustedEffects.energy < 0) {
      adjustedEffects.energy = Math.round(adjustedEffects.energy * 1.15);
    }
    if (
      choice.countsAsAction === 'work' &&
      state.workJobsCompletedThisWeek >= 1 &&
      adjustedEffects.money !== undefined &&
      adjustedEffects.money > 0
    ) {
      adjustedEffects.money = Math.round(adjustedEffects.money * 0.8);
      adjustedEffects.energy = (adjustedEffects.energy ?? 0) - 4;
    }
    if (
      choice.countsAsAction === 'work' &&
      weekday.isWeekend &&
      adjustedEffects.money !== undefined &&
      adjustedEffects.money > 0 &&
      choice.id !== 'wknd_quick_shift'
    ) {
      adjustedEffects.money = Math.round(adjustedEffects.money * 1.15);
    }
    if (
      choice.countsAsAction === 'study' &&
      state.flags.includes('has_org_reviewers') &&
      adjustedEffects.gwa !== undefined
    ) {
      adjustedEffects.gwa = Number((adjustedEffects.gwa - 0.02).toFixed(2));
    }
  }

  let updated = applyChoiceEffects(state, adjustedEffects);

  const nextTags = new Set(updated.dayContextTags ?? []);
  if (choice.contextTag) {
    nextTags.add(choice.contextTag);
  }

  const nextPending = choice.countsAsAction
    ? [...updated.pendingWeeklyActions, choice.countsAsAction]
    : updated.pendingWeeklyActions;

  const block: DailyScheduleBlock = {
    id: `story_${Date.now()}_${(updated.dayActions?.length ?? 0) + 1}`,
    actionId: choice.countsAsAction ?? (choice.triggerMinigame ? 'minigame' : 'wakeup'),
    label: choice.text.slice(0, 32),
    labelEn: choice.textEn.slice(0, 32),
    startMinute: startMin,
    endMinute: nextMin,
  };

  const nextWorkCount =
    choice.countsAsAction === 'work'
      ? updated.workJobsCompletedThisWeek + 1
      : updated.workJobsCompletedThisWeek;

  if (choice.triggerMinigame) {
    const targetBeat: DailyStoryBeat =
      choice.nextBeat === 'NEXT_DAY' ? 'bedtime' : choice.nextBeat;
    updated = signSaveData({
      ...updated,
      minuteOfDay: nextMin,
      hasWokenUpToday: true,
      dayBeat: targetBeat,
      dayContextTags: Array.from(nextTags),
      dayActions: [...(updated.dayActions ?? []), block],
      pendingWeeklyActions: nextPending,
      workJobsCompletedThisWeek: nextWorkCount,
    });
    return { nextState: updated, launchMinigame: choice.triggerMinigame };
  }

  if (choice.nextBeat === 'NEXT_DAY') {
    updated = signSaveData({
      ...updated,
      minuteOfDay: nextMin,
      hasWokenUpToday: true,
      dayBeat: 'bedtime',
      dayContextTags: Array.from(nextTags),
      dayActions: [...(updated.dayActions ?? []), block],
      pendingWeeklyActions: nextPending,
      workJobsCompletedThisWeek: nextWorkCount,
    });
    return { nextState: updated, finishDay: true };
  }

  updated = signSaveData({
    ...updated,
    minuteOfDay: nextMin,
    hasWokenUpToday: true,
    dayBeat: choice.nextBeat,
    dayContextTags: Array.from(nextTags),
    dayActions: [...(updated.dayActions ?? []), block],
    pendingWeeklyActions: nextPending,
    workJobsCompletedThisWeek: nextWorkCount,
  });

  return { nextState: updated };
}
