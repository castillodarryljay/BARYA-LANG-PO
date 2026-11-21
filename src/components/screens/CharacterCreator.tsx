import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dices,
  Flame,
  Play,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  ACCESSORIES,
  COLLEGE_COURSES,
  DIFFICULTY_MODES,
  FAMILY_BACKGROUNDS,
  HAIR_COLORS,
  HAIR_STYLES,
  HOMETOWN_OPTIONS,
  SHS_STRANDS,
  SKIN_TONES,
  UNIFORM_ACCENTS,
  getDefaultAppearance,
} from '../../data/config';
import { PixelSprite } from '../art/PixelSprite';
import { useGameStore } from '../../store/gameStore';
import { soundFX } from '../../engine/audio';
import type {
  CharacterAppearance,
  CollegeCourseId,
  DifficultyMode,
  FamilyBackgroundId,
  Gender,
  HometownId,
  ShsStrandId,
} from '../../types/game';

export const CharacterCreator: React.FC = () => {
  const { settings, startNewGame, setScreen } = useGameStore();
  const isTL = settings.language === 'taglish';

  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [gender, setGender] = useState<Gender>('male');
  const [appearance, setAppearance] = useState<CharacterAppearance>(() =>
    getDefaultAppearance('male')
  );
  const [hometown, setHometown] = useState<HometownId>('Pangasinan');
  const [familyBg, setFamilyBg] = useState<FamilyBackgroundId>('tindera');
  const [strand, setStrand] = useState<ShsStrandId>('TVL-ICT');
  const [course, setCourse] = useState<CollegeCourseId>('BSIT');
  const [difficulty, setDifficulty] = useState<DifficultyMode>('classic');

  const townObj = HOMETOWN_OPTIONS.find((h) => h.id === hometown)!;
  const famObj = FAMILY_BACKGROUNDS.find((f) => f.id === familyBg)!;
  const strandObj = SHS_STRANDS.find((s) => s.id === strand)!;
  const courseObj = COLLEGE_COURSES.find((c) => c.id === course)!;
  const diffObj = DIFFICULTY_MODES.find((d) => d.id === difficulty)!;

  const totalSteps = 6;

  const handleGenderChange = (nextGender: Gender) => {
    soundFX.playClick();
    setGender(nextGender);
    setAppearance((prev) => ({
      ...prev,
      hairStyle:
        prev.hairStyle === 'short' && nextGender === 'female'
          ? 'long'
          : prev.hairStyle === 'long' && nextGender === 'male'
            ? 'short'
            : prev.hairStyle,
    }));
  };

  const handleRandomizeLook = () => {
    soundFX.playClick();
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    setAppearance({
      skinTone: pick(SKIN_TONES).id,
      hairStyle: pick(HAIR_STYLES).id,
      hairColor: pick(HAIR_COLORS).id,
      accessory: pick(ACCESSORIES).id,
      uniformAccent: pick(UNIFORM_ACCENTS).id,
    });
  };

  const goNext = () => {
    if (step === 1 && !name.trim()) {
      setNameError(
        isTL ? 'Ilagay muna ang pangalan mo!' : 'Please enter your student name first!'
      );
      soundFX.playError();
      return;
    }
    setNameError('');
    soundFX.playClick();
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const goBack = () => {
    soundFX.playClick();
    if (step === 1) {
      setScreen('title');
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleStartStory = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setStep(1);
      setNameError(
        isTL ? 'Ilagay muna ang pangalan mo!' : 'Please enter your student name!'
      );
      return;
    }
    startNewGame({
      name: cleanName,
      gender,
      appearance,
      difficulty,
      hometown,
      isProvincial: townObj.isProvincial,
      familyBg,
      strand,
      course,
    });
  };

  const estStartCash =
    difficulty === 'hardcore'
      ? Math.round(famObj.startingMoney * 0.8)
      : famObj.startingMoney;
  const estBaon =
    difficulty === 'hardcore'
      ? Math.round(famObj.weeklyAllowance * 0.85)
      : famObj.weeklyAllowance;

  return (
    <main className="min-h-screen bg-[#18110c] text-[#f7eedd] py-4 sm:py-6 px-3 sm:px-6 flex flex-col">
      <div className="w-full max-w-4xl mx-auto my-auto flex flex-col gap-4 sm:gap-6">
        {/* Top Step Bar */}
        <header className="flex items-center justify-between gap-3 border-b border-amber-900/50 pb-3.5">
          <button
            type="button"
            onClick={goBack}
            className="min-h-[44px] px-3.5 rounded-xl bg-[#251a13] hover:bg-[#34251b] border border-amber-900/60 text-sm font-medium text-amber-100 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Title' : isTL ? 'Balik' : 'Back'}
          </button>
          <div className="text-center min-w-0">
            <h1 className="font-pixel text-lg sm:text-2xl text-amber-200 truncate">
              Student Enrollment Form
            </h1>
            <p className="text-xs font-mono text-amber-300/75">
              Step {step} / {totalSteps}
            </p>
          </div>
          <div className="w-16 sm:w-20 hidden sm:block" />
        </header>

        {/* Step Content */}
        <section
          key={step}
          className="bg-[#211711] border border-amber-800/50 rounded-2xl p-4 sm:p-7 pixel-frame anim-fade-up"
        >
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
              {/* Live Animated Character Preview Card */}
              <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#18110c] rounded-2xl p-5 border border-amber-900/50 space-y-3">
                <PixelSprite
                  spriteId={gender === 'female' ? 'player_female_happy' : 'player_male_happy'}
                  playerGender={gender}
                  appearance={appearance}
                  animation="idle"
                  size="lg"
                />
                <div className="text-center">
                  <p className="font-pixel text-xl text-amber-200">
                    {name.trim() || (isTL ? 'Bagong Estudyante' : 'New Student')}
                  </p>
                  <p className="text-xs text-amber-300/75">
                    {gender === 'male' ? 'Male Uniform' : 'Female Uniform'} ·{' '}
                    {HAIR_STYLES.find((h) => h.id === appearance.hairStyle)?.label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRandomizeLook}
                  className="min-h-[40px] px-3.5 rounded-xl bg-[#2a1d15] hover:bg-[#3a281d] border border-amber-700/60 text-xs font-semibold text-amber-200 flex items-center gap-1.5"
                >
                  <Dices className="w-3.5 h-3.5 text-amber-400" />
                  {isTL ? 'Randomize Look' : 'Randomize Look'}
                </button>
              </div>

              {/* Name, Gender & Visual Appearance Customizer */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <label
                    htmlFor="student-name"
                    className="block text-sm font-semibold text-amber-100 mb-1.5"
                  >
                    {isTL ? '1. Pangalan ng Estudyante' : '1. Student Name'}
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    maxLength={24}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder={
                      isTL ? 'Hal. Miguel, Camille, Paolo...' : 'e.g. Miguel, Camille, Paolo...'
                    }
                    className="w-full min-h-[46px] px-4 rounded-xl bg-[#160f0a] border border-amber-700/70 focus:border-amber-400 focus:outline-none text-amber-50 placeholder:text-amber-200/35 text-base"
                  />
                  {nameError && (
                    <p role="alert" className="text-xs text-rose-400 mt-1.5 font-medium">
                      {nameError}
                    </p>
                  )}
                </div>

                <div>
                  <span className="block text-sm font-semibold text-amber-100 mb-1.5">
                    {isTL ? '2. Gender (Sprite & Pronouns)' : '2. Gender (Sprite & Pronouns)'}
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['male', 'female'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleGenderChange(g)}
                        className={`min-h-[44px] rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 ${
                          gender === g
                            ? 'bg-amber-500 text-[#1b110a] border-amber-300'
                            : 'bg-[#18110c] text-amber-100 border-amber-900/60 hover:border-amber-600'
                        }`}
                      >
                        {gender === g && <Check className="w-4 h-4" />}
                        {g === 'male' ? 'Male (Lalaki)' : 'Female (Babae)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customizer Panel */}
                <div className="bg-[#18110c] border border-amber-900/50 rounded-xl p-3.5 space-y-3.5">
                  <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isTL ? '3. I-customize ang Karakter Mo' : '3. Customize Character Look'}
                  </div>

                  {/* Skin Tone */}
                  <div className="space-y-1.5">
                    <span className="block text-xs text-amber-200/80">
                      {isTL ? 'Kulay ng Balat (Skin Tone)' : 'Skin Tone'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {SKIN_TONES.map((s) => {
                        const active = appearance.skinTone === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              soundFX.playClick();
                              setAppearance((p) => ({ ...p, skinTone: s.id }));
                            }}
                            aria-label={`Skin tone: ${s.label}`}
                            className={`min-h-[36px] px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
                              active
                                ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                                : 'border-amber-900/60 bg-[#211711] text-amber-200/75'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-black/40 shrink-0"
                              style={{ backgroundColor: s.skin }}
                            />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hairstyle */}
                  <div className="space-y-1.5">
                    <span className="block text-xs text-amber-200/80">
                      {isTL ? 'Buhok (Hairstyle)' : 'Hairstyle'}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {HAIR_STYLES.map((h) => {
                        const active = appearance.hairStyle === h.id;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => {
                              soundFX.playClick();
                              setAppearance((p) => ({ ...p, hairStyle: h.id }));
                            }}
                            className={`min-h-[38px] px-2.5 rounded-lg border text-xs font-semibold ${
                              active
                                ? 'bg-amber-500 text-[#1b110a] border-amber-300'
                                : 'bg-[#211711] text-amber-200/85 border-amber-900/60 hover:border-amber-600'
                            }`}
                          >
                            {h.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hair Color & Uniform Accent */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="block text-xs text-amber-200/80">
                        {isTL ? 'Kulay ng Buhok' : 'Hair Color'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {HAIR_COLORS.map((c) => {
                          const active = appearance.hairColor === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              aria-label={`Hair color: ${c.label}`}
                              title={c.label}
                              onClick={() => {
                                soundFX.playClick();
                                setAppearance((p) => ({ ...p, hairColor: c.id }));
                              }}
                              className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                                active ? 'border-amber-300 scale-105' : 'border-amber-950'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            >
                              {active && <Check className="w-3.5 h-3.5 text-amber-300" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-xs text-amber-200/80">
                        {isTL ? 'Uniform / Lanyard Color' : 'Uniform Accent'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {UNIFORM_ACCENTS.map((u) => {
                          const active = appearance.uniformAccent === u.id;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              aria-label={`Uniform color: ${u.label}`}
                              title={u.label}
                              onClick={() => {
                                soundFX.playClick();
                                setAppearance((p) => ({ ...p, uniformAccent: u.id }));
                              }}
                              className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                                active ? 'border-amber-300 scale-105' : 'border-amber-950'
                              }`}
                              style={{ backgroundColor: u.hex }}
                            >
                              {active && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Accessory */}
                  <div className="space-y-1.5">
                    <span className="block text-xs text-amber-200/80">
                      {isTL ? 'Accessory' : 'Accessory'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ACCESSORIES.map((acc) => {
                        const active = appearance.accessory === acc.id;
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              soundFX.playClick();
                              setAppearance((p) => ({ ...p, accessory: acc.id }));
                            }}
                            className={`min-h-[36px] px-2.5 rounded-lg border text-xs font-semibold ${
                              active
                                ? 'bg-amber-500 text-[#1b110a] border-amber-300'
                                : 'bg-[#211711] text-amber-200/85 border-amber-900/60 hover:border-amber-600'
                            }`}
                          >
                            {acc.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-pixel text-2xl text-amber-200">
                  {isTL ? 'Saan ka galing? (Hometown)' : 'Choose Your Hometown'}
                </h2>
                <p className="text-sm text-amber-200/75 mt-1">
                  {isTL
                    ? 'Ang mga taga-probinsya ay luluwas at magbo-boarding house sa college; ang taga-Manila ay uwian sa heavy traffic.'
                    : 'Provincial students rent a boarding house in college; Metro Manila students commute daily through traffic.'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HOMETOWN_OPTIONS.map((h) => {
                  const selected = hometown === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setHometown(h.id);
                      }}
                      className={`text-left p-4 rounded-xl border transition-colors ${
                        selected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-50'
                          : 'bg-[#18110c] border-amber-900/50 text-amber-100/85 hover:border-amber-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-pixel text-lg text-amber-200">{h.id}</span>
                        <span className="text-xs font-mono text-amber-300/75">
                          {h.isProvincial ? 'Province' : 'NCR'}
                        </span>
                      </div>
                      <p className="text-xs text-amber-100/75 mt-1.5 leading-relaxed">
                        {isTL ? h.blurb : h.blurbEn}
                      </p>
                      <p className="text-[11px] font-mono text-amber-300/80 mt-2">
                        Fare ₱{h.farePerWeek}/wk · College Rent{' '}
                        {h.weeklyBoardCost > 0 ? `₱${h.weeklyBoardCost}/wk` : '₱0'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-pixel text-2xl text-amber-200">
                  {isTL ? 'Pamilya at Pinagmulan (Family Background)' : 'Family Background'}
                </h2>
                <p className="text-sm text-amber-200/75 mt-1">
                  {isTL
                    ? 'Ito ang magtatakda ng starting money, weekly baon, utang limit, at family story events.'
                    : 'Determines your starting cash, weekly allowance, debt limit, and family story arcs.'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FAMILY_BACKGROUNDS.map((f) => {
                  const selected = familyBg === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setFamilyBg(f.id);
                      }}
                      className={`text-left p-4 rounded-xl border transition-colors ${
                        selected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-50'
                          : 'bg-[#18110c] border-amber-900/50 text-amber-100/85 hover:border-amber-700'
                      }`}
                    >
                      <div className="font-pixel text-lg text-amber-200">
                        {isTL ? f.label : f.labelEn}
                      </div>
                      <p className="text-xs text-amber-100/75 mt-1 leading-relaxed">
                        {isTL ? f.blurb : f.blurbEn}
                      </p>
                      <p className="text-xs font-mono text-emerald-300 mt-2 tabular-nums">
                        Start ₱{f.startingMoney} · Baon ₱{f.weeklyAllowance}/wk · Utang Limit ₱
                        {f.debtLimit}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-pixel text-2xl text-amber-200">Senior High School Strand</h2>
                <p className="text-sm text-amber-200/75 mt-1">
                  {isTL
                    ? 'Nagbubukas ito ng strand-specific subjects, events, at bonus sa mga part-time raket!'
                    : 'Unlocks strand-specific subjects, story events, and part-time job bonuses!'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SHS_STRANDS.map((s) => {
                  const selected = strand === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setStrand(s.id);
                      }}
                      className={`text-left p-4 rounded-xl border transition-colors ${
                        selected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-50'
                          : 'bg-[#18110c] border-amber-900/50 text-amber-100/85 hover:border-amber-700'
                      }`}
                    >
                      <div className="font-pixel text-xl text-amber-200">{s.name}</div>
                      <p className="text-xs text-amber-100/75 mt-1 leading-relaxed">
                        {isTL ? s.blurb : s.blurbEn}
                      </p>
                      <p className="text-[11px] font-medium text-emerald-300 mt-2">
                        {isTL ? s.perk : s.perkEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-pixel text-2xl text-amber-200">
                  {isTL ? 'Pangarap na College Course' : 'Target College Course'}
                </h2>
                <p className="text-sm text-amber-200/75 mt-1">
                  {isTL
                    ? 'Bawat kurso ay may sariling tuition, major subjects, special story events, at ending paths.'
                    : 'Each degree shapes tuition, major subjects, course arcs, job perks, and ending paths.'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {COLLEGE_COURSES.map((c) => {
                  const selected = course === c.id;
                  const diffColor =
                    c.difficulty === 'Brutal'
                      ? 'text-rose-300'
                      : c.difficulty === 'Challenging'
                        ? 'text-amber-300'
                        : 'text-emerald-300';
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setCourse(c.id);
                      }}
                      className={`text-left p-4 rounded-xl border transition-colors ${
                        selected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-50'
                          : 'bg-[#18110c] border-amber-900/50 text-amber-100/85 hover:border-amber-700'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-pixel text-lg text-amber-200">{c.id}</span>
                        <span className={`text-[11px] font-mono font-semibold ${diffColor}`}>
                          {c.difficulty}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-amber-100/90 mt-0.5">{c.name}</div>
                      <p className="text-xs text-amber-100/70 mt-1.5 leading-relaxed">
                        {isTL ? c.blurb : c.blurbEn}
                      </p>
                      <p className="text-[11px] font-mono text-emerald-300 mt-2">
                        {isTL ? c.perk : c.perkEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
              <div className="md:col-span-4 flex flex-col items-center justify-center bg-[#18110c] rounded-2xl p-6 border border-amber-800/60 text-center">
                <PixelSprite
                  spriteId={gender === 'female' ? 'player_female_happy' : 'player_male_happy'}
                  playerGender={gender}
                  appearance={appearance}
                  animation="idle"
                  size="lg"
                />
                <h2 className="font-pixel text-2xl text-amber-200 mt-3">{name.trim()}</h2>
                <p className="text-xs font-mono text-amber-300/80 mt-0.5">
                  {strandObj.id} → {courseObj.id}
                </p>
                <p className="text-[11px] font-mono text-amber-400 mt-1">
                  {isTL ? diffObj.label : diffObj.labelEn}
                </p>
              </div>

              <div className="md:col-span-8 space-y-4">
                <h3 className="font-pixel text-xl sm:text-2xl text-amber-200">
                  {isTL
                    ? 'Piliin ang Challenge Mode & Simulan ang Kwento!'
                    : 'Pick Your Challenge Mode & Start!'}
                </h3>

                {/* Difficulty Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DIFFICULTY_MODES.map((d) => {
                    const active = difficulty === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setDifficulty(d.id);
                        }}
                        className={`text-left p-3.5 rounded-xl border transition-colors ${
                          active
                            ? d.id === 'hardcore'
                              ? 'bg-rose-950/50 border-rose-400 text-rose-50'
                              : 'bg-amber-500/20 border-amber-400 text-amber-50'
                            : 'bg-[#18110c] border-amber-900/50 text-amber-100/85 hover:border-amber-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-pixel text-base flex items-center gap-1.5">
                            {d.id === 'hardcore' ? (
                              <Flame className="w-4 h-4 text-rose-400" />
                            ) : (
                              <Shield className="w-4 h-4 text-emerald-400" />
                            )}
                            {isTL ? d.label : d.labelEn}
                          </span>
                          <span className="text-[10px] font-mono text-amber-300/90 shrink-0">
                            {d.id === 'hardcore' ? '+25% PAY' : 'STANDARD'}
                          </span>
                        </div>
                        <p className="text-xs text-amber-200/80 mt-1.5 leading-relaxed">
                          {isTL ? d.blurb : d.blurbEn}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm bg-[#18110c] border border-amber-900/50 rounded-xl p-4">
                  <div>
                    <dt className="text-xs text-amber-300/70">Hometown</dt>
                    <dd className="font-semibold text-amber-100">
                      {townObj.id} ({townObj.region})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-amber-300/70">Family</dt>
                    <dd className="font-semibold text-amber-100">
                      {isTL ? famObj.label : famObj.labelEn}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-amber-300/70">Starting Cash & Baon</dt>
                    <dd className="font-mono font-bold text-emerald-300 tabular-nums">
                      ₱{estStartCash} · ₱{estBaon}/wk
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-amber-300/70">Course Difficulty</dt>
                    <dd className="font-semibold text-amber-200">
                      {courseObj.id} · {courseObj.difficulty}
                    </dd>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-amber-900/40">
                    <dt className="text-xs text-amber-300/70">Unlocked Perks</dt>
                    <dd className="text-xs text-emerald-300 mt-0.5">
                      {isTL ? strandObj.perk : strandObj.perkEn} ·{' '}
                      {isTL ? courseObj.perk : courseObj.perkEn}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={handleStartStory}
                  className="w-full min-h-[54px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1b110a] font-bold text-base flex items-center justify-center gap-2 pixel-btn"
                >
                  <Play className="w-5 h-5 fill-current" />
                  {isTL ? 'Simulan ang Kwento! (Start Story)' : 'Start Story!'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Bottom Step Nav */}
        {step < totalSteps && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i + 1 === step
                      ? 'w-7 bg-amber-400'
                      : i + 1 < step
                        ? 'w-2.5 bg-amber-600'
                        : 'w-2.5 bg-amber-950'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={goNext}
              className="min-h-[48px] px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1b110a] font-bold text-sm flex items-center gap-2 pixel-btn"
            >
              {isTL ? 'Sunod' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
};
