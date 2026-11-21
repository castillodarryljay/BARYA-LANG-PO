import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyChoiceEffects,
  canPerformDailyAction,
  canStartMinigame,
  computeMinigamePayout,
  createInitialSave,
  evaluateConditions,
  evaluateEnding,
  finishDayAndAdvance,
  formatClockTime,
  getScholarshipSemesterFlag,
  getSleepBonus,
  getTimeOfDayPhase,
  getWeekdayInfo,
  interpolateText,
  isMinigameUnlocked,
  performDailyAction,
  performMorningWakeUp,
  resolveWeeklyPlan,
  selectNextEvent,
  signSaveData,
  verifySaveIntegrity,
} from './storyEngine';
import {
  getCalendarDayInfo,
  getMealLabelForTime,
  getSemesterAndPeriodFromDay,
} from './dailyScenes';
import { ALL_BASE_STORY_NODES, ALL_ENDINGS } from '../data/story';
import type { PlayerProfile } from '../types/game';

const baseProfile: PlayerProfile = {
  name: 'Miguel',
  gender: 'male',
  hometown: 'Pangasinan',
  isProvincial: true,
  familyBg: 'tindera',
  strand: 'TVL-ICT',
  course: 'BSIT',
};

test('createInitialSave initializes stats, subjects, and starting flags', () => {
  const save = createInitialSave(baseProfile);
  assert.equal(save.profile.name, 'Miguel');
  assert.equal(save.chapter, 'shs_year1');
  assert.equal(save.semester, 1);
  assert.equal(save.week, 1);
  assert.equal(save.stats.money, 1050);
  assert.ok(save.flags.includes('bg_tindera'));
  assert.equal(save.subjects.length, 4);
});

test('interpolateText replaces player name, hometown, strand, and course', () => {
  const out = interpolateText(
    'Kumusta {name} mula {hometown}! {strand} -> {course}.',
    baseProfile
  );
  assert.equal(out, 'Kumusta Miguel mula Pangasinan! TVL-ICT -> BSIT.');
});

test('evaluateConditions handles course, flags, numeric stats, and relationships', () => {
  const save = createInitialSave(baseProfile);
  save.flags.push('borrowed_money');
  save.stats.money = 1200;
  save.week = 4;

  assert.equal(
    evaluateConditions(
      {
        course: ['BSIT', 'BSCS'],
        flagsAll: ['borrowed_money'],
        flagsNone: ['scholarship_lost'],
        money: { lt: 2000 },
        week: { gte: 4 },
      },
      save
    ),
    true
  );

  assert.equal(
    evaluateConditions({ flagsAll: ['missing_flag'] }, save),
    false
  );
});

test('applyChoiceEffects clamps energy/mental, respects debt limit, and shifts courses', () => {
  let save = createInitialSave(baseProfile);
  save = applyChoiceEffects(save, {
    money: -99999,
    energy: -200,
    mental: 200,
    gwa: -0.5,
    flagsAdd: ['working_student'],
    shiftCourse: 'BSBA',
  });

  assert.equal(save.stats.money, -save.stats.debtLimit);
  assert.equal(save.stats.energy, 0);
  assert.equal(save.stats.mental, 100);
  assert.equal(save.stats.gwa, 1.45);
  assert.equal(save.profile.course, 'BSBA');
  assert.equal(save.profile.shiftedFrom, 'BSIT');
  assert.ok(save.flags.includes('working_student'));
});

test('selectNextEvent prioritizes crisis events when energy or mental reaches 0', () => {
  const save = createInitialSave(baseProfile);
  save.stats.energy = 0;
  const energyCrisis = selectNextEvent(save, ALL_BASE_STORY_NODES, () => 0.5);
  assert.equal(energyCrisis?.id, 'crisis_energy_collapse');

  save.stats.energy = 50;
  save.stats.mental = 0;
  const mentalCrisis = selectNextEvent(save, ALL_BASE_STORY_NODES, () => 0.5);
  assert.equal(mentalCrisis?.id, 'crisis_mental_burnout');
});

test('resolveWeeklyPlan advances 365-day calendar, semesters, chapters, and enforces scholarship GWA', () => {
  let save = createInitialSave(baseProfile);
  save.dayOfYear = 182; // Last day of Sem 1 (Nov 29)
  save.week = 8;
  save.semester = 1;
  save.scholarship = {
    id: 'iskolar',
    name: 'Iskolar ng Bayan',
    minGwa: 1.75,
    weeklyStipend: 210,
    tuitionDiscount: 0.5,
    active: true,
  };
  save.stats.gwa = 2.1; // Worse than 1.75

  const res = resolveWeeklyPlan(save, ['rest', 'socialize', 'family']);
  assert.equal(res.nextState.dayOfYear, 183);
  assert.equal(res.nextState.semester, 2);
  assert.equal(res.nextState.week, 1);
  assert.equal(res.scholarshipAlert, 'lost');
  assert.equal(res.nextState.scholarship?.active, false);
  assert.ok(res.nextState.flags.includes('scholarship_lost'));
});

test('weekly challenges award bonus money/mental and hardcore mode tightens economy', () => {
  const classic = createInitialSave(baseProfile);
  const hardcore = createInitialSave({ ...baseProfile, difficulty: 'hardcore' });
  assert.ok(hardcore.stats.money < classic.stats.money);
  assert.ok(hardcore.flags.includes('hardcore_mode'));

  classic.activeChallenge = {
    id: 'ch_test',
    title: 'Double Study',
    titleEn: 'Double Study',
    desc: 'Study twice',
    descEn: 'Study twice',
    kind: 'study_two',
    target: 2,
    rewardMoney: 200,
    rewardMental: 8,
    rewardGwa: -0.05,
  };
  const res = resolveWeeklyPlan(classic, ['study', 'attend_class', 'rest']);
  assert.equal(res.challengeCompleted?.id, 'ch_test');
  assert.equal(res.nextState.challengesCompleted, 1);
  assert.equal(res.nextState.studyStreak, 1);
});

test('minigame unlock & payout perks apply by strand/course', () => {
  const ictSave = createInitialSave(baseProfile);
  assert.equal(isMinigameUnlocked('freelance', ictSave), true);

  const nursingHumss = createInitialSave({
    ...baseProfile,
    strand: 'HUMSS',
    course: 'Nursing',
  });
  assert.equal(isMinigameUnlocked('freelance', nursingHumss), false);

  const educSave = createInitialSave({ ...baseProfile, course: 'Education' });
  const educPay = computeMinigamePayout('tutoring', 1, educSave);
  const regularPay = computeMinigamePayout('tutoring', 1, nursingHumss);
  assert.ok(educPay.payout > regularPay.payout);
});

test('evaluateEnding selects Cum Laude, Student Entrepreneur, Scholar, and Shifted endings properly', () => {
  const honorSave = createInitialSave(baseProfile);
  honorSave.stats.gwa = 1.45;
  assert.equal(evaluateEnding(honorSave, ALL_ENDINGS).id, 'cum_laude_broke');

  const bizSave = createInitialSave(baseProfile);
  bizSave.stats.gwa = 2.1;
  bizSave.stats.money = 7500;
  bizSave.flags.push('student_hustler');
  assert.equal(evaluateEnding(bizSave, ALL_ENDINGS).id, 'student_entrepreneur');

  const shiftedSave = createInitialSave(baseProfile);
  shiftedSave.stats.gwa = 2.4;
  shiftedSave.stats.money = 1200;
  shiftedSave.flags.push('shifted_course');
  assert.equal(evaluateEnding(shiftedSave, ALL_ENDINGS).id, 'shifted_course_ending');
});

test('24-hour clock formatting, time-of-day phases, and sleep bonus behave accurately', () => {
  assert.deepEqual(formatClockTime(330), { time12: '05:30 AM', time24: '05:30' });
  assert.deepEqual(formatClockTime(780), { time12: '01:00 PM', time24: '13:00' });
  assert.deepEqual(formatClockTime(1440), { time12: '12:00 AM', time24: '24:00' });

  assert.equal(getTimeOfDayPhase(330), 'dawn');
  assert.equal(getTimeOfDayPhase(480), 'morning');
  assert.equal(getTimeOfDayPhase(840), 'afternoon');
  assert.equal(getTimeOfDayPhase(1140), 'evening');
  assert.equal(getTimeOfDayPhase(1350), 'night');

  assert.equal(getSleepBonus(1200).energyBonus, 14);
  assert.equal(getSleepBonus(1350).energyBonus, 7);
  assert.equal(getSleepBonus(1440).energyBonus, -4);
});

test('performDailyAction advances 24h clock, records timeline blocks, and applies weekend pay bonus', () => {
  const save = createInitialSave(baseProfile);
  assert.equal(save.minuteOfDay, 330); // 05:30 AM dawn wake-up
  assert.equal(getWeekdayInfo(save.totalWeeks).short, 'Mon');

  const step1 = performDailyAction(save, 'attend_class');
  assert.ok(step1);
  assert.equal(step1.nextState.minuteOfDay, 510); // +3h -> 08:30 AM
  assert.equal(step1.nextState.dayActions?.length, 1);
  assert.equal(step1.reachedMidnight, false);

  // Test Saturday weekend +15% raket shift bonus
  const satSave = { ...save, totalWeeks: 6, minuteOfDay: 600 };
  assert.equal(getWeekdayInfo(satSave.totalWeeks).isWeekend, true);
  const weekdayWork = performDailyAction(save, 'work');
  const weekendWork = performDailyAction(satSave, 'work');
  assert.ok(weekdayWork && weekendWork);
  assert.ok(weekendWork.nextState.stats.money > weekdayWork.nextState.stats.money);
});

test('finishDayAndAdvance resets clock to 05:30 AM, resets wake-up scene, and advances dayOfYear', () => {
  const save = createInitialSave(baseProfile);
  save.stats.energy = 50;
  save.minuteOfDay = 1200; // 08:00 PM
  const step1 = performDailyAction(save, 'study');
  assert.ok(step1);
  const done = finishDayAndAdvance(step1.nextState);
  assert.equal(done.nextState.dayOfYear, 2);
  assert.equal(done.nextState.totalWeeks, 2);
  assert.equal(done.nextState.minuteOfDay, 330);
  assert.equal(done.nextState.hasWokenUpToday, false);
  assert.equal(done.nextState.dayActions?.length, 0);
  assert.equal(done.sleepBonus, 7); // 08:00 PM + 2h study = 10:00 PM (1320) -> Normal Sleep (+7 EN)
});

test('anti-loophole daily caps, time gate, and low-energy gate block spam exploits', () => {
  let save = createInitialSave(baseProfile);
  // Attend class max 1x/day
  const class1 = performDailyAction(save, 'attend_class');
  assert.ok(class1);
  assert.equal(canPerformDailyAction(class1.nextState, 'attend_class').allowed, false);

  // Paid shifts max 2x/day with overtime reduction on 2nd shift
  const shift1 = performDailyAction(save, 'work');
  assert.ok(shift1);
  const earned1 = shift1.nextState.stats.money - save.stats.money;
  const shift2 = performDailyAction(shift1.nextState, 'work');
  assert.ok(shift2);
  const earned2 = shift2.nextState.stats.money - shift1.nextState.stats.money;
  assert.ok(earned2 < earned1, '2nd shift should pay less due to overtime fatigue');
  assert.equal(canPerformDailyAction(shift2.nextState, 'work').allowed, false);
  assert.equal(canStartMinigame('carinderia', shift2.nextState, false).allowed, false);

  // Time gate: at 11:00 PM (1380), cannot start a 3h class or 2h minigame
  const lateNight = { ...save, minuteOfDay: 1380 };
  assert.equal(canPerformDailyAction(lateNight, 'attend_class').allowed, false);
  assert.equal(canStartMinigame('carinderia', lateNight, false).allowed, false);
  assert.equal(canPerformDailyAction(lateNight, 'family').allowed, true); // 1h fits before midnight

  // Low-energy gate: strenuous actions blocked below 12 energy
  const exhausted = { ...save, stats: { ...save.stats, energy: 8 } };
  assert.equal(canPerformDailyAction(exhausted, 'study').allowed, false);
  assert.equal(canPerformDailyAction(exhausted, 'rest').allowed, true);

  // Scholarship quest max 1 attempt per semester
  const triedSch = {
    ...save,
    flags: [...save.flags, getScholarshipSemesterFlag(save.chapter, save.semester)],
  };
  assert.equal(canStartMinigame('scholarship', triedSch, false).allowed, false);
});

test('anti-sleep-spam absent penalty and daily utang interest apply cleanly', () => {
  const morningSave = createInitialSave(baseProfile);
  const startGwa = morningSave.stats.gwa;
  // Sleeping at 06:00 AM with 0 actions done triggers absent penalty
  const skipRes = finishDayAndAdvance(morningSave);
  assert.equal(skipRes.absentPenalty, true);
  assert.equal(skipRes.sleepBonus, 0);
  assert.ok(skipRes.nextState.stats.gwa > startGwa);

  // Ending the day in negative cash triggers utang interest (>= ₱25)
  const debtSave = createInitialSave(baseProfile);
  debtSave.stats.money = -1000;
  debtSave.minuteOfDay = 1200;
  const debtRes = finishDayAndAdvance(debtSave);
  assert.equal(debtRes.debtInterest, 50); // 5% of ₱1,000
});

test('skill-curved minigame payouts deduct low scores and reward mastery', () => {
  const save = createInitialSave(baseProfile);
  const lowPay = computeMinigamePayout('carinderia', 0.2, save);
  const midPay = computeMinigamePayout('carinderia', 0.6, save);
  const maxPay = computeMinigamePayout('carinderia', 1.0, save);
  assert.equal(lowPay.bonusLabel, 'Low Score Deduction');
  assert.ok(lowPay.payout < 60);
  assert.ok(midPay.payout > lowPay.payout);
  assert.ok(maxPay.payout > midPay.payout);
});

test('save integrity checksum verifies authentic saves and catches tampered edits', () => {
  const authentic = createInitialSave(baseProfile);
  assert.equal(verifySaveIntegrity(authentic).valid, true);

  // Tampering with money breaks integrity hash
  const hackedMoney = {
    ...authentic,
    stats: { ...authentic.stats, money: 99999 },
  };
  assert.equal(verifySaveIntegrity(hackedMoney).valid, false);

  // Even a small silent cash edit without re-signing fails signature verification
  const stealthEdit = {
    ...authentic,
    stats: { ...authentic.stats, money: authentic.stats.money + 500 },
  };
  assert.equal(verifySaveIntegrity(stealthEdit).valid, false);

  // Re-signed valid state passes cleanly
  const validSigned = signSaveData({
    ...authentic,
    stats: { ...authentic.stats, money: authentic.stats.money + 100 },
  });
  assert.equal(verifySaveIntegrity(validSigned).valid, true);
});

test('365-day Philippine calendar maps months, seasons, holidays, and year rollover accurately', () => {
  const day1 = getCalendarDayInfo(1, 1);
  assert.equal(day1.monthName, 'June');
  assert.equal(day1.dayOfMonth, 1);
  assert.equal(day1.season, 'habagat');
  assert.ok(day1.specialDayTl?.includes('Pasukan'));

  const xmas = getCalendarDayInfo(208, 208);
  assert.equal(xmas.monthName, 'December');
  assert.equal(xmas.dayOfMonth, 25);
  assert.equal(xmas.season, 'amihan');
  assert.ok(xmas.specialDayTl?.includes('Pasko'));

  const day365 = getCalendarDayInfo(365, 365);
  assert.equal(day365.monthName, 'May');
  assert.equal(day365.dayOfMonth, 31);
  assert.equal(day365.season, 'tag_init');

  assert.equal(getSemesterAndPeriodFromDay(182).semester, 1);
  assert.equal(getSemesterAndPeriodFromDay(183).semester, 2);

  // Crossing Day 365 advances school year chapter (shs_year1 -> shs_year2) and wraps dayOfYear to 1
  const yearEnd = createInitialSave(baseProfile);
  yearEnd.dayOfYear = 365;
  yearEnd.semester = 2;
  yearEnd.week = 8;
  yearEnd.minuteOfDay = 1200;
  const rollover = finishDayAndAdvance(yearEnd);
  assert.equal(rollover.nextState.dayOfYear, 1);
  assert.equal(rollover.nextState.semester, 1);
  assert.equal(rollover.nextState.chapter, 'shs_year2');
  assert.equal(verifySaveIntegrity(rollover.nextState).valid, true);
});

test('interactive morning wake-up routine and eat_meal daily scenes update clock, stats, and narration', () => {
  const fresh = createInitialSave(baseProfile);
  assert.equal(fresh.hasWokenUpToday, false);
  assert.ok(fresh.currentMoment?.narrationTl.includes('05:30 AM'));

  const awake = performMorningWakeUp(fresh, 'breakfast');
  assert.ok(awake);
  assert.equal(awake.hasWokenUpToday, true);
  assert.equal(awake.minuteOfDay, 375); // 05:30 + 45m = 06:15 AM
  assert.equal(awake.stats.money, fresh.stats.money); // Free home breakfast in SHS!
  assert.ok(awake.currentMoment?.locationTl.includes('Almusal'));

  // Double wake-up blocked
  assert.equal(performMorningWakeUp(awake, 'snooze'), null);

  // Eat meal adapts by time of day (noon -> Tanghalian)
  const noonState = { ...awake, minuteOfDay: 750 }; // 12:30 PM
  assert.equal(getMealLabelForTime(750).tl, 'Tanghalian');
  const lunch = performDailyAction(noonState, 'eat_meal');
  assert.ok(lunch);
  assert.equal(lunch.block.label, 'Tanghalian');
  assert.ok(lunch.nextState.currentMoment?.locationTl.includes('Tanghalian'));
});

test('continuous 7-beat interactive daily story flows smoothly from wake_up to bedtime with intra-day memory', async () => {
  const { buildDailyStoryScene, applyDailyStoryChoice } = await import('./dailyStoryFlow');

  let state = createInitialSave(baseProfile);
  assert.equal(state.dayBeat, 'wake_up');

  // 1. Wake up -> snooze (sets 'snoozed' intra-day memory tag)
  const wakeScene = buildDailyStoryScene(state);
  assert.equal(wakeScene.beat, 'wake_up');
  const snoozeChoice = wakeScene.choices.find((c) => c.id === 'wake_snooze');
  assert.ok(snoozeChoice);
  state = applyDailyStoryChoice(state, snoozeChoice).nextState;
  assert.equal(state.dayBeat, 'commute');
  assert.ok(state.dayContextTags?.includes('snoozed'));

  // 2. Commute reacts directly to 'snoozed' tag!
  const commuteScene = buildDailyStoryScene(state);
  assert.equal(commuteScene.beat, 'commute');
  assert.ok(commuteScene.lines[0].text.toLowerCase().includes('snooze'));
  const jeepChoice = commuteScene.choices.find((c) => c.id === 'commute_jeep');
  assert.ok(jeepChoice);
  state = applyDailyStoryChoice(state, jeepChoice).nextState;
  assert.equal(state.dayBeat, 'morning_campus');

  // 3. Morning campus class reacts to 'snoozed' (rushed arrival)
  const classScene = buildDailyStoryScene(state);
  assert.equal(classScene.beat, 'morning_campus');
  assert.ok(classScene.lines[0].text.includes('Hiningal'));
  const reciteChoice = classScene.choices.find((c) => c.id === 'class_recite');
  assert.ok(reciteChoice);
  state = applyDailyStoryChoice(state, reciteChoice).nextState;
  assert.equal(state.dayBeat, 'lunch');

  // 4. Lunch reacts to skipped breakfast
  const lunchScene = buildDailyStoryScene(state);
  assert.equal(lunchScene.beat, 'lunch');
  assert.ok(lunchScene.lines[0].text.includes('almusal'));
  const munggoChoice = lunchScene.choices.find((c) => c.id === 'lunch_munggo');
  assert.ok(munggoChoice);
  state = applyDailyStoryChoice(state, munggoChoice).nextState;
  assert.equal(state.dayBeat, 'afternoon');

  // 5. Afternoon supports inline Job Picker story choices & Study progression
  const jobPickerScene = buildDailyStoryScene(state, { showJobPicker: true });
  assert.ok(jobPickerScene.choices.some((c) => c.triggerMinigame === 'carinderia'));
  assert.ok(jobPickerScene.choices.some((c) => c.id === 'close_job_picker'));

  const aftScene = buildDailyStoryScene(state);
  const studyChoice = aftScene.choices.find((c) => c.id === 'aft_study');
  assert.ok(studyChoice);
  state = applyDailyStoryChoice(state, studyChoice).nextState;
  assert.equal(state.dayBeat, 'evening');

  // 6. Evening -> Bedtime
  const eveScene = buildDailyStoryScene(state);
  const mamaChoice = eveScene.choices.find((c) => c.id === 'eve_dinner_mama');
  assert.ok(mamaChoice);
  state = applyDailyStoryChoice(state, mamaChoice).nextState;
  assert.equal(state.dayBeat, 'bedtime');

  // 7. Bedtime -> NEXT_DAY triggers Day 2/365 with fresh wake_up beat and valid integrity hash
  const bedScene = buildDailyStoryScene(state);
  assert.ok(bedScene.lines[0].text.includes('recite'));
  const sleepChoice = bedScene.choices.find((c) => c.nextBeat === 'NEXT_DAY');
  assert.ok(sleepChoice);
  const bedTransition = applyDailyStoryChoice(state, sleepChoice);
  assert.equal(bedTransition.finishDay, true);

  const day2 = finishDayAndAdvance(bedTransition.nextState).nextState;
  assert.equal(day2.dayOfYear, 2);
  assert.equal(day2.dayBeat, 'wake_up');
  assert.deepEqual(day2.dayContextTags, []);
  assert.equal(verifySaveIntegrity(day2).valid, true);
});



