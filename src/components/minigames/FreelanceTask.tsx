import React, { useState } from 'react';
import { soundFX } from '../../engine/audio';

interface Props {
  onFinish: (scoreRatio: number) => void;
  language: 'taglish' | 'english';
}

interface BugTask {
  title: string;
  prompt: string;
  promptEn: string;
  lines: string[];
  bugIndex: number;
  fixNote: string;
}

const TASKS: BugTask[] = [
  {
    title: 'Client Invoice Script',
    prompt: 'I-tap ang linyang may mali sa total calculation:',
    promptEn: 'Tap the buggy line breaking the invoice total:',
    lines: [
      'const price = 150;',
      'const qty = 4;',
      'const total = price + qty; // supposed to multiply!',
      'return "PHP " + total;',
    ],
    bugIndex: 2,
    fixNote: 'Fixed: price * qty',
  },
  {
    title: 'Sari-Sari Excel Ledger',
    prompt: 'I-tap ang maling formula sa cashflow sheet ni Aling Nena:',
    promptEn: 'Tap the broken spreadsheet formula in Aling Nena’s ledger:',
    lines: [
      'A1: Daily Sales = 2400',
      'A2: Expenses = 1500',
      'A3: Net Profit = SUM(A1, A2) // adds instead of subtracts!',
      'A4: Status = "Balanced"',
    ],
    bugIndex: 2,
    fixNote: 'Fixed: = A1 - A2',
  },
  {
    title: 'Landing Page Layout Order',
    prompt: 'I-tap ang maling naka-pwestong block sa poster layout:',
    promptEn: 'Tap the misplaced UI block breaking the poster layout:',
    lines: [
      '1. Brand Logo & Hero Headline',
      '2. Footer Copyright (should be at bottom!)',
      '3. Featured Product Pricing',
      '4. Order Now Call-to-Action',
    ],
    bugIndex: 1,
    fixNote: 'Moved Footer to bottom!',
  },
  {
    title: 'Student Portal Login',
    prompt: 'I-tap ang security bug sa login check:',
    promptEn: 'Tap the security bug in this login check:',
    lines: [
      'function checkLogin(inputPass, savedHash) {',
      '  if (inputPass.length > 0) return true; // skips verify!',
      '  return verifyHash(inputPass, savedHash);',
      '}',
    ],
    bugIndex: 1,
    fixNote: 'Removed bypass bug!',
  },
];

export const FreelanceTask: React.FC<Props> = ({ onFinish, language }) => {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const task = TASKS[idx];

  const handlePick = (lineIdx: number) => {
    if (done) return;
    if (lineIdx === task.bugIndex) {
      soundFX.playCoin();
      setCorrect((c) => c + 1);
      setFeedback(`✓ ${task.fixNote}`);
    } else {
      soundFX.playError();
      setFeedback(language === 'taglish' ? 'Hindi iyan ang bug — next ticket!' : 'Not the bug — moving to next ticket!');
    }

    window.setTimeout(() => {
      setFeedback(null);
      if (idx + 1 >= TASKS.length) {
        setDone(true);
      } else {
        setIdx((i) => i + 1);
      }
    }, 650);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-mono tabular-nums bg-[#251a13] border border-amber-900/50 rounded-xl px-4 py-3">
        <div>
          <span className="text-amber-300/70 mr-2">TICKET</span>
          <span className="text-lg font-bold text-sky-300">
            {Math.min(idx + 1, TASKS.length)}/{TASKS.length}
          </span>
        </div>
        <div>
          <span className="text-amber-300/70 mr-2">FIXED</span>
          <span className="text-lg font-bold text-emerald-300">{correct}</span>
        </div>
      </div>

      {!done ? (
        <div className="bg-[#1b1410] border border-sky-800/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-pixel text-lg text-sky-300">{task.title}</h4>
            {feedback && <span className="text-xs font-semibold text-amber-300">{feedback}</span>}
          </div>
          <p className="text-xs text-amber-100/80">
            {language === 'taglish' ? task.prompt : task.promptEn}
          </p>
          <div className="space-y-2">
            {task.lines.map((line, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePick(i)}
                className="w-full min-h-[48px] text-left font-mono text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-slate-700 hover:border-sky-400 text-slate-100 transition-colors"
              >
                <span className="text-slate-500 mr-3">{i + 1}</span>
                {line}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#2c1f16] border border-amber-600/50 rounded-2xl p-6 text-center space-y-4">
          <h3 className="font-pixel text-2xl text-amber-300">
            {language === 'taglish' ? 'Client Deliverable Approved!' : 'Client Deliverable Approved!'}
          </h3>
          <p className="text-sm text-amber-100/85">
            {language === 'taglish'
              ? `Naayos mo ang ${correct}/${TASKS.length} freelance tickets!`
              : `Resolved ${correct}/${TASKS.length} freelance client tickets!`}
          </p>
          <button
            type="button"
            onClick={() => onFinish(correct / TASKS.length)}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1c120b] font-bold text-base pixel-btn"
          >
            {language === 'taglish' ? 'Tanggapin ang GCash Payment (₱)' : 'Collect Freelance Pay (₱)'}
          </button>
        </div>
      )}
    </div>
  );
};
