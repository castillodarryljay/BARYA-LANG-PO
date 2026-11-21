import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Languages } from 'lucide-react';
import { PixelBackground } from '../art/PixelBackground';
import { PixelSprite } from '../art/PixelSprite';
import { evaluateConditions, interpolateText } from '../../engine/storyEngine';
import { soundFX } from '../../engine/audio';
import { useGameStore } from '../../store/gameStore';
import type { StoryNode } from '../../types/game';

interface VisualNovelStageProps {
  node: StoryNode;
}

function isCharacterSpeaking(charId: string, speakerRaw: string, playerName: string): boolean {
  const s = speakerRaw.toLowerCase();
  if (s === 'narrator' || s === 'system') return false;
  if (charId === 'player') {
    return s === playerName.toLowerCase() || s === '{name}' || s === 'you' || s === 'ikaw';
  }
  if (charId === 'nena' && s.includes('nena')) return true;
  if (charId === 'prof' && (s.includes('prof') || s.includes('reyes') || s.includes('sir') || s.includes('ma’am') || s.includes("ma'am"))) return true;
  if (charId === 'crush' && (s.includes('jamie') || s.includes('crush'))) return true;
  if (charId === 'employer' && (s.includes('manager') || s.includes('boss') || s.includes('crew') || s.includes('employer'))) return true;
  return s.includes(charId.toLowerCase());
}

export const VisualNovelStage: React.FC<VisualNovelStageProps> = ({ node }) => {
  const { save, settings, chooseStoryChoice, updateSettings } = useGameStore();
  const [lineIndex, setLineIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Reset dialogue index whenever node changes
  useEffect(() => {
    setLineIndex(0);
    setCharCount(0);
  }, [node.id]);

  const isTL = settings.language === 'taglish';
  const currentLine = node.scene.lines[Math.min(lineIndex, node.scene.lines.length - 1)];

  const fullText = useMemo(() => {
    if (!save || !currentLine) return '';
    const raw = isTL ? currentLine.text : currentLine.textEn || currentLine.text;
    return interpolateText(raw, save.profile);
  }, [currentLine, isTL, save]);

  const speakerName = useMemo(() => {
    if (!save || !currentLine) return '';
    return interpolateText(currentLine.speaker, save.profile);
  }, [currentLine, save]);

  const speedMs =
    settings.textSpeed === 'instant'
      ? 0
      : settings.textSpeed === 'fast'
        ? 10
        : settings.textSpeed === 'slow'
          ? 32
          : 17;

  useEffect(() => {
    if (speedMs === 0) {
      setCharCount(fullText.length);
      return;
    }
    if (charCount >= fullText.length) return;
    const timer = window.setTimeout(() => {
      setCharCount((c) => c + 1);
      if (charCount % 6 === 0) soundFX.playBlip();
    }, speedMs);
    return () => window.clearTimeout(timer);
  }, [charCount, fullText, speedMs]);

  if (!save) return null;

  const isTyping = charCount < fullText.length;
  const isLastLine = lineIndex >= node.scene.lines.length - 1;
  const visibleText = fullText.slice(0, charCount);

  const eligibleChoices = node.choices.filter((c) =>
    evaluateConditions(c.conditions, save)
  );
  const choicesToShow = eligibleChoices.length > 0 ? eligibleChoices : node.choices.slice(0, 1);

  const handleAdvanceDialogue = () => {
    if (isTyping) {
      setCharCount(fullText.length);
      return;
    }
    if (!isLastLine) {
      soundFX.playClick();
      setLineIndex((i) => i + 1);
      setCharCount(0);
    }
  };

  const hasSpecificSpeaker =
    speakerName.toLowerCase() !== 'narrator' &&
    node.scene.characters.some((c) =>
      isCharacterSpeaking(c.id, currentLine?.speaker ?? '', save.profile.name)
    );

  const renderSlotCharacters = (pos: 'left' | 'center' | 'right') => {
    const enterClass =
      pos === 'left'
        ? 'anim-enter-left'
        : pos === 'right'
          ? 'anim-enter-right'
          : 'anim-fade-up';
    return node.scene.characters
      .filter((c) => c.position === pos)
      .map((c) => {
        const speaking = isCharacterSpeaking(c.id, currentLine?.speaker ?? '', save.profile.name);
        const isWorried = c.sprite.endsWith('_worried') || c.sprite.endsWith('_sad');
        const spriteAnim = speaking
          ? 'speaking'
          : isWorried
            ? 'worried'
            : 'idle';
        return (
          <div
            key={`${node.id}-${c.id}-${c.sprite}`}
            className={enterClass}
          >
            <PixelSprite
              spriteId={c.sprite}
              playerGender={save.profile.gender}
              appearance={save.profile.appearance}
              animation={spriteAnim}
              dimmed={hasSpecificSpeaker && !speaking}
              size="lg"
            />
          </div>
        );
      });
  };

  return (
    <div
      key={node.id}
      className="space-y-3 sm:space-y-4 anim-fade-up"
    >
      {/* Crisp HD Pixel-Art Scene Window — responsive across 360px phones, tablets & wide monitors */}
      <div className="relative w-full h-[clamp(185px,34vh,360px)] sm:h-auto sm:aspect-[16/9] sm:max-h-[46vh] rounded-2xl overflow-hidden border border-amber-700/60 bg-[#120b07] pixel-frame">
        <PixelBackground backgroundId={node.scene.background} animated />

        {/* Subtle bottom scrim for character & dialogue grounding */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#120b07]/90 via-[#120b07]/30 to-transparent pointer-events-none" />

        {/* Quick Taglish / English Toggle inside scene corner */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            updateSettings({ language: isTL ? 'english' : 'taglish' });
          }}
          aria-label="Toggle Taglish or English"
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 min-h-[36px] px-3 rounded-lg bg-[#1c130d]/90 hover:bg-[#2b1d14] border border-amber-700/60 text-xs font-semibold text-amber-100 flex items-center gap-1.5"
        >
          <Languages className="w-3.5 h-3.5 text-amber-400" />
          {isTL ? 'Taglish' : 'English'}
        </button>

        {/* Animated Character Portraits */}
        <div className="absolute inset-x-2 sm:inset-x-4 bottom-0 z-10 flex items-end justify-between pointer-events-none">
          <div className="w-1/3 flex justify-start">{renderSlotCharacters('left')}</div>
          <div className="w-1/3 flex justify-center">{renderSlotCharacters('center')}</div>
          <div className="w-1/3 flex justify-end">{renderSlotCharacters('right')}</div>
        </div>
      </div>

      {/* Typewriter Dialogue Box */}
      <button
        type="button"
        data-vn-advance="true"
        onClick={handleAdvanceDialogue}
        className="w-full text-left bg-[#231812] hover:bg-[#291c15] border border-amber-700/60 rounded-2xl p-3.5 sm:p-5 space-y-2 pixel-frame transition-colors focus-visible:outline-2 focus-visible:outline-amber-400"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-pixel text-base sm:text-lg text-amber-300 tracking-wide">
            {speakerName}
          </span>
          <span className="text-[11px] font-mono text-amber-200/60 tabular-nums">
            {lineIndex + 1}/{node.scene.lines.length}
          </span>
        </div>

        <p className="text-[14px] sm:text-base text-[#faf2e3] leading-relaxed min-h-[3.25rem]">
          {visibleText}
          {isTyping && (
            <span className="inline-block w-2 h-4 bg-amber-400 ml-1 align-middle caret-blink" />
          )}
        </p>

        {(!isLastLine || isTyping) && (
          <div className="flex items-center justify-end gap-1 text-xs font-semibold text-amber-400 pt-0.5">
            <span>
              {isTyping
                ? isTL
                  ? 'I-tap para tapusin'
                  : 'Tap to skip'
                : isTL
                  ? 'Magpatuloy'
                  : 'Continue'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </button>

      {/* Staggered Story Choices (shown once on the last line and typing finished) */}
      {isLastLine && !isTyping && (
        <div
          className="space-y-2.5"
          role="group"
          aria-label="Story choices"
        >
          {choicesToShow.map((choice, idx) => {
            const label = interpolateText(
              isTL ? choice.text : choice.textEn || choice.text,
              save.profile
            );
            const hint = isTL ? choice.hint : choice.hintEn || choice.hint;
            return (
              <button
                key={idx}
                type="button"
                data-vn-choice="true"
                onClick={() => chooseStoryChoice(choice)}
                style={{ animationDelay: `${idx * 55}ms` }}
                className="w-full min-h-[52px] text-left px-3.5 sm:px-4 py-3 rounded-xl bg-[#2d1f16] hover:bg-[#3a281c] border border-amber-600/60 hover:border-amber-400 text-[#fff6e5] pixel-btn anim-choice-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2"
              >
                <span className="text-sm sm:text-[15px] font-semibold leading-snug">
                  <span className="font-mono text-amber-400 mr-2">{idx + 1}.</span>
                  {label}
                </span>
                {hint && (
                  <span className="text-[11px] sm:text-xs font-mono text-amber-300/85 shrink-0">
                    {hint}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
