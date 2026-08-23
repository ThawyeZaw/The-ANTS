'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Advanced Profile Editor (Consolidated 2-Tab System)
// Tab 1: Profile Editor (Personal & Student Portfolio, Appearance, Themes)
// Tab 2: Tutor & Contributor Profile (Teaching Schedule, Telegram, Credentials)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
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
import TutorContributorEditor from './TutorContributorEditor';
import { uploadAvatar } from '@/lib/avatar-upload';
import {
  actionGetFullProfile,
  actionCheckUsernameAvailable,
  actionUpdateUsername,
  actionUpdateDisplayName,
} from '@/actions/profile';

type MainTab = 'profile' | 'role-profile';
type SubTabId = 'basic' | 'social' | 'projects' | 'activities' | 'achievements' | 'grades' | 'certifications' | 'appearance';

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

export default function AdvancedProfileEditor() {
  const { user, updateProfile } = useAuth();
  const { isTutor, isContributor, isAdmin } = useRole();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') === 'role-profile' && (isTutor || isContributor || isAdmin)
    ? 'role-profile'
    : 'profile';

  const [mainTab, setMainTab] = useState<MainTab>(initialTab);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'role-profile' && (isTutor || isContributor || isAdmin)) {
      setMainTab('role-profile');
    }
  }, [searchParams, isTutor, isContributor, isAdmin]);

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

  useEffect(() => {
    if (user) {
      setUsernameInput(user.profile.username || '');
      setFormData({
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
        sectionOrder: user.profile.sectionOrder ? [...user.profile.sectionOrder] : ['projects', 'activities', 'achievements', 'academicGrades'],
        theme: user.profile.theme ? { ...user.profile.theme } : undefined,
        spacing: user.profile.spacing || undefined,
        width: user.profile.width || undefined,
        sectionLayout: user.profile.sectionLayout || undefined,
      });

      // Load certifications via action
      actionGetFullProfile(user.profile.username).then((data) => {
        if (data.certifications) {
          setCerts(data.certifications);
        }
      });
    }
  }, [user]);

  // Live debounced username uniqueness checker
  useEffect(() => {
    if (!usernameInput || !user) return;
    const currentUsername = (user.profile.username || '').trim().toLowerCase();
    const cleanInput = usernameInput.trim().toLowerCase();

    // If input matches user's current username, it's their own handle (valid)
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

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const cleanUsername = usernameInput.trim().toLowerCase();
      let finalUsername = user.profile.username;

      // 1. Update username if changed
      if (cleanUsername && cleanUsername !== user.profile.username.toLowerCase()) {
        const usernameRes = await actionUpdateUsername(user.id, cleanUsername);
        if (!usernameRes.success) {
          setUsernameError(usernameRes.error || 'Failed to update username');
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

      // 3. Update profile fields in context/db
      await updateProfile({
        ...formData,
        name: cleanName || user.profile.name,
        username: finalUsername,
        isPublic: formData.isPublic !== false,
      });

      setUsernameInput(finalUsername);
      setUsernameStatus('idle');
      setUsernameError(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar Upload Handlers
  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Please select an image file (JPEG, PNG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarUploadError('Image size must be under 2MB.');
      return;
    }

    setAvatarUploading(true);
    setAvatarUploadError(null);

    const result = await uploadAvatar(file, user?.id || 'user');
    setAvatarUploading(false);

    if (result.success && result.url) {
      setFormData((prev) => ({ ...prev, avatar: result.url }));
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

  // Array Manipulators
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

  const subTabs = [
    { id: 'basic', label: 'Basic Info', icon: <User className="h-4 w-4" /> },
    { id: 'social', label: 'Social Links', icon: <Link2 className="h-4 w-4" /> },
    { id: 'projects', label: 'Projects', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'activities', label: 'Activities & CCA', icon: <Globe className="h-4 w-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="h-4 w-4" /> },
    { id: 'grades', label: 'Academic Grades', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'certifications', label: 'Certifications', icon: <GraduationCap className="h-4 w-4" /> },
    { id: 'appearance', label: 'Appearance & Themes', icon: <LayoutTemplate className="h-4 w-4" /> },
  ];

  const hasRoleProfile = isTutor || isContributor || isAdmin;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Tab Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-background-card border border-border shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {hasRoleProfile ? (
            <>
              <button
                type="button"
                onClick={() => setMainTab('profile')}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  mainTab === 'profile'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
                )}
              >
                <User className="w-4 h-4" />
                1. Profile & Portfolio
              </button>

              <button
                type="button"
                onClick={() => setMainTab('role-profile')}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  mainTab === 'role-profile'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
                )}
              >
                <GraduationCap className="w-4 h-4" />
                2. Tutor & Contributor Profile
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-foreground">
              <User className="w-4 h-4 text-primary" />
              <span>Personal & Academic Profile</span>
            </div>
          )}
        </div>

        {mainTab === 'profile' && (
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
        )}
      </div>

      {/* Main Tab 2: Tutor & Contributor Editor */}
      {mainTab === 'role-profile' && <TutorContributorEditor />}

      {/* Main Tab 1: Standard Profile Editor */}
      {mainTab === 'profile' && (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Sub-tabs Sidebar */}
          <div className="flex md:flex-col gap-1 md:w-56 lg:w-64 shrink-0 overflow-x-auto pb-1 md:pb-0 -mx-1 px-1 scrollbar-none md:sticky md:top-4 md:self-start">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as SubTabId)}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 text-left',
                  activeSubTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-foreground-muted hover:bg-background-secondary hover:text-foreground'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Sub-tab Content Area */}
          <div className="flex-1 bg-background-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs min-h-[500px]">
            {/* Basic Info */}
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

                {/* Profile Privacy / Visibility Toggle */}
                <div className="p-4 rounded-2xl bg-background-secondary/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all',
                      formData.isPublic !== false
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    )}>
                      {formData.isPublic !== false ? (
                        <Globe className="w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-foreground">Profile Visibility</h3>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          formData.isPublic !== false
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        )}>
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
                      Your public profile URL: <code className="text-primary">/profile/{usernameInput || 'username'}</code>
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

            {/* Social Links */}
            {activeSubTab === 'social' && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-lg font-bold text-foreground">Social & Contact Links</h2>
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

            {/* Projects */}
            {activeSubTab === 'projects' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Projects & Portfolio</h2>
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

            {/* Activities */}
            {activeSubTab === 'activities' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Activities & Leadership</h2>
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
                          placeholder="Activity / Club Name"
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

            {/* Achievements */}
            {activeSubTab === 'achievements' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Achievements & Honors</h2>
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

            {/* Grades */}
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

            {/* Certifications */}
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

            {/* Appearance & Themes */}
            {activeSubTab === 'appearance' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-lg font-bold text-foreground">Theme & Color Presets</h2>
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
      )}
    </div>
  );
}
