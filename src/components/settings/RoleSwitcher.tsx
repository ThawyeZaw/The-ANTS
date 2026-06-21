'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Role Switcher Component
// Dropdown with confirmation dialog for changing the user's role.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  AlertTriangle,
  Loader2,
  Check,
  GraduationCap,
  BookOpen,
  Pencil,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { RoleBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { ALL_ROLES, ROLE_METADATA, type UserRole } from '@/types';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  student: <GraduationCap className="h-4 w-4" />,
  teacher: <BookOpen className="h-4 w-4" />,
  contributor: <Pencil className="h-4 w-4" />,
  main_contributor: <Shield className="h-4 w-4" />,
};

export default function RoleSwitcher() {
  const { user, updateRole } = useAuth();
  const { role: currentRole } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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

  const handleSelectRole = (role: UserRole) => {
    if (role === currentRole) {
      setIsOpen(false);
      return;
    }
    setPendingRole(role);
    setIsConfirming(true);
    setIsOpen(false);
  };

  const handleConfirm = async () => {
    if (!pendingRole) return;
    setIsSaving(true);
    setError(null);

    const result = await updateRole(pendingRole);

    setIsSaving(false);
    setIsConfirming(false);

    if (result.success) {
      setSuccess(true);
      setPendingRole(null);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Failed to update role.');
      setPendingRole(null);
    }
  };

  const handleCancelConfirm = () => {
    setIsConfirming(false);
    setPendingRole(null);
  };

  if (!user || !currentRole) return null;

  return (
    <div className="space-y-4">
      {/* Current Role Display */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Current Role</p>
          <div className="flex items-center gap-2">
            <RoleBadge role={currentRole} />
            <span className="text-xs text-foreground-muted">
              {ROLE_METADATA[currentRole].description.slice(0, 60)}…
            </span>
          </div>
        </div>

        {/* Dropdown Trigger */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer',
              isOpen
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-foreground-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5'
            )}
          >
            Change Role
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-background-card border border-border rounded-xl shadow-xl p-2 z-50 animate-slide-down">
              {ALL_ROLES.map((roleKey) => {
                const meta = ROLE_METADATA[roleKey];
                const isActive = roleKey === currentRole;
                return (
                  <button
                    key={roleKey}
                    onClick={() => handleSelectRole(roleKey)}
                    className={cn(
                      'flex items-start gap-3 w-full px-3 py-3 rounded-lg text-left transition-all duration-150 cursor-pointer',
                      isActive
                        ? 'bg-primary/10 ring-1 ring-primary/20'
                        : 'hover:bg-background-secondary'
                    )}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg shrink-0 mt-0.5',
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'bg-background-secondary text-foreground-muted'
                      )}
                    >
                      {ROLE_ICONS[roleKey]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{meta.displayName}</span>
                        {isActive && (
                          <span className="text-xs text-primary font-medium">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2">
                        {meta.description}
                      </p>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-primary shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {isConfirming && pendingRole && (
        <div className="p-4 rounded-xl border-2 border-warning/30 bg-warning/5 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Switch to {ROLE_METADATA[pendingRole].displayName}?
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                This will change your dashboard and feature access. Your navigation
                menu will update to reflect the new role's permissions.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleConfirm}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {isSaving ? 'Switching...' : 'Confirm Switch'}
                </button>
                <button
                  onClick={handleCancelConfirm}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary border border-border transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 text-success text-sm font-medium animate-fade-in">
          <Check className="h-4 w-4" />
          Role updated successfully! Navigation has been refreshed.
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-error/10 text-error text-sm font-medium animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
