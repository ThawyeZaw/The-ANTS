'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Avatar Image Component
// Renders preset illustrated avatars or uploaded images or fallback initials.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Image from 'next/image';
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

/** Pixel sizes mapped to Next.js Image `sizes` attribute */
const IMAGE_PX_SIZES: Record<string, string> = {
  sm: '40px',
  md: '64px',
  lg: '96px',
  xl: '128px',
};

/** Initials fallback font size classes */
const INITIALS_SIZE_MAP: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

export default function AvatarImage({ avatar, name, size = 'md', className = '' }: AvatarImageProps) {
  const sizeClass = SIZE_MAP[size];
  const emojiSizeClass = EMOJI_SIZE_MAP[size];
  const [imageError, setImageError] = useState(false);

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
  if (avatar && !imageError) {
    return (
      <div className={`shrink-0 rounded-full overflow-hidden relative ${sizeClass} ${className}`}>
        <Image
          src={avatar}
          alt={name}
          fill
          className="object-cover"
          sizes={IMAGE_PX_SIZES[size]}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Uploaded image that failed — fallback to initials
  if (avatar && imageError) {
    return (
      <div
        className={`shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-primary/20 ${sizeClass} ${INITIALS_SIZE_MAP[size]} ${className}`}
      >
        {getInitials(name)}
      </div>
    );
  }

  // Fallback initials (no avatar provided)
  return (
    <div
      className={`shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-primary/20 ${sizeClass} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
