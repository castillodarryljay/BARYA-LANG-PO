import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Play,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import type { StoryChoice, StoryNode } from '../../types/game';

type ChapterId = StoryNode['chapter'];
type BackgroundId = StoryNode['scene']['background'];

const CHAPTER_OPTIONS: ChapterId[] = [
  'shs_year1',
  'shs_year2',
  'college_year1',
  'college_year2',
  'college_year3',
  'college_year4',
  'random',
  'side',
  'course',
  'crisis',
];

const BACKGROUND_OPTIONS: BackgroundId[] = [
  'bg_provincial_home',
  'bg_school_gate',
  'bg_classroom',
  'bg_jeepney',
  'bg_carinderia',
  'bg_boarding_house',
  'bg_campus_quad',
  'bg_library',
  'bg_computer_lab',
  'bg_fastfood',
  'bg_hospital_ward',
  'bg_street_tusok',
  'bg_org_room',
  'bg_rainy_waiting_shed',
  'bg_thesis_defense',
  'bg_graduation_stage',
];

function createBlankNode(): StoryNode {
  return {
    id: `custom_event_${Date.now().toString().slice(-4)}`,
    chapter: 'random',
    weight: 1,
    scene: {
      background: 'bg_campus_quad',
      characters: [{ id: 'miggy', sprite: 'miggy_happy', position: 'right' }],
      lines: [
        {
          speaker: 'Miggy',
          text: 'Pre, may bago akong kwento! Ready ka na ba sa raket natin?',
          textEn: 'Bro, I have a new story! Are you ready for our next side hustle?',
        },
      ],
    },
    choices: [
      {
        text: 'Game! Tara na!',
        textEn: 'Let’s go! Count me in!',
        effects: { energy: -8, social: 6, money: 120 },
        next: 'PLANNER',
      },
      {
        text: 'Pass muna, aral muna ako.',
        textEn: 'Pass for now, I need to study.',
        effects: { gwa: -0.05, mental: 4 },
        next: 'PLANNER',
      },
    ],
  };
}

export const StoryEditor: React.FC = () => {
  const {
    getAllNodes,
    customNodes,
    saveCustomNode,
    deleteCustomNode,
    exportAllNodesJson,
    setScreen,
    save,
    debugJumpToNode,
    showToast,
  } = useGameStore();

  const allNodes = getAllNodes();
  const customIds = useMemo(() => new Set(customNodes.map((n) => n.id)), [customNodes]);

  const [search, setSearch] = useState('');
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [draft, setDraft] = useState<StoryNode>(() => createBlankNode());
  const [errorMsg, setErrorMsg] = useState('');

  const filteredNodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allNodes.filter((n) => {
      if (chapterFilter !== 'all' && n.chapter !== chapterFilter) return false;
      if (!q) return true;
      return (
        n.id.toLowerCase().includes(q) ||
        n.chapter.toLowerCase().includes(q) ||
        n.scene.lines.some((l) => l.text.toLowerCase().includes(q))
      );
    });
  }, [allNodes, search, chapterFilter]);

  const handleSelectNode = (node: StoryNode) => {
    setDraft(JSON.parse(JSON.stringify(node)) as StoryNode);
    setErrorMsg('');
  };

  const handleNewNode = () => {
    setDraft(createBlankNode());
    setErrorMsg('');
  };

  const handleUpdateLine = (
    idx: number,
    field: 'speaker' | 'text' | 'textEn',
    value: string
  ) => {
    const nextLines = draft.scene.lines.map((line, i) =>
      i === idx ? { ...line, [field]: value } : line
    );
    setDraft({ ...draft, scene: { ...draft.scene, lines: nextLines } });
  };

  const handleAddLine = () => {
    setDraft({
      ...draft,
      scene: {
        ...draft.scene,
        lines: [
          ...draft.scene.lines,
          { speaker: 'Narrator', text: '', textEn: '' },
        ],
      },
    });
  };

  const handleRemoveLine = (idx: number) => {
    if (draft.scene.lines.length <= 1) return;
    setDraft({
      ...draft,
      scene: {
        ...draft.scene,
        lines: draft.scene.lines.filter((_, i) => i !== idx),
      },
    });
  };

  const handleUpdateChoice = (
    idx: number,
    patch: Partial<StoryChoice>
  ) => {
    const nextChoices = draft.choices.map((ch, i) =>
      i === idx ? { ...ch, ...patch } : ch
    );
    setDraft({ ...draft, choices: nextChoices });
  };

  const handleUpdateChoiceEffect = (
    idx: number,
    stat: 'money' | 'energy' | 'mental' | 'social' | 'gwa',
    rawVal: string
  ) => {
    const num = Number(rawVal);
    const current = draft.choices[idx];
    const nextEffects = { ...(current.effects ?? {}) };
    if (rawVal === '' || Number.isNaN(num) || num === 0) {
      delete nextEffects[stat];
    } else {
      nextEffects[stat] = num;
    }
    handleUpdateChoice(idx, { effects: nextEffects });
  };

  const handleAddChoice = () => {
    if (draft.choices.length >= 4) return;
    setDraft({
      ...draft,
      choices: [
        ...draft.choices,
        {
          text: 'Bagong choice...',
          textEn: 'New choice...',
          effects: {},
          next: 'PLANNER',
        },
      ],
    });
  };

  const handleSave = () => {
    const cleanId = draft.id.trim().replace(/\s+/g, '_');
    if (!cleanId) {
      setErrorMsg('Node ID is required.');
      return;
    }
    if (draft.scene.lines.some((l) => !l.text.trim())) {
      setErrorMsg('Every dialogue line must have Taglish text.');
      return;
    }
    if (draft.choices.length < 1 || draft.choices.some((c) => !c.text.trim())) {
      setErrorMsg('Add at least one choice with text.');
      return;
    }
    setErrorMsg('');
    saveCustomNode({ ...draft, id: cleanId });
  };

  const handleExportAll = () => {
    const json = exportAllNodesJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barya-lang-story-nodes-${allNodes.length}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${allNodes.length} story nodes JSON`);
  };

  const handleTestPlay = () => {
    handleSave();
    if (!save) {
      showToast('Start or load a run first to test-play nodes live.');
      return;
    }
    debugJumpToNode(draft.id.trim().replace(/\s+/g, '_'));
    setScreen('playing');
  };

  return (
    <main className="min-h-screen bg-[#18110c] text-amber-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-[#1e140e]/95 border-b border-amber-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScreen(save ? 'playing' : 'title')}
              className="min-h-[42px] px-3.5 rounded-xl bg-[#2a1d15] hover:bg-[#38271c] border border-amber-900/60 text-amber-200 text-sm font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="font-pixel text-2xl text-amber-200 leading-none">
                Offline Story Editor
              </h1>
              <p className="text-xs text-amber-300/75 mt-0.5">
                {allNodes.length} total nodes ({customNodes.length} custom local overrides)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewNode}
              className="min-h-[42px] px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1a110b] text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Node
            </button>
            <button
              type="button"
              onClick={handleExportAll}
              className="min-h-[42px] px-3.5 rounded-xl bg-[#2a1d15] hover:bg-[#38271c] border border-amber-700/60 text-amber-100 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left Sidebar: Node Browser */}
        <aside className="lg:col-span-4 bg-[#221711] border border-amber-800/50 rounded-2xl p-4 flex flex-col gap-3 max-h-[78vh]">
          <div className="relative">
            <Search className="w-4 h-4 text-amber-400/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search node ID or dialogue..."
              aria-label="Search story nodes"
              className="w-full min-h-[42px] pl-9 pr-3 rounded-xl bg-[#160f0b] border border-amber-900/60 text-sm text-amber-100 placeholder:text-amber-200/40"
            />
          </div>

          <select
            aria-label="Filter by chapter"
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            className="w-full min-h-[40px] px-3 rounded-xl bg-[#160f0b] border border-amber-900/60 text-xs font-mono text-amber-200"
          >
            <option value="all">All Chapters ({allNodes.length})</option>
            {CHAPTER_OPTIONS.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>

          <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
            {filteredNodes.map((node) => {
              const isSelected = draft.id === node.id;
              const isCustom = customIds.has(node.id);
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleSelectNode(node)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-100'
                      : 'bg-[#18100c] border-amber-900/40 hover:border-amber-700/60 text-amber-200/85'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold truncate">
                      {node.id}
                    </span>
                    {isCustom && (
                      <span className="text-[10px] font-mono text-emerald-300 shrink-0">
                        CUSTOM
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-amber-300/60 truncate mt-0.5">
                    {node.chapter} · {node.scene.lines[0]?.text ?? ''}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Workspace: Node Editor Form */}
        <section className="lg:col-span-8 bg-[#221711] border border-amber-800/50 rounded-2xl p-4 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-700 text-rose-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1 block">
              <span className="text-xs font-mono text-amber-300">NODE ID</span>
              <input
                type="text"
                value={draft.id}
                onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                className="w-full min-h-[42px] px-3 rounded-xl bg-[#160f0b] border border-amber-900/60 text-sm font-mono text-amber-100"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-mono text-amber-300">CHAPTER</span>
              <select
                value={draft.chapter}
                onChange={(e) =>
                  setDraft({ ...draft, chapter: e.target.value as ChapterId })
                }
                className="w-full min-h-[42px] px-3 rounded-xl bg-[#160f0b] border border-amber-900/60 text-sm font-mono text-amber-100"
              >
                {CHAPTER_OPTIONS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-mono text-amber-300">BACKGROUND</span>
              <select
                value={draft.scene.background}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    scene: {
                      ...draft.scene,
                      background: e.target.value as BackgroundId,
                    },
                  })
                }
                className="w-full min-h-[42px] px-3 rounded-xl bg-[#160f0b] border border-amber-900/60 text-sm font-mono text-amber-100"
              >
                {BACKGROUND_OPTIONS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Dialogue Lines */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-pixel text-lg text-amber-200">
                Scene Dialogue Lines ({draft.scene.lines.length})
              </h2>
              <button
                type="button"
                onClick={handleAddLine}
                className="min-h-[36px] px-3 rounded-lg bg-[#2e2017] border border-amber-700/60 text-amber-200 text-xs font-semibold"
              >
                + Add Line
              </button>
            </div>

            {draft.scene.lines.map((line, idx) => (
              <div
                key={idx}
                className="bg-[#18100c] border border-amber-900/50 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={line.speaker}
                    onChange={(e) =>
                      handleUpdateLine(idx, 'speaker', e.target.value)
                    }
                    placeholder="Speaker (e.g. Mama, Miggy, Narrator)"
                    className="flex-1 min-h-[38px] px-3 rounded-lg bg-[#120c08] border border-amber-900/60 text-xs font-semibold text-amber-200"
                  />
                  {draft.scene.lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      aria-label={`Remove line ${idx + 1}`}
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-rose-950/60 text-rose-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={line.text}
                  onChange={(e) => handleUpdateLine(idx, 'text', e.target.value)}
                  placeholder="Taglish dialogue text (supports {{name}}, {{course}}, {{hometown}})..."
                  className="w-full p-2.5 rounded-lg bg-[#120c08] border border-amber-900/60 text-xs text-amber-100"
                />
                <textarea
                  rows={2}
                  value={line.textEn ?? ''}
                  onChange={(e) =>
                    handleUpdateLine(idx, 'textEn', e.target.value)
                  }
                  placeholder="English translation (optional)..."
                  className="w-full p-2.5 rounded-lg bg-[#120c08] border border-amber-900/50 text-xs text-amber-200/80"
                />
              </div>
            ))}
          </div>

          {/* Choices */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-pixel text-lg text-amber-200">
                Player Choices ({draft.choices.length})
              </h2>
              {draft.choices.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddChoice}
                  className="min-h-[36px] px-3 rounded-lg bg-[#2e2017] border border-amber-700/60 text-amber-200 text-xs font-semibold"
                >
                  + Add Choice
                </button>
              )}
            </div>

            {draft.choices.map((ch, idx) => (
              <div
                key={idx}
                className="bg-[#18100c] border border-amber-900/50 rounded-xl p-3 space-y-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={ch.text}
                    onChange={(e) =>
                      handleUpdateChoice(idx, { text: e.target.value })
                    }
                    placeholder="Taglish choice label"
                    className="min-h-[38px] px-3 rounded-lg bg-[#120c08] border border-amber-900/60 text-xs text-amber-100"
                  />
                  <input
                    type="text"
                    value={ch.textEn ?? ''}
                    onChange={(e) =>
                      handleUpdateChoice(idx, { textEn: e.target.value })
                    }
                    placeholder="English choice label"
                    className="min-h-[38px] px-3 rounded-lg bg-[#120c08] border border-amber-900/50 text-xs text-amber-200/80"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
                  <input
                    type="text"
                    value={ch.next ?? 'PLANNER'}
                    onChange={(e) =>
                      handleUpdateChoice(idx, { next: e.target.value })
                    }
                    placeholder="Next ID / PLANNER"
                    aria-label="Next node ID"
                    className="col-span-2 min-h-[36px] px-2.5 rounded-lg bg-[#120c08] border border-amber-900/60 text-xs font-mono text-sky-300"
                  />
                  {(['money', 'energy', 'mental', 'social'] as const).map((stat) => (
                    <input
                      key={stat}
                      type="number"
                      value={ch.effects?.[stat] ?? ''}
                      onChange={(e) =>
                        handleUpdateChoiceEffect(idx, stat, e.target.value)
                      }
                      placeholder={stat}
                      aria-label={`${stat} delta`}
                      className="min-h-[36px] px-2 rounded-lg bg-[#120c08] border border-amber-900/50 text-xs font-mono text-amber-200"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-900/50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="min-h-[44px] px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1b110a] font-bold text-sm flex items-center gap-2 pixel-btn"
              >
                <Save className="w-4 h-4" />
                Save Local Override
              </button>
              <button
                type="button"
                onClick={handleTestPlay}
                className="min-h-[44px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                Play Node Now
              </button>
            </div>

            {customIds.has(draft.id) && (
              <button
                type="button"
                onClick={() => deleteCustomNode(draft.id)}
                className="min-h-[44px] px-4 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Revert Custom Node
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
