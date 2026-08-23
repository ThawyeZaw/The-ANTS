'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Badge Component
// Color-coded badge for roles, statuses, and labels.
// ──────────────────────────────────────────────────────────────────────────────

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

type BadgeVariant =
  | 'default'
  | 'student'
  | 'tutor'
  | 'teacher'
  | 'contributor'
  | 'main_contributor'
  | 'admin'
  | 'success'
  | 'warning'
  | 'error';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-background-secondary text-foreground-secondary',
  student: 'bg-blue-500/15 text-blue-500',
  tutor: 'bg-emerald-500/15 text-emerald-500',
  teacher: 'bg-teal-500/15 text-teal-500',
  contributor: 'bg-purple-500/15 text-purple-500',
  main_contributor: 'bg-amber-500/15 text-amber-500',
  admin: 'bg-rose-500/15 text-rose-500',
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
    tutor: 'Tutor',
    teacher: 'Teacher',
    contributor: 'Contributor',
    main_contributor: 'Main Contributor',
    admin: 'Admin',
  };
  return <Badge variant={role}>{labels[role] || role}</Badge>;
}
