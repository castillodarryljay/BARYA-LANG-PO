import React, { useEffect, useState } from 'react';
import { soundFX } from '../../engine/audio';

interface Props {
  onFinish: (scoreRatio: number) => void;
  language: 'taglish' | 'english';
}

interface Pair {
  id: string;
  q: string;
  a: string;
}

const ROUNDS: Pair[][] = [
  [
    { id: '1', q: '2x + 6 = 14', a: 'x = 4' },
    { id: '2', q: 'Capital of PH', a: 'Manila' },
    { id: '3', q: 'H₂O formula', a: 'Water' },
    { id: '4', q: 'Assets = ?', a: 'Liabilities + Equity' },
  ],
  [
    { id: '5', q: 'HTML stands for', a: 'HyperText Markup' },
    { id: '6', q: 'Force = mass × ?', a: 'Acceleration' },
    { id: '7', q: 'Author of Noli', a: 'Jose Rizal' },
    { id: '8', q: '15% of ₱200', a: '₱30' },
  ],
  [
    { id: '9', q: 'Powerhouse of cell', a: 'Mitochondria' },
    { id: '10', q: 'Binary of 5', a: '101' },
    { id: '11', q: 'PH Independence', a: 'June 12, 1898' },
    { id: '12', q: 'Square root of 144', a: '12' },
  ],
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const TutoringQuiz: React.FC<Props> = ({ onFinish, language }) => {
  const [timeLeft, setTimeLeft] = useState(45);
  const [roundIdx, setRoundIdx] = useState(0);
  const [questions, setQuestions] = useState<Pair[]>(() => ROUNDS[0]);
  const [answers, setAnswers] = useState<Pair[]>(() => shuffle(ROUNDS[0]));
  const [selectedQ, setSelectedQ] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  const handleSelectAnswer = (ansId: string) => {
    if (!selectedQ || done) return;
    if (selectedQ === ansId) {
      soundFX.playCoin();
      const nextMatched = [...matchedIds, ansId];
      setMatchedIds(nextMatched);
      setTotalMatches((m) => m + 1);
      setSelectedQ(null);

      if (nextMatched.length === questions.length) {
        if (roundIdx + 1 < ROUNDS.length) {
          const nextRound = roundIdx + 1;
          setRoundIdx(nextRound);
          setQuestions(ROUNDS[nextRound]);
          setAnswers(shuffle(ROUNDS[nextRound]));
          setMatchedIds([]);
        } else {
          setDone(true);
        }
      }
    } else {
      soundFX.playError();
      setSelectedQ(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-mono tabular-nums bg-[#251a13] border border-amber-900/50 rounded-xl px-4 py-3">
        <div>
          <span className="text-amber-300/70 mr-2">TIME</span>
          <span className="text-lg font-bold text-amber-200">{timeLeft}s</span>
        </div>
        <div>
          <span className="text-amber-300/70 mr-2">ROUND</span>
          <span className="text-lg font-bold text-sky-300">{roundIdx + 1}/{ROUNDS.length}</span>
        </div>
        <div>
          <span className="text-amber-300/70 mr-2">MATCHED</span>
          <span className="text-lg font-bold text-emerald-300">{totalMatches}/12</span>
        </div>
      </div>

      {!done ? (
        <div className="space-y-3">
          <p className="text-xs text-amber-200/80">
            {language === 'taglish'
              ? '1) Pumili ng Tanong sa kaliwa, 2) I-tap ang tamang Sagot sa kanan!'
              : '1) Tap a Question on the left, 2) Tap its matching Answer on the right!'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2.5">
              {questions.map((item) => {
                const isMatched = matchedIds.includes(item.id);
                const isSelected = selectedQ === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isMatched}
                    onClick={() => {
                      soundFX.playClick();
                      setSelectedQ(item.id);
                    }}
                    className={`w-full min-h-[54px] px-3 py-2.5 rounded-xl border text-left text-sm font-semibold transition-all ${
                      isMatched
                        ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300/60 line-through'
                        : isSelected
                          ? 'bg-amber-500 text-[#1c120b] border-amber-300'
                          : 'bg-[#2c1f16] border-amber-800/60 text-amber-100 hover:border-amber-500'
                    }`}
                  >
                    {item.q}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2.5">
              {answers.map((item) => {
                const isMatched = matchedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isMatched || !selectedQ}
                    onClick={() => handleSelectAnswer(item.id)}
                    className={`w-full min-h-[54px] px-3 py-2.5 rounded-xl border text-left text-sm font-semibold transition-all ${
                      isMatched
                        ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300/60 line-through'
                        : selectedQ
                          ? 'bg-[#233245] border-sky-500/70 text-sky-100 hover:bg-[#2a3f57]'
                          : 'bg-[#1f1610] border-amber-900/40 text-amber-200/50'
                    }`}
                  >
                    {item.a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#2c1f16] border border-amber-600/50 rounded-2xl p-6 text-center space-y-4">
          <h3 className="font-pixel text-2xl text-amber-300">
            {language === 'taglish' ? 'Tapos na ang Tutoring Session!' : 'Tutoring Session Complete!'}
          </h3>
          <p className="text-sm text-amber-100/85">
            {language === 'taglish'
              ? `Naka-match ka ng ${totalMatches}/12 study cards — tuwang-tuwa ang tutee mo!`
              : `Matched ${totalMatches}/12 study cards — your tutee aced the review!`}
          </p>
          <button
            type="button"
            onClick={() => onFinish(totalMatches / 12)}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1c120b] font-bold text-base pixel-btn"
          >
            {language === 'taglish' ? 'Kunin ang Tutor Fee (₱)' : 'Collect Tutor Fee (₱)'}
          </button>
        </div>
      )}
    </div>
  );
};
