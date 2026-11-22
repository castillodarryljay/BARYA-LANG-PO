import type {
  CalendarDayInfo,
  DailyStoryBeat,
  DailyStoryChoice,
  DialogueLine,
  SaveData,
  SceneCharacter,
  WeatherId,
} from '../types/game';
import { MAX_PAID_SHIFTS_PER_DAY, MIN_STRENUOUS_ENERGY } from './config';

export interface PhilippineCalendarEvent {
  tl: string;
  en: string;
  isNoClass?: boolean;
  noteTl?: string;
  noteEn?: string;
}

/**
 * Authentic Philippine DepEd & National Observances across all 12 months (June -> May).
 */
export const PHILIPPINE_MONTHLY_THEMES: Record<
  string,
  { tl: string; en: string }
> = {
  Jun: { tl: 'Oplan Balik Eskwela & Brigada', en: 'School Opening & Brigada Eskwela' },
  Jul: { tl: 'Buwan ng Nutrisyon (Nutrition Month)', en: 'National Nutrition Month' },
  Aug: { tl: 'Buwan ng Wikang Pambansa', en: 'National Language & History Month' },
  Sep: { tl: 'Science & Math · Simula ng -Ber Months', en: 'Science Month · -Ber Months' },
  Oct: { tl: 'World Teachers’ & UN Month', en: 'Teachers’ & United Nations Month' },
  Nov: { tl: 'Filipino Values & Book Week', en: 'Filipino Values & Book Week' },
  Dec: { tl: 'Simbang Gabi & Paskong Pinoy', en: 'Simbang Gabi & Christmas Season' },
  Jan: { tl: 'Bagong Taon & Zero Waste Month', en: 'New Year & Zero Waste Month' },
  Feb: { tl: 'Buwan ng Sining (National Arts Month)', en: 'National Arts & Love Month' },
  Mar: { tl: 'Fire Prevention & Women’s Month', en: 'Fire Prevention & Women’s Month' },
  Apr: { tl: 'Buwan ng Panitikan · Peak Heat Season', en: 'Literature Month · Peak Heat Season' },
  May: { tl: 'Summer Break & Flores de Mayo', en: 'Summer Break & Town Fiestas' },
};

/**
 * Real Philippine Holidays, DepEd/Campus Milestones, & Cultural Days mapped accurately
 * to Day 1 (June 1) -> Day 365 (May 31).
 */
export const PHILIPPINE_CALENDAR_EVENTS: Record<number, PhilippineCalendarEvent> = {
  // JUNE (Day 1..30)
  1: {
    tl: 'Unang Araw ng Pasukan (Oplan Balik Eskwela)',
    en: 'First Day of School (Oplan Balik Eskwela)',
    noteTl: 'Amoy bagong notebook, bagong plantsang uniporme, at kilalanan sa klase!',
    noteEn: 'Fresh notebooks, crisp uniforms, and meeting classmates for the new school year!',
  },
  5: {
    tl: 'Brigada Eskwela Campus Clean-Up',
    en: 'Brigada Eskwela Campus Clean-Up',
  },
  12: {
    tl: 'Araw ng Kalayaan (Independence Day · Walang Pasok!)',
    en: 'Philippine Independence Day (National Holiday · No Class!)',
    isNoClass: true,
    noteTl: 'Kumakaway ang watawat ng Pilipinas sa plaza at kalsada!',
    noteEn: 'Philippine flags wave proudly along plazas and avenues nationwide!',
  },
  24: {
    tl: 'DepEd Founding Anniversary & Araw ng Maynila',
    en: 'DepEd Founding Anniversary & Manila Day',
  },

  // JULY (Day 31..61)
  31: {
    tl: 'Nutrition Month Kickoff (Gulayan sa Paaralan)',
    en: 'National Nutrition Month Kickoff',
  },
  48: {
    tl: 'Habagat Monsoon Watch · Baha Alert',
    en: 'Habagat Southwest Monsoon Rain Advisory',
  },
  58: {
    tl: 'Nutrition Month Culmination & Slogan Contest',
    en: 'Nutrition Month Culmination & Poster Contest',
  },

  // AUGUST (Day 62..92)
  62: {
    tl: 'Buwan ng Wikang Pambansa Opening',
    en: 'Buwan ng Wika Opening Ceremony',
  },
  75: {
    tl: 'Buwan ng Wika · Sabayang Pagbigkas Prep',
    en: 'Buwan ng Wika · Speech Choir Rehearsals',
  },
  82: {
    tl: 'Ninoy Aquino Day (Walang Pasok!)',
    en: 'Ninoy Aquino Day (Special Non-Working Holiday)',
    isNoClass: true,
  },
  89: {
    tl: 'Buwan ng Wika Culmination (Barong & Filipiniana Day!)',
    en: 'Buwan ng Wika Culmination (Filipiniana & Barong Day!)',
  },
  92: {
    tl: 'Araw ng mga Bayani (National Heroes Day · Walang Pasok!)',
    en: 'National Heroes Day (Regular Holiday · No Class!)',
    isNoClass: true,
  },

  // SEPTEMBER (Day 93..122)
  93: {
    tl: 'Sept 1 · Simula ng -Ber Months!',
    en: 'Sept 1 · Start of Philippine -Ber Months!',
    noteTl: 'Tumutugtog na si Jose Mari Chan sa mall at jeepney!',
    noteEn: 'Christmas songs are already playing in malls and jeepneys!',
  },
  97: {
    tl: 'National Teachers’ Month Kickoff',
    en: 'National Teachers’ Month Kickoff',
  },
  112: {
    tl: 'Sem 1 Midterm Exam Week',
    en: 'Semester 1 Midterm Exam Week',
  },
  118: {
    tl: 'Campus Science & Math Fair',
    en: 'Campus Science & Math Fair',
  },

  // OCTOBER (Day 123..153)
  127: {
    tl: 'World Teachers’ Day (Tribute to Prof. Reyes!)',
    en: 'World Teachers’ Day (Campus Appreciation Day!)',
  },
  146: {
    tl: 'United Nations Month Parade & Pageant',
    en: 'United Nations Month Cultural Parade',
  },
  153: {
    tl: 'Bisperas ng Undas · Uwian sa Probinsya (Walang Pasok)',
    en: 'Undas Eve · Provincial Bus Rush (No Class)',
    isNoClass: true,
  },

  // NOVEMBER (Day 154..183)
  154: {
    tl: 'Undas · All Saints’ Day (Walang Pasok!)',
    en: 'All Saints’ Day · Undas (Holiday · No Class!)',
    isNoClass: true,
    noteTl: 'Kandila, bulaklak, at tahimik na pag-alala kasama ang pamilya.',
    noteEn: 'Candles, flowers, and quiet remembrance with family.',
  },
  155: {
    tl: 'All Souls’ Day · Undas Break (Walang Pasok)',
    en: 'All Souls’ Day · Undas Break (No Class)',
    isNoClass: true,
  },
  178: {
    tl: 'National Book Week & Sem 1 Final Exams',
    en: 'National Book Week & Sem 1 Final Exams',
  },
  183: {
    tl: 'Bonifacio Day (Araw ni Andres Bonifacio · Walang Pasok!)',
    en: 'Bonifacio Day (Regular National Holiday · No Class!)',
    isNoClass: true,
  },

  // DECEMBER (Day 184..214)
  191: {
    tl: 'Feast of the Immaculate Conception (Walang Pasok!)',
    en: 'Feast of the Immaculate Conception (Holiday · No Class!)',
    isNoClass: true,
  },
  199: {
    tl: 'Unang Simbang Gabi · Bibingka & Puto Bumbong!',
    en: 'First Day of Simbang Gabi · Dawn Mass & Puto Bumbong!',
  },
  202: {
    tl: 'Class Christmas Party & Monito-Monita!',
    en: 'Class Christmas Party & Secret Santa Exchange!',
  },
  207: {
    tl: 'Bisperas ng Pasko · Noche Buena (Christmas Break)',
    en: 'Christmas Eve · Noche Buena (Holiday Break)',
    isNoClass: true,
  },
  208: {
    tl: 'Maligayang Pasko! (Christmas Day · Walang Pasok!)',
    en: 'Merry Christmas! (Regular Holiday · No Class!)',
    isNoClass: true,
  },
  213: {
    tl: 'Rizal Day (Araw ni Jose Rizal · Walang Pasok!)',
    en: 'Rizal Day (Regular Holiday · No Class!)',
    isNoClass: true,
  },
  214: {
    tl: 'Bisperas ng Bagong Taon · Media Noche (Walang Pasok)',
    en: 'New Year’s Eve · Media Noche (Holiday Break)',
    isNoClass: true,
  },

  // JANUARY (Day 215..245)
  215: {
    tl: 'Manigong Bagong Taon! (New Year’s Day · Walang Pasok!)',
    en: 'Happy New Year! (Regular Holiday · No Class!)',
    isNoClass: true,
  },
  219: {
    tl: 'Balik-Eskwela After Christmas Break!',
    en: 'Classes Resume After Holiday Break!',
  },
  232: {
    tl: 'Sinulog & Ati-Atihan Festival Spirit',
    en: 'Sinulog & Ati-Atihan Festival Weekend',
  },
  239: {
    tl: 'Dinagyang & Zero Waste Campus Drive',
    en: 'Dinagyang & Campus Zero Waste Drive',
  },

  // FEBRUARY (Day 246..273)
  246: {
    tl: 'National Arts Month (Buwan ng Sining) Kickoff',
    en: 'National Arts Month Kickoff',
  },
  259: {
    tl: 'Araw ng mga Puso · Campus Fair & Dedication Booth',
    en: 'Valentine’s Day · Campus Fair & Music Booth',
  },
  266: {
    tl: 'Campus Intramurals & Foundation Week!',
    en: 'Campus Intramurals & Foundation Week!',
  },
  270: {
    tl: 'EDSA People Power Anniversary',
    en: 'EDSA People Power Anniversary',
  },

  // MARCH (Day 274..304)
  274: {
    tl: 'Fire Prevention Month · Campus Fire Drill!',
    en: 'Fire Prevention Month · Campus Fire Drill!',
  },
  281: {
    tl: 'International Women’s Day (Women’s Month)',
    en: 'International Women’s Day Celebration',
  },
  288: {
    tl: 'Sem 2 Midterm Exam Week',
    en: 'Semester 2 Midterm Exam Week',
  },
  301: {
    tl: 'Thesis & Capstone Pre-Defense Crunch',
    en: 'Thesis & Capstone Pre-Defense Week',
  },

  // APRIL (Day 305..334)
  313: {
    tl: 'Araw ng Kagitingan (Day of Valor · Walang Pasok!)',
    en: 'Day of Valor / Araw ng Kagitingan (Holiday · No Class!)',
    isNoClass: true,
  },
  318: {
    tl: 'PAGASA 43°C Heat Index · Modular / ADM Shift!',
    en: 'PAGASA 43°C Extreme Heat · Asynchronous Class Shift!',
    isNoClass: true,
  },
  321: {
    tl: 'Huwebes Santo · Semana Santa (Walang Pasok!)',
    en: 'Maundy Thursday · Holy Week (Holiday · No Class!)',
    isNoClass: true,
  },
  322: {
    tl: 'Biyernes Santo · Semana Santa (Walang Pasok!)',
    en: 'Good Friday · Holy Week (Holiday · No Class!)',
    isNoClass: true,
  },
  329: {
    tl: 'Final Clearance Signing & Grade Consultation!',
    en: 'Final Clearance Signing & Grade Consultation!',
  },

  // MAY (Day 335..365)
  335: {
    tl: 'Araw ng Manggagawa (Labor Day · Walang Pasok!)',
    en: 'Labor Day (Regular National Holiday · No Class!)',
    isNoClass: true,
  },
  349: {
    tl: 'Barangay Fiesta & Flores de Mayo!',
    en: 'Town Fiesta & Flores de Mayo!',
    isNoClass: true,
  },
  358: {
    tl: 'Oplan Balik Eskwela & Early Registration',
    en: 'Oplan Balik Eskwela & Early Registration',
  },
  365: {
    tl: 'Moving-Up & Year-End Recognition Day!',
    en: 'Moving-Up & Year-End Recognition Day!',
  },
};

export const DAILY_ULAM_MENU: { tl: string; en: string }[] = [
  { tl: 'ginisang munggo na may chicharon', en: 'sautéed munggo with crispy chicharon' },
  { tl: 'chicken adobo na may itlog', en: 'savory chicken adobo with boiled egg' },
  { tl: 'sinigang na baboy na maasim-asim', en: 'tangy pork sinigang soup' },
  { tl: 'tinolang manok na may sayote at malunggay', en: 'ginger chicken tinola with malunggay' },
  { tl: 'tortang talong at bagoong', en: 'crispy eggplant omelet with rice' },
  { tl: 'bistek tagalog na maraming sibuyas', en: 'beef bistek topped with onion rings' },
  { tl: 'pinakbet na may pritong galunggong', en: 'veggie pinakbet with fried galunggong' },
  { tl: 'pork menudo at mainit na sabaw', en: 'pork menudo with free hot broth' },
  { tl: 'maanghang na Bicol Express', en: 'spicy creamy Bicol Express' },
  { tl: 'siomai rice na may chili garlic at toyomansi', en: 'siomai rice with chili garlic and toyomansi' },
  { tl: 'paksiw na bangus at pritong talong', en: 'vinegar-simmered bangus and fried eggplant' },
  { tl: 'ginataang kalabasa at sitaw', en: 'squash and string beans in coconut milk' },
  { tl: 'lumpiang shanghai at sweet chili sauce', en: 'crispy lumpiang shanghai with sweet chili' },
  { tl: 'tokwa’t baboy at lugaw special', en: 'tokwa’t baboy with warm rice porridge' },
];

export const DAILY_SLICE_OF_LIFE_BUZZ: { tl: string; en: string }[] = [
  {
    tl: 'Rinig sa kanto ang sigaw ng nagtitinda ng mainit na taho ("Tahooo!").',
    en: 'A morning taho vendor calls down the street ("Tahooo!").',
  },
  {
    tl: 'May dumaang jeepney na naka-full blast ang 90s OPM playlist.',
    en: 'A passing jeepney blasts classic 90s OPM rock from its speakers.',
  },
  {
    tl: 'Amoy bagong lutong pandesal mula sa bakery sa kabilang kanto.',
    en: 'Freshly baked pandesal drifts from the neighborhood pugon bakery.',
  },
  {
    tl: 'Natutulog ang sikat na campus cat sa ibabaw ng concrete bench malapit sa gate.',
    en: 'The famous campus cat naps peacefully on the concrete bench by the gate.',
  },
  {
    tl: 'Nagkukuwentuhan ang mga tricycle driver sa TODA tungkol sa presyo ng gasolina.',
    en: 'Tricycle drivers at the TODA terminal debate today’s rising gas prices.',
  },
  {
    tl: 'Pila-pila ang mga estudyante sa kariton ng kwek-kwek at malamig na samalamig.',
    en: 'Students line up around the orange kwek-kwek and cold gulaman cart.',
  },
  {
    tl: 'May tumutugtog ng gitara sa ilalim ng puno ng mangga sa campus quadrangle.',
    en: 'Someone strums an acoustic guitar beneath the mango tree on campus.',
  },
  {
    tl: 'Umuugong ang printing shop sa tapat dahil sabay-sabay ang pasahan ng papers.',
    en: 'The print shop across the street hums non-stop with last-minute essay submissions.',
  },
  {
    tl: 'Nagsisigawan sa tuwa ang mga bata sa half-court basketball game sa barangay.',
    en: 'Neighborhood kids cheer over a lively half-court basketball game down the alley.',
  },
  {
    tl: 'Amoy bananacue at turon na may langka mula sa meryendahan sa kanto.',
    en: 'Caramelized banana-cue and crispy turon perfume the afternoon breeze.',
  },
  {
    tl: 'Nag-aabang ang buong klase kung mag-a-announce si Mayor ng maagang dismissal.',
    en: 'Everyone keeps refreshing the local LGU page hoping for a surprise weather update.',
  },
  {
    tl: 'May nagpa-practice ng cheerdance at drumline sa covered court.',
    en: 'Drums echo from the covered court as student orgs rehearse for campus week.',
  },
];

export function computeRealisticTempC(
  season: 'habagat' | 'amihan' | 'tag_init',
  weather: WeatherId,
  dayOfYear: number
): number {
  const variance = (dayOfYear * 7) % 4; // 0..3°C daily realistic swing
  if (season === 'tag_init') {
    if (weather === 'hot') return 40 + variance; // 40..43°C PAGASA Heat Index!
    if (weather === 'sunny') return 36 + variance;
    return 33 + variance;
  }
  if (season === 'amihan') {
    if (weather === 'breezy') return 23 + variance; // 23..26°C cool Amihan
    if (weather === 'rainy') return 24 + (variance % 2);
    return 27 + variance;
  }
  // habagat
  if (weather === 'rainy') return 26 + (variance % 3);
  if (weather === 'cloudy') return 29 + (variance % 3);
  return 32 + (variance % 3);
}

export interface RealWorldEncounter {
  id: string;
  beat: DailyStoryBeat;
  tagTl: string;
  tagEn: string;
  locationTl: string;
  locationEn: string;
  background: string;
  characters: SceneCharacter[];
  lines: DialogueLine[];
  choices: DailyStoryChoice[];
}

/**
 * Deterministically picks at most 1 authentic real-world Filipino student problem/event
 * for a specific beat on this day (based on season, weather, course, family, and day seed)
 * so every day has distinct real-life texture without feeling repetitive!
 */
export function getDailyRealWorldEncounter(
  state: SaveData,
  cal: CalendarDayInfo,
  beat: DailyStoryBeat,
  isWeekend: boolean
): RealWorldEncounter | null {
  const day = cal.dayOfYear;
  const total = state.totalWeeks;
  const exhausted = state.stats.energy < MIN_STRENUOUS_ENERGY;
  const isNoClass = Boolean(cal.isHolidayOrBreak || isWeekend);
  const isBoarding = state.chapter.startsWith('college') && state.profile.isProvincial;
  const subjectName = state.subjects[day % state.subjects.length]?.name ?? state.profile.course;

  // Assign each day a dedicated "headline encounter beat" so each day gets 1 crisp real-life moment
  // (on Day 1, skip interrupting wake_up/commute/morning_campus so player experiences clean opening first,
  //  and fire a fun real-world encounter in Afternoon or Evening!)
  const targetBeatPool: DailyStoryBeat[] = isNoClass
    ? ['commute', 'lunch', 'afternoon', 'evening']
    : ['commute', 'morning_campus', 'lunch', 'afternoon', 'evening'];
  const headlineBeat: DailyStoryBeat =
    total === 1
      ? 'afternoon'
      : targetBeatPool[(day * 3 + total * 5) % targetBeatPool.length];

  if (beat !== headlineBeat) return null;

  // Build eligible real-world encounters for this beat
  const candidates: RealWorldEncounter[] = [];

  // --- COMMUTE REAL-WORLD PROBLEMS ---
  if (beat === 'commute') {
    if (cal.weather === 'rainy' || cal.season === 'habagat') {
      candidates.push({
        id: `rw_habagat_baha_${total}`,
        beat: 'commute',
        tagTl: 'Habagat Baha Alert',
        tagEn: 'Monsoon Flood Alert',
        locationTl: 'Espanya / Highway · Hanggang Bukong-bukong na Baha',
        locationEn: 'Main Avenue · Ankle-Deep Monsoon Flood',
        background: 'bg_rainy_flood',
        characters: [
          { id: 'player', sprite: 'player_worried', position: 'left' },
          { id: 'miggy', sprite: 'miggy_neutral', position: 'right' },
        ],
        lines: [
          {
            speaker: 'Narrator',
            text: `Buhos ang ulan ng Habagat (${cal.tempC}°C) at abot bukong-bukong na ang tubig-baha sa kanto! Naka-balot ng plastic ang sapatos ng mga commuter.`,
            textEn: `Heavy Habagat rain (${cal.tempC}°C) flooded the corner ankle-deep! Commuters wrap plastic bags around their shoes while checking LGU flood alerts.`,
          },
          {
            speaker: 'Miggy',
            text: `Grabe {name}, stranded na ang mga jeep! P50 singil ng pedicab patawid — lulusong ba tayo o tutulungan muna natin si Aling Nena mag-akyat ng gamit?`,
            textEn: `Wild flood {name}, jeepneys are stalled! Pedicabs charge ₱50 just to cross — wade carefully, pay the pedicab, or help Aling Nena lift her crates?`,
          },
        ],
        choices: [
          {
            id: 'rw_baha_pedicab',
            text: 'Mag-pedicab patawid para tuyo ang uniporme at iwas leptospirosis',
            textEn: 'Pay the pedicab across to stay dry and avoid floodwater illness',
            hint: '-₱50 · -3 EN · +3 MH',
            hintEn: '-₱50 · -3 EN · +3 MH',
            nextBeat: 'morning_campus',
            advanceToMinute: 465,
            effects: { money: -50, energy: -3, mental: 3 },
            contextTag: 'survived_flood',
          },
          {
            id: 'rw_baha_help_nena',
            text: 'Tumulong kay Aling Nena mag-akyat ng kaldero bago tumuloy (+Tip!)',
            textEn: 'Help Aling Nena stack her kitchen supplies above the flood (+Tip!)',
            hint: '+₱85 · -11 EN · +4 Aling Nena',
            hintEn: '+₱85 · -11 EN · +4 Aling Nena',
            nextBeat: 'morning_campus',
            advanceToMinute: 480,
            effects: { money: 85, energy: -11, mental: 2, relationships: { aling_nena: 4 } },
            contextTag: 'helped_nena_flood',
            disabled: exhausted,
            disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN)`,
            disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN)`,
          },
          {
            id: 'rw_baha_wade',
            text: 'I-plastic ang sapatos at lumusong nang maingat kasama si Miggy',
            textEn: 'Tie plastic bags over your shoes and carefully wade through with Miggy',
            hint: '₱0 · -10 EN · -3 MH · +3 Miggy',
            hintEn: '₱0 · -10 EN · -3 MH · +3 Miggy',
            nextBeat: 'morning_campus',
            advanceToMinute: 480,
            effects: { energy: -10, mental: -3, social: 2, relationships: { miggy: 3 } },
            contextTag: 'walked_school',
          },
        ],
      });
    }

    // Tigil-Pasada (Jeepney Transport Strike)
    candidates.push({
      id: `rw_tigil_pasada_${total}`,
      beat: 'commute',
      tagTl: 'Tigil-Pasada · Transport Strike',
      tagEn: 'Jeepney Transport Strike',
      locationTl: 'Sakayan · Walang Dumadaang Jeep',
      locationEn: 'Commuter Stop · Stranded Rush Hour',
      background: 'bg_manila_street',
      characters: [
        { id: 'player', sprite: 'player_surprised', position: 'left' },
        { id: 'miggy', sprite: 'miggy_neutral', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Narrator',
          text: `Breaking news sa radyo at GC ng klase: may nationwide Tigil-Pasada (transport strike) ngayong umaga! Halos walang dumadaang jeep at doble ang haba ng pila.`,
          textEn: `Breaking alert in your class group chat: there’s a jeepney transport strike this morning! Almost no jeepneys are passing and commuter lines double down the block.`,
        },
        {
          speaker: 'Miggy',
          text: `{name}, puno na rin mga modern e-jeep! May libreng sakay truck daw ang LGU pero 40 minutes ang hintayan — o mag-hati tayo sa tricycle?`,
          textEn: `{name}, even the e-jeeps are packed! There’s a free LGU shuttle truck with a 40-minute line — or should we split a tricycle?`,
        },
      ],
      choices: [
        {
          id: 'rw_strike_trike',
          text: 'Maki-hati kay Miggy sa special tricycle para umabot sa oras',
          textEn: 'Split a special tricycle with Miggy to arrive on time',
          hint: '-₱60 · -4 EN · +2 Miggy',
          hintEn: '-₱60 · -4 EN · +2 Miggy',
          nextBeat: 'morning_campus',
          advanceToMinute: 450,
          effects: { money: -60, energy: -4, social: 2, relationships: { miggy: 2 } },
          contextTag: 'took_jeep',
        },
        {
          id: 'rw_strike_libreng_sakay',
          text: 'Pumila sa Libreng Sakay ng LGU habang nagbabasa ng reviewer sa phone',
          textEn: 'Queue for the free LGU shuttle while reviewing notes on your phone',
          hint: '₱0 · -8 EN · -0.02 GWA',
          hintEn: '₱0 · -8 EN · -0.02 GWA',
          nextBeat: 'morning_campus',
          advanceToMinute: 475,
          effects: { energy: -8, gwa: -0.02 },
          contextTag: 'rode_free_shuttle',
        },
        {
          id: 'rw_strike_walk',
          text: 'Mag-brisk walk na lang ng 3 kilometro — tipid pamasahe, bawas antok!',
          textEn: 'Power-walk 3km straight to campus — save every single peso!',
          hint: '₱0 · -13 EN · +2 MH',
          hintEn: '₱0 · -13 EN · +2 MH',
          nextBeat: 'morning_campus',
          advanceToMinute: 480,
          effects: { energy: -13, mental: 2 },
          contextTag: 'walked_school',
          disabled: exhausted,
          disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN)`,
          disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN)`,
        },
      ],
    });

    // Exact Barya Crisis
    candidates.push({
      id: `rw_barya_crisis_${total}`,
      beat: 'commute',
      tagTl: 'Barya Lang Po sa Umaga!',
      tagEn: 'Exact Change Struggle',
      locationTl: 'Jeepney Interior · Morning Commute',
      locationEn: 'Inside Jeepney · Morning Commute',
      background: 'bg_jeepney_interior',
      characters: [
        { id: 'player', sprite: 'player_worried', position: 'left' },
        { id: 'miggy', sprite: 'miggy_happy', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Narrator',
          text: `Nakasakay ka na sa jeep pero pagbukas mo ng pitaka — buong papel lang ang natira at kulang ng barya! Nakasulat sa salamin: "Barya lang po sa umaga."`,
          textEn: `You hop into the jeepney only to realize you’re out of loose coins! Right above the windshield sits the classic sign: "Exact coins only in the morning."`,
        },
        {
          speaker: 'Miggy',
          text: `Hahaha classic yan {name}! Pahiramin muna kita ng bente, o bumaba muna tayo sandali sa sari-sari store para magpabarya?`,
          textEn: `Classic Pinoy commuter moment {name}! Want to borrow ₱20 in coins, break your bill at the sari-sari store, or help pass fares up front?`,
        },
      ],
      choices: [
        {
          id: 'rw_barya_store',
          text: 'Bumili ng ₱15 biscuit sa tindahan para may panukli at baon na rin',
          textEn: 'Buy ₱15 crackers at the sari-sari store to break your bill + snack',
          hint: '-₱35 · +5 EN · +2 MH',
          hintEn: '-₱35 · +5 EN · +2 MH',
          nextBeat: 'morning_campus',
          advanceToMinute: 460,
          effects: { money: -35, energy: 5, mental: 2 },
          contextTag: 'took_jeep',
        },
        {
          id: 'rw_barya_miggy',
          text: 'Hiramin muna ang ₱20 barya ni Miggy (babayaran sa tanghali!)',
          textEn: 'Borrow ₱20 in exact coins from Miggy and pay him back at lunch',
          hint: '-₱20 · -3 EN · +3 Miggy',
          hintEn: '-₱20 · -3 EN · +3 Miggy',
          nextBeat: 'morning_campus',
          advanceToMinute: 450,
          effects: { money: -20, energy: -3, relationships: { miggy: 3 } },
          contextTag: 'took_jeep',
        },
        {
          id: 'rw_barya_help_pass',
          text: 'Umupo sa likod ng driver at mag-abot ng lahat ng bayad ("Estudyante po!")',
          textEn: 'Sit right behind the driver and pass every passenger’s fare accurately',
          hint: '-₱15 · -6 EN · +4 Social',
          hintEn: '-₱15 · -6 EN · +4 Social',
          nextBeat: 'morning_campus',
          advanceToMinute: 450,
          effects: { money: -15, energy: -6, social: 4 },
          contextTag: 'took_jeep',
        },
      ],
    });
  }

  // --- MORNING CAMPUS REAL-WORLD PROBLEMS ---
  if (beat === 'morning_campus' && !isNoClass) {
    // PAGASA Extreme Heat Index (March-May or hot weather)
    if (cal.weather === 'hot' || cal.tempC >= 37) {
      candidates.push({
        id: `rw_heat_index_${total}`,
        beat: 'morning_campus',
        tagTl: `PAGASA ${cal.tempC}°C Heat Index`,
        tagEn: `PAGASA ${cal.tempC}°C Heat Index`,
        locationTl: 'Classroom · Mainit at Walang Aircon',
        locationEn: 'Sweltering Classroom · No Aircon',
        background: 'bg_classroom',
        characters: [
          { id: 'player', sprite: 'player_worried', position: 'left' },
          { id: 'prof', sprite: 'prof_neutral', position: 'center' },
          { id: 'bea', sprite: 'bea_neutral', position: 'right' },
        ],
        lines: [
          {
            speaker: 'Narrator',
            text: `Umabot sa ${cal.tempC}°C ang Heat Index ng PAGASA ngayon! Mainit ang buga ng electric fan sa siksikang classroom — nagpapaypay ng notebook ang buong klase.`,
            textEn: `PAGASA’s heat index climbs to ${cal.tempC}°C today! The wall fans blow warm air across the packed classroom as everyone fans themselves with notebooks.`,
          },
          {
            speaker: 'Prof. Reyes',
            text: `Mabuti pa, half-session muna tayo para walang mahilo sa init. I-upload ko ang asynchronous module sa ${subjectName} — siguraduhing uminom kayo ng tubig!`,
            textEn: `Let’s shorten face-to-face lecture before anyone faints from heat exhaustion. I’ll post the ${subjectName} asynchronous module — stay hydrated!`,
          },
        ],
        choices: [
          {
            id: 'rw_heat_aircon_study',
            text: 'Mag-aral ng module sa aircon na fastfood/study hub kasama si Bea',
            textEn: 'Finish the module in an air-conditioned fastfood corner with Bea',
            hint: '-₱65 · -6 EN · +5 MH · -0.07 GWA',
            hintEn: '-₱65 · -6 EN · +5 MH · -0.07 GWA',
            nextBeat: 'lunch',
            advanceToMinute: 720,
            countsAsAction: 'study',
            effects: { money: -65, energy: -6, mental: 5, gwa: -0.07, relationships: { bea: 4 } },
            contextTag: 'studied_with_bea',
          },
          {
            id: 'rw_heat_hydrate',
            text: 'Bumili ng malamig na buko/tubig at mag-review sa lilim ng campus tree',
            textEn: 'Buy cold water/buko juice and study under the shady campus tree',
            hint: '-₱25 · -8 EN · +2 MH · -0.05 GWA',
            hintEn: '-₱25 · -8 EN · +2 MH · -0.05 GWA',
            nextBeat: 'lunch',
            advanceToMinute: 720,
            countsAsAction: 'attend_class',
            effects: { money: -25, energy: -8, mental: 2, gwa: -0.05 },
            contextTag: 'aced_class',
          },
          {
            id: 'rw_heat_rest',
            text: 'Umuwi muna at magpalamig bago sumakit ang ulo sa heat exhaustion',
            textEn: 'Head home to cool off and hydrate before heat exhaustion hits',
            hint: '₱0 · +12 EN · +6 MH',
            hintEn: '₱0 · +12 EN · +6 MH',
            nextBeat: 'lunch',
            advanceToMinute: 720,
            countsAsAction: 'rest',
            effects: { energy: 12, mental: 6 },
            contextTag: 'rested_morning',
          },
        ],
      });
    }

    // Pabigat / Ghosting Groupmate Drama
    candidates.push({
      id: `rw_pabigat_groupmate_${total}`,
      beat: 'morning_campus',
      tagTl: 'Pabigat Groupmate Crisis',
      tagEn: 'Freeloader Groupmate Drama',
      locationTl: `Classroom · ${subjectName} Reporting`,
      locationEn: `Classroom · ${subjectName} Group Report`,
      background: 'bg_classroom',
      characters: [
        { id: 'player', sprite: 'player_worried', position: 'left' },
        { id: 'bea', sprite: 'bea_neutral', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Narrator',
          text: `15 minutes bago ang group reporting sa ${subjectName}! Pero "Seen" lang ang dalawa ninyong kagrupo sa Messenger at walang gawa sa PowerPoint slides!`,
          textEn: `15 minutes before your ${subjectName} group presentation — and two groupmates left your Messenger chat on "Seen" with zero slides finished!`,
        },
        {
          speaker: 'Bea',
          text: `{name}, nakaka-high blood na ’to! Tayo na lang ba ang magbuhat ng buong report, o maging honest tayo sa peer evaluation ni Prof. Reyes?`,
          textEn: `{name}, my blood pressure is spiking! Do we carry their whole part right now, or submit an honest contribution sheet to Prof. Reyes?`,
        },
      ],
      choices: [
        {
          id: 'rw_pabigat_carry',
          text: 'Buhating dalawa ni Bea ang report para safe ang grade ng grupo',
          textEn: 'Team up with Bea and carry the presentation to protect your grade',
          hint: '-14 EN · -6 MH · -0.08 GWA · +4 Bea',
          hintEn: '-14 EN · -6 MH · -0.08 GWA · +4 Bea',
          nextBeat: 'lunch',
          advanceToMinute: 720,
          countsAsAction: 'attend_class',
          effects: { energy: -14, mental: -6, gwa: -0.08, relationships: { bea: 4 } },
          contextTag: 'aced_class',
          disabled: exhausted,
          disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN)`,
          disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN)`,
        },
        {
          id: 'rw_pabigat_honest',
          text: 'I-report nang patas kay Prof. Reyes ang totoong ambag ng bawat member',
          textEn: 'Give Prof. Reyes an honest, fair breakdown of each member’s work',
          hint: '-8 EN · +5 MH · -0.05 GWA · +4 Prof',
          hintEn: '-8 EN · +5 MH · -0.05 GWA · +4 Prof',
          nextBeat: 'lunch',
          advanceToMinute: 720,
          countsAsAction: 'attend_class',
          effects: { energy: -8, mental: 5, gwa: -0.05, relationships: { prof_reyes: 4, bea: 2 } },
          contextTag: 'aced_class',
        },
        {
          id: 'rw_pabigat_confront',
          text: 'Kausapin nang mahinahon ang kagrupo at bigyan sila ng Q&A part ngayon din',
          textEn: 'Firmly assign the missing groupmates to handle Q&A on the spot',
          hint: '-7 EN · +3 MH · +6 Social · -0.04 GWA',
          hintEn: '-7 EN · +3 MH · +6 Social · -0.04 GWA',
          nextBeat: 'lunch',
          advanceToMinute: 720,
          countsAsAction: 'attend_class',
          effects: { energy: -7, mental: 3, social: 6, gwa: -0.04 },
          contextTag: 'studied_with_bea',
        },
      ],
    });

    // Sudden Ambagan / Lab Manual & Piso-Print Rush
    candidates.push({
      id: `rw_ambagan_print_${total}`,
      beat: 'morning_campus',
      tagTl: 'Urgent Class Ambagan & Print Rush',
      tagEn: 'Surprise Ambagan & Print Rush',
      locationTl: 'Campus Hallway · Piso-Print & Photocopier',
      locationEn: 'Campus Hallway · Photocopy Rush',
      background: 'bg_classroom',
      characters: [
        { id: 'player', sprite: 'player_surprised', position: 'left' },
        { id: 'carlo', sprite: 'carlo_neutral', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Carlo',
          text: `Hala {name}, kailangan daw ng printed lab manual at ₱110 class ambagan ngayong umaga sa ${subjectName} — at nag-jam pa ang piso-print sa tapat!`,
          textEn: `Heads up {name}, we need the printed lab manual and ₱110 class contribution for ${subjectName} today — and the cheap print shop across the street just jammed!`,
        },
        {
          speaker: '{name}',
          text: `Biglaan na naman ang bayarin... kailangan ko munang tignan kung magkano pa ang natitira sa pitaka ko!`,
          textEn: `Another surprise school expense... let me check how much cash is actually left in my wallet!`,
        },
      ],
      choices: [
        {
          id: 'rw_ambagan_pay',
          text: 'Bayaran ang ₱110 ambagan at kumuha ng sariling kopya ng manual',
          textEn: 'Pay the ₱110 fee and get your own crisp copy of the manual',
          hint: '-₱110 · -5 EN · -0.06 GWA',
          hintEn: '-₱110 · -5 EN · -0.06 GWA',
          nextBeat: 'lunch',
          advanceToMinute: 720,
          countsAsAction: 'attend_class',
          effects: { money: -110, energy: -5, gwa: -0.06 },
          contextTag: 'aced_class',
        },
        {
          id: 'rw_ambagan_share',
          text: 'Maki-share ng manual kay Carlo at mag-picture ng pages para makatipid',
          textEn: 'Split one manual with Carlo and take clean notes to save cash',
          hint: '-₱40 · -8 EN · +3 Carlo · -0.04 GWA',
          hintEn: '-₱40 · -8 EN · +3 Carlo · -0.04 GWA',
          nextBeat: 'lunch',
          advanceToMinute: 720,
          countsAsAction: 'attend_class',
          effects: { money: -40, energy: -8, gwa: -0.04, relationships: { carlo: 3 } },
          contextTag: 'studied_with_bea',
        },
        {
          id: 'rw_ambagan_layout',
          text: 'Mag-volunteer mag-type at mag-layout ng digital handout kapalit ng libreng kopya!',
          textEn: 'Offer to format the class digital handout in exchange for a free copy!',
          hint: '₱0 · -12 EN · +5 Social · -0.05 GWA',
          hintEn: '₱0 · -12 EN · +5 Social · -0.05 GWA',
          nextBeat: 'lunch',
          advanceToMinute: 720,
          countsAsAction: 'attend_class',
          effects: { energy: -12, social: 5, gwa: -0.05, relationships: { carlo: 4 } },
          contextTag: 'aced_class',
          disabled: exhausted,
          disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN)`,
          disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN)`,
        },
      ],
    });
  }

  // --- LUNCH REAL-WORLD ENCOUNTERS ---
  if (beat === 'lunch') {
    // Petsa de Peligro (budget crunch or mid-month days 12..15 / 26..30)
    if (state.stats.money < 400 || cal.dayOfMonth >= 25 || (cal.dayOfMonth >= 12 && cal.dayOfMonth <= 15)) {
      candidates.push({
        id: `rw_petsa_de_peligro_${total}`,
        beat: 'lunch',
        tagTl: 'Petsa de Peligro Survival',
        tagEn: 'Pre-Allowance Budget Crunch',
        locationTl: 'Carinderia · Bilangan ng Barya',
        locationEn: 'Eatery · Counting Loose Coins',
        background: 'bg_carinderia',
        characters: [
          { id: 'player', sprite: 'player_worried', position: 'left' },
          { id: 'nena', sprite: 'nena_happy', position: 'center' },
          { id: 'miggy', sprite: 'miggy_happy', position: 'right' },
        ],
        lines: [
          {
            speaker: 'Narrator',
            text: `Petsa de Peligro! Halos puro tig-lilimang piso at piso na lang ang kumakalansing sa bulsa ng mga estudyante habang umaamoy ang ${cal.dailyUlamTl}.`,
            textEn: `It’s "Petsa de Peligro" — that tight stretch right before allowance/payday! Coins clink nervously in pockets while ${cal.dailyUlamEn} simmers on the counter.`,
          },
          {
            speaker: 'Miggy',
            text: `{name}, pareho tayong tipid mode! Hati tayo sa isang order ng ${cal.dailyUlamTl} plus extra rice at unli-sabaw — o mag-lunch rush raket ka kay Aling Nena?`,
            textEn: `{name}, we’re both in survival budget mode! Want to split one serving of ${cal.dailyUlamEn} with extra rice and free soup — or work Aling Nena’s rush shift?`,
          },
        ],
        choices: [
          {
            id: 'rw_pdp_split',
            text: `Maki-hati kay Miggy sa ${cal.dailyUlamTl} + libreng mainit na sabaw`,
            textEn: `Split ${cal.dailyUlamEn} + free hot soup with Miggy`,
            hint: '-₱30 · +13 EN · +8 MH · +4 Miggy',
            hintEn: '-₱30 · +13 EN · +8 MH · +4 Miggy',
            nextBeat: 'afternoon',
            advanceToMinute: 840,
            countsAsAction: 'eat_meal',
            effects: { money: -30, energy: 13, mental: 8, social: 4, relationships: { miggy: 4 } },
            contextTag: 'ate_lunch',
          },
          {
            id: 'rw_pdp_shift',
            text: 'Mag-serve kay Aling Nena ngayong tanghali para may instant cash! (Minigame)',
            textEn: 'Work Aling Nena’s lunch rush right now for instant cash! (Minigame)',
            hint: 'Carinderia Rush · +₱85–₱340 · -16 EN',
            hintEn: 'Carinderia Rush · +₱85–₱340 · -16 EN',
            nextBeat: 'afternoon',
            advanceToMinute: 870,
            triggerMinigame: 'carinderia',
            contextTag: 'worked_shift',
            disabled: state.stats.energy < 16 || state.workJobsCompletedThisWeek >= MAX_PAID_SHIFTS_PER_DAY,
            disabledReasonTl:
              state.workJobsCompletedThisWeek >= MAX_PAID_SHIFTS_PER_DAY
                ? `Max ${MAX_PAID_SHIFTS_PER_DAY} shifts/day naabot na`
                : 'Kulang sa Energy (16 EN)',
            disabledReasonEn:
              state.workJobsCompletedThisWeek >= MAX_PAID_SHIFTS_PER_DAY
                ? `Max ${MAX_PAID_SHIFTS_PER_DAY} shifts/day reached`
                : 'Not enough Energy (16 EN)',
          },
          {
            id: 'rw_pdp_canton',
            text: 'Pancit canton at boiled egg muna — classic Filipino student meal!',
            textEn: 'Instant pancit canton and boiled egg — classic Pinoy student survival!',
            hint: '-₱22 · +10 EN · +3 MH',
            hintEn: '-₱22 · +10 EN · +3 MH',
            nextBeat: 'afternoon',
            advanceToMinute: 840,
            countsAsAction: 'eat_meal',
            effects: { money: -22, energy: 10, mental: 3 },
            contextTag: 'ate_lunch',
          },
        ],
      });
    }

    // Free Food Campus Seminar / Org Pa-Lugaw
    candidates.push({
      id: `rw_free_food_seminar_${total}`,
      beat: 'lunch',
      tagTl: 'Libreng Pagkain sa Campus Seminar!',
      tagEn: 'Free-Food Campus Seminar!',
      locationTl: 'Campus Auditorium · Student Org Event',
      locationEn: 'Campus Auditorium · Free Seminar',
      background: 'bg_canteen',
      characters: [
        { id: 'player', sprite: 'player_happy', position: 'left' },
        { id: 'carlo', sprite: 'carlo_happy', position: 'center' },
        { id: 'crush', sprite: 'crush_happy', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Carlo',
          text: `Psst {name}! May free-entry career talk sa auditorium at may libreng pancit, lumpia, at certificate! Bilis bago maubos ang stub!`,
          textEn: `Psst {name}! There’s a free career talk in the auditorium with free pancit, lumpia, and a seminar certificate! Hurry before stubs run out!`,
        },
        {
          speaker: 'Jamie',
          text: `Sakto! Tara {name}, tabihan natin si Carlo — makakatipid na tayo ng pananghalian, dagdag pa sa resume!`,
          textEn: `Perfect timing! Come on {name}, let’s sit with Carlo — we save lunch money AND pick up a certificate!`,
        },
      ],
      choices: [
        {
          id: 'rw_sem_attend',
          text: 'Sumama kina Jamie at Carlo — libreng tanghalian + certificate!',
          textEn: 'Join Jamie and Carlo — free lunch + seminar certificate!',
          hint: '₱0 · +14 EN · +9 MH · +5 Jamie · -0.02 GWA',
          hintEn: '₱0 · +14 EN · +9 MH · +5 Jamie · -0.02 GWA',
          nextBeat: 'afternoon',
          advanceToMinute: 840,
          countsAsAction: 'eat_meal',
          effects: {
            energy: 14,
            mental: 9,
            social: 6,
            gwa: -0.02,
            relationships: { crush: 5, carlo: 3 },
          },
          contextTag: 'ate_lunch',
        },
        {
          id: 'rw_sem_volunteer',
          text: 'Tumulong mag-abot ng food packs sa registration desk (+Extra Pack!)',
          textEn: 'Volunteer at the food distribution table (+Take-Home Pack!)',
          hint: '₱0 · +18 EN · +6 MH · +5 Carlo',
          hintEn: '₱0 · +18 EN · +6 MH · +5 Carlo',
          nextBeat: 'afternoon',
          advanceToMinute: 840,
          countsAsAction: 'org',
          effects: { energy: 18, mental: 6, social: 7, relationships: { carlo: 5 } },
          contextTag: 'did_org',
        },
        {
          id: 'rw_sem_skip_study',
          text: 'Ipagpaubaya sa iba at mag-quiet lunch kay Aling Nena na lang',
          textEn: 'Leave the stubs for others and eat quietly at Aling Nena’s',
          hint: '-₱45 · +15 EN · +6 MH · +2 Aling Nena',
          hintEn: '-₱45 · +15 EN · +6 MH · +2 Aling Nena',
          nextBeat: 'afternoon',
          advanceToMinute: 840,
          countsAsAction: 'eat_meal',
          effects: { money: -45, energy: 15, mental: 6, relationships: { aling_nena: 2 } },
          contextTag: 'ate_lunch',
        },
      ],
    });
  }

  // --- AFTERNOON REAL-WORLD ENCOUNTERS ---
  if (beat === 'afternoon') {
    // Course-specific authentic Filipino student problem!
    const course = state.profile.course;
    const strand = state.profile.strand;
    const isTech = course === 'BSIT' || course === 'BSCS' || strand === 'TVL-ICT';
    const isNursing = course === 'Nursing';
    const isEng = course === 'Engineering' || strand === 'STEM';

    if (isTech) {
      candidates.push({
        id: `rw_course_tech_${total}`,
        beat: 'afternoon',
        tagTl: `${course} Lab Crunch`,
        tagEn: `${course} Lab Emergency`,
        locationTl: 'Computer Lab · Biglang Nag-Crash ang PC!',
        locationEn: 'Computer Lab · Unsaved Code Crash!',
        background: 'bg_computer_lab',
        characters: [
          { id: 'player', sprite: 'player_surprised', position: 'left' },
          { id: 'bea', sprite: 'bea_neutral', position: 'right' },
        ],
        lines: [
          {
            speaker: 'Narrator',
            text: `Biglang kumurap ang kuryente sa Computer Lab at nag-reboot ang PC mo! Hindi naka-auto-save ang huling 200 lines ng code mo para sa ${subjectName}!`,
            textEn: `Power flickers in the Computer Lab and your PC reboots! The last 200 lines of your ${subjectName} project weren’t committed yet!`,
          },
          {
            speaker: 'Bea',
            text: `Hinga malalim {name}! May backup copy ka ba sa flash drive mo, o sabay nating i-debug mabilis habang bukas pa ang lab?`,
            textEn: `Deep breath {name}! Do you have a flash drive backup, or should we speed-rebuild it together while the lab is still open?`,
          },
        ],
        choices: [
          {
            id: 'rw_tech_rebuild',
            text: 'Mag-focus at i-rebuild ang code kasama si Bea (with Git commits na!)',
            textEn: 'Lock in and rebuild cleanly with Bea (committing to Git this time!)',
            hint: '-13 EN · -4 MH · -0.09 GWA · +4 Bea',
            hintEn: '-13 EN · -4 MH · -0.09 GWA · +4 Bea',
            nextBeat: 'evening',
            advanceToMinute: 1110,
            countsAsAction: 'study',
            effects: { energy: -13, mental: -4, gwa: -0.09, relationships: { bea: 4 } },
            contextTag: 'studied_afternoon',
            disabled: exhausted,
            disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN)`,
            disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN)`,
          },
          {
            id: 'rw_tech_freelance_mg',
            text: 'Ayusin muna ang paid freelance layout bug para may pang-load at kape! (Minigame)',
            textEn: 'Clear a paying freelance tech task first for coffee & data money! (Minigame)',
            hint: 'Freelance Minigame · +₱160–₱520 · -17 EN',
            hintEn: 'Freelance Minigame · +₱160–₱520 · -17 EN',
            nextBeat: 'evening',
            advanceToMinute: 1110,
            triggerMinigame: 'freelance',
            contextTag: 'worked_shift',
            disabled: state.stats.energy < 17 || state.workJobsCompletedThisWeek >= MAX_PAID_SHIFTS_PER_DAY,
            disabledReasonTl:
              state.workJobsCompletedThisWeek >= MAX_PAID_SHIFTS_PER_DAY
                ? `Max ${MAX_PAID_SHIFTS_PER_DAY} shifts/day naabot na`
                : 'Kulang sa Energy (17 EN)',
            disabledReasonEn:
              state.workJobsCompletedThisWeek >= MAX_PAID_SHIFTS_PER_DAY
                ? `Max ${MAX_PAID_SHIFTS_PER_DAY} shifts/day reached`
                : 'Not enough Energy (17 EN)',
          },
          {
            id: 'rw_tech_all_jobs',
            text: 'Tignan lahat ng Raket Minigames & Scholarship Quest',
            textEn: 'Browse all Side-Hustle Minigames & Scholarship Quest',
            hint: 'Open Raket List',
            hintEn: 'Open Jobs List',
            nextBeat: 'afternoon',
            openJobPicker: true,
          },
          {
            id: 'rw_tech_rest',
            text: 'Huminga muna at magpahinga — mas madaling mag-debug pag malinaw ang isip',
            textEn: 'Step away and rest — fresh eyes debug twice as fast',
            hint: '+20 EN · +11 MH',
            hintEn: '+20 EN · +11 MH',
            nextBeat: 'evening',
            advanceToMinute: 1110,
            countsAsAction: 'rest',
            effects: { energy: 20, mental: 11 },
            contextTag: 'napped_afternoon',
          },
        ],
      });
    } else if (isNursing) {
      candidates.push({
        id: `rw_course_nursing_${total}`,
        beat: 'afternoon',
        tagTl: 'Nursing Return-Demo Crunch',
        tagEn: 'Nursing Clinical Return-Demo',
        locationTl: 'Skills Lab · Return Demo Practice',
        locationEn: 'Nursing Skills Lab · Return Demo',
        background: 'bg_classroom',
        characters: [
          { id: 'player', sprite: 'player_worried', position: 'left' },
          { id: 'bea', sprite: 'bea_happy', position: 'right' },
        ],
        lines: [
          {
            speaker: 'Narrator',
            text: `May practical return-demo checklist ka sa Skills Lab! Namumuti na ang kamay mo sa alcohol at kabado ka sa sterile gloving steps.`,
            textEn: `Practical return-demo check in the Nursing Skills Lab! Your hands smell like rubbing alcohol as you rehearse every sterile gloving step.`,
          },
          {
            speaker: 'Bea',
            text: `Kaya mo yan {name}! Sabay tayo mag-practice ng vital signs at checklist — o mag-raket muna tayo pang-RLE supplies?`,
            textEn: `You’ve got this {name}! Let’s drill vital signs and checklists together — or do you need a quick shift for RLE supplies?`,
          },
        ],
        choices: [
          {
            id: 'rw_nurs_practice',
            text: 'Mag-drill ng vital signs at sterile checklist kasama si Bea',
            textEn: 'Drill vital signs and sterile checklist with Bea',
            hint: '-13 EN · -3 MH · -0.09 GWA · +4 Bea',
            hintEn: '-13 EN · -3 MH · -0.09 GWA · +4 Bea',
            nextBeat: 'evening',
            advanceToMinute: 1110,
            countsAsAction: 'study',
            effects: { energy: -13, mental: -3, gwa: -0.09, relationships: { bea: 4 } },
            contextTag: 'studied_afternoon',
            disabled: exhausted,
            disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN)`,
            disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN)`,
          },
          {
            id: 'rw_nurs_jobs',
            text: 'Pumili ng Raket Minigame pang-RLE fees o Scholarship Quest',
            textEn: 'Pick a Side-Hustle Minigame for RLE fees or Scholarship Quest',
            hint: 'Open Raket List',
            hintEn: 'Open Jobs List',
            nextBeat: 'afternoon',
            openJobPicker: true,
          },
          {
            id: 'rw_nurs_rest',
            text: 'Mag-power nap muna — bawal ang nanginginig na kamay sa duty!',
            textEn: 'Take a power nap — steady hands matter on clinical duty!',
            hint: '+21 EN · +12 MH',
            hintEn: '+21 EN · +12 MH',
            nextBeat: 'evening',
            advanceToMinute: 1110,
            countsAsAction: 'rest',
            effects: { energy: 21, mental: 12 },
            contextTag: 'napped_afternoon',
          },
        ],
      });
    } else if (isEng) {
      candidates.push({
        id: `rw_course_eng_${total}`,
        beat: 'afternoon',
        tagTl: 'Sci-Cal & Problem Set Crunch',
        tagEn: 'Sci-Cal Battery Panic',
        locationTl: 'Library · Engineering/STEM Table',
        locationEn: 'Library · Problem Set Table',
        background: 'bg_library',
        characters: [
          { id: 'player', sprite: 'player_surprised', position: 'left' },
          { id: 'bea', sprite: 'bea_happy', position: 'right' },
        ],
        lines: [
          {
            speaker: 'Narrator',
            text: `Humihina ang screen ng scientific calculator mo habang 12 problems pa ang kailangan i-solve sa ${subjectName}!`,
            textEn: `Your scientific calculator display fades mid-equation with 12 ${subjectName} problems left to solve!`,
          },
          {
            speaker: 'Bea',
            text: `Haha itapat mo sa ilaw ng bintana {name}, solar yan! Or bumili na tayo ng bagong button battery sa bookstore?`,
            textEn: `Tilt it toward the window light {name}, the solar strip helps! Or want to grab a fresh button battery at the campus store?`,
          },
        ],
        choices: [
          {
            id: 'rw_eng_battery',
            text: 'Bumili ng ₱35 battery at tapusin lahat ng problem sets sa Library',
            textEn: 'Buy a ₱35 battery and crush every single problem set at the Library',
            hint: '-₱35 · -12 EN · -0.09 GWA · +3 Bea',
            hintEn: '-₱35 · -12 EN · -0.09 GWA · +3 Bea',
            nextBeat: 'evening',
            advanceToMinute: 1110,
            countsAsAction: 'study',
            effects: { money: -35, energy: -12, gwa: -0.09, relationships: { bea: 3 } },
            contextTag: 'studied_afternoon',
            disabled: exhausted,
            disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN)`,
            disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN)`,
          },
          {
            id: 'rw_eng_jobs',
            text: 'Mag-Tutoring o iba pang Raket Minigame muna (+Bonus Pay!)',
            textEn: 'Take a Tutoring or Side-Hustle Minigame shift (+Bonus Pay!)',
            hint: 'Open Raket List',
            hintEn: 'Open Jobs List',
            nextBeat: 'afternoon',
            openJobPicker: true,
          },
          {
            id: 'rw_eng_rest',
            text: 'Ipahinga muna ang utak — sunog na ang neurons sa Calculus!',
            textEn: 'Rest your brain — Calculus fried every neuron today!',
            hint: '+21 EN · +12 MH',
            hintEn: '+21 EN · +12 MH',
            nextBeat: 'evening',
            advanceToMinute: 1110,
            countsAsAction: 'rest',
            effects: { energy: 21, mental: 12 },
            contextTag: 'napped_afternoon',
          },
        ],
      });
    }

    // Campus Fire / Earthquake Drill (authentic DepEd/CHED quarterly drill!)
    candidates.push({
      id: `rw_campus_drill_${total}`,
      beat: 'afternoon',
      tagTl: cal.monthShort === 'Mar' ? 'Fire Prevention Drill' : 'Nationwide Simultaneous Earthquake Drill',
      tagEn: cal.monthShort === 'Mar' ? 'Fire Prevention Drill' : 'Campus Earthquake Drill',
      locationTl: 'Campus Quadrangle · Duck, Cover, and Hold!',
      locationEn: 'Campus Quadrangle · Evacuation Drill',
      background: 'bg_school_gate',
      characters: [
        { id: 'player', sprite: 'player_neutral', position: 'left' },
        { id: 'carlo', sprite: 'carlo_happy', position: 'center' },
        { id: 'crush', sprite: 'crush_happy', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Narrator',
          text: `WEEEEEOOOOOH! Tumunog ang campus siren para sa quarterly ${cal.monthShort === 'Mar' ? 'Fire Prevention Drill' : 'Earthquake Drill (Duck, Cover, and Hold)'}! Lumabas ang lahat patungong open field.`,
          textEn: `WEEEEEOOOOOH! The campus siren blares for the quarterly ${cal.monthShort === 'Mar' ? 'Fire Prevention Drill' : 'Earthquake Drill (Duck, Cover, and Hold)'}! Everyone files out to the open quadrangle.`,
        },
        {
          speaker: 'Carlo',
          text: `Organized lahat! {name}, tulungan mo akong mag-marshal ng freshmen, o mag-review / kumausap kay Jamie habang naghihintay ng all-clear?`,
          textEn: `Smooth evacuation! {name}, help me marshal freshmen, review flashcards on the grass, or catch up with Jamie while waiting for the all-clear?`,
        },
      ],
      choices: [
        {
          id: 'rw_drill_marshal',
          text: 'Tumulong kay Carlo bilang student safety marshal',
          textEn: 'Help Carlo guide students as a volunteer safety marshal',
          hint: '-8 EN · +6 MH · +9 Social · +5 Carlo',
          hintEn: '-8 EN · +6 MH · +9 Social · +5 Carlo',
          nextBeat: 'evening',
          advanceToMinute: 1110,
          countsAsAction: 'org',
          effects: { energy: -8, mental: 6, social: 9, relationships: { carlo: 5 } },
          contextTag: 'did_org',
        },
        {
          id: 'rw_drill_jamie',
          text: 'Makisilong sa ilalim ng puno ng mangga at makipag-kwentuhan kay Jamie',
          textEn: 'Share the shade under the mango tree and chat with Jamie',
          hint: '+6 EN · +12 MH · +5 Jamie',
          hintEn: '+6 EN · +12 MH · +5 Jamie',
          nextBeat: 'evening',
          advanceToMinute: 1110,
          countsAsAction: 'socialize',
          effects: { energy: 6, mental: 12, social: 6, relationships: { crush: 5 } },
          contextTag: 'lunch_barkada',
        },
        {
          id: 'rw_drill_jobs',
          text: 'Pagkatapos ng all-clear, dumiretso sa Raket Minigame / Scholarship Quest!',
          textEn: 'Once the all-clear rings, jump straight into a Side-Hustle / Scholarship Quest!',
          hint: 'Open Raket List',
          hintEn: 'Open Jobs List',
          nextBeat: 'afternoon',
          openJobPicker: true,
        },
        {
          id: 'rw_drill_flashcards',
          text: 'Gamitin ang waiting time para mag-memorize ng flashcards',
          textEn: 'Use the waiting time on the field to memorize flashcards',
          hint: '-9 EN · -0.06 GWA',
          hintEn: '-9 EN · -0.06 GWA',
          nextBeat: 'evening',
          advanceToMinute: 1110,
          countsAsAction: 'study',
          effects: { energy: -9, gwa: -0.06 },
          contextTag: 'studied_afternoon',
          disabled: exhausted,
          disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN)`,
          disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN)`,
        },
      ],
    });
  }

  // --- EVENING REAL-WORLD PROBLEMS ---
  if (beat === 'evening') {
    const homeBg = isBoarding ? 'bg_boarding_house' : 'bg_provincial_house';

    // 1. Rotating Brownout at 11:59 PM Deadline
    candidates.push({
      id: `rw_brownout_${total}`,
      beat: 'evening',
      tagTl: 'Biglaang Brownout!',
      tagEn: 'Sudden Power Outage!',
      locationTl: isBoarding ? 'Boarding House · Brownout!' : 'Bahay · Biglang Namatay ang Ilaw!',
      locationEn: isBoarding ? 'Boarding House · Blackout!' : 'Home · Sudden Power Outage!',
      background: homeBg,
      characters: [
        { id: 'player', sprite: 'player_surprised', position: 'left' },
      ],
      lines: [
        {
          speaker: 'Narrator',
          text: `KLIK! Biglang namatay ang electric fan at lahat ng ilaw sa buong barangay — unscheduled brownout! 19% na lang ang battery ng phone mo at may 11:59 PM submission pa!`,
          textEn: `CLICK! The electric fan whirs to a stop and the whole barangay plunges into darkness — sudden power outage! Your phone is at 19% with an 11:59 PM upload due!`,
        },
        {
          speaker: '{name}',
          text: `Aray ko! Mainit, madilim, at malapit ma-lowbat... anong diskarte natin ngayong gabi?`,
          textEn: `Oh no! Hot, dark, and low battery... how do we pull this off tonight?`,
        },
      ],
      choices: [
        {
          id: 'rw_brownout_candle',
          text: 'Gumamit ng rechargeable lamp/flashlight at tapusin ang notes nang kalmado',
          textEn: 'Switch on a flashlight/rechargeable lamp and finish your notes steadily',
          hint: '-11 EN · -3 MH · -0.07 GWA',
          hintEn: '-11 EN · -3 MH · -0.07 GWA',
          nextBeat: 'bedtime',
          advanceToMinute: 1320,
          countsAsAction: 'study',
          effects: { energy: -11, mental: -3, gwa: -0.07 },
          contextTag: 'night_review',
          disabled: exhausted,
          disabledReasonTl: `Pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN)`,
          disabledReasonEn: `Too exhausted (${MIN_STRENUOUS_ENERGY}+ EN)`,
        },
        {
          id: 'rw_brownout_cafe',
          text: 'Tumakbo sa may generator na fastfood/piso-net sa highway para mag-upload',
          textEn: 'Head to the generator-powered fastfood/shop on the highway to charge & upload',
          hint: '-₱60 · -7 EN · -0.08 GWA · +2 MH',
          hintEn: '-₱60 · -7 EN · -0.08 GWA · +2 MH',
          nextBeat: 'bedtime',
          advanceToMinute: 1320,
          countsAsAction: 'study',
          effects: { money: -60, energy: -7, mental: 2, gwa: -0.08 },
          contextTag: 'night_review',
        },
        {
          id: 'rw_brownout_sleep',
          text: 'Mag-message kay Prof. Reyes tungkol sa brownout at magpahinga nang maaga',
          textEn: 'Message Prof. Reyes about the outage and get proper early rest',
          hint: '₱0 · +18 EN · +10 MH',
          hintEn: '₱0 · +18 EN · +10 MH',
          nextBeat: 'bedtime',
          advanceToMinute: 1260,
          countsAsAction: 'rest',
          effects: { energy: 18, mental: 10 },
          contextTag: 'early_wind_down',
        },
      ],
    });

    // 2. Prepaid Load / Piso Wi-Fi Expired Right Before LMS Submission
    candidates.push({
      id: `rw_no_load_${total}`,
      beat: 'evening',
      tagTl: 'Ubos ang Data Load!',
      tagEn: 'Prepaid Data Ran Out!',
      locationTl: 'Sari-Sari Store · Piso Wi-Fi Corner',
      locationEn: 'Corner Sari-Sari Store · Piso Wi-Fi',
      background: 'bg_sari_sari',
      characters: [
        { id: 'player', sprite: 'player_worried', position: 'left' },
        { id: 'nena', sprite: 'nena_happy', position: 'right' },
      ],
      lines: [
        {
          speaker: 'Narrator',
          text: `"Your data promo has expired." Timing na timing — 85% uploaded na sana ang PDF assignment mo sa Google Classroom!`,
          textEn: `"Your prepaid data promo has expired." Right as your PDF assignment hit 85% uploading to Google Classroom!`,
        },
        {
          speaker: 'Aling Nena',
          text: `Oh {name}, mukhang hinahabol mo na naman ang deadline! May ₱5 Piso Wi-Fi vendo dito sa labas, o magpapa-load ka ng ₱30 promo?`,
          textEn: `Oh {name}, chasing another online deadline? There’s a ₱5 Piso Wi-Fi machine outside, or need a ₱30 prepaid load?`,
        },
      ],
      choices: [
        {
          id: 'rw_load_pisowifi',
          text: 'Maghulog ng ₱10 sa Piso Wi-Fi vendo at i-upload agad ang file!',
          textEn: 'Drop ₱10 into the Piso Wi-Fi vendo and finish the upload fast!',
          hint: '-₱10 · -6 EN · -0.06 GWA',
          hintEn: '-₱10 · -6 EN · -0.06 GWA',
          nextBeat: 'bedtime',
          advanceToMinute: 1290,
          countsAsAction: 'study',
          effects: { money: -10, energy: -6, gwa: -0.06 },
          contextTag: 'night_review',
        },
        {
          id: 'rw_load_promo',
          text: 'Magpa-load ng ₱35 all-access promo para may pang-video call na rin kay Mama',
          textEn: 'Buy ₱35 data promo so you can submit AND video-call Mama too',
          hint: '-₱35 · +10 MH · +4 Pamilya · -0.05 GWA',
          hintEn: '-₱35 · +10 MH · +4 Family · -0.05 GWA',
          nextBeat: 'bedtime',
          advanceToMinute: 1290,
          countsAsAction: 'family',
          effects: { money: -35, mental: 10, gwa: -0.05, relationships: { family: 4 } },
          contextTag: 'called_mama',
        },
        {
          id: 'rw_load_rest',
          text: 'I-save muna offline at maagang pumasok sa campus Wi-Fi bukas',
          textEn: 'Save offline tonight and upload on free campus Wi-Fi early tomorrow',
          hint: '₱0 · +14 EN · +6 MH',
          hintEn: '₱0 · +14 EN · +6 MH',
          nextBeat: 'bedtime',
          advanceToMinute: 1260,
          countsAsAction: 'rest',
          effects: { energy: 14, mental: 6 },
          contextTag: 'early_wind_down',
        },
      ],
    });

    // 3. Boarding House Water Interruption (Provincial College) OR Rainy Season Flu Warning
    if (isBoarding) {
      candidates.push({
        id: `rw_water_outage_${total}`,
        beat: 'evening',
        tagTl: 'Walang Tubig sa Boarding House',
        tagEn: 'Boarding House Water Interruption',
        locationTl: 'Boarding House · Igib sa Ground Floor',
        locationEn: 'Boarding House · Fetching Water Pails',
        background: 'bg_boarding_house',
        characters: [
          { id: 'player', sprite: 'player_worried', position: 'left' },
          { id: 'nena', sprite: 'nena_neutral', position: 'right' },
        ],
        lines: [
          {
            speaker: 'Narrator',
            text: `Pagsara ng pinto ng banyo — walang lumalabas sa gripo! Scheduled water interruption pala sa barangay hanggang madaling-araw.`,
            textEn: `You twist the faucet — nothing but a hollow hiss! There’s a barangay water interruption until 3:00 AM.`,
          },
          {
            speaker: 'Aling Nena',
            text: `Pasensya na {name}, may naipon akong drum sa ibaba! Paki-tulong na rin akong mag-lista ng electric sub-meter ng mga boarders, bawasan ko meryenda mo!`,
            textEn: `Sorry {name}, I stored water drums downstairs! Help me tally the boarders’ electric sub-meters too and I’ll hand you ₱75!`,
          },
        ],
        choices: [
          {
            id: 'rw_water_help',
            text: 'Mag-igib ng timba at tulungan si Aling Nena mag-lista ng sub-meter (+₱75)',
            textEn: 'Carry water pails and help Aling Nena tally sub-meter bills (+₱75)',
            hint: '+₱75 · -9 EN · +4 Aling Nena',
            hintEn: '+₱75 · -9 EN · +4 Aling Nena',
            nextBeat: 'bedtime',
            advanceToMinute: 1290,
            effects: { money: 75, energy: -9, mental: 3, relationships: { aling_nena: 4 } },
            contextTag: 'worked_shift',
          },
          {
            id: 'rw_water_jug',
            text: 'Bumili ng ₱30 water refill jug at mag-video call kay Mama',
            textEn: 'Buy a ₱30 water refill jug and unwind calling Mama',
            hint: '-₱30 · +10 EN · +11 MH · +4 Pamilya',
            hintEn: '-₱30 · +10 EN · +11 MH · +4 Family',
            nextBeat: 'bedtime',
            advanceToMinute: 1290,
            countsAsAction: 'family',
            effects: { money: -30, energy: 10, mental: 11, relationships: { family: 4 } },
            contextTag: 'called_mama',
          },
          {
            id: 'rw_water_sleep',
            text: 'Magpunas na lang muna ng bimpo at matulog nang maaga',
            textEn: 'Freshen up lightly and head straight to bed early',
            hint: '₱0 · +16 EN · +8 MH',
            hintEn: '₱0 · +16 EN · +8 MH',
            nextBeat: 'bedtime',
            advanceToMinute: 1260,
            countsAsAction: 'rest',
            effects: { energy: 16, mental: 8 },
            contextTag: 'early_wind_down',
          },
        ],
      });
    } else if (cal.weather === 'rainy') {
      candidates.push({
        id: `rw_trangkaso_${total}`,
        beat: 'evening',
        tagTl: 'Banta ng Trangkaso (Rainy Season)',
        tagEn: 'Rainy Season Flu Scare',
        locationTl: 'Bahay · Mainit na Salabat & Pahinga',
        locationEn: 'Home · Ginger Tea & Rest',
        background: 'bg_provincial_house',
        characters: [
          { id: 'player', sprite: 'player_worried', position: 'left' },
          { id: 'mama', sprite: 'mama_worried', position: 'right' },
        ],
        lines: [
          {
            speaker: 'Narrator',
            text: `Sinisipon ka at medyo makati ang lalamunan matapos maambunan sa labas. Uso ngayon ang trangkaso sa school!`,
            textEn: `Your throat feels scratchy and chills creep in after today’s downpour. Half the class is catching the rainy-season flu!`,
          },
          {
            speaker: 'Mama',
            text: `Naku {name}, mainit ang noo mo nang kaunti! Uminom ka ng mainit na salabat at biogesic — huwag ka munang magpuyat ngayong gabi ha?`,
            textEn: `Oh {name}, your forehead feels warm! Drink hot calamansi-ginger tea and take medicine — please don’t stay up late tonight!`,
          },
        ],
        choices: [
          {
            id: 'rw_flu_meds',
            text: 'Bumili ng gamot/vitamin C, uminom ng salabat ni Mama, at magpahinga',
            textEn: 'Take medicine/vitamin C, sip Mama’s ginger tea, and rest early',
            hint: '-₱35 · +20 EN · +12 MH · +4 Pamilya',
            hintEn: '-₱35 · +20 EN · +12 MH · +4 Family',
            nextBeat: 'bedtime',
            advanceToMinute: 1260,
            countsAsAction: 'family',
            effects: { money: -35, energy: 20, mental: 12, relationships: { family: 4 } },
            contextTag: 'called_mama',
          },
          {
            id: 'rw_flu_soup_rest',
            text: 'Higop ng mainit na sabaw at matulog nang mahaba (no spending)',
            textEn: 'Sip warm broth at home and sleep early (save cash)',
            hint: '₱0 · +16 EN · +8 MH · +2 Pamilya',
            hintEn: '₱0 · +16 EN · +8 MH · +2 Family',
            nextBeat: 'bedtime',
            advanceToMinute: 1260,
            countsAsAction: 'rest',
            effects: { energy: 16, mental: 8, relationships: { family: 2 } },
            contextTag: 'early_wind_down',
          },
          {
            id: 'rw_flu_push',
            text: 'Magpilit mag-review kahit may sinat — ayaw mong mahuli sa quiz',
            textEn: 'Force yourself to study despite the chills — can’t fall behind',
            hint: '-15 EN · -8 MH · -0.06 GWA',
            hintEn: '-15 EN · -8 MH · -0.06 GWA',
            nextBeat: 'bedtime',
            advanceToMinute: 1330,
            countsAsAction: 'study',
            effects: { energy: -15, mental: -8, gwa: -0.06 },
            contextTag: 'night_review',
            disabled: exhausted,
            disabledReasonTl: `Bawal — pagod na pagod (${MIN_STRENUOUS_ENERGY}+ EN)`,
            disabledReasonEn: `Too weak to push (${MIN_STRENUOUS_ENERGY}+ EN)`,
          },
        ],
      });
    }
  }

  if (candidates.length === 0) return null;
  return candidates[(day * 7 + total * 11) % candidates.length];
}
