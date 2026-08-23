'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Users Table (Multi-Role Management)
// Filterable, searchable table of all users with multi-role badges.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { Search, Users, Filter, Loader2, ChevronDown, Check, Shield, Award, BookOpen, GraduationCap } from 'lucide-react';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { UserRole } from '@/types';
import type { Profile } from '@/types';

interface UsersTableProps {
  users: Profile[];
  onRoleChange?: (userId: string, newRole: UserRole) => Promise<void>;
  onRolesChange?: (userId: string, newRoles: UserRole[]) => Promise<void>;
}

const ALL_SELECTABLE_ROLES: { role: UserRole; label: string; icon: any; color: string }[] = [
  { role: 'student', label: 'Student', icon: BookOpen, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { role: 'tutor', label: 'Tutor', icon: GraduationCap, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { role: 'contributor', label: 'Contributor', icon: Award, color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  { role: 'admin', label: 'Admin', icon: Shield, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
];

export default function UsersTable({ users, onRoleChange, onRolesChange }: UsersTableProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const handleRolesToggle = async (userId: string, currentRoles: UserRole[], targetRole: UserRole) => {
    setChangingRoleId(userId);
    try {
      let newRoles: UserRole[];
      if (currentRoles.includes(targetRole)) {
        // Can't remove all roles; minimum is student
        newRoles = currentRoles.filter((r) => r !== targetRole);
        if (newRoles.length === 0) newRoles = ['student'];
      } else {
        newRoles = [...currentRoles, targetRole];
      }

      if (onRolesChange) {
        await onRolesChange(userId, newRoles);
      } else if (onRoleChange) {
        await onRoleChange(userId, newRoles[0]);
      }
    } finally {
      setChangingRoleId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;

    if (activeFilter !== 'all') {
      result = result.filter((u) => {
        const uRoles = u.roles || [u.role];
        return uRoles.includes(activeFilter as UserRole) || (activeFilter === 'tutor' && uRoles.includes('teacher' as UserRole)) || (activeFilter === 'admin' && uRoles.includes('main_contributor' as UserRole));
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, activeFilter, search]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-background-card text-foreground-muted hover:text-foreground border border-border'
            )}
          >
            All Users ({users.length})
          </button>
          {ALL_SELECTABLE_ROLES.map(({ role, label }) => (
            <button
              key={role}
              onClick={() => setActiveFilter(role)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                activeFilter === role
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-background-card text-foreground-muted hover:text-foreground border border-border'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-background-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-background-secondary/50 text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Username</th>
              <th className="px-5 py-3.5">Joined Date</th>
              <th className="px-5 py-3.5">Assigned Roles (Click to Toggle)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {filteredUsers.map((user) => {
              const currentRoles: UserRole[] = user.roles && user.roles.length > 0 ? user.roles : [user.role || 'student'];
              const isLoading = changingRoleId === user.id;

              return (
                <tr key={user.id} className="hover:bg-background-secondary/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-foreground-muted truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-foreground-muted">
                    @{user.username}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-foreground-muted">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ALL_SELECTABLE_ROLES.map(({ role, label, color }) => {
                        const isAssigned =
                          currentRoles.includes(role) ||
                          (role === 'tutor' && currentRoles.includes('teacher' as UserRole)) ||
                          (role === 'admin' && currentRoles.includes('main_contributor' as UserRole));

                        return (
                          <button
                            key={role}
                            disabled={isLoading}
                            onClick={() => handleRolesToggle(user.id, currentRoles, role)}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                              isAssigned
                                ? `${color} shadow-xs font-semibold`
                                : 'bg-background-secondary/40 text-foreground-muted/60 border-border/40 hover:border-border hover:text-foreground-muted opacity-60 hover:opacity-100',
                              isLoading && 'cursor-not-allowed opacity-50'
                            )}
                          >
                            {isAssigned && <Check className="w-3 h-3" />}
                            {label}
                          </button>
                        );
                      })}
                      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-1" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-foreground-muted">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No users found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredUsers.map((user) => {
          const currentRoles: UserRole[] = user.roles && user.roles.length > 0 ? user.roles : [user.role || 'student'];
          const isLoading = changingRoleId === user.id;

          return (
            <div
              key={user.id}
              className="bg-background-card border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-foreground-muted truncate">{user.email}</p>
                  <p className="text-[11px] text-foreground-muted/80">@{user.username} • Joined {formatDate(user.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground-muted mb-1.5">Roles (tap to toggle):</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ALL_SELECTABLE_ROLES.map(({ role, label, color }) => {
                    const isAssigned =
                      currentRoles.includes(role) ||
                      (role === 'tutor' && currentRoles.includes('teacher' as UserRole)) ||
                      (role === 'admin' && currentRoles.includes('main_contributor' as UserRole));

                    return (
                      <button
                        key={role}
                        disabled={isLoading}
                        onClick={() => handleRolesToggle(user.id, currentRoles, role)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                          isAssigned
                            ? `${color} shadow-xs font-semibold`
                            : 'bg-background-secondary/40 text-foreground-muted/60 border-border/40 opacity-60',
                          isLoading && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        {isAssigned && <Check className="w-3 h-3" />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-foreground-muted">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No users found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
