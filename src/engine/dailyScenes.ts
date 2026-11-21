import {
  CALENDAR_SPECIAL_DAYS,
  DAYS_PER_YEAR,
  PHILIPPINE_CALENDAR_MONTHS,
  SEM1_DAYS,
  SEM2_DAYS,
  WEEKS_PER_SEMESTER,
} from '../data/config';
import type {
  CalendarDayInfo,
  DailyMomentSnapshot,
  EmotionId,
  SaveData,
  SeasonId,
  WakeUpChoiceId,
  WeatherId,
  WeeklyActionId,
} from '../types/game';

function formatSimpleTime12(minuteOfDay: number): string {
  const clamped = Math.min(1440, Math.max(0, Math.floor(minuteOfDay)));
  if (clamped >= 1440) return '12:00 AM';
  const h24 = Math.floor(clamped / 60);
  const mins = clamped % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${suffix}`;
}

export function normalizeDayOfYear(dayOfYear?: number): number {
  if (!dayOfYear || !Number.isFinite(dayOfYear)) return 1;
  const mod = ((Math.floor(dayOfYear) - 1) % DAYS_PER_YEAR + DAYS_PER_YEAR) % DAYS_PER_YEAR;
  return mod + 1;
}

export function getSemesterAndPeriodFromDay(dayOfYear: number): {
  semester: 1 | 2;
  week: number;
  dayInSem: number;
  semDays: number;
} {
  const day = normalizeDayOfYear(dayOfYear);
  if (day <= SEM1_DAYS) {
    const week = Math.min(
      WEEKS_PER_SEMESTER,
      Math.floor(((day - 1) / SEM1_DAYS) * WEEKS_PER_SEMESTER) + 1
    );
    return { semester: 1, week, dayInSem: day, semDays: SEM1_DAYS };
  }
  const dayInSem = day - SEM1_DAYS;
  const week = Math.min(
    WEEKS_PER_SEMESTER,
    Math.floor(((dayInSem - 1) / SEM2_DAYS) * WEEKS_PER_SEMESTER) + 1
  );
  return { semester: 2, week, dayInSem, semDays: SEM2_DAYS };
}

export function getCalendarDayInfo(dayOfYear: number, totalDays: number = 1): CalendarDayInfo {
  const day = normalizeDayOfYear(dayOfYear);
  let remaining = day;
  let monthMeta: (typeof PHILIPPINE_CALENDAR_MONTHS)[number] = PHILIPPINE_CALENDAR_MONTHS[0];
  let dayOfMonth = 1;

  for (const m of PHILIPPINE_CALENDAR_MONTHS) {
    if (remaining <= m.days) {
      monthMeta = m;
      dayOfMonth = remaining;
      break;
    }
    remaining -= m.days;
  }

  const season: SeasonId = monthMeta.season;
  const seasonLabels: Record<SeasonId, { tl: string; en: string }> = {
    habagat: { tl: 'Tag-ulan (Habagat)', en: 'Rainy Season (Habagat)' },
    amihan: { tl: 'Tag-lamig (Amihan)', en: 'Cool Breeze (Amihan)' },
    tag_init: { tl: 'Tag-init (Summer)', en: 'Dry Summer (Tag-init)' },
  };

  // Deterministic pseudo-random weather per day based on Philippine season
  const seed = (day * 31 + Math.max(1, totalDays) * 17) % 100;
  let weather: WeatherId;
  if (season === 'habagat') {
    if (seed < 48) weather = 'rainy';
    else if (seed < 78) weather = 'cloudy';
    else weather = 'sunny';
  } else if (season === 'amihan') {
    if (seed < 45) weather = 'breezy';
    else if (seed < 75) weather = 'sunny';
    else if (seed < 90) weather = 'cloudy';
    else weather = 'rainy';
  } else {
    if (seed < 52) weather = 'hot';
    else if (seed < 85) weather = 'sunny';
    else weather = 'cloudy';
  }

  const weatherLabels: Record<WeatherId, { tl: string; en: string }> = {
    sunny: { tl: 'Maaraw · Maaliwalas', en: 'Clear & Sunny' },
    breezy: { tl: 'Presko · Mahangin', en: 'Cool & Breezy' },
    cloudy: { tl: 'Maulap · Makulimlim', en: 'Partly Cloudy' },
    rainy: { tl: 'Maulan · Magdala ng Payong', en: 'Rainy · Bring Umbrella' },
    hot: { tl: 'Mainit · Maalinsangan', en: 'Hot & Humid' },
  };

  const special = CALENDAR_SPECIAL_DAYS[day];

  return {
    dayOfYear: day,
    monthName: monthMeta.name,
    monthShort: monthMeta.short,
    dayOfMonth,
    season,
    seasonLabelTl: seasonLabels[season].tl,
    seasonLabelEn: seasonLabels[season].en,
    weather,
    weatherLabelTl: weatherLabels[weather].tl,
    weatherLabelEn: weatherLabels[weather].en,
    specialDayTl: special?.tl,
    specialDayEn: special?.en,
  };
}

function getHomeBackground(state: SaveData): string {
  const isCollege = state.chapter.startsWith('college');
  if (isCollege && state.profile.isProvincial) {
    return 'bg_boarding_house';
  }
  return 'bg_provincial_house';
}

export function buildMorningWakeUpMoment(state: SaveData): DailyMomentSnapshot {
  const day = normalizeDayOfYear(state.dayOfYear ?? state.totalWeeks);
  const cal = getCalendarDayInfo(day, state.totalWeeks);
  const homeBg = getHomeBackground(state);
  const isBoarding = homeBg === 'bg_boarding_house';
  const time12 = formatSimpleTime12(state.minuteOfDay ?? 330);

  let narrationTl: string;
  let narrationEn: string;

  if (cal.specialDayTl) {
    narrationTl = `05:30 AM — Tumutunog ang alarm sa tabi ng unan mo. ${cal.specialDayTl} ngayon (${cal.monthName} ${cal.dayOfMonth})! Amoy bagong umaga sa labas ng bintana.`;
    narrationEn = `05:30 AM — Your alarm buzzes beside your pillow. Today is ${cal.specialDayEn} (${cal.monthName} ${cal.dayOfMonth})! Fresh dawn air drifts through the window.`;
  } else if (cal.weather === 'rainy') {
    narrationTl = isBoarding
      ? '05:30 AM — Rinig mo ang mahinang patak ng ulan sa yero ng boarding house. Malamig ang simoy ng hangin — nakakatuksong mag-snooze pa sandali!'
      : '05:30 AM — Malakas ang tilaok ng manok kasabay ng ambon sa labas. Dinig mo ang kalansing ng takure sa kusina ni Mama.';
    narrationEn = isBoarding
      ? '05:30 AM — Gentle rain patters against the boarding house tin roof. The cool morning air makes the blanket feel twice as heavy.'
      : '05:30 AM — A rooster crows through soft morning rain outside. You hear the kettle clinking softly in Mama’s kitchen.';
  } else if (cal.weather === 'hot') {
    narrationTl =
      '05:30 AM — Mainit-init na agad kahit bukang-liwayway pa lang. Umiikot ang electric fan sa number 3 habang bumabangon ka para sa panibagong araw.';
    narrationEn =
      '05:30 AM — Even at dawn the summer warmth lingers. Your electric fan hums steadily on setting 3 as you sit up for a brand-new day.';
  } else if (cal.weather === 'breezy') {
    narrationTl =
      '05:30 AM — Presko ang simoy ng Amihan sa bintana! Tahimik pa ang kalsada at malinaw ang langit — magandang umaga para bumangon nang maaga.';
    narrationEn =
      '05:30 AM — A cool Amihan breeze drifts through the window! The street is still quiet and clear — a refreshing morning to get moving.';
  } else {
    narrationTl = isBoarding
      ? '05:30 AM — Tumutunog ang alarm ng cellphone mo. Nakasabit na sa pako ang plantsadong uniporme mo at nakahanda ang barya sa ibabaw ng desk.'
      : '05:30 AM — Sumisilip na ang unang sinag ng araw sa capiz na bintana. Amoy bagong saing na kanin at kape mula sa kusina!';
    narrationEn = isBoarding
      ? '05:30 AM — Your phone alarm rings softly. Your pressed uniform hangs on the wall hook and neatly stacked coins sit ready on your desk.'
      : '05:30 AM — Golden dawn light filters through the window. The warm scent of freshly cooked rice and coffee drifts from the kitchen!';
  }

  return {
    backgroundId: homeBg,
    playerEmotion: 'worried',
    locationTl: isBoarding ? 'Boarding House · Kwarto (Paggising)' : 'Bahay · Kwarto (Paggising)',
    locationEn: isBoarding ? 'Boarding House · Bedroom (Waking Up)' : 'Home · Bedroom (Waking Up)',
    narrationTl,
    narrationEn,
    time12,
  };
}

export function buildWakeUpResultMoment(
  state: SaveData,
  choiceId: WakeUpChoiceId,
  endMinute: number
): DailyMomentSnapshot {
  const homeBg = getHomeBackground(state);
  const time12 = formatSimpleTime12(endMinute);

  if (choiceId === 'early_shower') {
    return {
      backgroundId: homeBg,
      playerEmotion: 'happy',
      locationTl: 'Umaga · Handa nang Lumarga',
      locationEn: 'Morning · Fresh & Ready',
      narrationTl:
        'Brrrr! Malamig ang unang buhos ng tubig sa tabo, pero gising na gising ang diwa mo! Suot na ang malinis na uniporme, ID sa leeg, at sakto ang barya sa bulsa.',
      narrationEn:
        'Brrr! That first splash of cold tabo water wakes every nerve right up! Clean uniform on, ID clipped, and exact jeepney coins tucked in your pocket.',
      time12,
    };
  }

  if (choiceId === 'snooze') {
    return {
      backgroundId: 'bg_jeepney_interior',
      playerEmotion: 'surprised',
      locationTl: 'Nagmamadaling Umaga · Kalsada',
      locationEn: 'Rushed Morning · On the Move',
      narrationTl:
        'Napasarap ang dagdag na 30 minutong tulog! Mabilisang hilamos, suklay sa jeep, at habol sa hininga — pero kahit papaano bawi ang antok mo.',
      narrationEn:
        'That extra 30 minutes under the blanket felt heavenly! Quick face wash, combing hair on the go — slightly rushed, yet your energy feels topped up.',
      time12,
    };
  }

  return {
    backgroundId: homeBg === 'bg_boarding_house' ? 'bg_carinderia' : 'bg_provincial_house',
    playerEmotion: 'happy',
    companionSpriteId: homeBg === 'bg_provincial_house' ? 'mama_happy' : 'nena_happy',
    locationTl: 'Almusal · Kape at Pandesal',
    locationEn: 'Breakfast · Coffee & Pandesal',
    narrationTl:
      'Mainit na 3-in-1 kape at bagong lutong pandesal! Habang humihigop ka, pinaplano mo na ang klase, aral, at diskarte mo ngayong araw.',
    narrationEn:
      'Steaming 3-in-1 coffee and warm pandesal! As you take your first sip, you calmly map out today’s classes, study blocks, and budget.',
    time12,
  };
}

export function getMealLabelForTime(minuteOfDay: number): { tl: string; en: string } {
  if (minuteOfDay < 540) return { tl: 'Almusal', en: 'Breakfast' };
  if (minuteOfDay < 690) return { tl: 'Recess / Merienda', en: 'Morning Snack' };
  if (minuteOfDay < 900) return { tl: 'Tanghalian', en: 'Lunch' };
  if (minuteOfDay < 1080) return { tl: 'Merienda sa Hapon', en: 'Afternoon Merienda' };
  return { tl: 'Hapunan', en: 'Dinner' };
}

export function buildActionMoment(
  state: SaveData,
  actId: WeeklyActionId,
  startMinute: number,
  endMinute: number
): DailyMomentSnapshot {
  const time12 = formatSimpleTime12(endMinute);
  const seed = (state.totalWeeks + (state.dayActions?.length ?? 0) + Math.floor(startMinute / 60)) % 3;
  const isTech =
    state.profile.strand === 'TVL-ICT' ||
    state.profile.course === 'BSIT' ||
    state.profile.course === 'BSCS';
  const homeBg = getHomeBackground(state);

  switch (actId) {
    case 'attend_class': {
      const variants = [
        {
          tl: 'Sikisikan sa jeep papunta, pero nakahabol ka bago mag-check ng attendance si Prof. Reyes! Sulit ang pakikinig at pagsulat ng notes sa harap.',
          en: 'Tight jeepney commute, yet you made it right before Prof. Reyes called roll! Focused lecture and crisp notes from the front row.',
        },
        {
          tl: 'May surprise recitation sa klase! Kinabahan ka sandali pero nasagot mo nang maayos — ngumiti nang bahagya si Prof. Reyes habang naglalagay ng check.',
          en: 'Surprise recitation in class! Your heart raced for a second, then you nailed the answer — Prof. Reyes gave a rare nod of approval.',
        },
        {
          tl: 'Tahimik ang classroom maliban sa tunog ng chalk at electric fan. Nakopya mo lahat ng sample problems na lalabas daw sa susunod na quiz.',
          en: 'The classroom hummed with ceiling fans and chalk on the board. You copied every sample problem hinted for the upcoming quiz.',
        },
      ];
      return {
        backgroundId: isTech && seed === 1 ? 'bg_computer_lab' : 'bg_classroom',
        playerEmotion: 'neutral',
        companionSpriteId: 'prof_neutral',
        locationTl: isTech && seed === 1 ? 'Campus · Computer Lab' : 'Campus · Classroom',
        locationEn: isTech && seed === 1 ? 'Campus · Computer Lab' : 'Campus · Classroom',
        narrationTl: variants[seed].tl,
        narrationEn: variants[seed].en,
        time12,
      };
    }

    case 'eat_meal': {
      const meal = getMealLabelForTime(startMinute);
      const isNight = startMinute >= 1080;
      const variants = [
        {
          tl: `${meal.tl} time! Umorder ka ng half-rice at ginisang munggo na may libreng mainit na sabaw kay Aling Nena. Busog na, tipid pa!`,
          en: `${meal.en} time! Ordered half-rice with sautéed munggo and free hot soup at Aling Nena’s. Full stomach, wallet intact!`,
        },
        {
          tl: `Nag-${meal.tl.toLowerCase()} ka ng sizzling siomai rice at malamig na gulaman. Nakakaginhawa ang pahinga sa pagitan ng mahabang araw.`,
          en: `Stopped for ${meal.en.toLowerCase()} — warm siomai rice and cold gulaman. A much-needed breather in the middle of a busy day.`,
        },
        {
          tl: `${meal.tl} sa canteen habang nagkukuwentuhan ang mga estudyante sa kabilang mesa. Bawi ang lakas para sa susunod na gagawin.`,
          en: `Enjoyed ${meal.en.toLowerCase()} at the canteen surrounded by cheerful student chatter. Energy restored for the rest of the day.`,
        },
      ];
      return {
        backgroundId: isNight ? 'bg_carinderia' : seed === 0 ? 'bg_carinderia' : 'bg_canteen',
        playerEmotion: 'happy',
        companionSpriteId: seed === 0 ? 'nena_happy' : undefined,
        locationTl: `${meal.tl} · ${seed === 0 || isNight ? 'Carinderia ni Aling Nena' : 'School Canteen'}`,
        locationEn: `${meal.en} · ${seed === 0 || isNight ? 'Aling Nena’s Eatery' : 'School Canteen'}`,
        narrationTl: variants[seed].tl,
        narrationEn: variants[seed].en,
        time12,
      };
    }

    case 'study': {
      const isNight = startMinute >= 1080;
      const variants = [
        {
          tl: 'Binuksan mo ang highlighter at flashcards sa tahimik na sulok. Isa-isang nagiging malinaw ang mga mahihirap na formulas.',
          en: 'Spread out your highlighters and flashcards in a quiet corner. Tricky concepts finally start clicking into place.',
        },
        {
          tl: 'Sabay kayong nag-review ni Bea gamit ang color-coded notes niya. Mas madaling tandaan ang lesson pag may ka-quiz bee!',
          en: 'Reviewed alongside Bea using her color-coded notes. Quizzing each other made tough chapters stick effortlessly!',
        },
        {
          tl: 'Nakatuon ang desk lamp sa notebook mo habang marahang pumapatak ang oras. Ramdam mo ang pag-usad ng mastery mo.',
          en: 'Warm desk lamp illuminating your open notebook as minutes tick calmly by. You can feel your confidence growing.',
        },
      ];
      return {
        backgroundId: isNight ? homeBg : 'bg_library',
        playerEmotion: 'neutral',
        companionSpriteId: !isNight && seed === 1 ? 'bea_happy' : undefined,
        locationTl: isNight ? 'Kwarto · Study Desk' : 'Campus · Library',
        locationEn: isNight ? 'Bedroom · Study Desk' : 'Campus · Library',
        narrationTl: variants[seed].tl,
        narrationEn: variants[seed].en,
        time12,
      };
    }

    case 'work': {
      const variants = [
        {
          tl: 'Walang tigil ang dating ng customers sa shift mo! Pawisan at ngalay ang paa, pero pag abot ng sahod sa dulo, ngiting-ngiti ka sa hawak na barya.',
          en: 'Non-stop rush during your shift! Sore feet and sweaty brow, yet holding your hard-earned pesos at closing time feels amazing.',
        },
        {
          tl: 'Tumulong ka kay Aling Nena sa pag-aasikaso ng mga order at sukli. Binigyan ka pa niya ng extra sabaw sa dulo ng shift!',
          en: 'Helped Aling Nena juggle orders and exact change during rush hour. She even slipped you an extra cup of soup after work!',
        },
        {
          tl: 'Bawat pisong kinita mo ngayong shift ay diretso sa tuition at pang-araw-araw na baon. Diskarte at sipag ang puhunan!',
          en: 'Every peso earned this shift goes straight toward tuition and daily survival. Pure grit and hustle!',
        },
      ];
      return {
        backgroundId: seed === 2 ? 'bg_sari_sari' : 'bg_carinderia',
        playerEmotion: 'happy',
        companionSpriteId: 'nena_happy',
        locationTl: seed === 2 ? 'Part-Time · Sari-Sari Store' : 'Part-Time · Carinderia Shift',
        locationEn: seed === 2 ? 'Part-Time · Neighborhood Store' : 'Part-Time · Eatery Shift',
        narrationTl: variants[seed].tl,
        narrationEn: variants[seed].en,
        time12,
      };
    }

    case 'rest': {
      const variants = [
        {
          tl: 'Humiga ka muna sa kama habang umiikot ang electric fan. Pinikit mo ang mata nang walang iniisip na deadline — sobrang gaan sa pakiramdam.',
          en: 'Stretched out on your bed under the steady hum of the electric fan. Closing your eyes without worrying about deadlines feels healing.',
        },
        {
          tl: 'Nag-power nap ka sa hapon at uminom ng malamig na tubig paggising. Hindi na mabigat ang talukap ng mata mo!',
          en: 'Took a proper afternoon power nap and drank a tall glass of cold water upon waking. Your mind feels clear again!',
        },
        {
          tl: 'Nakinig ka sa mahinang lo-fi music habang nakatingin sa kisame. Minsan, ang pahinga ang pinakamatalinong diskarte.',
          en: 'Listened to gentle lo-fi beats while staring at the ceiling. Sometimes resting is the smartest move you can make.',
        },
      ];
      return {
        backgroundId: homeBg,
        playerEmotion: 'happy',
        locationTl: homeBg === 'bg_boarding_house' ? 'Boarding House · Power Nap' : 'Bahay · Pahinga',
        locationEn: homeBg === 'bg_boarding_house' ? 'Boarding House · Power Nap' : 'Home · Quiet Rest',
        narrationTl: variants[seed].tl,
        narrationEn: variants[seed].en,
        time12,
      };
    }

    case 'socialize': {
      const variants = [
        {
          tl: 'Tuhog ng fishball at kikiam sa kanto kasama si Miggy! Tawang-tawa kayo sa mga kwento tungkol sa klase — nawala bigla ang stress.',
          en: 'Skewering fishballs and kikiam at the corner stall with Miggy! Laughing over campus stories melts away today’s stress.',
        },
        {
          tl: 'Nag-chikahan kayo ng barkada sa labas ng gate habang nag-aantay ng sunset. Masarap sa pakiramdam na may karamay sa hirap ng eskwela.',
          en: 'Chatted with the barkada outside the campus gate as the sky turned gold. Good friends make tough school days lighter.',
        },
        {
          tl: 'Nag-share kayo ni Jamie ng biscuits at kwentuhan tungkol sa mga pangarap pagkatapos ng graduation.',
          en: 'Shared snacks with Jamie and talked quietly about dreams for life after graduation.',
        },
      ];
      return {
        backgroundId: seed === 2 ? 'bg_school_gate' : 'bg_barangay_street',
        playerEmotion: 'happy',
        companionSpriteId: seed === 2 ? 'crush_happy' : 'miggy_happy',
        locationTl: 'Barkada · Fishball & Kwentuhan',
        locationEn: 'Friends · Street Snacks & Laughs',
        narrationTl: variants[seed].tl,
        narrationEn: variants[seed].en,
        time12,
      };
    }

    case 'org': {
      return {
        backgroundId: 'bg_school_gate',
        playerEmotion: 'happy',
        companionSpriteId: 'carlo_happy',
        locationTl: 'Campus · Student Org Activity',
        locationEn: 'Campus · Student Org Activity',
        narrationTl:
          'Tumulong ka kay Carlo sa pag-aayos ng tarpaulin, registration booth, at program ng student org. Lumawak ang circle at leadership skills mo!',
        narrationEn:
          'Helped Carlo run the campus org booth and event prep. Great teamwork, fresh connections, and real leadership experience!',
        time12,
      };
    }

    case 'family': {
      return {
        backgroundId: 'bg_provincial_house',
        playerEmotion: 'happy',
        companionSpriteId: 'mama_happy',
        locationTl: 'Pamilya · Kumustahan kay Mama',
        locationEn: 'Family · Catching Up with Mama',
        narrationTl:
          'Mahabang kwentuhan kay Mama tungkol sa school at kalusugan sa bahay. "Mag-ingat ka lagi anak, kumain sa tamang oras ha?" — buo ulit ang loob mo.',
        narrationEn:
          'Had a warm heart-to-heart with Mama about school and home. "Take care always, eat on time okay?" — your spirit feels completely renewed.',
        time12,
      };
    }
  }
}

export function buildIdleMomentForTime(state: SaveData): DailyMomentSnapshot {
  if (!state.hasWokenUpToday) {
    return buildMorningWakeUpMoment(state);
  }
  if (state.currentMoment) {
    return {
      ...state.currentMoment,
      time12: formatSimpleTime12(state.minuteOfDay ?? 360),
    };
  }
  const min = state.minuteOfDay ?? 360;
  const cal = getCalendarDayInfo(state.dayOfYear ?? state.totalWeeks, state.totalWeeks);
  const time12 = formatSimpleTime12(min);
  const homeBg = getHomeBackground(state);

  if (cal.monthShort === 'Dec' && min >= 1080) {
    return {
      backgroundId: 'bg_christmas_parol',
      playerEmotion: 'happy',
      locationTl: 'Disyembre · Gabi ng Parol',
      locationEn: 'December · Parol-Lit Evening',
      narrationTl:
        'Umiilaw na ang mga parol sa kahabaan ng kalsada at amoy bibingka sa kanto. Ano ang susunod mong gagawin ngayong gabi?',
      narrationEn:
        'Capiz star parols glow along the street and the aroma of warm bibingka drifts by. What will you do next tonight?',
      time12,
    };
  }

  if (cal.weather === 'rainy' && min >= 960 && min < 1200) {
    return {
      backgroundId: 'bg_rainy_flood',
      playerEmotion: 'worried',
      locationTl: 'Kalsada · Maulang Hapon',
      locationEn: 'Street · Rainy Commute',
      narrationTl:
        'Bumubuhos ang ulan sa labas at kumikinang ang kalsada sa ilaw ng poste. Ingat sa pamasahe at huwag magpaulan nang sobra!',
      narrationEn:
        'Rain pours down as streetlights shimmer across the wet pavement. Watch your commute fare and try to stay dry!',
      time12,
    };
  }

  if (min < 690) {
    return {
      backgroundId: 'bg_school_gate',
      playerEmotion: 'neutral',
      locationTl: 'Campus Gate · Umaga',
      locationEn: 'Campus Gate · Morning',
      narrationTl:
        'Nasa labas ka na ng gate habang dumaragsa ang mga estudyante at jeepney. Pumili ng susunod mong gawain para sa umaga.',
      narrationEn:
        'Students and jeepneys stream past the campus gate in the morning light. Choose your next activity for the morning.',
      time12,
    };
  }
  if (min < 1050) {
    return {
      backgroundId: 'bg_manila_street',
      playerEmotion: 'neutral',
      locationTl: 'Tanghali / Hapon · Labas ng Campus',
      locationEn: 'Afternoon · Around Campus',
      narrationTl:
        'Masigla ang paligid sa tanghali — amoy street food at ingay ng jeepney sa kanto. Planuhin ang hapon mo nang maayos.',
      narrationEn:
        'Afternoon bustle fills the avenue — street food aromas and jeepney horns humming along. Decide how to spend your afternoon.',
      time12,
    };
  }
  return {
    backgroundId: homeBg,
    playerEmotion: min >= 1320 ? 'worried' : 'neutral',
    locationTl: min >= 1320 ? 'Hatinggabi · Puyat Hours' : 'Gabi · Kwarto',
    locationEn: min >= 1320 ? 'Late Night · Puyat Hours' : 'Evening · Room',
    narrationTl:
      min >= 1320
        ? 'Malalim na ang gabi at tahimik na ang buong paligid. Baka oras na para matulog nang maaga para hindi puyat bukas!'
        : 'Naka-uwi ka na sa kwarto habang lumulubog ang araw. Pwede pang mag-review, kumain ng hapunan, o magpahinga na.',
    narrationEn:
      min >= 1320
        ? 'The neighborhood is silent and late-night hours are setting in. Consider heading to bed soon so you aren’t exhausted tomorrow!'
        : 'Back in your room as evening settles in. You still have time to study, eat dinner, call home, or rest early.',
    time12,
  };
}
