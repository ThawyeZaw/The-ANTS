'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Users Table
// Filterable, searchable table of all users with role badges.
// Responsive: cards on mobile, table on desktop.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { Search, Users, Filter, Loader2, ChevronDown } from 'lucide-react';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { UserRole, ROLE_METADATA, ALL_ROLES } from '@/types';
import type { Profile } from '@/types';

interface UsersTableProps {
  users: Profile[];
  onRoleChange?: (userId: string, newRole: UserRole) => Promise<void>;
}

type RoleFilter = UserRole | 'all';

const FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  ...ALL_ROLES.map((r) => ({
    value: r as RoleFilter,
    label: ROLE_METADATA[r].displayName,
  })),
];

// Avatar gradient colors keyed by role
const AVATAR_GRADIENTS: Record<UserRole, string> = {
  student: 'from-blue-500 to-cyan-400',
  teacher: 'from-emerald-500 to-teal-400',
  contributor: 'from-violet-500 to-purple-400',
  main_contributor: 'from-amber-500 to-orange-400',
};

export default function UsersTable({ users, onRoleChange }: UsersTableProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<RoleFilter>('all');
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!onRoleChange) return;
    setChangingRoleId(userId);
    try {
      await onRoleChange(userId, newRole);
    } finally {
      setChangingRoleId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;

    // Filter by role
    if (activeFilter !== 'all') {
      result = result.filter((u) => u.role === activeFilter);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, activeFilter, search]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          All Users
          <span className="text-sm font-normal text-foreground-muted">
            ({filteredUsers.length})
          </span>
        </h3>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
          />
        </div>

        {/* Role filter chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-foreground-muted shrink-0" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap',
                activeFilter === opt.value
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-background-secondary text-foreground-muted hover:bg-background-card hover:text-foreground border border-border'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block rounded-xl border border-border overflow-visible">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-background-secondary/80">
              <th className="text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider px-5 py-3 w-[25%]">
                User
              </th>
              <th className="text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider px-5 py-3 w-[30%]">
                Email
              </th>
              <th className="text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider px-5 py-3 w-[15%]">
                Role
              </th>
              <th className="text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider px-5 py-3 w-[15%]">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider px-5 py-3 w-[15%]">
                Joined
              </th>
              <th className="text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider px-5 py-3 w-[15%]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => {
              const meta = ROLE_METADATA[user.role];
              return (
                <tr
                  key={user.id}
                  className="hover:bg-background-secondary/50 transition-colors duration-150"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shrink-0',
                          AVATAR_GRADIENTS[user.role]
                        )}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name}
                        </p>
                        {user.title && (
                          <p className="text-xs text-foreground-muted truncate">
                            {user.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-foreground-secondary">{user.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                        user.role === 'student' && 'bg-blue-500/10 text-blue-600',
                        user.role === 'teacher' && 'bg-emerald-500/10 text-emerald-600',
                        user.role === 'contributor' && 'bg-violet-500/10 text-violet-600',
                        user.role === 'main_contributor' && 'bg-amber-500/10 text-amber-600'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          user.role === 'student' && 'bg-blue-500',
                          user.role === 'teacher' && 'bg-emerald-500',
                          user.role === 'contributor' && 'bg-violet-500',
                          user.role === 'main_contributor' && 'bg-amber-500'
                        )}
                      />
                      {meta.displayName}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider',
                        user.isVerified
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-foreground-muted/10 text-foreground-muted'
                      )}
                    >
                      {user.isVerified ? 'Verified' : 'Invited'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-foreground-muted">
                      {formatDate(user.createdAt)}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    {onRoleChange ? (
                      <RoleDropdown
                        userId={user.id}
                        currentRole={user.role}
                        isLoading={changingRoleId === user.id}
                        onChange={handleRoleChange}
                      />
                    ) : (
                      <span className="text-xs text-foreground-muted">—</span>
                    )}
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

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-3">
        {filteredUsers.map((user) => {
          const meta = ROLE_METADATA[user.role];
          return (
            <div
              key={user.id}
              className="bg-background-card border border-border rounded-xl p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shrink-0',
                    AVATAR_GRADIENTS[user.role]
                  )}
                >
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground truncate">{user.name}</p>
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0',
                          user.isVerified
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-foreground-muted/10 text-foreground-muted'
                        )}
                      >
                        {user.isVerified ? 'Verified' : 'Invited'}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0',
                          user.role === 'student' && 'bg-blue-500/10 text-blue-600',
                          user.role === 'teacher' && 'bg-emerald-500/10 text-emerald-600',
                          user.role === 'contributor' && 'bg-violet-500/10 text-violet-600',
                          user.role === 'main_contributor' && 'bg-amber-500/10 text-amber-600'
                        )}
                      >
                        {meta.displayName}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground-muted truncate">{user.email}</p>
                  <p className="text-xs text-foreground-muted mt-1">
                    Joined {formatDate(user.createdAt)}
                  </p>
                  {onRoleChange && (
                    <div className="mt-2">
                      <RoleDropdown
                        userId={user.id}
                        currentRole={user.role}
                        isLoading={changingRoleId === user.id}
                        onChange={handleRoleChange}
                      />
                    </div>
                  )}
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

// ── Role Dropdown ─────────────────────────────────────────────────────────────

function RoleDropdown({
  userId,
  currentRole,
  isLoading,
  onChange,
}: {
  userId: string;
  currentRole: UserRole;
  isLoading: boolean;
  onChange: (userId: string, newRole: UserRole) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer',
          'hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
          currentRole === 'student' && 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          currentRole === 'teacher' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          currentRole === 'contributor' && 'bg-violet-500/10 text-violet-600 border-violet-500/20',
          currentRole === 'main_contributor' && 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            {ROLE_METADATA[currentRole].displayName}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </>
        )}
      </button>

      {open && !isLoading && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-44 bg-background-card border border-border rounded-xl shadow-xl overflow-hidden animate-fade-in">
            {ALL_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => {
                  onChange(userId, role);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors cursor-pointer',
                  'hover:bg-background-secondary',
                  role === currentRole && 'bg-primary/10 text-primary'
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    role === 'student' && 'bg-blue-500',
                    role === 'teacher' && 'bg-emerald-500',
                    role === 'contributor' && 'bg-violet-500',
                    role === 'main_contributor' && 'bg-amber-500'
                  )}
                />
                {ROLE_METADATA[role].displayName}
                {role === currentRole && (
                  <span className="ml-auto text-[10px] text-primary/60">current</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
