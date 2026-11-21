import type {
  AccessoryId,
  CharacterAppearance,
  CollegeCourseId,
  DifficultyMode,
  FamilyBackgroundId,
  Gender,
  HairColorId,
  HairStyleId,
  HometownId,
  MinigameId,
  NpcId,
  SchoolChapterId,
  ShsStrandId,
  SkinToneId,
  SubjectGrade,
  UniformAccentId,
  WeeklyActionId,
  WeeklyChallenge,
} from '../types/game';

export const WEEKS_PER_SEMESTER = 8;
export const DAY_START_MINUTE = 360; // 06:00 AM
export const DAY_END_MINUTE = 1440; // 24:00 (12:00 AM)
export const MAX_PAID_SHIFTS_PER_DAY = 2; // Anti-loophole cap on paid shifts/minigames per day
export const MIN_STRENUOUS_ENERGY = 12; // Cannot grind work/study/class when exhausted

export const WEEKDAYS = [
  { short: 'Mon', tl: 'Lunes', isWeekend: false },
  { short: 'Tue', tl: 'Martes', isWeekend: false },
  { short: 'Wed', tl: 'Miyerkules', isWeekend: false },
  { short: 'Thu', tl: 'Huwebes', isWeekend: false },
  { short: 'Fri', tl: 'Biyernes', isWeekend: false },
  { short: 'Sat', tl: 'Sabado', isWeekend: true },
  { short: 'Sun', tl: 'Linggo', isWeekend: true },
] as const;

export const SKIN_TONES: { id: SkinToneId; label: string; skin: string; shadow: string }[] = [
  { id: 'fair', label: 'Fair', skin: '#f1c69c', shadow: '#cc976a' },
  { id: 'moreno', label: 'Moreno/a', skin: '#d99b66', shadow: '#b57442' },
  { id: 'kayumanggi', label: 'Kayumanggi', skin: '#c4834e', shadow: '#9a5f32' },
  { id: 'tan', label: 'Golden Tan', skin: '#b06d3d', shadow: '#854c24' },
  { id: 'deep', label: 'Deep Brown', skin: '#8d552c', shadow: '#633717' },
];

export const HAIR_STYLES: { id: HairStyleId; label: string }[] = [
  { id: 'short', label: 'Classic Short' },
  { id: 'curtain', label: 'Curtain / Soft' },
  { id: 'spiky', label: 'Spiky' },
  { id: 'long', label: 'Long Straight' },
  { id: 'ponytail', label: 'Ponytail' },
  { id: 'curly', label: 'Curly Bob' },
];

export const HAIR_COLORS: { id: HairColorId; label: string; hex: string }[] = [
  { id: 'black', label: 'Jet Black', hex: '#1e1b18' },
  { id: 'espresso', label: 'Espresso', hex: '#3b2419' },
  { id: 'chestnut', label: 'Chestnut', hex: '#6d3f25' },
  { id: 'burgundy', label: 'Burgundy', hex: '#6b1d34' },
  { id: 'midnight', label: 'Midnight Blue', hex: '#1e3357' },
  { id: 'ash', label: 'Ash Blonde', hex: '#a89274' },
];

export const ACCESSORIES: { id: AccessoryId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'glasses', label: 'Eyeglasses' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'cap', label: 'Campus Cap' },
  { id: 'bandana', label: 'Bandana' },
];

export const UNIFORM_ACCENTS: { id: UniformAccentId; label: string; hex: string }[] = [
  { id: 'royal', label: 'Royal Blue', hex: '#1e3a8a' },
  { id: 'maroon', label: 'Maroon', hex: '#7f1d1d' },
  { id: 'forest', label: 'Forest Green', hex: '#14532d' },
  { id: 'gold', label: 'Varsity Gold', hex: '#b45309' },
  { id: 'crimson', label: 'Crimson', hex: '#9f1239' },
];

export function getDefaultAppearance(gender: Gender): CharacterAppearance {
  return {
    skinTone: 'moreno',
    hairStyle: gender === 'female' ? 'long' : 'short',
    hairColor: 'black',
    accessory: 'none',
    uniformAccent: 'royal',
  };
}

export const DIFFICULTY_MODES: {
  id: DifficultyMode;
  label: string;
  labelEn: string;
  blurb: string;
  blurbEn: string;
}[] = [
  {
    id: 'classic',
    label: 'Classic Iskolar',
    labelEn: 'Classic Student',
    blurb: 'Balanse ang baon, renta, at grades. Sakto para ma-enjoy ang buong kwento at lahat ng endings.',
    blurbEn: 'Balanced allowance, rent, and grades. Ideal for enjoying the full story and endings.',
  },
  {
    id: 'hardcore',
    label: 'Hardcore Barya Mode',
    labelEn: 'Hardcore Broke Mode',
    blurb: '-15% baon, +20% tuition/rent inflation, mas mabilis mapagod — pero +25% bonus pay sa magaling sa raket!',
    blurbEn: '-15% allowance, +20% rent/tuition inflation, faster fatigue — plus +25% skill bonus on side-hustle payouts!',
  },
];

export const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'ch_deans_grind',
    title: 'Dean’s List Grind',
    titleEn: 'Dean’s List Grind',
    desc: 'Tapusin ang araw na may GWA ≤ 1.85.',
    descEn: 'Finish the day with GWA ≤ 1.85.',
    kind: 'gwa_lte',
    target: 1.85,
    rewardMoney: 110,
    rewardMental: 6,
  },
  {
    id: 'ch_ipon_challenge',
    title: 'Ipon Challenge',
    titleEn: 'Savings Challenge',
    desc: 'Mag-iwan ng ₱1,400+ sa wallet pagkatapos ng daily bills.',
    descEn: 'Keep at least ₱1,400 in your wallet after daily expenses.',
    kind: 'money_gte',
    target: 1400,
    rewardMoney: 135,
    rewardMental: 7,
  },
  {
    id: 'ch_self_care',
    title: 'Iwas Burnout Check',
    titleEn: 'Anti-Burnout Check',
    desc: 'Panatilihing 65+ ang Energy AT Mental Health bago matulog.',
    descEn: 'Keep both Energy and Mental Health at 65+ before sleeping.',
    kind: 'energy_mental_gte',
    target: 65,
    rewardMoney: 90,
    rewardMental: 9,
    rewardGwa: -0.04,
  },
  {
    id: 'ch_barkada_bond',
    title: 'Barkada Spirit',
    titleEn: 'Social Butterfly',
    desc: 'Paabutin sa 60+ ang Social stat mo ngayong araw.',
    descEn: 'Reach or maintain at least 60 Social today.',
    kind: 'social_gte',
    target: 60,
    rewardMoney: 100,
    rewardMental: 7,
  },
  {
    id: 'ch_raket_hustle',
    title: 'Raket Master Shift',
    titleEn: 'Side-Hustle Shift',
    desc: 'Mag-Part-Time Shift o maglaro ng 1 Raket Minigame ngayong araw.',
    descEn: 'Complete a Part-Time Shift or 1 Job Minigame today.',
    kind: 'work_shift',
    target: 1,
    rewardMoney: 150,
    rewardMental: 5,
  },
  {
    id: 'ch_double_study',
    title: 'Exam Prep Focus',
    titleEn: 'Double Study Sprint',
    desc: 'Gumawa ng 2 Study o Attend Class blocks ngayong araw.',
    descEn: 'Complete at least 2 Study or Attend Class blocks today.',
    kind: 'study_two',
    target: 2,
    rewardMoney: 105,
    rewardMental: 6,
    rewardGwa: -0.05,
  },
];

export const CHAPTER_ORDER: SchoolChapterId[] = [
  'shs_year1',
  'shs_year2',
  'college_year1',
  'college_year2',
  'college_year3',
  'college_year4',
];

export const CHAPTER_LABELS: Record<SchoolChapterId, { tl: string; en: string; short: string }> = {
  prologue: { tl: 'Prologo', en: 'Prologue', short: 'PROLOGUE' },
  shs_year1: { tl: 'SHS Grade 11', en: 'SHS Grade 11', short: 'G11' },
  shs_year2: { tl: 'SHS Grade 12', en: 'SHS Grade 12', short: 'G12' },
  college_year1: { tl: 'College 1st Year', en: 'College Year 1', short: 'YR 1' },
  college_year2: { tl: 'College 2nd Year', en: 'College Year 2', short: 'YR 2' },
  college_year3: { tl: 'College 3rd Year', en: 'College Year 3', short: 'YR 3' },
  college_year4: { tl: 'College 4th Year', en: 'College Year 4', short: 'YR 4' },
};

export interface HometownOption {
  id: HometownId;
  region: string;
  isProvincial: boolean;
  blurb: string;
  blurbEn: string;
  weeklyBoardCost: number; // Added in College if provincial
  farePerWeek: number;
}

export const HOMETOWN_OPTIONS: HometownOption[] = [
  {
    id: 'Pangasinan',
    region: 'Ilocos Region',
    isProvincial: true,
    blurb: 'Malapit sa dagat at palayan. Lumuwas sa Manila pag college — may boarding house rent!',
    blurbEn: 'Coastal rice province. Moves to Manila for college — boarding house rent applies!',
    weeklyBoardCost: 720,
    farePerWeek: 210,
  },
  {
    id: 'Iloilo',
    region: 'Western Visayas',
    isProvincial: true,
    blurb: 'Masarap ang batchoy at malambing ang punto. Malayo sa pamilya pag college.',
    blurbEn: 'Warm community and famous batchoy. Far from family once college begins.',
    weeklyBoardCost: 760,
    farePerWeek: 200,
  },
  {
    id: 'Davao del Sur',
    region: 'Davao Region',
    isProvincial: true,
    blurb: 'Tahimik sa probinsya pero malaking hakbang ang pagluwas para sa pangarap.',
    blurbEn: 'Peaceful provincial roots, big leap moving to the metro for college.',
    weeklyBoardCost: 760,
    farePerWeek: 220,
  },
  {
    id: 'Batangas',
    region: 'CALABARZON',
    isProvincial: true,
    blurb: 'Barako ang kape at matapang ang loob. Kaya pang umuwi tuwing weekend kung may pamasahe.',
    blurbEn: 'Strong barako coffee and grit. Close enough for weekend trips home when budget allows.',
    weeklyBoardCost: 650,
    farePerWeek: 240,
  },
  {
    id: 'Metro Manila',
    region: 'NCR',
    isProvincial: false,
    blurb: 'Walang boarding house rent pero araw-araw kang nakikipaglaban sa jeep, LRT, at traffic.',
    blurbEn: 'No boarding rent, but daily commute battles through jeepneys, LRT, and heavy traffic.',
    weeklyBoardCost: 0,
    farePerWeek: 390,
  },
];

export interface FamilyBackgroundOption {
  id: FamilyBackgroundId;
  label: string;
  labelEn: string;
  blurb: string;
  blurbEn: string;
  startingMoney: number;
  weeklyAllowance: number;
  debtLimit: number;
  startingFlags: string[];
  familyRelBonus: number;
}

export const FAMILY_BACKGROUNDS: FamilyBackgroundOption[] = [
  {
    id: 'ofw',
    label: 'OFW Parent',
    labelEn: 'OFW Parent',
    blurb: 'Mas malaki ang padala, pero minsan delayed ang remittance at mabigat ang homesick at expectations.',
    blurbEn: 'Higher allowance, but remittances can be delayed and expectations run heavy.',
    startingMoney: 1700,
    weeklyAllowance: 640,
    debtLimit: 4500,
    startingFlags: ['bg_ofw'],
    familyRelBonus: 5,
  },
  {
    id: 'farmer',
    label: 'Farmer / Fisherman Family',
    labelEn: 'Farmer / Fisherman Family',
    blurb: 'Nakadepende sa ani at panahon ang kita. Bagyo sa probinsya = tipid mode sa syudad.',
    blurbEn: 'Income depends on harvest and weather. A province typhoon means instant survival mode.',
    startingMoney: 750,
    weeklyAllowance: 350,
    debtLimit: 3200,
    startingFlags: ['bg_farmer'],
    familyRelBonus: 12,
  },
  {
    id: 'tindera',
    label: 'Tindera / Small Business',
    labelEn: 'Market Vendor / Sari-Sari Family',
    blurb: 'Sanay ka sa barya, sukli, at diskarte. Mas madaling kumita sa raket at negosyo.',
    blurbEn: 'Raised on coins, sukli, and hustle. Bonus earnings in selling and side hustles.',
    startingMoney: 1050,
    weeklyAllowance: 430,
    debtLimit: 3600,
    startingFlags: ['bg_tindera', 'business_instinct'],
    familyRelBonus: 8,
  },
  {
    id: 'single_parent',
    label: 'Single Parent Household',
    labelEn: 'Single Parent Household',
    blurb: 'Si Mama ang kumakayod para sa inyo. Maliit ang baon pero buo ang suporta at determinasyon.',
    blurbEn: 'One parent carries the whole house. Tight baon, fierce love, strong scholarship drive.',
    startingMoney: 800,
    weeklyAllowance: 370,
    debtLimit: 3200,
    startingFlags: ['bg_single_parent'],
    familyRelBonus: 15,
  },
  {
    id: 'employed_low',
    label: 'Both Parents Employed (Low Income)',
    labelEn: 'Both Parents Minimum Wage',
    blurb: 'Steady pero sakto lang sa bills at pamasahe. Isang hospital bill lang, tagilid agad.',
    blurbEn: 'Steady paycheck stretched thin by bills. One unexpected expense tips the scale.',
    startingMoney: 1180,
    weeklyAllowance: 470,
    debtLimit: 3800,
    startingFlags: ['bg_employed_low'],
    familyRelBonus: 6,
  },
];

export interface StrandOption {
  id: ShsStrandId;
  name: string;
  blurb: string;
  blurbEn: string;
  perk: string;
  perkEn: string;
  subjects: string[];
}

export const SHS_STRANDS: StrandOption[] = [
  {
    id: 'STEM',
    name: 'STEM',
    blurb: 'Calculus, Physics, at walang katapusang lab reports. Malakas sa scholarship exams.',
    blurbEn: 'Calculus, Physics, and endless lab reports. Strong edge on scholarship exams.',
    perk: '+Scholarship exam edge & Math tutoring bonus',
    perkEn: '+Scholarship exam edge & Math tutoring bonus',
    subjects: ['Pre-Calculus', 'General Physics', 'General Biology', 'Research in Daily Life'],
  },
  {
    id: 'ABM',
    name: 'ABM',
    blurb: 'Debits, credits, at negosyo mindset. Unlocks sari-sari bookkeeping & freelance accounting gigs.',
    blurbEn: 'Debits, credits, and hustler mindset. Unlocks bookkeeping & freelance business gigs.',
    perk: 'Unlocks Freelance & +20% Tusok-tusok profit',
    perkEn: 'Unlocks Freelance & +20% street-selling profit',
    subjects: ['Fundamentals of ABM', 'Business Math', 'Organization & Mgmt', 'Applied Economics'],
  },
  {
    id: 'HUMSS',
    name: 'HUMSS',
    blurb: 'Debate, essay, at makataong pananaw. Malakas sa social, orgs, at scholarship interviews.',
    blurbEn: 'Debates, essays, and civic voice. Excels in social ties, orgs, and scholarship interviews.',
    perk: '+Social gains & Scholarship essay bonus',
    perkEn: '+Social gains & Scholarship essay bonus',
    subjects: ['Creative Writing', 'Philippine Politics', 'World Religions', 'Disciplines of Social Sci'],
  },
  {
    id: 'GAS',
    name: 'GAS',
    blurb: 'Flexible para sa hindi pa siguradong kurso. Balanse ang energy at stress.',
    blurbEn: 'Flexible general strand for explorers. Balanced energy and mental health drain.',
    perk: 'Lower weekly stress & flexible shifting',
    perkEn: 'Lower weekly stress & flexible course shifting',
    subjects: ['Humanities 1', 'Applied Economics', 'Disaster Readiness', 'Empowerment Tech'],
  },
  {
    id: 'TVL-ICT',
    name: 'TVL-ICT',
    blurb: 'PC repair, coding, at Canva layouts. Instant raket sa computer shop at freelance!',
    blurbEn: 'PC repair, coding, and layout design. Instant side-gig access in tech & freelance!',
    perk: 'Unlocks Freelance Tech Gigs from SHS!',
    perkEn: 'Unlocks Freelance Tech Gigs right in SHS!',
    subjects: ['Computer Programming', 'CSS Hardware Servicing', 'Animation & Layout', 'Empowerment Tech'],
  },
  {
    id: 'TVL-HE',
    name: 'TVL-HE',
    blurb: 'Kusina, baking, at hospitality skills. Halimaw sa Carinderia at Fastfood shifts!',
    blurbEn: 'Culinary, baking, and service skills. Top earner in Carinderia & Fastfood shifts!',
    perk: '+25% Carinderia & Fastfood shift pay',
    perkEn: '+25% Carinderia & Fastfood shift pay',
    subjects: ['Bread & Pastry', 'Cookery NC II', 'Food & Beverage Service', 'Entrepreneurship'],
  },
];

export interface CourseOption {
  id: CollegeCourseId;
  name: string;
  difficulty: 'Moderate' | 'Challenging' | 'Brutal';
  tuitionPerSem: number;
  blurb: string;
  blurbEn: string;
  perk: string;
  perkEn: string;
  hasBoardExam: boolean;
  subjectsByYear: Record<1 | 2 | 3 | 4, string[]>;
}

export const COLLEGE_COURSES: CourseOption[] = [
  {
    id: 'BSIT',
    name: 'BS Information Technology',
    difficulty: 'Challenging',
    tuitionPerSem: 4800,
    blurb: 'Kape, debugging sa 2AM, at capstone system na nag-crash bago defense.',
    blurbEn: 'Coffee, 2AM debugging, and a capstone app crashing right before defense.',
    perk: 'Unlocks Freelance Dev & PC Repair gigs',
    perkEn: 'Unlocks Freelance Dev & PC Repair gigs',
    hasBoardExam: false,
    subjectsByYear: {
      1: ['Intro to Computing', 'Computer Prog 1', 'Discrete Math', 'Purposive Comm'],
      2: ['Data Structures', 'Web Systems', 'Database Mgmt', 'Networking 1'],
      3: ['Systems Integration', 'Info Assurance', 'Human-Computer Int.', 'Capstone Prep'],
      4: ['Capstone Project 2', 'IT Practicum (OJT)', 'Cloud & DevOps', 'IT Ethics'],
    },
  },
  {
    id: 'BSCS',
    name: 'BS Computer Science',
    difficulty: 'Brutal',
    tuitionPerSem: 4900,
    blurb: 'Algorithms, proofs, at compilers. Masakit sa ulo pero mataas ang freelance rate.',
    blurbEn: 'Algorithms, proofs, and compilers. Heavy brain drain, high freelance rate.',
    perk: 'High-pay Freelance Tech & Math Tutoring',
    perkEn: 'High-pay Freelance Tech & Math Tutoring',
    hasBoardExam: false,
    subjectsByYear: {
      1: ['Intro to CS', 'Prog Fundamentals', 'Calculus 1', 'Discrete Structures'],
      2: ['Algorithms & Complexity', 'Computer Architecture', 'Operating Systems', 'Linear Algebra'],
      3: ['Automata Theory', 'Software Engineering', 'Machine Learning Intro', 'CS Thesis 1'],
      4: ['CS Thesis 2', 'Distributed Systems', 'CS Practicum', 'Ethics in Computing'],
    },
  },
  {
    id: 'Nursing',
    name: 'BS Nursing',
    difficulty: 'Brutal',
    tuitionPerSem: 6200,
    blurb: 'Putian na uniform, RLE fees, return demo, at puyat sa hospital duty. Pusong bayani!',
    blurbEn: 'Crisp white uniform, RLE fees, return demos, and hospital duties. Real grit!',
    perk: 'Clinical duty arcs & Board Exam Ending path',
    perkEn: 'Clinical duty arcs & Board Exam Ending path',
    hasBoardExam: true,
    subjectsByYear: {
      1: ['Anatomy & Physiology', 'Biochemistry', 'Theoretical Foundations', 'Health Assessment'],
      2: ['Pharmacology', 'Community Health Nsg', 'Maternal & Child Care', 'RLE Clinical 1'],
      3: ['Med-Surg Nursing', 'Psychiatric Nursing', 'Nursing Research 1', 'RLE Hospital Duty'],
      4: ['Intensive Care Nsg', 'Nursing Leadership', 'Nursing Research 2', 'Board Review Prep'],
    },
  },
  {
    id: 'Education',
    name: 'BS Education',
    difficulty: 'Moderate',
    tuitionPerSem: 3600,
    blurb: 'Visual aids, lesson plans, at demo teaching. Laging mabenta sa tutoring raket!',
    blurbEn: 'Visual aids, lesson plans, and demo teaching. Always in demand for tutoring!',
    perk: '+35% Tutoring payout & LET Board Ending path',
    perkEn: '+35% Tutoring payout & LET Board Ending path',
    hasBoardExam: true,
    subjectsByYear: {
      1: ['Child Development', 'Facilitating Learning', 'Assessment 1', 'Purposive Comm'],
      2: ['Curriculum Dev', 'Teaching Strategies', 'EdTech & Visual Aids', 'Field Study 1'],
      3: ['Action Research', 'Classroom Management', 'Demo Teaching Lab', 'Field Study 2'],
      4: ['Practice Teaching', 'LET Intensive Review', 'Action Research 2', 'Teaching Profession'],
    },
  },
  {
    id: 'Engineering',
    name: 'BS Civil Engineering',
    difficulty: 'Brutal',
    tuitionPerSem: 5600,
    blurb: 'T-square, scientific calculator, at removal exams. Pero pag nakapasa, solid ang respeto.',
    blurbEn: 'T-squares, sci-cal battles, and removal exams. Brutal grind, huge pride.',
    perk: 'High Tutoring pay & Engineering Board path',
    perkEn: 'High Tutoring pay & Engineering Board path',
    hasBoardExam: true,
    subjectsByYear: {
      1: ['Calculus 1', 'Chemistry for Eng', 'Engineering Drawing', 'Statics Intro'],
      2: ['Differential Equations', 'Mechanics of Bodies', 'Surveying 1', 'CAD Drafting'],
      3: ['Structural Theory', 'Hydraulics', 'Geotechnical Eng', 'CE Research 1'],
      4: ['Structural Design', 'CE Project Study', 'Construction Mgmt', 'Board Correlation'],
    },
  },
  {
    id: 'Criminology',
    name: 'BS Criminology',
    difficulty: 'Moderate',
    tuitionPerSem: 4100,
    blurb: 'Morning formation, criminal law, at forensics. Matibay ang stamina at disiplina.',
    blurbEn: 'Morning drills, criminal law, and forensics. Extra stamina and discipline.',
    perk: '+10% Energy efficiency on tough weeks',
    perkEn: '+10% Energy efficiency on tough weeks',
    hasBoardExam: true,
    subjectsByYear: {
      1: ['Intro to Criminology', 'Criminal Law 1', 'Defensive Tactics', 'Ethics & Values'],
      2: ['Forensic Photography', 'Criminal Law 2', 'Traffic Management', 'Law Enforcement'],
      3: ['Criminalistics Lab', 'Juvenile Delinquency', 'Crim Research 1', 'Fire Arson Inv.'],
      4: ['Criminology Intern', 'Crim Thesis 2', 'Correctional Admin', 'CLE Board Review'],
    },
  },
  {
    id: 'BSBA',
    name: 'BS Business Administration',
    difficulty: 'Moderate',
    tuitionPerSem: 4300,
    blurb: 'Feasibility study, sales pitch, at side-hustle mastery. Hari ng diskarte at negosyo.',
    blurbEn: 'Feasibility studies, pitches, and hustle mastery. Best route for student entrepreneurs.',
    perk: 'Unlocks Freelance Business & +25% Tusok profit',
    perkEn: 'Unlocks Freelance Business & +25% selling profit',
    hasBoardExam: false,
    subjectsByYear: {
      1: ['Basic Microeconomics', 'Accounting Principles', 'Marketing Mgmt', 'Business Comm'],
      2: ['Financial Mgmt', 'Operations Mgmt', 'Business Law', 'HR Management'],
      3: ['Feasibility Study 1', 'Strategic Mgmt', 'Taxation Basics', 'E-Commerce'],
      4: ['Feasibility Defense', 'Business OJT', 'Venture Creation', 'Corporate Governance'],
    },
  },
  {
    id: 'Hospitality',
    name: 'BS Hospitality Management',
    difficulty: 'Moderate',
    tuitionPerSem: 5200,
    blurb: 'Gala uniform, kitchen lab fees, at hotel OJT. Lakas kumita sa food service shifts!',
    blurbEn: 'Pressed gala uniforms, kitchen lab fees, and hotel OJT. Top food-service earner!',
    perk: '+30% Carinderia & Fastfood payout',
    perkEn: '+30% Carinderia & Fastfood payout',
    hasBoardExam: false,
    subjectsByYear: {
      1: ['Macro Tourism', 'Kitchen Essentials', 'Food Safety & Hygiene', 'Hospitality Comm'],
      2: ['Bar & Beverage Ops', 'Front Office Ops', 'Culinary Arts Lab', 'Cost Control'],
      3: ['Events Management', 'Housekeeping Ops', 'Hospitality Research', 'Global Cuisine'],
      4: ['Hotel OJT Practicum', 'Hospitality Capstone', 'Revenue Mgmt', 'Service Excellence'],
    },
  },
  {
    id: 'Psychology',
    name: 'BS Psychology',
    difficulty: 'Challenging',
    tuitionPerSem: 4400,
    blurb: 'SPSS stats, case studies, at "binabasa mo ba isip ko?" jokes. Matibay ang mental health.',
    blurbEn: 'SPSS stats, case studies, and "are you reading my mind?" jokes. Strong mental resilience.',
    perk: 'Slower Mental Health drain & Social bonus',
    perkEn: 'Slower Mental Health drain & Social bonus',
    hasBoardExam: true,
    subjectsByYear: {
      1: ['Intro to Psychology', 'Psych Statistics', 'Developmental Psych', 'Biological Psych'],
      2: ['Theories of Personality', 'Experimental Psych', 'Abnormal Psych', 'Social Psychology'],
      3: ['Psychological Assess.', 'Industrial Psych', 'Psych Research 1', 'Counseling Intro'],
      4: ['Clinical/IO Practicum', 'Psych Thesis 2', 'Filipino Psychology', 'BLEPP Review'],
    },
  },
];

export interface NpcMetadata {
  id: NpcId;
  name: string;
  role: string;
  roleEn: string;
  spriteBase: string;
  bio: string;
  bioEn: string;
}

export const NPCS: Record<NpcId, NpcMetadata> = {
  family: {
    id: 'family',
    name: 'Mama & Pamilya',
    role: 'Pamilya / Home',
    roleEn: 'Family / Home',
    spriteBase: 'mama',
    bio: 'Pinagkukunan ng lakas, baon, at rason kung bakit ka lumalaban hanggang martsa.',
    bioEn: 'Your anchor, source of allowance, and the main reason you keep pushing to graduation.',
  },
  miggy: {
    id: 'miggy',
    name: 'Miggy',
    role: 'Barkada · Joker & Raketero',
    roleEn: 'Best Friend · Hustler & Comedian',
    spriteBase: 'miggy',
    bio: 'Laging may alam na raket, murang siomai rice, at jokes kahit bagsak sa quiz.',
    bioEn: 'Always knows a side hustle, cheap siomai rice spots, and jokes even after failing a quiz.',
  },
  bea: {
    id: 'bea',
    name: 'Bea',
    role: 'Barkada · Dean’s Lister',
    roleEn: 'Friend · Honor Student',
    spriteBase: 'bea',
    bio: 'Organized, may color-coded reviewers, at laging nagpapaalala ng deadlines.',
    bioEn: 'Organized, shares color-coded reviewers, and reminds everyone of looming deadlines.',
  },
  carlo: {
    id: 'carlo',
    name: 'Carlo',
    role: 'Barkada · Org & Streetwise',
    roleEn: 'Friend · Org Leader & Streetwise',
    spriteBase: 'carlo',
    bio: 'Active sa student orgs at laging handang tumulong sa campus survival.',
    bioEn: 'Active in student orgs and always knows which free-food seminars are happening.',
  },
  crush: {
    id: 'crush',
    name: 'Jamie',
    role: 'Classmate · Special Someone',
    roleEn: 'Classmate · Crush',
    spriteBase: 'crush',
    bio: 'Tahimik pero maalaga — lagi kang hinahatian ng extra ballpen o merienda sa library.',
    bioEn: 'Quietly caring — always has an extra pen or shares biscuits during library cramming.',
  },
  prof_reyes: {
    id: 'prof_reyes',
    name: 'Prof. Reyes',
    role: 'Strict Professor / Adviser',
    roleEn: 'Strict Professor / Adviser',
    spriteBase: 'prof',
    bio: 'Terror sa recitation pero patas sa mga estudyanteng totoong nagsisikap.',
    bioEn: 'Feared during recitations, but respects hardworking students and recommends scholarships.',
  },
  aling_nena: {
    id: 'aling_nena',
    name: 'Aling Nena',
    role: 'Carinderia Owner & Landlady',
    roleEn: 'Carinderia Owner & Landlady',
    spriteBase: 'nena',
    bio: 'May-ari ng carinderia at boarding house. Strikta sa renta pero may puso para sa working students.',
    bioEn: 'Runs the carinderia and boarding house. Strict about rent, soft spot for working students.',
  },
};

export interface WeeklyActionConfig {
  id: WeeklyActionId;
  label: string;
  labelEn: string;
  desc: string;
  descEn: string;
  durationHours: number;
  maxPerDay: number;
  strenuous?: boolean;
  timelineColor: string;
  energyDelta: number;
  mentalDelta: number;
  socialDelta: number;
  gwaDelta: number; // negative is better GWA
  moneyDelta: number;
}

export const WEEKLY_ACTIONS: WeeklyActionConfig[] = [
  {
    id: 'attend_class',
    label: 'Pumasok sa Klase',
    labelEn: 'Attend Class',
    desc: 'Complete attendance (1×/day), nakikita ni Prof. Reyes, steady ang grades.',
    descEn: 'Full attendance (1×/day), impresses Prof. Reyes, steady grades.',
    durationHours: 3,
    maxPerDay: 1,
    strenuous: true,
    timelineColor: '#38bdf8',
    energyDelta: -12,
    mentalDelta: -3,
    socialDelta: 4,
    gwaDelta: -0.06,
    moneyDelta: -65,
  },
  {
    id: 'study',
    label: 'Mag-aral / Review',
    labelEn: 'Study & Review',
    desc: 'Hataw sa notes at reviewer (max 2×/day). Gumaganda ang GWA pero nakaka-drain.',
    descEn: 'Grind notes and reviewers (max 2×/day). Improves GWA but drains energy.',
    durationHours: 2,
    maxPerDay: 2,
    strenuous: true,
    timelineColor: '#f59e0b',
    energyDelta: -15,
    mentalDelta: -6,
    socialDelta: -2,
    gwaDelta: -0.08,
    moneyDelta: -40,
  },
  {
    id: 'work',
    label: 'Quick Raket Shift',
    labelEn: 'Quick Part-Time Shift',
    desc: '3-hour shift (+₱125 base, +15% Weekend). Max 2 paid shifts/day — mag-Minigame para mas malaking kita!',
    descEn: '3-hour shift (+₱125 base, +15% Weekend). Max 2 paid shifts/day — play Job Minigames for higher pay!',
    durationHours: 3,
    maxPerDay: 2,
    strenuous: true,
    timelineColor: '#10b981',
    energyDelta: -18,
    mentalDelta: -6,
    socialDelta: 1,
    gwaDelta: 0.03,
    moneyDelta: 125,
  },
  {
    id: 'rest',
    label: 'Power Nap / Pahinga',
    labelEn: 'Power Nap & Rest',
    desc: 'Bawi ng tulog at pahinga sa kwarto (max 2×/day). Iwas burnout!',
    descEn: 'Catch up on sleep and breathe (max 2×/day). Essential to avoid burnout!',
    durationHours: 2,
    maxPerDay: 2,
    strenuous: false,
    timelineColor: '#f472b6',
    energyDelta: 24,
    mentalDelta: 13,
    socialDelta: -1,
    gwaDelta: 0.01,
    moneyDelta: 0,
  },
  {
    id: 'socialize',
    label: 'Tambay w/ Barkada',
    labelEn: 'Hangout w/ Barkada',
    desc: 'Fishball, chikahan, at tawanan (1×/day) kasama sina Miggy, Bea, Carlo, at Jamie.',
    descEn: 'Street food, laughs, and bonding (1×/day) with Miggy, Bea, Carlo, and Jamie.',
    durationHours: 2,
    maxPerDay: 1,
    strenuous: false,
    timelineColor: '#a78bfa',
    energyDelta: -6,
    mentalDelta: 13,
    socialDelta: 12,
    gwaDelta: 0.01,
    moneyDelta: -90,
  },
  {
    id: 'org',
    label: 'Org Activity',
    labelEn: 'Org Activity',
    desc: 'Campus org meetings, events, at connections (1×/day).',
    descEn: 'Campus org events and networking (1×/day).',
    durationHours: 2,
    maxPerDay: 1,
    strenuous: true,
    timelineColor: '#22d3ee',
    energyDelta: -11,
    mentalDelta: 5,
    socialDelta: 10,
    gwaDelta: -0.02,
    moneyDelta: -35,
  },
  {
    id: 'family',
    label: 'Tawag / Family Time',
    labelEn: 'Call Home / Family',
    desc: 'Makipag-usap kay Mama o tumulong sa bahay (1×/day). Pampagaan ng loob.',
    descEn: 'Call home or help around the house (1×/day). Restores heart and family ties.',
    durationHours: 1,
    maxPerDay: 1,
    strenuous: false,
    timelineColor: '#fb7185',
    energyDelta: 5,
    mentalDelta: 11,
    socialDelta: 5,
    gwaDelta: 0,
    moneyDelta: -25,
  },
];

export interface MinigameConfig {
  id: MinigameId;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  energyCost: number;
  basePay: number;
  maxPay: number;
  durationSec: number;
  unlockHint?: string;
  unlockHintEn?: string;
}

export const MINIGAME_CONFIGS: MinigameConfig[] = [
  {
    id: 'carinderia',
    title: 'Carinderia Rush',
    titleEn: 'Carinderia Rush',
    subtitle: 'Tap-to-serve ang ulam at kanin kay Aling Nena bago mainip ang gutom na customers!',
    subtitleEn: 'Tap-to-serve Filipino meals at Aling Nena’s eatery before hungry diners lose patience!',
    energyCost: 16,
    basePay: 85,
    maxPay: 340,
    durationSec: 40,
  },
  {
    id: 'jeepney',
    title: 'Jeepney Barkada Sukli',
    titleEn: 'Jeepney Fare Pass',
    subtitle: 'Maging konduktor! Ibigay ang tamang barya at sukli sa bawat pasahero.',
    subtitleEn: 'Play jeepney conductor! Count exact ₱ coins to return accurate change.',
    energyCost: 14,
    basePay: 80,
    maxPay: 310,
    durationSec: 45,
  },
  {
    id: 'tutoring',
    title: 'Tutoring Quiz Match',
    titleEn: 'Tutoring Quiz Match',
    subtitle: 'I-match ang tanong at tamang sagot para sa mga estudyanteng tinuturuan mo.',
    subtitleEn: 'Match study questions to the right answers for your tutoring tutees.',
    energyCost: 15,
    basePay: 100,
    maxPay: 370,
    durationSec: 45,
  },
  {
    id: 'fastfood',
    title: 'Fastfood Crew Stack',
    titleEn: 'Fastfood Crew Stack',
    subtitle: 'Buuin ang order ng customer sa tamang pagkakasunod-sunod bago maubos ang oras.',
    subtitleEn: 'Stack burgers, rice meals, and drinks in the exact order requested.',
    energyCost: 18,
    basePay: 110,
    maxPay: 390,
    durationSec: 40,
  },
  {
    id: 'freelance',
    title: 'Freelance Tech & Layout',
    titleEn: 'Freelance Tech & Layout',
    subtitle: 'Ayusin ang code bugs o business layout para sa client. Malaking kita pag pulido!',
    subtitleEn: 'Fix broken code lines or layout blocks for a paying client. High pay if accurate!',
    energyCost: 17,
    basePay: 160,
    maxPay: 520,
    durationSec: 50,
    unlockHint: 'Unlocked by TVL-ICT, ABM, BSIT, BSCS, BSBA, or laptop flag.',
    unlockHintEn: 'Unlocked by TVL-ICT, ABM, BSIT, BSCS, BSBA, or owning a laptop.',
  },
  {
    id: 'tusok',
    title: 'Tusok-Tusok & Supplies',
    titleEn: 'Street Snacks & Supplies',
    subtitle: 'Bumili ng stock, mag-presyo, at makiramdam sa panahon sa campus!',
    subtitleEn: 'Buy stock, set smart prices, and adapt to campus weather over 4 rush waves!',
    energyCost: 14,
    basePay: 75,
    maxPay: 460,
    durationSec: 50,
  },
  {
    id: 'scholarship',
    title: 'Scholarship Quest',
    titleEn: 'Scholarship Application Quest',
    subtitle: '3-stage mission (1×/sem): Requirements, Essay Choices, at Panel Interview!',
    subtitleEn: '3-stage mission (1×/sem): Gather Documents, Craft Essay, and Ace the Panel Interview!',
    energyCost: 16,
    basePay: 200,
    maxPay: 650,
    durationSec: 60,
    unlockHint: 'Requires GWA ≤ 2.25 (1 attempt per semester).',
    unlockHintEn: 'Requires GWA ≤ 2.25 (1 attempt per semester).',
  },
];

export function buildSubjectsForStage(
  chapter: SchoolChapterId,
  strand: ShsStrandId,
  course: CollegeCourseId,
  baseGwa: number
): SubjectGrade[] {
  const strandObj = SHS_STRANDS.find((s) => s.id === strand) ?? SHS_STRANDS[0];
  const courseObj = COLLEGE_COURSES.find((c) => c.id === course) ?? COLLEGE_COURSES[0];

  let names: string[];
  if (chapter === 'prologue' || chapter === 'shs_year1' || chapter === 'shs_year2') {
    names = strandObj.subjects;
  } else {
    const yearMap: Record<SchoolChapterId, 1 | 2 | 3 | 4> = {
      prologue: 1,
      shs_year1: 1,
      shs_year2: 1,
      college_year1: 1,
      college_year2: 2,
      college_year3: 3,
      college_year4: 4,
    };
    names = courseObj.subjectsByYear[yearMap[chapter]];
  }

  return names.map((name, idx) => {
    const offset = ((idx % 3) - 1) * 0.1;
    const grade = Number(Math.min(5, Math.max(1, baseGwa + offset)).toFixed(2));
    return {
      code: `${chapter.toUpperCase().slice(0, 3)}-${idx + 1}0${idx + 1}`,
      name,
      grade,
      units: 3,
    };
  });
}
