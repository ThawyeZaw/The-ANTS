# Clubs & Profiles Portfolio Improvement Plan

## Summary

Transform **Profiles** into full-featured portfolios and **Clubs** into public project/activity showcases. Connect clubs to profiles so users can selectively display club contributions on their portfolio. Add progress tracking (milestones + member activity) to clubs. Enrich profiles with academic certifications and improved social link embeds. Update `spec.md` and `schema.md` for Supabase migration readiness.

---

## Current State Analysis

### What already exists (fully implemented with mock data)

**Profiles:**
- Rich portfolio with 6 section types: Projects, Activities, Achievements, Academic Grades, Testimonials, Certifications
- 8 theme presets, 3 layout options, section visibility/ordering, pinned items
- Profile editor (AdvancedProfileEditor) with 8 tabs
- Public profile at `/(public)/profile/[username]`
- Profile discovery at `/explore/profiles`
- Social links with platform icons (GitHub, Facebook, LinkedIn, Website, Twitter, Instagram, YouTube, Custom)

**Clubs:**
- 7 feature tabs: Chat, Announcements, Links, Members, Requests, Projects, Activity Timeline
- 3 join modes: open, invite_link, approval_based
- Roles: admin, moderator, member
- Feature toggles with `enabled` + `public_visible` flags
- Public club discovery at `/explore/clubs` and `/(public)/explore/clubs/[id]`
- Club management at `/(app)/clubs/[id]/manage`

### Key Gaps

| Gap | Details |
|-----|---------|
| **Clubs & Profiles disconnected** | Club memberships/projects/activity do not appear on user profiles at all |
| **No club landing page** | Public club view is basic; no hero, project gallery, member showcase, milestones |
| **No progress tracking** | Clubs have no milestones, task completion, or member progress dashboards |
| **Certifications lack structure** | Current `certifications` are generic; no dedicated fields for IGCSE/IELTS/A-Levels |
| **Social links are basic** | Links stored as JSONB but no rich embed previews, no drag-to-reorder in profile view |
| **Profile shareability** | No custom share URLs, no SEO metadata, no "share profile" button |
| **spec.md and schema.md outdated** | Don't reflect the actual rich portfolio system already built or new features |

---

## Proposed Changes

### 1. Schema Updates (`schema.md`)

#### 1.1 New Tables

**`club_milestones`** — Project/activity milestones within a club
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` | FK → clubs.id |
| `title` | `text` | |
| `description` | `text` | Nullable |
| `status` | `text` | `'planned'` \| `'in_progress'` \| `'completed'` |
| `target_date` | `timestamp` | Nullable |
| `completed_at` | `timestamp` | Nullable |
| `created_by` | `uuid` | FK → profiles.id |
| `created_at` | `timestamp` | |
| `order_no` | `int4` | Nullable |

**`club_member_contributions`** — Tracks individual member activity/progress within a club
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` | FK → clubs.id |
| `user_id` | `uuid` | FK → profiles.id |
| `contribution_type` | `text` | `'project'` \| `'event'` \| `'milestone_completed'` \| `'discussion'` \| `'other'` |
| `title` | `text` | |
| `description` | `text` | Nullable |
| `metadata` | `jsonb` | Nullable (e.g., linked entity IDs) |
| `created_at` | `timestamp` | |

**`certifications`** — Dedicated academic certifications (separate from generic profile achievements)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` | FK → profiles.id |
| `type` | `text` | `'igcse'` \| `'as_level'` \| `'a_level'` \| `'ielts'` \| `'toefl'` \| `'sat'` \| `'other'` |
| `subject` | `text` | Nullable (e.g., "Mathematics", "Physics") |
| `exam_board` | `text` | Nullable (e.g., "Cambridge", "Edexcel") |
| `grade` | `text` | Nullable (e.g., "A*", "Band 8.0") |
| `year` | `int4` | Nullable |
| `certificate_url` | `text` | Nullable (Supabase Storage URL) |
| `is_verified` | `bool` | Default: false |
| `verified_by` | `uuid` | Nullable (Main Contributor who verified) |
| `is_hidden` | `bool` | Default: false |
| `order_no` | `int4` | Nullable |
| `created_at` | `timestamp` | |

#### 1.2 Modified Tables

**`clubs`** — Add columns for landing page customization
| New Column | Type | Description |
|------------|------|-------------|
| `cover_image_url` | `text` Nullable | Hero banner image for club landing page |
| `tagline` | `text` Nullable | Short slogan (max 120 chars) |
| `custom_domain_slug` | `text` Nullable Unique | Custom URL slug for sharing (e.g., "science-club") |
| `is_showcase` | `bool` Default: false | Whether club is promoted as a public showcase |

**`club_projects`** — Add rich project fields
| New Column | Type | Description |
|------------|------|-------------|
| `status` | `text` | `'active'` \| `'completed'` \| `'archived'` |
| `cover_image_url` | `text` Nullable | Project cover image |
| `links` | `jsonb` Nullable | Array of `{ label, url }` for project links |
| `contributors` | `uuid[]` Nullable | Array of user IDs who contributed |
| `tags` | `text[]` Nullable | Tags for categorization |
| `updated_at` | `timestamp` Nullable | |

**`profiles`** — Add fields for enhanced shareability
| New Column | Type | Description |
|------------|------|-------------|
| `custom_url_slug` | `text` Nullable Unique | Custom profile URL (e.g., "john-doe") |
| `show_club_memberships` | `bool` Default: true | Whether to show club badges on profile |
| `show_club_projects` | `bool` Default: true | Whether to show club projects on portfolio |
| `show_club_activity` | `bool` Default: true | Whether to show club activity in timeline |
| `certification_ids` | `uuid[]` Nullable | Linked certification IDs for display |

---

### 2. Spec Updates (`spec.md`)

#### 2.1 Update Section 10 (Clubs) — Add subsections:

- **10.5 Club Landing Page (Showcase)**: Public-facing mini-website per club with hero banner, project gallery, member spotlight, milestone tracker, announcements feed, shareable custom URL
- **10.6 Progress Tracking**: Milestones with status tracking (planned → in_progress → completed), member contribution tracking, progress dashboard
- **10.7 Club-to-Profile Integration**: Users can toggle which club data appears on their profile portfolio

#### 2.2 Update Section 20 (Profiles) — Add:

- **20.3.3 Academic Certifications**: Structured certification display with type badges (IGCSE, A-Level, IELTS), grade display, verification status, certificate image upload
- **20.3.4 Club Integration Panel**: In profile editor, users toggle visibility of club memberships, projects, and activity on their public portfolio
- **20.3.5 Profile Shareability**: Custom URL slugs, SEO metadata per profile, social share preview cards, "Share Profile" button

#### 2.3 Update Section 21 (Explore) — Add:

- **21.2.3 Club Showcase Page**: Distinct from club detail; a polished landing page at `/(public)/showcase/[slug]` or `/(public)/clubs/[slug]/showcase`

---

### 3. Type Updates (`src/types/index.ts`)

Add new types and update existing ones:

```typescript
// New types
interface ClubMilestone { id, clubId, title, description, status, targetDate?, completedAt?, createdBy, createdAt, orderNo? }
interface ClubMemberContribution { id, clubId, userId, contributionType, title, description?, metadata?, createdAt }
interface Certification { id, userId, type, subject?, examBoard?, grade?, year?, certificateUrl?, isVerified, verifiedBy?, isHidden, orderNo?, createdAt }

// Updated Club type
// + coverImageUrl?, tagline?, customDomainSlug?, isShowcase?
// + milestones?: ClubMilestone[]

// Updated ClubProject type  
// + status, coverImageUrl?, links?, contributors?, tags?, updatedAt?

// Updated Profile type
// + customUrlSlug?, showClubMemberships, showClubProjects, showClubActivity

// New certification type enum
type CertificationType = 'igcse' | 'as_level' | 'a_level' | 'ielts' | 'toefl' | 'sat' | 'other'
```

---

### 4. Mock Data Updates (`src/lib/mock/database.ts`)

- Add 3-5 `mockCertifications` entries across profiles (e.g., IGCSE Maths A*, IELTS Band 7.5, A-Level Physics A)
- Add `mockClubMilestones` for each club (2-4 milestones each)
- Add `mockMemberContributions` entries
- Update `mockClubs` to include `coverImageUrl`, `tagline`, `customDomainSlug`
- Update `mockClubProjects` with `status`, `links`, `tags`

---

### 5. Component Changes

#### 5.1 New Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ClubShowcase.tsx` | `src/components/clubs/` | Public club landing page with hero, gallery, milestones, members, announcements |
| `MilestoneTracker.tsx` | `src/components/clubs/` | Milestone progress board within club detail + showcase |
| `MemberProgressPanel.tsx` | `src/components/clubs/` | Per-member contribution tracking within club manage |
| `CertificationSection.tsx` | `src/components/profile/` | Structured certification display on public profile |
| `CertificationEditor.tsx` | `src/components/settings/` | Tab/section in AdvancedProfileEditor for certifications |
| `ClubMembershipsPanel.tsx` | `src/components/profile/` | Shows user's club badges/links on profile page |
| `ShareProfileButton.tsx` | `src/components/profile/` | Share button with copy link + social share options |

#### 5.2 Modified Components

| Component | Changes |
|-----------|---------|
| `ClubDetail.tsx` | Add Milestones tab; add member contribution tracking |
| `ClubDiscovery.tsx` | Add "View Showcase" link on club cards; show showcase badge |
| `ClubDetail.tsx` (public) | Major redesign: hero banner, tagline, project gallery grid, milestone timeline, member spotlight, announcements feed |
| `AdvancedProfileEditor.tsx` | Add Certifications tab; add "Club Integration" section in Settings tab with toggles for showClubMemberships/showClubProjects/showClubActivity |
| `ProfileHero.tsx` | Add custom URL slug field; add "Share Profile" button; add club membership badges row |
| `ProfileActivity.tsx` | Include club activity events in timeline when enabled |
| `public/profile/[username]/page.tsx` | Add club memberships panel, certification section, improved SEO metadata |

#### 5.3 New Routes

| Route | Purpose |
|-------|---------|
| `/(public)/clubs/[slug]/showcase` | Public club landing page (if using slug) |
| - or - `/(public)/clubs/[id]` enhanced | Redesign existing public club detail into showcase-style page |

---

### 6. Hook Updates

#### 6.1 `useClub.ts`
- Add `getClubMilestones(clubId)`, `addClubMilestone()`, `updateClubMilestone()`, `deleteClubMilestone()`
- Add `getMemberContributions(clubId, userId?)`, `addMemberContribution()`
- Add `getClubMemberProgress(clubId)` — aggregated stats per member
- Add `updateClubShowcase(clubId, data)` — update landing page fields
- Add `getUserClubs(userId)` — get all clubs a user is a member of

#### 6.2 `useProfile.ts`
- Add `getUserCertifications(userId)` 
- Add `addCertification()`, `updateCertification()`, `deleteCertification()`
- Add `getUserClubMemberships(username)` — for profile page
- Add `getProfileBySlug(slug)` — for custom URL routing

---

### 7. Route & Navigation Updates

- Add "My Clubs" link in NavBar user dropdown or profile sidebar
- Club cards in discovery get a "Showcase" badge if `isShowcase` is true
- Profile URL supports both `/[username]` and `/p/[customSlug]`

---

## Assumptions & Decisions

1. **Club landing page replaces enhanced public club detail** — Rather than creating a separate route, the existing `/(public)/clubs/[id]` page will be redesigned into the showcase-style landing page. This avoids route fragmentation.

2. **Certifications are separate from Achievements** — Certifications are structured (type, subject, exam board, grade, year) while Achievements remain free-form. Both display on the profile.

3. **Club-to-profile integration is opt-in** — Users choose what to display via toggles in the profile editor. No automatic leaking of private club data.

4. **Milestones are club-level, not per-project** — Each club has a single milestone board. Projects already track their own status separately.

5. **Custom URL slugs** — Profiles get `/p/[slug]` and clubs get `/c/[slug]` for clean shareable URLs. Existing `/profile/[username]` and `/clubs/[id]` routes continue to work.

6. **File structure ownership** — Clubs are owned by AKT; Profiles are owned by PM (TYZ). New components follow existing ownership boundaries:
   - Club components go in `src/components/clubs/`
   - Profile components go in `src/components/profile/` and `src/components/settings/`
   - Shared types go in `src/types/index.ts`

7. **MVP mock data first** — All new features are built against mock data in `database.ts`. Supabase migration SQL will be prepared but not applied until production transition.

---

## Verification Steps

1. **Schema validation**: Run `npm run type-check` (or `npx tsc --noEmit`) after type updates to ensure no type errors
2. **Mock data integrity**: Verify all new mock data entries reference valid IDs and follow type constraints
3. **Component rendering**: Open each affected page route and verify new sections render correctly with mock data
4. **Profile editor**: Navigate to Settings → Profile → verify Certifications tab exists and Club Integration toggles work
5. **Club detail**: Open a club → verify Milestones tab appears and shows progress
6. **Public club page**: Open `/(public)/clubs/[id]` → verify landing page style with hero, projects, milestones, members
7. **Profile page**: Open `/(public)/profile/[username]` → verify club memberships panel and certification section appear
8. **Discovery pages**: Open `/explore/clubs` and `/explore/profiles` → verify showcase badges and new card data
