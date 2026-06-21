# Settings Page Improvements + Contributor Public Profile + spec.md Update

Upgrade the existing settings page with profile editing, role management, and an "update profile" function. Build the Contributor Public Profile page at `/profile/[username]`. Update `spec.md` to reflect the current project file structure.

## User Review Required

> [!IMPORTANT]
> **Profile Editing**: The current settings page shows name/email as "Read-only" with a note to "contact your administrator." This plan upgrades those fields to be **editable inline** with a Save button. Changes update the mock database in-memory (persisted to localStorage via the session). When Supabase is connected, the save function will call `supabase.from('profiles').update()`.

> [!IMPORTANT]
> **Role Change**: The settings page will add a **role switcher** dropdown allowing users to change their own role. This is convenient for demo/testing purposes now and matches the spec ("users can upgrade or downgrade their role later"). In production, this could be gated by admin approval.

> [!WARNING]
> **Profile route uses `[username]`**: The spec defines the public profile at `/profile/[username]`. Since the current mock data doesn't have usernames, I'll derive a slug from the user's name (e.g., `ayechanthu` for `Aye Chan Thu`) and store it in a `username` field added to the `Profile` type. Existing mock users will get auto-generated usernames. The NavBar already links to `/profile/me` — this will resolve to the logged-in user's own profile.

---

## Proposed Changes

### Types & Utilities

#### [MODIFY] [index.ts](file:///c:/Users/USER/Desktop/The-ANTS/src/types/index.ts)
- Add `username: string` field to the `Profile` interface

#### [MODIFY] [utils.ts](file:///c:/Users/USER/Desktop/The-ANTS/src/lib/utils.ts)
- Add `generateUsername(name: string)` helper — converts "Aye Chan Thu" → "ayechanthu"

---

### Mock Database

#### [MODIFY] [database.ts](file:///c:/Users/USER/Desktop/The-ANTS/src/lib/mock/database.ts)
- Add `username` field to every mock profile (e.g., `thiriaaung`, `minhtetnaing`, `dawhlamyint`)
- Add `getProfileByUsername(username: string)` query helper
- Add `mockUpdateProfile(userId, data)` function — updates name, bio, title, social links, avatar in mock store
- Add `mockUpdateRole(userId, newRole)` function — changes the role in mock store
- Update `mockSignup` and `mockInviteUser` to generate and store usernames

---

### Auth Context

#### [MODIFY] [AuthContext.tsx](file:///c:/Users/USER/Desktop/The-ANTS/src/context/AuthContext.tsx)
- Add `updateProfile(data)` method to `AuthContextValue` — calls `mockUpdateProfile`, then updates the context `user` state and localStorage session
- Add `updateRole(newRole)` method to `AuthContextValue` — calls `mockUpdateRole`, then refreshes context user and localStorage

---

### Hooks

#### [MODIFY] [useAuth.ts](file:///c:/Users/USER/Desktop/The-ANTS/src/hooks/useAuth.ts)
- No changes needed — it re-exports from `AuthContext`, which will now include `updateProfile` and `updateRole`

#### [NEW] [useProfile.ts](file:///c:/Users/USER/Desktop/The-ANTS/src/hooks/useProfile.ts)
- Hook for the public profile page that:
  - Takes a `username` parameter
  - Returns `{ profile, contributorProfile, stats, isLoading, isOwnProfile }`
  - Fetches from `getProfileByUsername`, `mockContributorProfiles`, `mockContributorStats`
  - Compares with the logged-in user to determine `isOwnProfile`

---

### Components

#### [NEW] [ProfileEditor.tsx](file:///c:/Users/USER/Desktop/The-ANTS/src/components/settings/ProfileEditor.tsx)
Editable profile section replacing the current read-only `AccountInfo`:
- Editable **name** field (text input)
- Read-only **email** field (stays read-only — email changes require verification in production)
- Editable **bio** (textarea)
- Editable **title** (text input)
- Editable **social links** section (website, LinkedIn, GitHub, Facebook)
- **Avatar** display with initials (editable avatar upload deferred to Supabase Storage phase)
- Role badge display with **Change Role** button/dropdown
- **Save Changes** button with loading state and success toast
- Form tracks dirty state — save button only enables when there are unsaved changes

#### [NEW] [RoleSwitcher.tsx](file:///c:/Users/USER/Desktop/The-ANTS/src/components/settings/RoleSwitcher.tsx)
Role change component:
- Shows current role with badge
- Dropdown showing all 4 roles with `ROLE_METADATA` descriptions and icons
- Confirmation step: "Are you sure you want to switch to {role}? This will change your dashboard and feature access."
- After confirmation: calls `updateRole`, success animation, page refreshes role-gated navigation

#### [NEW] [ProfileHero.tsx](file:///c:/Users/USER/Desktop/The-ANTS/src/components/profile/ProfileHero.tsx)
Hero banner for the public profile page:
- Large avatar with gradient background (initials-based)
- Name, title, role badge
- Bio text
- Social links as icon buttons (website, LinkedIn, GitHub, Facebook)
- "Edit Profile" button if viewing own profile (links to `/settings`)
- Gradient banner background derived from role color

#### [NEW] [ProfileStats.tsx](file:///c:/Users/USER/Desktop/The-ANTS/src/components/profile/ProfileStats.tsx)
Stats cards for contributor profiles:
- Published curriculums count
- Published resources count
- Total views
- Member since date
- Only shows for contributor/main_contributor roles

#### [NEW] [ProfileActivity.tsx](file:///c:/Users/USER/Desktop/The-ANTS/src/components/profile/ProfileActivity.tsx)
Recent activity feed on the profile page:
- Shows recent contributions (published resources, approved submissions)
- Uses `mockActivityFeed` and `mockEditorSubmissions` data
- Timeline-style display with icons and timestamps

---

### Pages

#### [MODIFY] [page.tsx](file:///c:/Users/USER/Desktop/The-ANTS/src/app/(app)/settings/page.tsx)
- Replace the read-only `AccountInfo` component with the new `ProfileEditor` component
- Add a new `SettingsSection` for "Role Management" containing `RoleSwitcher`
- Keep existing theme/appearance section unchanged

#### [NEW] [page.tsx](file:///c:/Users/USER/Desktop/The-ANTS/src/app/(app)/profile/[username]/page.tsx)
Public profile page shell:
- Extracts `username` from route params
- Uses `useProfile(username)` hook
- Renders `ProfileHero`, `ProfileStats`, `ProfileActivity`
- Handles "me" username → redirects to current user's actual username
- 404-style fallback if username not found

---

### spec.md Update

#### [MODIFY] [spec.md](file:///c:/Users/USER/Desktop/The-ANTS/spec.md)
- Update the file structure tree to reflect all files that now exist:
  - `src/components/contributor-manager/` directory with its 5 components
  - `src/components/settings/` directory with `ProfileEditor.tsx`, `RoleSwitcher.tsx`
  - `src/components/profile/` directory with `ProfileHero.tsx`, `ProfileStats.tsx`, `ProfileActivity.tsx`
  - `src/hooks/useContributorManager.ts`, `useProfile.ts`
  - `src/app/(app)/main-contributor/add-contributor/page.tsx`
  - `src/app/(app)/profile/[username]/page.tsx`
  - `src/app/(app)/settings/page.tsx`
- Add ownership annotations (🔒 PM) for new PM-owned files
- Update Section 9 "No Dashboard Directory" note to reflect the current `/dashboard` route reality

---

## Design Direction

- **Settings page**: Keep existing glassmorphism card sections. Profile editor uses inline editing with subtle focus animations. Role switcher uses a premium dropdown with role gradient swatches.
- **Public profile page**: Hero banner with gradient background matching role color. Glassmorphism stat cards. Timeline-style activity feed with smooth hover animations.
- **Responsive**: Mobile-first — stacked layout on small screens, two-column (hero + stats sidebar) on desktop.

---

## Verification Plan

### Automated Tests
- `npm run build` — verify no TypeScript errors

### Manual Verification
1. Log in as contributor (`aye.chan@theants.edu` / `contributor123`)
2. Navigate to Settings → edit name, bio, title → save → verify changes persist
3. Navigate to Settings → change role to `student` → verify nav groups change
4. Navigate to `/profile/me` → verify redirect to own profile
5. Navigate to `/profile/dawhlamyint` → verify public profile renders correctly
6. Test on mobile viewport — verify responsive layout
7. Verify non-contributor profiles show minimal profile (no stats section)
