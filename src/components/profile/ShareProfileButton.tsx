'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ShareProfileButtonProps {
  username: string;
  customSlug?: string | null;
}

export default function ShareProfileButton({ username, customSlug }: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${customSlug || username}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = profileUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s Profile - The ANTS`,
          url: profileUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="secondary"
      size="sm"
      icon={copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
    >
      {copied ? 'Copied!' : 'Share Profile'}
    </Button>
  );
}
