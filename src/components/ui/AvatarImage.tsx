'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Avatar Image Component
// Renders preset illustrated avatars or uploaded images or fallback initials.
// ──────────────────────────────────────────────────────────────────────────────

import { isPresetAvatar, getPresetAvatar, PRESET_AVATARS } from '@/constants/avatars';
import { getInitials } from '@/lib/utils';

interface AvatarImageProps {
  /** The avatar value from profile (e.g. empty string, a URL, or 'preset:fox') */
  avatar: string;
  /** The user's name (for initials fallback) */
  name: string;
  /** Size class for the container */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional additional className */
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-10 w-10 text-lg',
  md: 'h-16 w-16 text-2xl',
  lg: 'h-24 w-24 text-4xl',
  xl: 'h-32 w-32 text-5xl',
};

const EMOJI_SIZE_MAP = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
  xl: 'text-6xl',
};

export default function AvatarImage({ avatar, name, size = 'md', className = '' }: AvatarImageProps) {
  const sizeClass = SIZE_MAP[size];
  const emojiSizeClass = EMOJI_SIZE_MAP[size];

  // Preset avatar
  if (avatar && isPresetAvatar(avatar)) {
    const preset = getPresetAvatar(avatar);
    if (preset) {
      return (
        <div
          className={`shrink-0 rounded-full bg-gradient-to-br ${preset.gradient} flex items-center justify-center ${sizeClass} ${className}`}
        >
          <span className={`${emojiSizeClass} select-none`}>{preset.emoji}</span>
        </div>
      );
    }
  }

  // Uploaded image
  if (avatar) {
    return (
      <div className={`shrink-0 rounded-full overflow-hidden ${sizeClass} ${className}`}>
        <img
          src={avatar}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback to initials on broken image
            const parent = (e.target as HTMLElement).parentElement;
            if (parent) {
              parent.innerHTML = `<div class="h-full w-full rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-4xl'}">${getInitials(name)}</div>`;
            }
          }}
        />
      </div>
    );
  }

  // Fallback initials
  return (
    <div
      className={`shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-primary/20 ${sizeClass} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
