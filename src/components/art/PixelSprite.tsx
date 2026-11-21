import React, { useEffect, useState } from 'react';
import {
  HAIR_COLORS,
  SKIN_TONES,
  UNIFORM_ACCENTS,
} from '../../data/config';
import type {
  AccessoryId,
  CharacterAppearance,
  EmotionId,
  Gender,
} from '../../types/game';
import { loadAssetOverrides } from './PixelBackground';

interface PixelSpriteProps {
  spriteId: string; // e.g., "mama_worried", "player_happy"
  playerGender?: Gender;
  appearance?: CharacterAppearance;
  animation?: 'idle' | 'speaking' | 'worried' | 'none';
  dimmed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface CharacterStyle {
  skin: string;
  skinShadow: string;
  hair: string;
  outfit: string;
  accent: string;
  hairStyle: 'short' | 'curtain' | 'long' | 'bun' | 'spiky' | 'ponytail' | 'curly' | 'visor';
  accessory?: AccessoryId;
  label: string;
}

const CHAR_STYLES: Record<string, CharacterStyle> = {
  player_male: {
    skin: '#d99b66',
    skinShadow: '#b57442',
    hair: '#1e1b18',
    outfit: '#f8fafc',
    accent: '#1e3a8a',
    hairStyle: 'short',
    accessory: 'none',
    label: 'You',
  },
  player_female: {
    skin: '#d99b66',
    skinShadow: '#b57442',
    hair: '#1e1b18',
    outfit: '#f8fafc',
    accent: '#1d4ed8',
    hairStyle: 'long',
    accessory: 'none',
    label: 'You',
  },
  mama: {
    skin: '#c68652',
    skinShadow: '#9e6234',
    hair: '#27201c',
    outfit: '#d97706',
    accent: '#fef3c7',
    hairStyle: 'bun',
    label: 'Mama',
  },
  tatay: {
    skin: '#b57442',
    skinShadow: '#8c5328',
    hair: '#475569',
    outfit: '#3f6212',
    accent: '#fef08a',
    hairStyle: 'short',
    label: 'Tatay',
  },
  miggy: {
    skin: '#d99b66',
    skinShadow: '#b57442',
    hair: '#1e293b',
    outfit: '#dc2626',
    accent: '#facc15',
    hairStyle: 'spiky',
    label: 'Miggy',
  },
  bea: {
    skin: '#e0ac7c',
    skinShadow: '#bc8454',
    hair: '#29201b',
    outfit: '#0f766e',
    accent: '#f8fafc',
    hairStyle: 'ponytail',
    accessory: 'glasses',
    label: 'Bea',
  },
  carlo: {
    skin: '#c68652',
    skinShadow: '#9e6234',
    hair: '#1e1b18',
    outfit: '#2563eb',
    accent: '#f97316',
    hairStyle: 'curtain',
    label: 'Carlo',
  },
  crush: {
    skin: '#e0ac7c',
    skinShadow: '#bc8454',
    hair: '#312119',
    outfit: '#7e22ce',
    accent: '#f9a8d4',
    hairStyle: 'long',
    label: 'Jamie',
  },
  prof: {
    skin: '#c68652',
    skinShadow: '#9e6234',
    hair: '#64748b',
    outfit: '#e2e8f0',
    accent: '#7f1d1d',
    hairStyle: 'short',
    accessory: 'glasses',
    label: 'Prof. Reyes',
  },
  nena: {
    skin: '#c68652',
    skinShadow: '#9e6234',
    hair: '#475569',
    outfit: '#b45309',
    accent: '#dc2626',
    hairStyle: 'bun',
    label: 'Aling Nena',
  },
  employer: {
    skin: '#d99b66',
    skinShadow: '#b57442',
    hair: '#1e293b',
    outfit: '#15803d',
    accent: '#facc15',
    hairStyle: 'visor',
    label: 'Manager',
  },
};

function parseSpriteId(spriteId: string, playerGender: Gender): { key: string; emotion: EmotionId } {
  const parts = spriteId.split('_');
  const possibleEmotion = parts[parts.length - 1] as EmotionId;
  const validEmotions: EmotionId[] = ['neutral', 'happy', 'sad', 'angry', 'worried', 'surprised'];
  let emotion: EmotionId = 'neutral';
  let base = spriteId;

  if (validEmotions.includes(possibleEmotion)) {
    emotion = possibleEmotion;
    base = parts.slice(0, -1).join('_');
  }

  if (base === 'player') {
    base = playerGender === 'female' ? 'player_female' : 'player_male';
  }

  return { key: CHAR_STYLES[base] ? base : 'player_male', emotion };
}

function resolveStyle(key: string, appearance?: CharacterAppearance): CharacterStyle {
  const base = CHAR_STYLES[key] ?? CHAR_STYLES.player_male;
  if (!appearance || (key !== 'player_male' && key !== 'player_female')) {
    return base;
  }

  const skinObj = SKIN_TONES.find((s) => s.id === appearance.skinTone);
  const hairObj = HAIR_COLORS.find((h) => h.id === appearance.hairColor);
  const accentObj = UNIFORM_ACCENTS.find((u) => u.id === appearance.uniformAccent);

  return {
    ...base,
    skin: skinObj?.skin ?? base.skin,
    skinShadow: skinObj?.shadow ?? base.skinShadow,
    hair: hairObj?.hex ?? base.hair,
    accent: accentObj?.hex ?? base.accent,
    hairStyle: appearance.hairStyle ?? base.hairStyle,
    accessory: appearance.accessory ?? 'none',
  };
}

export const PixelSprite: React.FC<PixelSpriteProps> = ({
  spriteId,
  playerGender = 'male',
  appearance,
  animation = 'none',
  dimmed = false,
  className = '',
  size = 'lg',
}) => {
  const { key, emotion } = parseSpriteId(spriteId, playerGender);
  const style = resolveStyle(key, appearance);
  const [overrideUrl, setOverrideUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadAssetOverrides().then((map) => {
      if (active) {
        const resolvedKey = `${key}_${emotion}`;
        setOverrideUrl(map.sprites?.[resolvedKey] ?? map.sprites?.[key] ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, [key, emotion]);

  const dimClass =
    size === 'sm'
      ? 'w-12 h-16'
      : size === 'md'
        ? 'w-20 h-28'
        : 'w-24 h-36 sm:w-32 sm:h-48 md:w-36 md:h-52';

  const animClass =
    animation === 'speaking'
      ? 'sprite-speaking'
      : animation === 'worried'
        ? 'sprite-worried'
        : animation === 'idle'
          ? 'sprite-idle'
          : '';

  const focusClass = dimmed
    ? 'opacity-75 brightness-90 transition-all duration-200'
    : 'opacity-100 brightness-100 transition-all duration-200';

  if (overrideUrl) {
    return (
      <img
        src={overrideUrl}
        alt={`${style.label} (${emotion})`}
        className={`${dimClass} object-contain pixelated ${animClass} ${focusClass} ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <svg
      viewBox="0 0 32 48"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`${style.label} (${emotion})`}
      className={`${dimClass} pixelated drop-shadow-[0_6px_0_rgba(0,0,0,0.45)] ${animClass} ${focusClass} ${className}`}
    >
      {/* Back hair for long/ponytail/bun/curly */}
      {style.hairStyle === 'long' && (
        <>
          <rect x="7" y="8" width="18" height="20" fill={style.hair} />
          <rect x="6" y="13" width="2" height="14" fill={style.hair} />
          <rect x="24" y="13" width="2" height="14" fill={style.hair} />
        </>
      )}
      {style.hairStyle === 'ponytail' && (
        <>
          <rect x="22" y="10" width="4" height="13" fill={style.hair} />
          <rect x="23" y="19" width="3" height="5" fill={style.hair} />
          <rect x="21" y="10" width="2" height="3" fill={style.accent} />
        </>
      )}
      {style.hairStyle === 'bun' && (
        <rect x="12" y="2" width="8" height="5" fill={style.hair} />
      )}
      {style.hairStyle === 'curly' && (
        <>
          <rect x="6" y="5" width="20" height="13" fill={style.hair} />
          <rect x="5" y="8" width="2" height="9" fill={style.hair} />
          <rect x="25" y="8" width="2" height="9" fill={style.hair} />
          <rect x="9" y="3" width="14" height="3" fill={style.hair} />
        </>
      )}

      {/* Shoulders & Torso */}
      <rect x="6" y="26" width="20" height="22" fill={style.outfit} />
      <rect x="4" y="29" width="24" height="19" fill={style.outfit} />
      {/* Collar / Ribbon / Lanyard Accent */}
      <rect x="12" y="26" width="8" height="5" fill={style.accent} />
      <rect x="14" y="31" width="4" height="11" fill={style.accent} />
      {/* ID Badge / Pocket */}
      <rect x="19" y="34" width="4" height="5" fill="#fef08a" />
      <rect x="20" y="35" width="2" height="2" fill={style.accent} />

      {/* Neck */}
      <rect x="13" y="22" width="6" height="5" fill={style.skinShadow} />

      {/* Head */}
      <rect x="9" y="8" width="14" height="15" fill={style.skin} />
      <rect x="10" y="21" width="12" height="2" fill={style.skinShadow} />

      {/* Hair top & bangs */}
      <rect x="8" y="5" width="16" height="6" fill={style.hair} />
      <rect x="8" y="9" width="2" height="5" fill={style.hair} />
      <rect x="22" y="9" width="2" height="5" fill={style.hair} />
      {style.hairStyle === 'curtain' && (
        <>
          <rect x="9" y="10" width="5" height="3" fill={style.hair} />
          <rect x="18" y="10" width="5" height="3" fill={style.hair} />
          <rect x="15" y="9" width="2" height="2" fill={style.skin} />
        </>
      )}
      {style.hairStyle === 'spiky' && (
        <>
          <rect x="10" y="3" width="3" height="3" fill={style.hair} />
          <rect x="15" y="2" width="4" height="4" fill={style.hair} />
          <rect x="20" y="4" width="3" height="2" fill={style.hair} />
        </>
      )}
      {style.hairStyle === 'curly' && (
        <>
          <rect x="8" y="10" width="3" height="3" fill={style.hair} />
          <rect x="13" y="10" width="3" height="2" fill={style.hair} />
          <rect x="18" y="10" width="3" height="2" fill={style.hair} />
          <rect x="21" y="10" width="3" height="3" fill={style.hair} />
        </>
      )}
      {style.hairStyle === 'visor' && (
        <>
          <rect x="8" y="5" width="16" height="4" fill={style.outfit} />
          <rect x="7" y="8" width="18" height="2" fill={style.accent} />
        </>
      )}

      {/* Accessory: Street Cap */}
      {style.accessory === 'cap' && (
        <>
          <rect x="8" y="4" width="16" height="4" fill={style.accent} />
          <rect x="7" y="7" width="20" height="2" fill="#0f172a" />
          <rect x="14" y="5" width="4" height="2" fill="#fef08a" />
        </>
      )}

      {/* Accessory: Study Bandana */}
      {style.accessory === 'bandana' && (
        <>
          <rect x="8" y="8" width="16" height="2" fill={style.accent} />
          <rect x="23" y="9" width="3" height="2" fill={style.accent} />
          <rect x="24" y="11" width="2" height="2" fill={style.accent} />
        </>
      )}

      {/* Accessory: Lo-Fi Headphones */}
      {style.accessory === 'headphones' && (
        <>
          <rect x="7" y="4" width="18" height="2" fill="#334155" />
          <rect x="6" y="6" width="2" height="7" fill="#334155" />
          <rect x="24" y="6" width="2" height="7" fill="#334155" />
          <rect x="6" y="12" width="3" height="6" fill={style.accent} />
          <rect x="23" y="12" width="3" height="6" fill={style.accent} />
        </>
      )}

      {/* Eyes & Brows by Emotion */}
      {emotion === 'happy' ? (
        <>
          <rect x="11" y="14" width="3" height="1" fill="#111827" />
          <rect x="18" y="14" width="3" height="1" fill="#111827" />
          <rect x="10" y="16" width="2" height="1" fill="#f472b6" opacity="0.65" />
          <rect x="20" y="16" width="2" height="1" fill="#f472b6" opacity="0.65" />
        </>
      ) : emotion === 'surprised' ? (
        <>
          <rect x="11" y="13" width="3" height="3" fill="#ffffff" />
          <rect x="12" y="14" width="2" height="2" fill="#111827" />
          <rect x="18" y="13" width="3" height="3" fill="#ffffff" />
          <rect x="18" y="14" width="2" height="2" fill="#111827" />
        </>
      ) : (
        <>
          <rect x="11" y="14" width="2" height="2" fill="#111827" />
          <rect x="19" y="14" width="2" height="2" fill="#111827" />
        </>
      )}

      {emotion === 'angry' && (
        <>
          <rect x="11" y="12" width="3" height="1" fill="#111827" />
          <rect x="18" y="12" width="3" height="1" fill="#111827" />
        </>
      )}

      {(emotion === 'worried' || emotion === 'sad') && (
        <>
          <rect x="10" y="12" width="3" height="1" fill="#111827" />
          <rect x="19" y="12" width="3" height="1" fill="#111827" />
          {emotion === 'worried' && (
            <rect x="22" y="11" width="2" height="3" fill="#38bdf8" />
          )}
        </>
      )}

      {/* Accessory: Glasses */}
      {style.accessory === 'glasses' && (
        <>
          <rect x="10" y="13" width="5" height="4" fill="rgba(255,255,255,0.14)" stroke="#1e293b" strokeWidth="1" />
          <rect x="17" y="13" width="5" height="4" fill="rgba(255,255,255,0.14)" stroke="#1e293b" strokeWidth="1" />
          <rect x="15" y="14" width="2" height="1" fill="#1e293b" />
        </>
      )}

      {/* Mouth by Emotion */}
      {emotion === 'happy' && (
        <>
          <rect x="13" y="18" width="6" height="2" fill="#7f1d1d" />
          <rect x="14" y="18" width="4" height="1" fill="#ffffff" />
        </>
      )}
      {emotion === 'neutral' && <rect x="14" y="19" width="4" height="1" fill="#7c2d12" />}
      {emotion === 'sad' && (
        <>
          <rect x="14" y="19" width="4" height="1" fill="#7c2d12" />
          <rect x="13" y="20" width="1" height="1" fill="#7c2d12" />
          <rect x="18" y="20" width="1" height="1" fill="#7c2d12" />
        </>
      )}
      {emotion === 'worried' && <rect x="14" y="19" width="4" height="1" fill="#7c2d12" />}
      {emotion === 'angry' && <rect x="13" y="19" width="6" height="2" fill="#7f1d1d" />}
      {emotion === 'surprised' && <rect x="15" y="18" width="2" height="3" fill="#7f1d1d" />}
    </svg>
  );
};
