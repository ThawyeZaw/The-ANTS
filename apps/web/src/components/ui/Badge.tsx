'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Badge Component
// Color-coded badge for roles, statuses, and labels.
// ──────────────────────────────────────────────────────────────────────────────

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

type BadgeVariant = 'default' | 'student' | 'teacher' | 'contributor' | 'main_contributor' | 'success' | 'warning' | 'error';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-background-secondary text-foreground-secondary',
  student: 'bg-role-student/15 text-role-student',
  teacher: 'bg-role-teacher/15 text-role-teacher',
  contributor: 'bg-role-contributor/15 text-role-contributor',
  main_contributor: 'bg-role-main-contributor/15 text-role-main-contributor',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Convenience component that maps a UserRole to the correct badge variant */
export function RoleBadge({ role }: { role: UserRole }) {
  const labels: Record<UserRole, string> = {
    student: 'Student',
    teacher: 'Teacher',
    contributor: 'Contributor',
    main_contributor: 'Main Contributor',
  };
  return <Badge variant={role}>{labels[role]}</Badge>;
}
