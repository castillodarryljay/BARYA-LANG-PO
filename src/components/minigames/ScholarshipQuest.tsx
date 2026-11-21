import React, { useState } from 'react';
import { soundFX } from '../../engine/audio';

interface Props {
  onFinish: (scoreRatio: number, passedScholarship: boolean) => void;
  language: 'taglish' | 'english';
}

const DOC_ITEMS = [
  { id: 'indigency', label: 'Barangay Certificate of Indigency', valid: true },
  { id: 'grades', label: 'Certified True Copy of Grades (GWA)', valid: true },
  { id: 'receipt', label: 'Old Milk Tea Receipt', valid: false },
  { id: 'id', label: 'School ID & Registration Form', valid: true },
  { id: 'comic', label: 'Borrowed Manga Volume', valid: false },
  { id: 'reco', label: 'Prof. Reyes Recommendation Letter', valid: true },
];

export const ScholarshipQuest: React.FC<Props> = ({ onFinish, language }) => {
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [pickedDocs, setPickedDocs] = useState<string[]>([]);
  const [points, setPoints] = useState(0);

  const toggleDoc = (id: string) => {
    soundFX.playClick();
    setPickedDocs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submitStage1 = () => {
    const validIds = DOC_ITEMS.filter((d) => d.valid).map((d) => d.id);
    const exact =
      pickedDocs.length === validIds.length &&
      validIds.every((id) => pickedDocs.includes(id));
    if (exact) {
      soundFX.playCoin();
      setPoints((p) => p + 35);
    } else {
      soundFX.playError();
      setPoints((p) => p + 15);
    }
    setStage(2);
  };

  const pickEssay = (score: number) => {
    soundFX.playClick();
    setPoints((p) => p + score);
    setStage(3);
  };

  const pickInterview = (score: number) => {
    const finalPoints = points + score;
    setPoints(finalPoints);
    if (finalPoints >= 75) soundFX.playFanfare();
    else soundFX.playError();
    setStage(4);
  };

  const passed = points >= 75;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-mono bg-[#251a13] border border-amber-900/50 rounded-xl px-4 py-3">
        <span className="text-amber-300">STAGE {Math.min(stage, 3)} / 3</span>
        <span className="text-emerald-300 font-bold">SCORE: {points}/100</span>
      </div>

      {stage === 1 && (
        <div className="bg-[#2c1f16] border border-amber-800/50 rounded-2xl p-4 space-y-3">
          <h4 className="font-pixel text-lg text-amber-300">
            {language === 'taglish'
              ? '1. Ayusin ang Requirements Folder'
              : '1. Gather Official Requirements'}
          </h4>
          <p className="text-xs text-amber-100/80">
            {language === 'taglish'
              ? 'Piliin lamang ang 4 na opisyal na dokumento para sa Iskolar ng Bayan application:'
              : 'Select ONLY the 4 official scholarship documents:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DOC_ITEMS.map((doc) => {
              const selected = pickedDocs.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => toggleDoc(doc.id)}
                  className={`min-h-[48px] text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium ${
                    selected
                      ? 'bg-amber-500 text-[#1c120b] border-amber-300 font-bold'
                      : 'bg-[#1f1610] text-amber-100 border-amber-900/50'
                  }`}
                >
                  {selected ? '✓ ' : '+ '}
                  {doc.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={submitStage1}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1c120b] font-bold pixel-btn"
          >
            {language === 'taglish' ? 'Ipasa sa Scholarship Desk' : 'Submit Document Folder'}
          </button>
        </div>
      )}

      {stage === 2 && (
        <div className="bg-[#2c1f16] border border-amber-800/50 rounded-2xl p-4 space-y-3">
          <h4 className="font-pixel text-lg text-amber-300">
            {language === 'taglish'
              ? '2. Personal Essay: "Bakit karapat-dapat ka sa scholarship?"'
              : '2. Personal Essay: "Why do you deserve this scholarship?"'}
          </h4>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => pickEssay(35)}
              className="w-full min-h-[54px] text-left p-3.5 rounded-xl bg-[#1f1610] hover:bg-[#38271b] border border-amber-800/60 text-sm text-amber-100"
            >
              {language === 'taglish'
                ? 'Ikwento nang tapat ang pagsisikap ng pamilya, ang pagiging working student, at ang plano mong maglingkod sa komunidad.'
                : 'Share honestly your family’s grit, balancing work and study, and how your degree will serve your community.'}
            </button>
            <button
              type="button"
              onClick={() => pickEssay(22)}
              className="w-full min-h-[54px] text-left p-3.5 rounded-xl bg-[#1f1610] hover:bg-[#38271b] border border-amber-800/60 text-sm text-amber-100"
            >
              {language === 'taglish'
                ? 'Ilista lang lahat ng awards at grades mula elementarya hanggang ngayon.'
                : 'List only your grades and academic certificates from elementary to now.'}
            </button>
            <button
              type="button"
              onClick={() => pickEssay(10)}
              className="w-full min-h-[54px] text-left p-3.5 rounded-xl bg-[#1f1610] hover:bg-[#38271b] border border-amber-800/60 text-sm text-amber-100"
            >
              {language === 'taglish'
                ? 'Magpasa ng maikling dalawang pangungusap na "Kailangan ko po ng pambayad tuition."'
                : 'Write two short lines saying "I just need help paying tuition."'}
            </button>
          </div>
        </div>
      )}

      {stage === 3 && (
        <div className="bg-[#2c1f16] border border-amber-800/50 rounded-2xl p-4 space-y-3">
          <h4 className="font-pixel text-lg text-amber-300">
            {language === 'taglish'
              ? '3. Panel Interview: "Paano mo papanatilihin ang 1.75 GWA habang nagwo-work?"'
              : '3. Panel Interview: "How will you protect a 1.75 GWA while working?"'}
          </h4>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => pickInterview(30)}
              className="w-full min-h-[54px] text-left p-3.5 rounded-xl bg-[#1f1610] hover:bg-[#38271b] border border-amber-800/60 text-sm text-amber-100"
            >
              {language === 'taglish'
                ? '"May structured weekly planner po ako, study group sa library, at nakikiusap ako sa shift schedule kapag exam weeks."'
                : '"I follow a strict weekly planner, study with peers in the library, and adjust shifts ahead of exam weeks."'}
            </button>
            <button
              type="button"
              onClick={() => pickInterview(18)}
              className="w-full min-h-[54px] text-left p-3.5 rounded-xl bg-[#1f1610] hover:bg-[#38271b] border border-amber-800/60 text-sm text-amber-100"
            >
              {language === 'taglish'
                ? '"Magpupuyat na lang po ako gabi-gabi at iinom ng maraming kape."'
                : '"I will just pull all-nighters every week and survive on coffee."'}
            </button>
          </div>
        </div>
      )}

      {stage === 4 && (
        <div className="bg-[#2c1f16] border border-amber-600/50 rounded-2xl p-6 text-center space-y-4">
          <h3 className={`font-pixel text-2xl ${passed ? 'text-emerald-300' : 'text-amber-300'}`}>
            {passed
              ? language === 'taglish'
                ? 'CONGRATS, ISKOLAR!'
                : 'SCHOLARSHIP APPROVED!'
              : language === 'taglish'
                ? 'Waitlisted — Subukan Muli!'
                : 'Waitlisted — Keep Pushing!'}
          </h3>
          <p className="text-sm text-amber-100/85">
            {passed
              ? language === 'taglish'
                ? `Score: ${points}/100! Pasado ka sa Iskolar ng Bayan Grant (+₱300 weekly stipend at 50% tuition discount)!`
                : `Score: ${points}/100! You earned the Iskolar ng Bayan Grant (+₱300 weekly stipend & 50% tuition off)!`
              : language === 'taglish'
                ? `Score: ${points}/100. Kailangan ng 75+ para ma-grant — pero may small book stipend ka pa rin!`
                : `Score: ${points}/100. Needed 75+ for the full grant — you still receive a small book stipend!`}
          </p>
          <button
            type="button"
            onClick={() => onFinish(points / 100, passed)}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1c120b] font-bold text-base pixel-btn"
          >
            {language === 'taglish' ? 'Tanggapin ang Resulta' : 'Claim Results'}
          </button>
        </div>
      )}
    </div>
  );
};
