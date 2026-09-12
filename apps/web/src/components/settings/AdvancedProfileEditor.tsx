'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Unified Advanced Profile & Portfolio Editor
// Consolidates Personal Profile, Portfolio, Teaching Schedule & Contributor Showcase
// into a unified single-editor layout.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import {
  User,
  Briefcase,
  Globe,
  Award,
  BookOpen,
  Settings,
  Plus,
  Trash2,
  Save,
  Loader2,
  Check,
  LayoutTemplate,
  Link2,
  Code2,
  Camera,
  Music2,
  X,
  Upload,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Lock,
  Pencil,
  Send,
  Building,
  DollarSign,
  Clock,
  RotateCcw,
  Shield,
} from 'lucide-react';
import {
  Profile,
  ProjectEntry,
  ActivityEntry,
  AchievementEntry,
  AcademicGradeEntry,
  SocialPlatform,
  PROFILE_THEME_PRESETS,
} from '@/types';
import { cn, getInitials } from '@/lib/utils';
import CertificationEditor from './CertificationEditor';
import { uploadAvatar } from '@/lib/avatar-upload';
import {
  canHavePublicProfile,
  parseTutorAvailability,
  type TutorAvailabilityStatus,
} from '@the-ants/shared-types';
import {
  actionGetFullProfile,
  actionCheckUsernameAvailable,
  actionUpdateUsername,
  actionUpdateDisplayName,
  actionUpdateTutorProfile,
  actionUpdateContributorProfile,
  actionSyncCertifications,
} from '@/actions/profile';

type SubTabId =
  | 'basic'
  | 'tutor'
  | 'contributor'
  | 'social'
  | 'projects'
  | 'activities'
  | 'achievements'
  | 'grades'
  | 'certifications'
  | 'appearance';

interface Certification {
  id: string;
  type: string;
  subject?: string | null;
  exam_board?: string | null;
  grade?: string | null;
  year?: number | null;
  certificate_url?: string | null;
  is_verified: boolean;
  is_hidden: boolean;
  order_no?: number | null;
}

const POPULAR_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English Literature',
  'Economics',
  'Computer Science',
  'Business Studies',
  'Accounting',
];

const POPULAR_CURRICULUMS = [
  'Cambridge IGCSE',
  'Cambridge International AS/A Level',
  'Edexcel IGCSE',
  'Edexcel International A-Level',
  'Matriculation (Grade 12)',
  'IELTS / English Prep',
  'GED',
];

export default function AdvancedProfileEditor() {
  const { user, updateProfile } = useAuth();
  const { isTutor, isContributor, isAdmin } = useRole();
  const searchParams = useSearchParams();

  // Initial sub-tab from search params
  const tabParam = searchParams?.get('tab');
  const initialSubTab: SubTabId =
    tabParam === 'role-profile' || tabParam === 'tutor' || tabParam === 'schedule'
      ? 'tutor'
      : tabParam === 'contributor'
      ? 'contributor'
      : tabParam === 'social'
      ? 'social'
      : tabParam === 'projects'
      ? 'projects'
      : tabParam === 'appearance'
      ? 'appearance'
      : 'basic';

  const [activeSubTab, setActiveSubTab] = useState<SubTabId>(initialSubTab);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarDragOver, setAvatarDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [certs, setCerts] = useState<Certification[]>([]);

  // Username validation state
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Tutor profile state
  const [telegramHandle, setTelegramHandle] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [institution, setInstitution] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [teachingSubjects, setTeachingSubjects] = useState<string[]>([]);
  const [teachingCurriculums, setTeachingCurriculums] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<TutorAvailabilityStatus>('available');
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [newSubjectInput, setNewSubjectInput] = useState('');

  // Contributor profile state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  useEffect(() => {
    if (tabParam === 'role-profile' || tabParam === 'tutor' || tabParam === 'schedule') {
      setActiveSubTab('tutor');
    } else if (tabParam === 'contributor') {
      setActiveSubTab('contributor');
    }
  }, [tabParam]);

  // Load all user profile, tutor, and contributor data on mount
  useEffect(() => {
    if (!user) return;

    setUsernameInput(user.profile.username || '');
    setFormData({
      avatar: user.profile.avatar || '',
      name: user.profile.name || '',
      bio: user.profile.bio || '',
      title: user.profile.title || '',
      socialLinks: user.profile.socialLinks ? [...user.profile.socialLinks] : [],
      projects: user.profile.projects ? [...user.profile.projects] : [],
      activities: user.profile.activities ? [...user.profile.activities] : [],
      achievements: user.profile.achievements ? [...user.profile.achievements] : [],
      academicGrades: user.profile.academicGrades ? [...user.profile.academicGrades] : [],
      isPublic: user.profile.isPublic ?? true,
      pinnedItemId: user.profile.pinnedItemId || '',
      sectionVisibility: { ...(user.profile.sectionVisibility || {}) },
      sectionOrder: user.profile.sectionOrder
        ? [...user.profile.sectionOrder]
        : ['projects', 'activities', 'achievements', 'academicGrades'],
      theme: user.profile.theme ? { ...user.profile.theme } : undefined,
      spacing: user.profile.spacing || undefined,
      width: user.profile.width || undefined,
      sectionLayout: user.profile.sectionLayout || undefined,
    });

    // Load full profile details (including tutor & contributor info)
    actionGetFullProfile(user.profile.username, user.id).then((data) => {
      if (data.certifications) {
        setCerts(data.certifications);
      }
      if (data.tutorProfile) {
        setTelegramHandle(data.tutorProfile.telegram_handle || '');
        setHourlyRate(data.tutorProfile.hourly_rate || '');
        setInstitution(data.tutorProfile.institution || '');
        setSpecialization(data.tutorProfile.specialization || '');
        setTeachingSubjects(data.tutorProfile.teaching_subjects || []);
        setTeachingCurriculums(data.tutorProfile.teaching_curriculums || []);
        const availabilityMeta = parseTutorAvailability(data.tutorProfile.availability_slots);
        setAvailabilityStatus(availabilityMeta.status ?? 'available');
        setAvailabilityNote(availabilityMeta.note ?? '');
      } else {
        setTelegramHandle(user.profile.telegramHandle || user.profile.username || '');
      }

      if (data.contributorProfile) {
        setWebsiteUrl(data.contributorProfile.website_url || '');
        setGithubUrl(data.contributorProfile.github_url || '');
        setLinkedinUrl(data.contributorProfile.linkedin_url || '');
      }
    });
  }, [user]);

  // Live debounced username uniqueness checker
  useEffect(() => {
    if (!usernameInput || !user) return;
    const currentUsername = (user.profile.username || '').trim().toLowerCase();
    const cleanInput = usernameInput.trim().toLowerCase();

    if (cleanInput === currentUsername) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }

    if (cleanInput.length < 3) {
      setUsernameStatus('taken');
      setUsernameError('Must be at least 3 characters');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await actionCheckUsernameAvailable(cleanInput, user.id);
        if (res.available) {
          setUsernameStatus('available');
          setUsernameError(null);
        } else {
          setUsernameStatus('taken');
          setUsernameError(res.error || 'Username is not available');
        }
      } catch {
        setUsernameStatus('taken');
        setUsernameError('Could not verify availability');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [usernameInput, user]);

  // Avatar Upload Handlers
  const handleAvatarFile = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      setAvatarUploadError('Image size must be under 2MB.');
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setAvatarUploadError('Only JPEG and PNG images are supported.');
      return;
    }

    setAvatarUploading(true);
    setAvatarUploadError(null);
    const result = await uploadAvatar(file, user.id);
    setAvatarUploading(false);

    if (result.success && result.url) {
      setFormData((prev) => ({ ...prev, avatar: result.url }));
      await updateProfile({ avatar: result.url });
    } else {
      setAvatarUploadError(result.error || 'Failed to upload avatar.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAvatarFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setAvatarDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleAvatarFile(file);
  };

  const staffEligible = canHavePublicProfile(
    user?.profile.roles && user.profile.roles.length > 0
      ? user.profile.roles
      : [user?.profile.role ?? 'student']
  );

  const handleToggleSubject = (sub: string) => {
    if (teachingSubjects.includes(sub)) {
      setTeachingSubjects(teachingSubjects.filter((s) => s !== sub));
    } else {
      setTeachingSubjects([...teachingSubjects, sub]);
    }
  };

  const handleAddCustomSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (trimmed && !teachingSubjects.includes(trimmed)) {
      setTeachingSubjects([...teachingSubjects, trimmed]);
      setNewSubjectInput('');
    }
  };

  const handleToggleCurriculum = (curr: string) => {
    if (teachingCurriculums.includes(curr)) {
      setTeachingCurriculums(teachingCurriculums.filter((c) => c !== curr));
    } else {
      setTeachingCurriculums([...teachingCurriculums, curr]);
    }
  };

  // Array Manipulators for Portfolio Items
  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        { id: `proj_${Date.now()}`, title: '', description: '', technologies: [], order: prev.projects?.length || 0 },
      ],
    }));
  };

  const addActivity = () => {
    setFormData((prev) => ({
      ...prev,
      activities: [
        ...(prev.activities || []),
        { id: `act_${Date.now()}`, name: '', organization: '', role: '', start_date: '', order: prev.activities?.length || 0 },
      ],
    }));
  };

  const addAchievement = () => {
    setFormData((prev) => ({
      ...prev,
      achievements: [
        ...(prev.achievements || []),
        { id: `ach_${Date.now()}`, title: '', description: '', date: '', issuer: '', order: prev.achievements?.length || 0 },
      ],
    }));
  };

  const addGrade = () => {
    setFormData((prev) => ({
      ...prev,
      academicGrades: [
        ...(prev.academicGrades || []),
        { id: `grd_${Date.now()}`, title: '', description: '', fileUrl: '', order: prev.academicGrades?.length || 0 },
      ],
    }));
  };

  const handleAddCert = (data: {
    type: string;
    subject?: string | null;
    exam_board?: string | null;
    grade?: string | null;
    year?: number | null;
  }) => {
    const newCert: Certification = {
      id: `cert_${Date.now()}`,
      type: data.type,
      subject: data.subject || null,
      exam_board: data.exam_board || null,
      grade: data.grade || null,
      year: data.year || null,
      is_verified: false,
      is_hidden: false,
    };
    setCerts((prev) => [...prev, newCert]);
    return { success: true };
  };

  const handleUpdateCert = (certId: string, updates: Record<string, unknown>) => {
    setCerts((prev) => prev.map((c) => (c.id === certId ? { ...c, ...updates } : c)));
    return { success: true };
  };

  const handleDeleteCert = (certId: string) => {
    setCerts((prev) => prev.filter((c) => c.id !== certId));
    return { success: true };
  };

  const updateItem = (category: keyof Profile, index: number, field: string, value: any) => {
    setFormData((prev) => {
      const list = [...((prev[category] as any[]) || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [category]: list };
    });
  };

  const removeItem = (category: keyof Profile, index: number) => {
    setFormData((prev) => {
      const list = [...((prev[category] as any[]) || [])];
      list.splice(index, 1);
      return { ...prev, [category]: list };
    });
  };

  const PREDEFINED_PLATFORMS: { key: SocialPlatform; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { key: 'github', label: 'GitHub', icon: <Code2 className="h-4 w-4" />, placeholder: 'https://github.com/username' },
    { key: 'facebook', label: 'Facebook', icon: <Camera className="h-4 w-4" />, placeholder: 'https://facebook.com/username' },
    { key: 'instagram', label: 'Instagram', icon: <Camera className="h-4 w-4" />, placeholder: 'https://instagram.com/username' },
    { key: 'tiktok', label: 'TikTok', icon: <Music2 className="h-4 w-4" />, placeholder: 'https://tiktok.com/@username' },
    { key: 'website', label: 'Website', icon: <Globe className="h-4 w-4" />, placeholder: 'https://yoursite.com' },
  ];

  const getPlatformLink = (platform: SocialPlatform) => {
    return formData.socialLinks?.find((link) => link.platform === platform);
  };

  const setPlatformLink = (platform: SocialPlatform, url: string) => {
    setFormData((prev) => {
      const links = [...(prev.socialLinks || [])];
      const existing = links.findIndex((l) => l.platform === platform);
      const label = PREDEFINED_PLATFORMS.find((p) => p.key === platform)?.label || platform;
      if (existing >= 0) {
        if (url) {
          links[existing] = { ...links[existing], url, visible: true };
        } else {
          links.splice(existing, 1);
        }
      } else if (url) {
        links.push({ id: `soc_${Date.now()}`, platform, label, url, visible: true, order: links.length });
      }
      return { ...prev, socialLinks: links };
    });
  };

  // Unified Save Handler
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const cleanUsername = usernameInput.trim().toLowerCase();
      let finalUsername = user.profile.username;

      // 1. Update username if changed
      if (cleanUsername && cleanUsername !== user.profile.username.toLowerCase()) {
        const usernameRes = await actionUpdateUsername(user.id, cleanUsername);
        if (!usernameRes.success) {
          setUsernameError(usernameRes.error || 'Failed to update username');
          setSaveError(usernameRes.error || 'Failed to update username');
          setIsSaving(false);
          return;
        }
        finalUsername = cleanUsername;
      }

      // 2. Update display name if changed
      const cleanName = (formData.name || '').trim();
      if (cleanName && cleanName !== user.profile.name) {
        await actionUpdateDisplayName(user.id, cleanName);
      }

      // 3. Update core profile & portfolio metadata
      const cleanTelegram = telegramHandle.replace('@', '').trim();
      await updateProfile({
        name: cleanName || user.profile.name,
        username: finalUsername,
        title: (formData.title || '').trim(),
        bio: (formData.bio || '').trim(),
        socialLinks: formData.socialLinks || [],
        projects: formData.projects || [],
        activities: formData.activities || [],
        achievements: formData.achievements || [],
        academicGrades: formData.academicGrades || [],
        isPublic: staffEligible ? (formData.isPublic ?? true) : false,
        pinnedItemId: formData.pinnedItemId || undefined,
        sectionVisibility: formData.sectionVisibility,
        theme: formData.theme,
        telegramHandle: cleanTelegram,
        hourlyRate: hourlyRate.trim(),
        teachingCurriculums: teachingCurriculums,
        teachingSubjects: teachingSubjects,
      });

      // 4. Save Tutor Profile if user has Tutor/Admin role or filled tutor fields
      const certRes = await actionSyncCertifications(user.id, certs);
      if (!certRes.success) {
        setSaveError(certRes.error || 'Failed to save certifications');
        setIsSaving(false);
        return;
      }

      if (isTutor || isAdmin || cleanTelegram || teachingSubjects.length > 0) {
        const tutorRes = await actionUpdateTutorProfile(user.id, {
          telegram_handle: cleanTelegram,
          hourly_rate: hourlyRate.trim(),
          institution: institution.trim(),
          specialization: specialization.trim(),
          teaching_subjects: teachingSubjects,
          teaching_curriculums: teachingCurriculums,
          availability_slots: {
            status: availabilityStatus,
            note: availabilityNote.trim() || undefined,
          },
          is_active: availabilityStatus !== 'unavailable',
        });

        if (!tutorRes.success) {
          console.warn('[handleSave] Tutor profile update warning:', tutorRes.error);
        }
      }

      // 5. Save Contributor Profile if user has Contributor/Admin role or filled contributor fields
      if (isContributor || isAdmin || websiteUrl || githubUrl || linkedinUrl) {
        const contribRes = await actionUpdateContributorProfile(user.id, {
          website_url: websiteUrl.trim(),
          github_url: githubUrl.trim(),
          linkedin_url: linkedinUrl.trim(),
        });

        if (!contribRes.success) {
          console.warn('[handleSave] Contributor profile update warning:', contribRes.error);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setSaveError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Build unified sub-tabs list
  const subTabs = [
    { id: 'basic', label: 'Basic Info', icon: <User className="h-4 w-4" /> },
    ...(isTutor || isAdmin
      ? [
          {
            id: 'tutor' as const,
            label: 'Teaching & Schedule',
            icon: <GraduationCap className="h-4 w-4 text-emerald-500" />,
            badge: 'Tutor',
          },
        ]
      : []),
    ...(isContributor || isAdmin
      ? [
          {
            id: 'contributor' as const,
            label: 'Contributor Showcase',
            icon: <Pencil className="h-4 w-4 text-violet-500" />,
            badge: 'Creator',
          },
        ]
      : []),
    { id: 'social', label: 'Social Links', icon: <Link2 className="h-4 w-4" /> },
    { id: 'projects', label: 'Projects', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'activities', label: 'Activities & CCA', icon: <Globe className="h-4 w-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="h-4 w-4" /> },
    { id: 'grades', label: 'Academic Grades', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'certifications', label: 'Certifications', icon: <GraduationCap className="h-4 w-4" /> },
    { id: 'appearance', label: 'Appearance & Themes', icon: <LayoutTemplate className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Unified Header & Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-3xl bg-background-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
            🐜
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Profile &amp; Portfolio Editor
            </h1>
            <p className="text-xs text-foreground-muted">
              Configure your public profile, portfolio cards, and teaching schedule.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <a
            href={`/profile/${usernameInput || user?.profile?.username || 'me'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl border border-border bg-background-secondary text-xs font-semibold text-foreground hover:bg-background-secondary/80 transition-colors inline-flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Preview Live</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary-hover active:scale-98 transition-all cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saveSuccess ? 'Saved!' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Save Error Alert */}
      {saveError && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Combined Layout */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Unified Sub-tabs Sidebar */}
        <div className="flex md:flex-col gap-1 md:w-56 lg:w-64 shrink-0 overflow-x-auto pb-1 md:pb-0 -mx-1 px-1 scrollbar-none md:sticky md:top-4 md:self-start">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as SubTabId)}
              className={cn(
                'flex items-center justify-between gap-2 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 text-left',
                activeSubTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-foreground-muted hover:bg-background-secondary hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-2.5">
                {tab.icon}
                <span>{tab.label}</span>
              </div>
              {(tab as any).badge && (
                <span
                  className={cn(
                    'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0',
                    activeSubTab === tab.id
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-primary/10 text-primary border-primary/20'
                  )}
                >
                  {(tab as any).badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-background-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs min-h-[500px]">
          {/* 1. Basic Info */}
          {activeSubTab === 'basic' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-foreground">Basic Information</h2>

              {/* Avatar Upload */}
              <div className="p-4 rounded-2xl bg-background-secondary/50 border border-border flex flex-col sm:flex-row items-center gap-5">
                <div className="relative shrink-0">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar"
                      className="h-20 w-20 rounded-2xl object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {getInitials(formData.name || 'You')}
                    </div>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setAvatarDragOver(true);
                    }}
                    onDragLeave={() => setAvatarDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-3.5 text-center transition-all cursor-pointer',
                      avatarDragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-background-card'
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <p className="text-xs font-semibold text-foreground flex items-center justify-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      Click or drag new profile photo (Max 2MB)
                    </p>
                  </div>

                  {avatarUploadError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {avatarUploadError}
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Privacy / Visibility Toggle (staff roles only) */}
              {staffEligible && (
              <div className="p-4 rounded-2xl bg-background-secondary/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all',
                      formData.isPublic !== false
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    )}
                  >
                    {formData.isPublic !== false ? (
                      <Globe className="w-5 h-5" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-foreground">Profile Visibility</h3>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          formData.isPublic !== false
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        )}
                      >
                        {formData.isPublic !== false ? 'Public Profile' : 'Private Profile'}
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground-muted mt-0.5">
                      {formData.isPublic !== false
                        ? 'Your profile is public. It can be found in explore directories and viewed at your profile URL.'
                        : 'Your profile is private. Only you can view it when signed in. External visitors see a private profile message.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, isPublic: p.isPublic === false ? true : false }))}
                  className={cn(
                    'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-end sm:self-center',
                    formData.isPublic !== false ? 'bg-emerald-500' : 'bg-zinc-600'
                  )}
                  aria-label="Toggle profile visibility"
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                      formData.isPublic !== false ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
              )}

              {!staffEligible && (
                <div className="p-4 rounded-2xl bg-background-secondary/60 border border-border flex items-start gap-3">
                  <Lock className="w-5 h-5 text-foreground-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Student accounts are private</p>
                    <p className="text-[11px] text-foreground-muted mt-0.5">
                      Public profiles are available for tutors, contributors, and staff. Your portfolio edits are saved for your account only.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">Display Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Min Thaw Khant"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      Username <span className="text-foreground-muted font-normal">(@handle)</span>
                    </label>
                    {usernameStatus === 'checking' && (
                      <span className="text-[11px] text-foreground-muted flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" /> Checking...
                      </span>
                    )}
                    {usernameStatus === 'available' && (
                      <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Available
                      </span>
                    )}
                    {usernameStatus === 'taken' && (
                      <span className="text-[11px] text-destructive font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {usernameError || 'Taken'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) =>
                        setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      }
                      className={cn(
                        'w-full pl-8 pr-4 py-2.5 rounded-xl bg-background-secondary border text-xs font-mono text-foreground focus:outline-none focus:ring-2 transition-all',
                        usernameStatus === 'taken'
                          ? 'border-destructive focus:ring-destructive/20'
                          : usernameStatus === 'available'
                          ? 'border-emerald-500/50 focus:ring-emerald-500/20'
                          : 'border-border focus:ring-primary/20'
                      )}
                      placeholder="username"
                    />
                  </div>
                  <p className="text-[11px] text-foreground-muted mt-1">
                    Your public profile URL:{' '}
                    <code className="text-primary">/profile/{usernameInput || 'username'}</code>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">Headline / Subtitle</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Cambridge IGCSE Student & Tech Enthusiast"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">Bio</label>
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Tell the community about your academic interests and goals..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Teaching & Schedule (Tutor Section) */}
          {activeSubTab === 'tutor' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-500" />
                    Teaching Profile &amp; Weekly Schedule
                  </h2>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Configure your teaching credentials, hourly rate, and weekly booking availability.
                  </p>
                </div>
              </div>

              {/* Core Tutor Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-500" />
                    Telegram Handle <span className="text-foreground-muted font-normal">(@username)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted">
                      @
                    </span>
                    <input
                      type="text"
                      placeholder="telegram_username"
                      value={telegramHandle}
                      onChange={(e) => setTelegramHandle(e.target.value.replace('@', '').trim())}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <p className="text-[11px] text-foreground-muted mt-1">
                    Used for direct student class inquiries and QR code scanner on your public tutor profile.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    Hourly Teaching Rate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $25/hr or 35,000 MMK/hr"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-foreground-muted mt-1">
                    Displays your standard 1-on-1 or group session fee to prospective students.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-500" />
                    Institution / University
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. University of Yangon / Yangon University of Economics"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-violet-500" />
                    Specialization / Major
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pure Mathematics & IGCSE Physics"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Teaching Curriculums */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="text-xs font-bold text-foreground block">
                  Curriculums &amp; Exam Boards Taught
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CURRICULUMS.map((curr) => {
                    const isSelected = teachingCurriculums.includes(curr);
                    return (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => handleToggleCurriculum(curr)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-background-secondary text-foreground-muted border-border hover:text-foreground'
                        )}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {curr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teaching Subjects */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="text-xs font-bold text-foreground block">Subjects Taught</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_SUBJECTS.map((sub) => {
                    const isSelected = teachingSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleToggleSubject(sub)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                          isSelected
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                            : 'bg-background-secondary text-foreground-muted border-border hover:text-foreground'
                        )}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {sub}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Subject */}
                <div className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    placeholder="Add other subject..."
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSubject();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Availability status (replaces weekly schedule grid) */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    Teaching Availability Status
                  </h3>
                  <p className="text-[11px] text-foreground-muted">
                    Shown on your public tutor profile so students know if you are accepting inquiries.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {([
                    ['available', 'Available', 'Accepting new students'],
                    ['limited', 'Limited', 'Limited slots — contact first'],
                    ['unavailable', 'Unavailable', 'Not taking new inquiries'],
                  ] as const).map(([value, label, hint]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAvailabilityStatus(value)}
                      className={cn(
                        'p-4 rounded-2xl border text-left transition-all cursor-pointer',
                        availabilityStatus === value
                          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                          : 'border-border bg-background-secondary hover:border-primary/30'
                      )}
                    >
                      <p className="text-xs font-bold text-foreground">{label}</p>
                      <p className="text-[11px] text-foreground-muted mt-1">{hint}</p>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">Optional note</label>
                  <input
                    type="text"
                    value={availabilityNote}
                    onChange={(e) => setAvailabilityNote(e.target.value)}
                    placeholder="e.g. Available on weekday evenings only"
                    className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Contributor Showcase (Creator Section) */}
          {activeSubTab === 'contributor' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-violet-500" />
                  Academic Contributor Showcase
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Showcase your academic author credentials, verified publications, and creator links.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-700 dark:text-violet-300 flex items-start gap-3">
                <Shield className="w-5 h-5 shrink-0 mt-0.5 text-violet-500" />
                <div className="space-y-1">
                  <p className="font-bold">Verified Academic Creator</p>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    As an authorized contributor, notes and syllabus summaries you publish appear directly in
                    The ANTS Resource Library for thousands of students.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    Portfolio / Personal Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourportfolio.dev"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/yourhandle"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-blue-500" />
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/yourhandle"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Social Links */}
          {activeSubTab === 'social' && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-foreground">Social &amp; Contact Links</h2>
              <div className="space-y-3">
                {PREDEFINED_PLATFORMS.map((platform) => {
                  const existingLink = getPlatformLink(platform.key);
                  return (
                    <div key={platform.key} className="flex items-center gap-3">
                      <span className="w-24 text-xs font-semibold text-foreground-muted flex items-center gap-1.5">
                        {platform.icon}
                        {platform.label}
                      </span>
                      <input
                        type="text"
                        placeholder={platform.placeholder}
                        value={existingLink?.url || ''}
                        onChange={(e) => setPlatformLink(platform.key, e.target.value.trim())}
                        className="flex-1 px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Projects */}
          {activeSubTab === 'projects' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Projects &amp; Portfolio</h2>
                <button
                  type="button"
                  onClick={addProject}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>
              <div className="space-y-4">
                {(formData.projects || []).map((proj, idx) => (
                  <div key={proj.id} className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Project #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeItem('projects', idx)}
                        className="text-destructive/80 hover:text-destructive text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={proj.title}
                      onChange={(e) => updateItem('projects', idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-background-card border border-border rounded-xl"
                    />
                    <textarea
                      placeholder="Project Description..."
                      value={proj.description}
                      onChange={(e) => updateItem('projects', idx, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-background-card border border-border rounded-xl resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Activities */}
          {activeSubTab === 'activities' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Activities &amp; Leadership</h2>
                <button
                  type="button"
                  onClick={addActivity}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Activity
                </button>
              </div>
              <div className="space-y-4">
                {(formData.activities || []).map((act, idx) => (
                  <div key={act.id} className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Activity #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeItem('activities', idx)}
                        className="text-destructive/80 hover:text-destructive text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Activity / Organization"
                        value={act.name}
                        onChange={(e) => updateItem('activities', idx, 'name', e.target.value)}
                        className="px-3 py-2 text-xs bg-background-card border border-border rounded-xl"
                      />
                      <input
                        type="text"
                        placeholder="Role (e.g. President / Member)"
                        value={act.role}
                        onChange={(e) => updateItem('activities', idx, 'role', e.target.value)}
                        className="px-3 py-2 text-xs bg-background-card border border-border rounded-xl"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Achievements */}
          {activeSubTab === 'achievements' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Achievements &amp; Honors</h2>
                <button
                  type="button"
                  onClick={addAchievement}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Award
                </button>
              </div>
              <div className="space-y-4">
                {(formData.achievements || []).map((ach, idx) => (
                  <div key={ach.id} className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Achievement #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeItem('achievements', idx)}
                        className="text-destructive/80 hover:text-destructive text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Award Title"
                      value={ach.title}
                      onChange={(e) => updateItem('achievements', idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-background-card border border-border rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Grades */}
          {activeSubTab === 'grades' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Academic Grades</h2>
                <button
                  type="button"
                  onClick={addGrade}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Result
                </button>
              </div>
              <div className="space-y-4">
                {(formData.academicGrades || []).map((grd, idx) => (
                  <div key={grd.id} className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Grade #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeItem('academicGrades', idx)}
                        className="text-destructive/80 hover:text-destructive text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Cambridge IGCSE Pure Math (Grade A*)"
                      value={grd.title}
                      onChange={(e) => updateItem('academicGrades', idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-background-card border border-border rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. Certifications */}
          {activeSubTab === 'certifications' && (
            <div className="space-y-5 animate-fade-in">
              <CertificationEditor
                certifications={certs}
                onAdd={handleAddCert}
                onUpdate={handleUpdateCert}
                onDelete={handleDeleteCert}
              />
            </div>
          )}

          {/* 10. Appearance & Themes */}
          {activeSubTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-foreground">Theme &amp; Color Presets</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PROFILE_THEME_PRESETS.map((preset) => {
                  const isSelected = (formData.theme?.preset || 'default') === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, theme: { preset: preset.key } }))}
                      className={cn(
                        'p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-2',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                          : 'border-border bg-background-secondary hover:border-primary/40'
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                        <span className="text-xs font-semibold text-foreground">{preset.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Save & Preview Action Bar */}
          <div className="mt-8 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <a
              href={`/profile/${usernameInput || user?.profile?.username || 'me'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-foreground-muted hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              View Live Public Profile ↗
            </a>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary-hover active:scale-98 transition-all cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saveSuccess ? 'Changes Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
