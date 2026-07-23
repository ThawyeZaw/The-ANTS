'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Club Management Page
// Club leaders use this page to manage their club settings, sections, projects,
// announcements, leaders, and view members.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useClub } from '@/hooks/useClub';
import type { ClubField, ClubSectionKey } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import BackButton from '@/components/ui/BackButton';
import {
  Shield,
  Settings,
  Layout,
  FolderGit2,
  Megaphone,
  Users,
  UserPlus,
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ChevronLeft,
  GripVertical,
  Globe,
  Search,
  Building2,
} from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────────────────

type ManageTab = 'details' | 'sections' | 'projects' | 'announcements' | 'members';

const TABS: Array<{ key: ManageTab; label: string; icon: React.ReactNode }> = [
  { key: 'details', label: 'Details', icon: <Settings className="h-4 w-4" /> },
  { key: 'sections', label: 'Sections', icon: <Layout className="h-4 w-4" /> },
  { key: 'projects', label: 'Projects', icon: <FolderGit2 className="h-4 w-4" /> },
  { key: 'announcements', label: 'Announcements', icon: <Megaphone className="h-4 w-4" /> },
  { key: 'members', label: 'People', icon: <Users className="h-4 w-4" /> },
];

const FIELD_LABELS: Record<ClubField, string> = {
  architecture: 'Architecture',
  computer_science: 'Computer Science',
  volunteering: 'Volunteering',
  mathematics: 'Mathematics',
  science: 'Science',
  literature: 'Literature',
  arts: 'Arts',
  music: 'Music',
  debate: 'Debate',
  entrepreneurship: 'Entrepreneurship',
  engineering: 'Engineering',
  medicine: 'Medicine',
  other: 'Other',
};

const FIELD_OPTIONS = Object.entries(FIELD_LABELS) as [ClubField, string][];

// ── Page Component ───────────────────────────────────────────────────────────

export default function ClubManagePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const clubStore = useClub();
  const slug = params.slug;

  const [club, setClub] = useState<any>(null);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ManageTab>('details');

  // ── Load club and check authorization ──

  useEffect(() => {
    (async () => {
      setLoading(true);
      const clubData = await clubStore.getClubBySlug(slug);
      setClub(clubData);

      if (clubData) {
        const leadersData = await clubStore.getClubLeaders(clubData.id);
        setLeaders(leadersData);
      }

      setLoading(false);
    })();
  }, [slug]);

  // ── Authorization check ──

  const isLeader = user && leaders.some((l: any) => l.user_id === user.id);

  const handleClubUpdated = (updatedClub: any, oldSlug: string) => {
    setClub((prev: any) => (prev ? { ...prev, ...updatedClub } : updatedClub));
    const newSlug = updatedClub.custom_slug;
    if (newSlug && newSlug !== oldSlug) {
      router.replace(`/clubs/${newSlug}/manage`);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-6">
        <div className="h-10 w-32 rounded-xl bg-background-card" />
        <div className="h-64 rounded-2xl bg-background-card" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background-card p-8 text-center">
        <Shield className="mx-auto h-10 w-10 text-foreground-muted" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Club not found</h1>
        <p className="mt-2 text-foreground-muted">
          This club may have been deleted or you may not have access to it.
        </p>
        <div className="mt-6">
          <BackButton href="/clubs" label="Back to Clubs" />
        </div>
      </div>
    );
  }

  if (!user || !isLeader) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background-card p-8 text-center">
        <Shield className="mx-auto h-10 w-10 text-foreground-muted" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-foreground-muted">
          You don&apos;t have permission to manage this club.
        </p>
        <div className="mt-6">
          <BackButton href={`/clubs/${slug}`} label="Back to Club" />
        </div>
      </div>
    );
  }

  const accentColor = club.accent_color || '#6366f1';

  return (
    <div className="space-y-6 animate-fade-in" style={{ '--club-accent': accentColor } as React.CSSProperties}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton href={`/clubs/${slug}`} label="Back to Club" />
          <a
            href={`/explore/clubs/${club.custom_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background-card px-3 py-1.5 text-xs font-medium text-foreground-secondary hover:border-border-hover hover:text-foreground transition-colors cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">View Public Page</span>
          </a>
        </div>
        <span className="flex items-center gap-2 text-sm text-foreground-muted">
          <Shield className="h-4 w-4" />
          Managing <strong className="text-foreground">{club.name}</strong>
        </span>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-[var(--club-accent)] bg-[var(--club-accent)]/10 text-[var(--club-accent)]'
                : 'border-border bg-background-card text-foreground-secondary hover:border-border-hover hover:text-foreground'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <DetailsTab club={club} clubId={club.id} userId={user.id} clubStore={clubStore} onClubUpdated={handleClubUpdated} />
      )}
      {activeTab === 'sections' && (
        <SectionsTab clubId={club.id} userId={user.id} clubStore={clubStore} />
      )}
      {activeTab === 'projects' && (
        <ProjectsTab clubId={club.id} userId={user.id} clubStore={clubStore} />
      )}
      {activeTab === 'announcements' && (
        <AnnouncementsTab clubId={club.id} userId={user.id} clubStore={clubStore} />
      )}
      {activeTab === 'members' && (
        <MembersTab clubId={club.id} userId={user.id} club={club} clubStore={clubStore} />
      )}
    </div>
  );
}

// ── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({
  club,
  clubId,
  userId,
  clubStore,
  onClubUpdated,
}: {
  club: any;
  clubId: string;
  userId: string;
  clubStore: ReturnType<typeof useClub>;
  onClubUpdated: (updatedClub: any, oldSlug: string) => void;
}) {
  const [name, setName] = useState(club.name || '');
  const [tagline, setTagline] = useState(club.tagline || '');
  const [description, setDescription] = useState(club.description || '');
  const [field, setField] = useState<ClubField>(club.field || 'other');
  const [coverImageUrl, setCoverImageUrl] = useState(club.cover_image_url || '');
  const [accentColor, setAccentColor] = useState(club.accent_color || '#6366f1');
  const [customSlug, setCustomSlug] = useState(club.custom_slug || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const result = await clubStore.updateClub(clubId, userId, {
      name: name || undefined,
      tagline: tagline || null,
      description: description || null,
      field,
      cover_image_url: coverImageUrl || null,
      accent_color: accentColor || null,
      custom_slug: customSlug || null,
    });

    setSaving(false);
    if (result.success) {
      const updatedClub = (result as any).data;
      if (updatedClub) {
        onClubUpdated(updatedClub, club.custom_slug || '');
      }
      setMessage({ type: 'success', text: 'Club details updated successfully.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update club details.' });
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-2xl border border-border bg-background-card p-6">
        <h2 className="text-lg font-bold text-foreground">Basic Information</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Update your club&apos;s basic details and appearance.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input
            label="Club Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter club name"
            required
          />
          <Input
            label="Tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="A short tagline for your club"
          />

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe your club's mission and activities"
              className="w-full rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Field</label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value as ClubField)}
              className="w-full rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {FIELD_OPTIONS.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Cover Image URL"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#6366f1"
              />
            </div>
          </div>

          <Input
            label="Custom URL Slug"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
            placeholder="my-club-slug"
            icon={<span className="text-foreground-muted text-xs">/clubs/</span>}
          />
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-error/30 bg-error/10 text-error'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" isLoading={saving} icon={<Save className="h-4 w-4" />}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}

// ── Section icons & labels ──────────────────────────────────────────────────

const SECTION_META: Record<string, { icon: React.ReactNode; label: string }> = {
  about: { icon: <Building2 className="h-4 w-4" />, label: 'About' },
  projects: { icon: <FolderGit2 className="h-4 w-4" />, label: 'Projects Gallery' },
  members: { icon: <Users className="h-4 w-4" />, label: 'Members' },
  announcements: { icon: <Megaphone className="h-4 w-4" />, label: 'Announcements' },
};

// ── Sections Tab ─────────────────────────────────────────────────────────────

function SectionsTab({
  clubId,
  userId,
  clubStore,
}: {
  clubId: string;
  userId: string;
  clubStore: ReturnType<typeof useClub>;
}) {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const data = await clubStore.getClubSections(clubId);
      setSections(data);
      setLoading(false);
    })();
  }, [clubId]);

  // ── Drag & Drop ───────────────────────────────────────────────────

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setSections((prev) => {
      const next = [...prev];
      const [item] = next.splice(dragIndex, 1);
      next.splice(index, 0, item);
      return next.map((s, i) => ({ ...s, order_no: i }));
    });
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  // ── Section helpers ────────────────────────────────────────────────

  const toggleVisibility = (index: number) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s))
    );
  };

  const updateTitle = (index: number, title: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, title_override: title || null } : s))
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSections((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((s, i) => ({ ...s, order_no: i }));
    });
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    setSections((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((s, i) => ({ ...s, order_no: i }));
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const result = await clubStore.updateSections(
      clubId,
      userId,
      sections.map((s) => ({
        section_key: s.section_key,
        visible: s.visible,
        order_no: s.order_no,
        title_override: s.title_override,
      }))
    );

    setSaving(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Section settings saved.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update sections.' });
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-background-card p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-background-secondary" />
          ))}
        </div>
      </div>
    );
  }

  const visibleSections = sections.filter((s) => s.visible).sort((a, b) => a.order_no - b.order_no);

  return (
    <div className="space-y-6">
      {/* ── Section Editor ── */}
      <div className="rounded-2xl border border-border bg-background-card p-6">
        <h2 className="text-lg font-bold text-foreground">Section Visibility &amp; Order</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Drag to reorder, toggle visibility, and customize section titles for your club&apos;s public page.
        </p>

        <div className="mt-6 space-y-2">
          {sections
            .sort((a, b) => a.order_no - b.order_no)
            .map((section, index) => {
              const meta = SECTION_META[section.section_key];
              const isDragging = dragIndex === index;
              return (
                <div
                  key={section.id || section.section_key}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 rounded-xl border bg-background-secondary p-4 transition-all ${
                    isDragging ? 'border-primary shadow-lg scale-[1.02] opacity-90' : 'border-border'
                  } ${!section.visible ? 'opacity-50' : ''}`}
                >
                  {/* Drag handle */}
                  <button
                    type="button"
                    className="cursor-grab active:cursor-grabbing text-foreground-muted hover:text-foreground shrink-0"
                    aria-label="Drag to reorder"
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>

                  {/* Section info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground-secondary">{meta?.icon}</span>
                      <span className="text-sm font-medium text-foreground capitalize">
                        {section.section_key}
                      </span>
                      <span className="text-xs text-foreground-muted">
                        ({meta?.label})
                      </span>
                      {!section.visible && (
                        <span className="text-[10px] text-foreground-muted ml-1">Hidden</span>
                      )}
                    </div>

                    {/* Title override input */}
                    <Input
                      value={section.title_override || ''}
                      onChange={(e) => updateTitle(index, e.target.value)}
                      placeholder={`Default: "${meta?.label}"`}
                      icon={<Settings className="h-3.5 w-3.5" />}
                      className="text-xs"
                    />
                  </div>

                  {/* Reorder arrows */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="cursor-pointer text-foreground-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index === sections.length - 1}
                      className="cursor-pointer text-foreground-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={() => toggleVisibility(index)}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      section.visible
                        ? 'bg-success/10 text-success hover:bg-success/20'
                        : 'bg-foreground-muted/10 text-foreground-muted hover:bg-foreground-muted/20'
                    }`}
                  >
                    {section.visible ? (
                      <><Eye className="h-3.5 w-3.5" /> Visible</>
                    ) : (
                      <><EyeOff className="h-3.5 w-3.5" /> Hidden</>
                    )}
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── Live Preview ── */}
      <div className="rounded-2xl border border-border bg-background-card p-6">
        <h2 className="text-lg font-bold text-foreground">Live Preview</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          How your club&apos;s public page will look with current settings.
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-border bg-background-secondary p-4 sm:p-6">
          {visibleSections.length === 0 ? (
            <div className="text-center py-6">
              <EyeOff className="mx-auto h-8 w-8 text-foreground-muted" />
              <p className="mt-3 text-sm font-medium text-foreground">No sections visible</p>
              <p className="text-xs text-foreground-muted mt-1">
                Toggle visibility on at least one section above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleSections.map((section, i) => {
                const meta = SECTION_META[section.section_key];
                return (
                  <div
                    key={section.section_key}
                    className="rounded-lg border border-border bg-background-card p-4 flex items-center gap-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {section.title_override || meta?.label}
                      </p>
                      <p className="text-xs text-foreground-muted">{meta?.label} section</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Save ── */}
      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-error/30 bg-error/10 text-error'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          isLoading={saving}
          icon={<Save className="h-4 w-4" />}
        >
          Save Section Settings
        </Button>
      </div>
    </div>
  );
}

// ── Projects Tab ─────────────────────────────────────────────────────────────

function ProjectsTab({
  clubId,
  userId,
  clubStore,
}: {
  clubId: string;
  userId: string;
  clubStore: ReturnType<typeof useClub>;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add project form
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [linksStr, setLinksStr] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const loadProjects = async () => {
    const data = await clubStore.getClubProjects(clubId);
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, [clubId]);

  const handleDelete = async (projectId: string) => {
    const result = await clubStore.deleteProject(projectId, userId);
    if (result.success) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  };

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setAdding(true);
    setAddError('');

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const links = linksStr
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [url, label] = l.split('|').map((s) => s.trim());
        return { label: label || url, url: url || l };
      });

    const result = await clubStore.addProject(clubId, userId, {
      title,
      description: description || undefined,
      cover_image_url: coverImageUrl || undefined,
      tags,
      links,
    });

    setAdding(false);
    if (result.success) {
      setTitle('');
      setDescription('');
      setCoverImageUrl('');
      setTagsStr('');
      setLinksStr('');
      setShowAddForm(false);
      loadProjects();
    } else {
      setAddError(result.error || 'Failed to add project.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Project Button / Form */}
      {!showAddForm ? (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowAddForm(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Add Project
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleAddProject}
          className="rounded-2xl border border-border bg-background-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">New Project</h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-sm text-foreground-muted hover:text-foreground cursor-pointer px-2 py-1"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              required
            />
            <Input
              label="Cover Image URL"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://example.com/cover.jpg"
            />

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of the project"
                className="w-full rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <Input
              label="Tags (comma-separated)"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="React, TypeScript, API"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Links (one per line: url | label)
              </label>
              <textarea
                value={linksStr}
                onChange={(e) => setLinksStr(e.target.value)}
                rows={2}
                placeholder="https://github.com/example | GitHub&#10;https://demo.com | Live Demo"
                className="w-full rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {addError && (
            <p className="mt-3 text-sm text-error">{addError}</p>
          )}

          <div className="mt-4 flex justify-end">
            <Button type="submit" isLoading={adding} icon={<Plus className="h-4 w-4" />}>
              Create Project
            </Button>
          </div>
        </form>
      )}

      {/* Projects grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-background-card" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-8 text-center">
          <FolderGit2 className="mx-auto h-8 w-8 text-foreground-muted" />
          <p className="mt-3 font-semibold text-foreground">No projects yet</p>
          <p className="text-sm text-foreground-muted">
            Add a project to showcase your club&apos;s work.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative rounded-xl border border-border bg-background-card p-5 transition-all hover:border-border-hover hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => handleDelete(project.id)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-error/10 text-error opacity-0 transition-opacity hover:bg-error/20 group-hover:opacity-100 cursor-pointer"
                title="Delete project"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <h3 className="font-semibold text-foreground pr-8">{project.title}</h3>
              {project.description && (
                <p className="mt-2 text-sm text-foreground-secondary line-clamp-2">
                  {project.description}
                </p>
              )}

              {project.tags && project.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.tags.map((tag: string) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              )}

              <p className="mt-4 text-xs text-foreground-muted">
                Created by {project.profiles?.name || 'Member'} &middot;{' '}
                {formatDate(project.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Announcements Tab ────────────────────────────────────────────────────────

function AnnouncementsTab({
  clubId,
  userId,
  clubStore,
}: {
  clubId: string;
  userId: string;
  clubStore: ReturnType<typeof useClub>;
}) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const loadAnnouncements = async () => {
    const data = await clubStore.getClubAnnouncements(clubId);
    setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, [clubId]);

  const handlePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setPosting(true);
    setPostError('');

    const result = await clubStore.postAnnouncement(clubId, userId, title, content);

    setPosting(false);
    if (result.success) {
      setTitle('');
      setContent('');
      loadAnnouncements();
    } else {
      setPostError(result.error || 'Failed to post announcement.');
    }
  };

  const handleDelete = async (announcementId: string) => {
    const result = await clubStore.deleteAnnouncement(announcementId, userId);
    if (result.success) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Create announcement form */}
      <form
        onSubmit={handlePost}
        className="rounded-2xl border border-border bg-background-card p-6"
      >
        <h2 className="text-lg font-bold text-foreground">Create Announcement</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Post an announcement to your club members.
        </p>

        <div className="mt-4 grid gap-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Write your announcement here..."
              required
              className="w-full rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {postError && <p className="mt-3 text-sm text-error">{postError}</p>}

        <div className="mt-4 flex justify-end">
          <Button type="submit" isLoading={posting} icon={<Megaphone className="h-4 w-4" />}>
            Post Announcement
          </Button>
        </div>
      </form>

      {/* Announcements list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-background-card" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-8 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-foreground-muted" />
          <p className="mt-3 font-semibold text-foreground">No announcements yet</p>
          <p className="text-sm text-foreground-muted">
            Create your first announcement above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl border border-border bg-background-card p-5"
            >
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-error/10 text-error opacity-0 transition-opacity hover:bg-error/20 group-hover:opacity-100 cursor-pointer"
                title="Delete announcement"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <h3 className="font-semibold text-foreground pr-8">{item.title}</h3>
              <p className="mt-2 text-sm text-foreground-secondary whitespace-pre-line">
                {item.content}
              </p>
              <p className="mt-3 text-xs text-foreground-muted">
                Posted {formatDate(item.created_at)} &middot;{' '}
                {item.profiles?.name || 'Club leader'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Leaders Tab ──────────────────────────────────────────────────────────────

function LeadersTab({
  clubId,
  userId,
  clubStore,
  currentLeaders,
  onLeadersChange,
}: {
  clubId: string;
  userId: string;
  clubStore: ReturnType<typeof useClub>;
  currentLeaders: any[];
  onLeadersChange: (leaders: any[]) => void;
}) {
  const [addUserId, setAddUserId] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const handleAddLeader = async (e: FormEvent) => {
    e.preventDefault();
    if (!addUserId.trim()) return;

    setAdding(true);
    setAddError('');

    const result = await clubStore.addLeader(clubId, userId, addUserId.trim());

    setAdding(false);
    if (result.success) {
      setAddUserId('');
      // Reload leaders
      const updated = await clubStore.getClubLeaders(clubId);
      onLeadersChange(updated);
    } else {
      setAddError(result.error || 'Failed to add leader.');
    }
  };

  const handleRemoveLeader = async (targetUserId: string) => {
    if (targetUserId === userId) {
      // Don't let leaders remove themselves
      return;
    }

    const result = await clubStore.removeLeader(clubId, userId, targetUserId);
    if (result.success) {
      const updated = await clubStore.getClubLeaders(clubId);
      onLeadersChange(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add leader form */}
      <form
        onSubmit={handleAddLeader}
        className="rounded-2xl border border-border bg-background-card p-6"
      >
        <h2 className="text-lg font-bold text-foreground">Add Leader</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Add a new leader by entering their user ID.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="User ID"
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              placeholder="Enter the user's ID"
              required
              icon={<UserPlus className="h-4 w-4" />}
            />
          </div>
          <Button type="submit" isLoading={adding} icon={<Plus className="h-4 w-4" />}>
            Add Leader
          </Button>
        </div>

        {addError && <p className="mt-3 text-sm text-error">{addError}</p>}
      </form>

      {/* Current leaders */}
      <div className="rounded-2xl border border-border bg-background-card p-6">
        <h2 className="text-lg font-bold text-foreground">
          Current Leaders ({currentLeaders.length})
        </h2>

        {currentLeaders.length === 0 ? (
          <p className="mt-4 text-sm text-foreground-muted">No leaders yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {currentLeaders.map((leader) => {
              const profile = leader.profiles;
              const isSelf = leader.user_id === userId;
              return (
                <div
                  key={leader.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border bg-background-secondary p-4 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--club-accent)]/10 text-sm font-bold text-[var(--club-accent)]" style={{ '--club-accent': 'var(--club-accent, #6366f1)' } as React.CSSProperties}>
                      {getInitials(profile?.name || 'User')}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {profile?.name || 'Unknown user'}
                        {isSelf && (
                          <span className="ml-2 text-xs text-foreground-muted font-normal">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        @{profile?.username || 'unknown'}
                      </p>
                    </div>
                  </div>

                  {!isSelf && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoveLeader(leader.user_id)}
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({
  clubId,
  userId,
  club,
  clubStore,
}: {
  clubId: string;
  userId: string;
  club: any;
  clubStore: ReturnType<typeof useClub>;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);

  const isCreator = club?.created_by === userId;
  const memberUserIds = new Set(members.map((m: any) => m.user_id));

  const loadData = async () => {
    const [m, l] = await Promise.all([
      clubStore.getClubMembers(clubId),
      clubStore.getClubLeaders(clubId),
    ]);
    setMembers(m);
    setLeaders(l);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [clubId]);

  const leaderUserIds = new Set(leaders.map((l: any) => l.user_id));

  // ── Invite link ──────────────────────────────────────────────────────

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/explore/clubs/${club?.custom_slug}`
    : '';

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  // ── Search & invite ──────────────────────────────────────────────────

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { actionSearchProfiles } = await import('@/actions/clubs');
    const result = await actionSearchProfiles(q);
    if (result.success && result.profiles) {
      setSearchResults(result.profiles.filter((p: any) => !memberUserIds.has(p.id)));
    }
    setSearching(false);
  };

  const handleInviteUser = async (targetUserId: string) => {
    setInvitingUserId(targetUserId);
    setActionError('');
    // Add as member
    const joinResult = await clubStore.joinClub(clubId, targetUserId);
    if (joinResult.success) {
      setSearchResults((prev) => prev.filter((p) => p.id !== targetUserId));
      await loadData();
    } else {
      setActionError(joinResult.error || 'Failed to invite user.');
    }
    setInvitingUserId(null);
  };

  // ── Add leader by ID ──────────────────────────────────────────────

  const [addLeaderId, setAddLeaderId] = useState('');
  const [addingLeader, setAddingLeader] = useState(false);

  const handleAddLeader = async () => {
    if (!addLeaderId.trim()) return;
    setAddingLeader(true);
    setActionError('');
    const result = await clubStore.addLeader(clubId, userId, addLeaderId.trim());
    if (result.success) {
      setAddLeaderId('');
      await loadData();
    } else {
      setActionError(result.error || 'Failed to add leader.');
    }
    setAddingLeader(false);
  };

  const handlePromote = async (targetUserId: string) => {
    setActionTarget(targetUserId);
    setActionError('');
    const result = await clubStore.addLeader(clubId, userId, targetUserId);
    if (result.success) {
      await loadData();
    } else {
      setActionError(result.error || 'Failed to promote member.');
    }
    setActionTarget(null);
  };

  const handleRemove = async (targetUserId: string) => {
    setActionTarget(targetUserId);
    setActionError('');
    const result = await clubStore.removeMember(clubId, userId, targetUserId);
    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
      setLeaders((prev) => prev.filter((l) => l.user_id !== targetUserId));
    } else {
      setActionError(result.error || 'Failed to remove member.');
    }
    setActionTarget(null);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-background-card p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-background-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background-card p-6">
      <h2 className="text-lg font-bold text-foreground">
        Members ({members.length})
      </h2>
      <p className="mt-1 text-sm text-foreground-muted">
        {isCreator
          ? 'Manage members — promote to leader or remove from club.'
          : 'View all members who have joined this club.'}
      </p>

      {actionError && (
        <div className="mt-3 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {actionError}
        </div>
      )}

      {/* ── Invite tools (creator only) ── */}
      {isCreator && (
        <div className="mt-4 space-y-3">
          {/* Invite link */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-border bg-background-secondary p-3">
            <span className="text-xs font-medium text-foreground-secondary">Invite Link</span>
            <code className="flex-1 truncate rounded-lg bg-background px-2.5 py-1.5 text-xs text-foreground">
              {inviteUrl}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={copyInviteLink}
              className="shrink-0"
            >
              {inviteCopied ? 'Copied' : 'Copy Link'}
            </Button>
          </div>

          {/* Search & invite */}
          <div className="rounded-xl border border-border bg-background-secondary p-3">
            <p className="text-xs font-medium text-foreground-secondary mb-2">Invite by username</p>
            <div className="relative">
              <Input
                placeholder="Search users by name or username..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
              {searching && (
                <div className="mt-2 text-xs text-foreground-muted">Searching...</div>
              )}
              {!searching && searchResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border bg-background p-2">
                  {searchResults.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-background-secondary"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {getInitials(profile.name || 'User')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{profile.name}</p>
                          <p className="text-xs text-foreground-muted truncate">@{profile.username}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleInviteUser(profile.id)}
                        isLoading={invitingUserId === profile.id}
                        icon={<UserPlus className="h-3.5 w-3.5" />}
                      >
                        Invite
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="mt-2 text-xs text-foreground-muted">No users found.</div>
              )}
            </div>
          </div>

          {/* Add leader by ID */}
          <div className="rounded-xl border border-border bg-background-secondary p-3">
            <p className="text-xs font-medium text-foreground-secondary mb-2">Add leader by user ID</p>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter user ID..."
                value={addLeaderId}
                onChange={(e) => setAddLeaderId(e.target.value)}
                icon={<Shield className="h-4 w-4" />}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAddLeader}
                isLoading={addingLeader}
                className="shrink-0"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-background-secondary p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-foreground-muted" />
          <p className="mt-3 font-semibold text-foreground">No members yet</p>
          <p className="text-sm text-foreground-muted">
            Members will appear here once they join the club.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {members.map((member) => {
            const profile = member.profiles;
            const isLeader = leaderUserIds.has(member.user_id);
            const isSelf = member.user_id === userId;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background-secondary px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {getInitials(profile?.name || 'User')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {profile?.name || 'Unknown user'}
                      {isSelf && (
                        <span className="ml-1.5 text-xs text-foreground-muted font-normal">(you)</span>
                      )}
                      {isLeader && !isSelf && (
                        <span className="ml-1.5 text-[10px] text-[var(--club-accent)] font-medium">Leader</span>
                      )}
                    </p>
                    <p className="text-xs text-foreground-muted truncate">
                      @{profile?.username || 'unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-foreground-muted hidden sm:inline">
                    Joined {member.joined_at ? formatDate(member.joined_at) : 'N/A'}
                  </span>
                  {isCreator && !isSelf && (
                    <div className="flex items-center gap-1.5">
                      {!isLeader && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePromote(member.user_id)}
                          isLoading={actionTarget === member.user_id}
                          icon={<UserPlus className="h-3.5 w-3.5" />}
                        >
                          Promote
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemove(member.user_id)}
                        isLoading={actionTarget === member.user_id}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
