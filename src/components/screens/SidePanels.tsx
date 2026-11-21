import React, { useRef, useState } from 'react';
import {
  Bug,
  Check,
  CheckCircle,
  CloudRain,
  Download,
  Music,
  Palette,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  WifiOff,
} from 'lucide-react';
import {
  ACCESSORIES,
  CHAPTER_LABELS,
  CHAPTER_ORDER,
  HAIR_COLORS,
  HAIR_STYLES,
  NPCS,
  SKIN_TONES,
  UNIFORM_ACCENTS,
  getDefaultAppearance,
} from '../../data/config';
import { ALL_ENDINGS } from '../../data/story';
import { getCourseTuition } from '../../engine/storyEngine';
import { soundFX } from '../../engine/audio';
import { NPC_LIST, useGameStore } from '../../store/gameStore';
import { usePWA } from '../../hooks/usePWA';
import { PWAInstallButton } from '../PWAInstallButton';
import { PixelSprite } from '../art/PixelSprite';
import type { BgmStyle, CharacterAppearance, SchoolChapterId } from '../../types/game';

export const StatsPanel: React.FC = () => {
  const { save, settings, updateProfileAppearance } = useGameStore();
  const [editingLook, setEditingLook] = useState(false);

  if (!save) return null;
  const isTL = settings.language === 'taglish';
  const currentLook: CharacterAppearance =
    save.profile.appearance ?? getDefaultAppearance(save.profile.gender);

  const patchLook = (partial: Partial<CharacterAppearance>) => {
    updateProfileAppearance({ ...currentLook, ...partial });
  };

  const meters = [
    { label: 'Energy', val: save.stats.energy, bar: 'bg-amber-400', note: save.stats.energy <= 20 ? 'LOW' : 'OK' },
    { label: 'Mental Health', val: save.stats.mental, bar: 'bg-pink-400', note: save.stats.mental <= 20 ? 'STRESSED' : 'STEADY' },
    {
      label: 'Social',
      val: save.stats.social,
      bar: 'bg-sky-400',
      note: save.stats.social >= 75 ? 'POPULAR' : save.stats.social >= 40 ? 'FRIENDLY' : 'QUIET',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-[#231812] border border-amber-800/50 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="bg-[#18110c] rounded-xl p-2 border border-amber-900/50 shrink-0">
              <PixelSprite
                spriteId="player_happy"
                playerGender={save.profile.gender}
                appearance={currentLook}
                animation="idle"
                size="sm"
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-pixel text-2xl text-amber-100 truncate">{save.profile.name}</h2>
              <p className="text-xs text-amber-300/80 truncate">
                {save.profile.hometown} · {save.profile.strand} → {save.profile.course}
                {save.profile.shiftedFrom ? ` (shifted from ${save.profile.shiftedFrom})` : ''}
              </p>
              <p className="text-[11px] font-mono text-amber-400/85 mt-0.5">
                {save.profile.difficulty === 'hardcore' ? 'Hardcore Barya' : 'Classic Iskolar'} ·{' '}
                {save.challengesCompleted ?? 0} Challenges · {save.studyStreak ?? 0}d Streak
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setEditingLook((v) => !v);
            }}
            className="min-h-[38px] px-3 rounded-xl bg-[#2d1f16] hover:bg-[#3a281c] border border-amber-700/60 text-xs font-semibold text-amber-200 flex items-center gap-1.5 shrink-0"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            {editingLook ? (isTL ? 'Isara' : 'Done') : isTL ? 'Edit Look' : 'Edit Look'}
          </button>
        </div>

        {/* Mid-game Character Appearance Customizer */}
        {editingLook && (
          <div className="bg-[#18110c] border border-amber-800/60 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-3">
              <PixelSprite
                spriteId="player_happy"
                playerGender={save.profile.gender}
                appearance={currentLook}
                animation="idle"
                size="md"
              />
              <div className="text-xs text-amber-200/80 space-y-1">
                <div className="font-pixel text-base text-amber-200">
                  {isTL ? 'Wardrobe & Styling' : 'Wardrobe & Styling'}
                </div>
                <p>
                  {isTL
                    ? 'Awtomatikong magbabago ang sprite mo sa lahat ng eksena!'
                    : 'Changes update your student portrait across every story scene immediately!'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-amber-300/75">Skin Tone</div>
              <div className="flex flex-wrap gap-1.5">
                {SKIN_TONES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => patchLook({ skinTone: s.id })}
                    aria-label={s.label}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                      currentLook.skinTone === s.id ? 'border-amber-300 scale-110' : 'border-black/40'
                    }`}
                    style={{ backgroundColor: s.skin }}
                  >
                    {currentLook.skinTone === s.id && <Check className="w-3 h-3 text-[#18110c]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-amber-300/75">Hairstyle</div>
              <div className="grid grid-cols-3 gap-1.5">
                {HAIR_STYLES.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => patchLook({ hairStyle: h.id })}
                    className={`min-h-[34px] px-2 rounded-lg text-[11px] font-semibold border ${
                      currentLook.hairStyle === h.id
                        ? 'bg-amber-500 text-[#1b110a] border-amber-300'
                        : 'bg-[#211711] text-amber-200 border-amber-900/60'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <div className="text-[11px] text-amber-300/75">Hair Color</div>
                <div className="flex flex-wrap gap-1.5">
                  {HAIR_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => patchLook({ hairColor: c.id })}
                      aria-label={c.label}
                      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center ${
                        currentLook.hairColor === c.id ? 'border-amber-300' : 'border-amber-950'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {currentLook.hairColor === c.id && <Check className="w-3 h-3 text-amber-300" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-amber-300/75">Uniform Accent</div>
                <div className="flex flex-wrap gap-1.5">
                  {UNIFORM_ACCENTS.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => patchLook({ uniformAccent: u.id })}
                      aria-label={u.label}
                      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center ${
                        currentLook.uniformAccent === u.id ? 'border-amber-300' : 'border-amber-950'
                      }`}
                      style={{ backgroundColor: u.hex }}
                    >
                      {currentLook.uniformAccent === u.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-amber-300/75">Accessory</div>
              <div className="flex flex-wrap gap-1.5">
                {ACCESSORIES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => patchLook({ accessory: a.id })}
                    className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-semibold border ${
                      currentLook.accessory === a.id
                        ? 'bg-amber-500 text-[#1b110a] border-amber-300'
                        : 'bg-[#211711] text-amber-200 border-amber-900/60'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
          <div className="bg-[#18110c] border border-amber-900/50 rounded-xl p-3">
            <div className="text-[11px] text-amber-300/70">WALLET / UTANG LIMIT</div>
            <div className={`text-xl font-bold ${save.stats.money < 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
              ₱{save.stats.money.toLocaleString()}
            </div>
            <div className="text-[11px] text-amber-200/60">Limit: -₱{save.stats.debtLimit.toLocaleString()}</div>
          </div>
          <div className="bg-[#18110c] border border-amber-900/50 rounded-xl p-3">
            <div className="text-[11px] text-amber-300/70">OVERALL GWA (PH SCALE)</div>
            <div className="text-xl font-bold text-sky-300">{save.stats.gwa.toFixed(2)}</div>
            <div className="text-[11px] text-amber-200/60">
              {save.stats.gwa <= 1.65 ? 'Cum Laude Track' : save.stats.gwa <= 2.0 ? 'Dean’s List Track' : 'Passing Standing'}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {meters.map((m) => (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-xs font-mono tabular-nums">
                <span className="text-amber-100">{m.label}</span>
                <span className="text-amber-300">{m.val}/100 · {m.note}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#140e0a] overflow-hidden border border-amber-950">
                <div className={`h-full transition-all duration-300 ${m.bar}`} style={{ width: `${m.val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scholarship & Tuition Info */}
      <div className="bg-[#231812] border border-amber-800/50 rounded-2xl p-4 space-y-2">
        <h3 className="font-pixel text-lg text-amber-200">
          {isTL ? 'Scholarship & Tuition Status' : 'Scholarship & Tuition Status'}
        </h3>
        {save.scholarship?.active ? (
          <p className="text-sm text-emerald-300">
            Active: <strong>{save.scholarship.name}</strong> · Maintain GWA ≤ {save.scholarship.minGwa.toFixed(2)} · +₱{save.scholarship.weeklyStipend}/day stipend
          </p>
        ) : (
          <p className="text-xs text-amber-200/75">
            {isTL
              ? 'Wala pang active scholarship. Panatilihin ang GWA ≤ 2.25 at piliin ang Scholarship Quest sa hapon!'
              : 'No active scholarship yet. Keep GWA ≤ 2.25 and pick the Scholarship Quest during afternoon scenes!'}
          </p>
        )}
        <p className="text-xs font-mono text-amber-300/80">
          Est. Sem Tuition ({save.profile.course}): ₱{getCourseTuition(save).toLocaleString()}
        </p>
      </div>

      {/* Subject Grades Table */}
      <div className="bg-[#231812] border border-amber-800/50 rounded-2xl p-4 space-y-3">
        <h3 className="font-pixel text-lg text-amber-200">
          {isTL ? 'Current Semester Subjects' : 'Current Semester Subjects'}
        </h3>
        <div className="divide-y divide-amber-900/40 text-sm">
          {save.subjects.map((sub) => (
            <div key={sub.code} className="py-2 flex items-center justify-between gap-2">
              <div>
                <div className="font-medium text-amber-100">{sub.name}</div>
                <div className="text-[11px] font-mono text-amber-300/65">{sub.code} · {sub.units} units</div>
              </div>
              <span className="font-mono font-bold tabular-nums text-sky-300">
                {sub.grade.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RelationshipsPanel: React.FC = () => {
  const { save, settings } = useGameStore();
  if (!save) return null;
  const isTL = settings.language === 'taglish';

  return (
    <div className="space-y-3">
      <h2 className="font-pixel text-2xl text-amber-200">
        {isTL ? 'Barkada, Pamilya at Mga Kakilala' : 'Relationships & Contacts'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {NPC_LIST.map((npcId) => {
          const meta = NPCS[npcId];
          const val = save.relationships[npcId] ?? 0;
          const tier =
            val >= 75 ? 'Close Bond' : val >= 50 ? 'Trusted' : val >= 30 ? 'Friendly' : 'Acquaintance';
          return (
            <div
              key={npcId}
              className="bg-[#231812] border border-amber-800/50 rounded-2xl p-3.5 flex gap-3 items-start"
            >
              <div className="bg-[#18110c] rounded-xl p-1.5 border border-amber-900/50 shrink-0">
                <PixelSprite spriteId={`${meta.spriteBase}_happy`} size="sm" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-pixel text-lg text-amber-100 truncate">{meta.name}</span>
                  <span className="text-xs font-mono text-amber-300 tabular-nums">{val}/100</span>
                </div>
                <div className="text-[11px] text-amber-300/75">
                  {isTL ? meta.role : meta.roleEn} · {tier}
                </div>
                <div className="h-2 w-full rounded-full bg-[#140e0a] overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${val}%` }} />
                </div>
                <p className="text-xs text-amber-100/75 leading-snug">
                  {isTL ? meta.bio : meta.bioEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const JournalPanel: React.FC = () => {
  const { save, settings } = useGameStore();
  if (!save) return null;
  const isTL = settings.language === 'taglish';

  return (
    <div className="space-y-4">
      <div className="bg-[#231812] border border-amber-800/50 rounded-2xl p-4 space-y-3">
        <h2 className="font-pixel text-2xl text-amber-200">
          {isTL ? 'Student Journal & Milestones' : 'Student Journal & Milestones'}
        </h2>
        {save.journal.length === 0 ? (
          <p className="text-sm text-amber-200/70">
            {isTL
              ? 'Wala pang nakasulat sa journal. Gumawa ng mga choices sa kwento!'
              : 'No journal entries yet. Your key story decisions will be recorded here.'}
          </p>
        ) : (
          <div className="divide-y divide-amber-900/40">
            {save.journal.map((entry) => (
              <div key={entry.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-amber-300/75">
                  <span>{entry.dateLabel}</span>
                  <span>{entry.category.toUpperCase()}</span>
                </div>
                <div className="font-semibold text-amber-100">
                  {isTL ? entry.title : entry.titleEn}
                </div>
                <p className="text-xs sm:text-sm text-amber-100/75">
                  {isTL ? entry.summary : entry.summaryEn}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#231812] border border-amber-800/50 rounded-2xl p-4 space-y-2">
        <h3 className="font-pixel text-lg text-amber-200">
          {isTL ? 'Active Story Flags & Traits' : 'Active Story Flags & Traits'} ({save.flags.length})
        </h3>
        <p className="text-xs font-mono text-amber-300/80 leading-relaxed break-words">
          {save.flags.length > 0 ? save.flags.join(' · ') : 'None yet'}
        </p>
      </div>
    </div>
  );
};

export const SavesPanel: React.FC = () => {
  const {
    manualSlots,
    saveToSlot,
    loadFromSlot,
    deleteSlot,
    exportSaveJson,
    importSaveJson,
    settings,
  } = useGameStore();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string>('');
  const isTL = settings.language === 'taglish';

  const handleExport = () => {
    const json = exportSaveJson();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barya-lang-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importSaveJson(String(reader.result ?? ''));
      setImportError(ok ? '' : 'Invalid save JSON file.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#231812] border border-amber-800/50 rounded-2xl p-4 space-y-3">
        <h2 className="font-pixel text-2xl text-amber-200">
          {isTL ? 'Offline Save Slots (Local Device Only)' : 'Offline Save Slots (Local Device Only)'}
        </h2>
        <p className="text-xs text-amber-200/75">
          {isTL
            ? 'Naka-auto-save ang laro bawat choice. Gumamit ng 3 manual slots o mag-export ng JSON backup.'
            : 'Progress auto-saves on every choice. Use 3 manual slots or export a JSON backup anytime.'}
        </p>

        <div className="space-y-2.5">
          {manualSlots.map(({ slot, data }) => (
            <div
              key={slot}
              className="bg-[#18110c] border border-amber-900/50 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="font-pixel text-base text-amber-200">Save Slot {slot}</div>
                {data ? (
                  <div className="text-xs font-mono text-amber-300/80">
                    {data.label} · ₱{data.stats.money} · GWA {data.stats.gwa.toFixed(2)}
                  </div>
                ) : (
                  <div className="text-xs text-amber-200/45">Empty slot</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => saveToSlot(slot)}
                  className="min-h-[40px] px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#1b110a] text-xs font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  type="button"
                  disabled={!data}
                  onClick={() => loadFromSlot(slot)}
                  className="min-h-[40px] px-3.5 rounded-lg bg-[#2c1f16] hover:bg-[#3a281c] border border-amber-700/60 text-amber-100 text-xs font-semibold disabled:opacity-40"
                >
                  Load
                </button>
                {data && (
                  <button
                    type="button"
                    aria-label={`Delete Save Slot ${slot}`}
                    onClick={() => deleteSlot(slot)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/60 text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#231812] border border-amber-800/50 rounded-2xl p-4 space-y-3">
        <h3 className="font-pixel text-lg text-amber-200">JSON Backup (Export / Import)</h3>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="min-h-[44px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Save JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-[44px] px-4 rounded-xl bg-[#2d1f16] hover:bg-[#3a291d] border border-amber-700/60 text-amber-100 text-sm font-semibold flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Save JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
        {importError && <p className="text-xs text-rose-400">{importError}</p>}
      </div>
    </div>
  );
};

export const SettingsPanel: React.FC = () => {
  const {
    save,
    settings,
    updateSettings,
    resetAllSaves,
    setScreen,
    getAllNodes,
    debugJumpToChapter,
    debugJumpToNode,
    debugAdjustStat,
    debugToggleFlag,
    debugForceRandomEvent,
    debugTriggerEnding,
  } = useGameStore();
  const { offlineReady, isOnline, needRefresh, applyUpdate } = usePWA();
  const [confirmReset, setConfirmReset] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState('college1_tuition_deadline');
  const [flagInput, setFlagInput] = useState('student_hustler');

  const isTL = settings.language === 'taglish';
  const allNodes = getAllNodes();

  return (
    <div className="space-y-4">
      <div className="bg-[#231812] border border-amber-800/50 rounded-2xl p-4 sm:p-5 space-y-5">
        <h2 className="font-pixel text-2xl text-amber-200">
          {isTL ? 'Settings & Offline Status' : 'Settings & Offline Status'}
        </h2>

        {/* Offline Ready Indicator */}
        <div className="bg-[#18110c] border border-emerald-800/50 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            {offlineReady ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <div className="font-semibold text-emerald-200">
                {offlineReady ? 'Offline Ready (100% Precached)' : 'Local Offline Engine Active'}
              </div>
              <div className="text-xs text-amber-200/70">
                Connection: {isOnline ? 'Online' : 'Offline Mode'} · Zero external network calls
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {needRefresh && (
              <button
                type="button"
                onClick={applyUpdate}
                className="min-h-[40px] px-3 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Update Version
              </button>
            )}
            <PWAInstallButton variant="compact" showFallbackTrigger />
          </div>
        </div>

        {/* Language */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-amber-100">Language / Wika</div>
            <div className="text-xs text-amber-200/70">Switch between natural Taglish and English</div>
          </div>
          <div className="flex gap-2">
            {(['taglish', 'english'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => updateSettings({ language: lang })}
                className={`min-h-[40px] px-3.5 rounded-lg text-xs font-bold capitalize ${
                  settings.language === lang
                    ? 'bg-amber-500 text-[#1b110a]'
                    : 'bg-[#18110c] text-amber-200 border border-amber-900/60'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Text Speed */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-amber-100">Text Speed</div>
          <div className="flex gap-1.5">
            {(['slow', 'normal', 'fast', 'instant'] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => updateSettings({ textSpeed: spd })}
                className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold capitalize ${
                  settings.textSpeed === spd
                    ? 'bg-amber-500 text-[#1b110a]'
                    : 'bg-[#18110c] text-amber-200 border border-amber-900/60'
                }`}
              >
                {spd}
              </button>
            ))}
          </div>
        </div>

        {/* Relaxing Background Music Style & Rain Ambience */}
        <div className="bg-[#18110c] border border-amber-900/50 rounded-xl p-3.5 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
              <Music className="w-4 h-4 text-amber-400" />
              {isTL ? 'Background Music Mood' : 'Background Music Style'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'lofi', label: 'Lo-Fi Study' },
                  { id: 'rainy', label: 'Rainy Piano' },
                  { id: 'chiptune', label: '8-Bit Retro' },
                ] as { id: BgmStyle; label: string }[]
              ).map((track) => {
                const active = (settings.bgmStyle ?? 'lofi') === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      updateSettings({ bgmStyle: track.id });
                      soundFX.unlockAndStart('chill');
                      soundFX.playClick();
                    }}
                    className={`min-h-[38px] px-3 rounded-lg text-xs font-bold ${
                      active
                        ? 'bg-amber-500 text-[#1b110a]'
                        : 'bg-[#231812] text-amber-200 border border-amber-900/60'
                    }`}
                  >
                    {track.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-900/40">
            <div>
              <div className="text-sm font-semibold text-amber-100 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-sky-400" />
                {isTL ? 'Relaxing Rain Ambience' : 'Relaxing Rain Ambience'}
              </div>
              <div className="text-xs text-amber-200/70">
                {isTL
                  ? 'Mahinang patak ng ulan habang nag-aaral (100% offline synth)'
                  : 'Gentle tropical rain backdrop while studying (100% offline synth)'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !settings.rainAmbience;
                updateSettings({ rainAmbience: next });
                soundFX.unlockAndStart('chill');
                soundFX.playClick();
              }}
              className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold border ${
                settings.rainAmbience
                  ? 'bg-sky-600 text-white border-sky-400'
                  : 'bg-[#231812] text-amber-200 border-amber-900/60'
              }`}
            >
              {settings.rainAmbience ? 'Rain: ON' : 'Rain: OFF'}
            </button>
          </div>
        </div>

        {/* Audio Volume */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1.5 block">
            <div className="flex justify-between text-xs text-amber-100">
              <span>Relaxing Music (BGM) Volume</span>
              <span className="font-mono">{Math.round(settings.bgmVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.bgmVolume}
              onChange={(e) => updateSettings({ bgmVolume: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </label>

          <label className="space-y-1.5 block">
            <div className="flex justify-between text-xs text-amber-100">
              <span>Sound Effects (SFX) Volume</span>
              <span className="font-mono">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              onChange={(e) => updateSettings({ sfxVolume: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </label>
        </div>

        {/* Debug Mode Toggle & Story Editor Link */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-900/50">
          <button
            type="button"
            onClick={() => updateSettings({ debugMode: !settings.debugMode })}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              settings.debugMode
                ? 'bg-purple-700 text-white border-purple-400'
                : 'bg-[#18110c] text-amber-200 border-amber-900/60'
            }`}
          >
            <Bug className="w-4 h-4" />
            Debug Mode: {settings.debugMode ? 'ON' : 'OFF'}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScreen('editor')}
              className="min-h-[44px] px-4 rounded-xl bg-[#2d1f16] border border-amber-700/60 text-amber-100 text-xs font-semibold"
            >
              Open Story Editor
            </button>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[44px] px-4 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-semibold"
              >
                Reset Saves
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  resetAllSaves();
                }}
                className="min-h-[44px] px-4 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Confirm Reset All?
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Debug Tools Panel (only visible when Debug Mode toggled ON in Settings) */}
      {settings.debugMode && save && (
        <div className="bg-[#1f1326] border border-purple-600/60 rounded-2xl p-4 sm:p-5 space-y-4">
          <h3 className="font-pixel text-xl text-purple-200 flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Developer Debug Console
          </h3>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => debugAdjustStat('money', 1500)}
              className="min-h-[38px] px-3 rounded-lg bg-emerald-800 text-white text-xs font-mono"
            >
              +₱1500
            </button>
            <button
              type="button"
              onClick={() => debugAdjustStat('gwa', -0.25)}
              className="min-h-[38px] px-3 rounded-lg bg-sky-800 text-white text-xs font-mono"
            >
              GWA -0.25 (Better)
            </button>
            <button
              type="button"
              onClick={() => debugAdjustStat('energy', 50)}
              className="min-h-[38px] px-3 rounded-lg bg-amber-700 text-white text-xs font-mono"
            >
              +50 Energy
            </button>
            <button
              type="button"
              onClick={() => debugAdjustStat('energy', -100)}
              className="min-h-[38px] px-3 rounded-lg bg-rose-800 text-white text-xs font-mono"
            >
              Trigger Energy 0
            </button>
            <button
              type="button"
              onClick={() => debugAdjustStat('mental', -100)}
              className="min-h-[38px] px-3 rounded-lg bg-rose-800 text-white text-xs font-mono"
            >
              Trigger Mental 0
            </button>
            <button
              type="button"
              onClick={debugForceRandomEvent}
              className="min-h-[38px] px-3 rounded-lg bg-purple-700 text-white text-xs font-mono"
            >
              Force Random Event
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="text-xs text-purple-200">Jump to Chapter</div>
              <div className="flex flex-wrap gap-1.5">
                {CHAPTER_ORDER.map((ch: SchoolChapterId) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => debugJumpToChapter(ch)}
                    className="min-h-[36px] px-2.5 rounded-lg bg-[#2b1a36] hover:bg-purple-800 text-purple-100 text-xs font-mono"
                  >
                    {CHAPTER_LABELS[ch].short}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dbg-node" className="text-xs text-purple-200 block">
                Jump to Story Node ({allNodes.length})
              </label>
              <div className="flex gap-2">
                <select
                  id="dbg-node"
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="flex-1 min-h-[38px] px-2.5 rounded-lg bg-[#140c1a] border border-purple-700 text-xs text-purple-100"
                >
                  {allNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      [{n.chapter}] {n.id}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => debugJumpToNode(selectedNodeId)}
                  className="min-h-[38px] px-3 rounded-lg bg-purple-600 text-white text-xs font-bold"
                >
                  Go
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              value={flagInput}
              onChange={(e) => setFlagInput(e.target.value)}
              placeholder="flag_name"
              className="min-h-[38px] px-3 rounded-lg bg-[#140c1a] border border-purple-700 text-xs font-mono text-purple-100"
            />
            <button
              type="button"
              onClick={() => flagInput.trim() && debugToggleFlag(flagInput.trim())}
              className="min-h-[38px] px-3 rounded-lg bg-purple-700 text-white text-xs font-semibold"
            >
              Toggle Flag
            </button>
            <select
              aria-label="Test Ending"
              defaultValue=""
              onChange={(e) => e.target.value && debugTriggerEnding(e.target.value)}
              className="min-h-[38px] px-2.5 rounded-lg bg-[#140c1a] border border-purple-700 text-xs text-purple-100"
            >
              <option value="">Preview Ending...</option>
              {ALL_ENDINGS.map((end) => (
                <option key={end.id} value={end.id}>
                  {end.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
