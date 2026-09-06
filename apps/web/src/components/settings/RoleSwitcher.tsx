'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Role Switcher Component (Multi-Role Support)
// Lets users switch their active persona among their assigned roles.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Check,
  GraduationCap,
  BookOpen,
  Pencil,
  Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { type UserRole } from '@/types';

const ROLE_INFO: Record<string, { label: string; icon: LucideIcon; desc: string }> = {
  student: {
    label: 'Student',
    icon: BookOpen,
    desc: 'Access study tools, timetable & library',
  },
  tutor: {
    label: 'Tutor',
    icon: GraduationCap,
    desc: 'Manage teaching schedule, public profile & student classes',
  },
  teacher: {
    label: 'Tutor',
    icon: GraduationCap,
    desc: 'Manage teaching schedule, public profile & student classes',
  },
  contributor: {
    label: 'Contributor',
    icon: Pencil,
    desc: 'Maintain curriculum & exam data and submit proposals',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    desc: 'Manage organisation, promote users & oversee review queue',
  },
  main_contributor: {
    label: 'Admin',
    icon: Shield,
    desc: 'Manage organisation, promote users & oversee review queue',
  },
};

export default function RoleSwitcher() {
  const { roles, activeRole, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const activeInfo = ROLE_INFO[activeRole] || ROLE_INFO.student;
  const ActiveIcon = activeInfo.icon;

  const userRolesList: UserRole[] = (roles && roles.length > 0 ? roles : ['student']) as UserRole[];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer shadow-xs',
          'bg-primary/10 text-primary border-primary/20',
          'hover:bg-primary/15',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
      >
        <ActiveIcon className="w-3.5 h-3.5" />
        <span>
          Active View: <b>{activeInfo.label}</b>
        </span>
        {userRolesList.length > 1 && <ChevronDown className="w-3 h-3 opacity-70 ml-0.5" />}
      </button>

      {isOpen && userRolesList.length > 1 && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-64 bg-background-card border border-border rounded-2xl shadow-xl p-2 z-50 animate-fade-in">
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted px-2 py-1">
            Switch Active Persona
          </p>
          <div className="space-y-1 mt-1">
            {userRolesList.map((r) => {
              const info = ROLE_INFO[r] || ROLE_INFO.student;
              const Icon = info.icon;
              const isActive =
                activeRole === r ||
                (r === 'tutor' && activeRole === 'teacher') ||
                (r === 'admin' && activeRole === 'main_contributor');

              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    switchRole(r);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isActive ? 'bg-primary/10 text-primary' : 'hover:bg-background-secondary text-foreground'
                  )}
                >
                  <AppIcon
                    icon={Icon}
                    size="sm"
                    tone={isActive ? 'primary' : 'muted'}
                    frame="soft"
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">{info.label}</p>
                      {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <p className="text-[11px] text-foreground-muted leading-tight mt-0.5">{info.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
