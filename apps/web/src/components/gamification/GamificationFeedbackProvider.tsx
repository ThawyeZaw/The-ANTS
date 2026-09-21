'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { AwardXpResult } from '@/lib/gamification/types';
import type { BadgeDefinition } from '@/lib/gamification/badges';
import { useWorkspaceToast } from '@/components/workspace/WorkspaceToast';
import { BadgeUnlockModal } from './BadgeUnlockModal';

interface GamificationFeedbackContextValue {
  handleAwardResult: (result?: AwardXpResult) => void;
}

const GamificationFeedbackContext = createContext<GamificationFeedbackContextValue>({
  handleAwardResult: () => {},
});

export function useGamificationFeedback() {
  return useContext(GamificationFeedbackContext);
}

export function GamificationFeedbackProvider({ children }: { children: ReactNode }) {
  const { showToast } = useWorkspaceToast();
  const [badgeQueue, setBadgeQueue] = useState<BadgeDefinition[]>([]);
  const activeBadge = badgeQueue[0] ?? null;

  const dismissBadge = useCallback(() => {
    setBadgeQueue((prev) => prev.slice(1));
  }, []);

  const handleAwardResult = useCallback(
    (result?: AwardXpResult) => {
      if (!result?.success || !result.awarded) return;

      if (result.xpAmount) {
        showToast(`+${result.xpAmount} XP earned`, 'success');
      }
      if (result.levelUp && result.currentLevel) {
        showToast(`Level up! You're now Level ${result.currentLevel}`, 'success');
      }
      if (result.newBadges?.length) {
        setBadgeQueue((prev) => [...prev, ...result.newBadges!]);
      }
    },
    [showToast]
  );

  return (
    <GamificationFeedbackContext.Provider value={{ handleAwardResult }}>
      {children}
      <BadgeUnlockModal badge={activeBadge} onClose={dismissBadge} />
    </GamificationFeedbackContext.Provider>
  );
}
