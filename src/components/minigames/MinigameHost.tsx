import React from 'react';
import { X } from 'lucide-react';
import { MINIGAME_CONFIGS } from '../../data/config';
import type { LanguageMode, MinigameId } from '../../types/game';
import { CarinderiaRush } from './CarinderiaRush';
import { JeepneyFarePass } from './JeepneyFarePass';
import { TutoringQuiz } from './TutoringQuiz';
import { FastfoodCrew } from './FastfoodCrew';
import { FreelanceTask } from './FreelanceTask';
import { TusokSelling } from './TusokSelling';
import { ScholarshipQuest } from './ScholarshipQuest';

interface MinigameHostProps {
  minigameId: MinigameId;
  language: LanguageMode;
  onComplete: (scoreRatio: number, passedScholarship?: boolean) => void;
  onCancel: () => void;
}

export const MinigameHost: React.FC<MinigameHostProps> = ({
  minigameId,
  language,
  onComplete,
  onCancel,
}) => {
  const cfg = MINIGAME_CONFIGS.find((m) => m.id === minigameId) ?? MINIGAME_CONFIGS[0];

  return (
    <div className="bg-[#1e1510] border border-amber-700/50 rounded-2xl p-4 sm:p-6 space-y-4 pixel-frame">
      <div className="flex items-start justify-between gap-3 border-b border-amber-900/50 pb-3">
        <div>
          <div className="text-xs font-mono text-amber-400/80">
            {language === 'taglish' ? 'PART-TIME RAKET' : 'PART-TIME SHIFT'} · -{cfg.energyCost} Energy · ₱{cfg.basePay}–₱{cfg.maxPay}
          </div>
          <h2 className="font-pixel text-2xl text-amber-100 mt-0.5">
            {language === 'taglish' ? cfg.title : cfg.titleEn}
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/75 mt-1">
            {language === 'taglish' ? cfg.subtitle : cfg.subtitleEn}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close minigame"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#2c1f16] hover:bg-[#3a291d] border border-amber-900/60 text-amber-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {minigameId === 'carinderia' && (
        <CarinderiaRush language={language} onFinish={(r) => onComplete(r)} />
      )}
      {minigameId === 'jeepney' && (
        <JeepneyFarePass language={language} onFinish={(r) => onComplete(r)} />
      )}
      {minigameId === 'tutoring' && (
        <TutoringQuiz language={language} onFinish={(r) => onComplete(r)} />
      )}
      {minigameId === 'fastfood' && (
        <FastfoodCrew language={language} onFinish={(r) => onComplete(r)} />
      )}
      {minigameId === 'freelance' && (
        <FreelanceTask language={language} onFinish={(r) => onComplete(r)} />
      )}
      {minigameId === 'tusok' && (
        <TusokSelling language={language} onFinish={(r) => onComplete(r)} />
      )}
      {minigameId === 'scholarship' && (
        <ScholarshipQuest
          language={language}
          onFinish={(r, passed) => onComplete(r, passed)}
        />
      )}
    </div>
  );
};
