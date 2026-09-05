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
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';
import { type UserRole } from '@/types';

const ROLE_INFO: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  student: {
    label: 'Student',
    icon: BookOpen,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    desc: 'Access study tools, timetable & library',
  },
  tutor: {
    label: 'Tutor',
    icon: GraduationCap,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    desc: 'Manage teaching schedule, public profile & student classes',
  },
  teacher: {
    label: 'Tutor',
    icon: GraduationCap,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    desc: 'Manage teaching schedule, public profile & student classes',
  },
  contributor: {
    label: 'Contributor',
    icon: Pencil,
    color: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    desc: 'Maintain curriculum & exam data and submit proposals',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    desc: 'Manage organisation, promote users & oversee review queue',
  },
  main_contributor: {
    label: 'Admin',
    icon: Shield,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
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
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs',
          activeInfo.color,
          'hover:brightness-95 active:scale-98'
        )}
      >
        <ActiveIcon className="w-3.5 h-3.5" />
        <span>Active View: <b>{activeInfo.label}</b></span>
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
              const isActive = activeRole === r || (r === 'tutor' && activeRole === 'teacher') || (r === 'admin' && activeRole === 'main_contributor');

              return (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer',
                    isActive ? 'bg-primary/10 text-primary' : 'hover:bg-background-secondary text-foreground'
                  )}
                >
                  <div className={cn('p-1.5 rounded-lg shrink-0 mt-0.5', info.color)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
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
