'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Role Upgrade Form Component
// Users can request a role upgrade (student → teacher → contributor → main_contributor).
// Requests are submitted for main contributor approval. No downgrades allowed.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  ChevronDown,
  Loader2,
  Check,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Pencil,
  Shield,
  Send,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { RoleBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ROLE_METADATA, ALL_ROLES, type UserRole } from '@/types';
import { mockRequestRoleUpgrade, getUserUpgradeRequests } from '@/lib/mock/database';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  student: <GraduationCap className="h-4 w-4" />,
  teacher: <BookOpen className="h-4 w-4" />,
  contributor: <Pencil className="h-4 w-4" />,
  main_contributor: <Shield className="h-4 w-4" />,
};

/** Role hierarchy: higher number = higher role */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 0,
  teacher: 1,
  contributor: 2,
  main_contributor: 3,
};

export default function RoleUpgradeForm() {
  const { user } = useAuth();
  const { role: currentRole } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [reason, setReason] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !currentRole) return null;

  // Available roles for upgrade (must be higher than current)
  const availableRoles = ALL_ROLES.filter(
    (r) => ROLE_HIERARCHY[r] > ROLE_HIERARCHY[currentRole]
  );

  // Check existing requests
  const existingRequests = getUserUpgradeRequests(user.id);
  const pendingRequest = existingRequests.find((r) => r.status === 'pending');
  const approvedRequests = existingRequests.filter((r) => r.status === 'approved');

  const handleSubmit = async () => {
    if (!selectedRole) return;
    setIsSending(true);
    setError(null);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = mockRequestRoleUpgrade(user.id, selectedRole, reason);
    if (result.success) {
      setSuccess(true);
      setSelectedRole(null);
      setReason('');
      setIsOpen(false);
      setTimeout(() => setSuccess(false), 5000);
    } else {
      setError(result.error || 'Failed to submit upgrade request.');
    }

    setIsSending(false);
  };

  return (
    <div className="space-y-4">
      {/* Current Role Display */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Current Role</p>
          <div className="flex items-center gap-2">
            <RoleBadge role={currentRole} />
            <span className="text-xs text-foreground-muted">
              {ROLE_METADATA[currentRole].description}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Request Info */}
      {pendingRequest && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Upgrade Request Pending</p>
              <p className="text-xs text-foreground-muted mt-1">
                You requested to upgrade to {ROLE_METADATA[pendingRequest.requested_role].displayName}.
                A main contributor will review your request.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Approved Upgrades Info */}
      {approvedRequests.length > 0 && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 animate-fade-in">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Previous Upgrades</p>
              {approvedRequests.map((req) => (
                <p key={req.id} className="text-xs text-foreground-muted mt-0.5">
                  {ROLE_METADATA[req.current_role].displayName} → {ROLE_METADATA[req.requested_role].displayName}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Request Form */}
      {!pendingRequest && availableRoles.length > 0 && (
        <div className="border border-border rounded-xl p-4">
          <p className="text-sm font-medium text-foreground mb-3">Request Role Upgrade</p>
          <p className="text-xs text-foreground-muted mb-4">
            Select a higher role to request an upgrade. A main contributor will review your request.
          </p>

          {/* Role Selection Dropdown */}
          <div className="relative mb-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'flex items-center justify-between w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer',
                isOpen
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground-secondary hover:text-primary hover:border-primary/40'
              )}
            >
              {selectedRole ? (
                <span className="flex items-center gap-2">
                  {ROLE_ICONS[selectedRole]}
                  {ROLE_METADATA[selectedRole].displayName}
                </span>
              ) : (
                'Select a role...'
              )}
              <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background-card border border-border rounded-xl shadow-xl p-2 z-50 animate-slide-down">
                {availableRoles.map((roleKey) => {
                  const meta = ROLE_METADATA[roleKey];
                  return (
                    <button
                      key={roleKey}
                      onClick={() => {
                        setSelectedRole(roleKey);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-3 rounded-lg text-left transition-all cursor-pointer',
                        selectedRole === roleKey
                          ? 'bg-primary/10 ring-1 ring-primary/20'
                          : 'hover:bg-background-secondary'
                      )}
                    >
                      <div className="p-2 rounded-lg bg-background-secondary text-foreground-muted shrink-0">
                        {ROLE_ICONS[roleKey]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{meta.displayName}</p>
                        <p className="text-xs text-foreground-muted">{meta.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reason Textarea */}
          {selectedRole && (
            <>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you want to upgrade? (optional)"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
              />

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={isSending}
                icon={isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                fullWidth
              >
                {isSending ? 'Submitting...' : 'Submit Upgrade Request'}
              </Button>
            </>
          )}
        </div>
      )}

      {/* No upgrades available */}
      {availableRoles.length === 0 && !pendingRequest && (
        <div className="p-4 rounded-xl border border-border bg-background-secondary text-center">
          <Shield className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No Upgrades Available</p>
          <p className="text-xs text-foreground-muted mt-1">
            You are already at the highest role level.
          </p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 text-success text-sm font-medium animate-fade-in">
          <Check className="h-4 w-4" />
          Upgrade request submitted successfully! A main contributor will review it.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-error/10 text-error text-sm font-medium animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}