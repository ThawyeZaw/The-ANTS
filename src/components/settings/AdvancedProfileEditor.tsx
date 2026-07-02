'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  User,
  Briefcase,
  FileText,
  Globe,
  Award,
  BookOpen,
  Settings,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Check,
  LayoutTemplate,
  Link2,
  Code2,
  Camera,
  Music2,
  X,
} from 'lucide-react';
import {
  Profile,
  ProjectEntry,
  ActivityEntry,
  AchievementEntry,
  AcademicGradeEntry,
  SocialLinkItem,
  SocialPlatform,
  PROFILE_THEME_PRESETS,
  type ProfileTheme,
  type ProfileSpacing,
  type ProfileWidth,
  type ProfileSectionLayout,
} from '@/types';
import { PRESET_AVATARS, makePresetAvatarKey, isPresetAvatar } from '@/constants/avatars';
import AvatarImage from '@/components/ui/AvatarImage';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type TabId = 'basic' | 'social' | 'projects' | 'activities' | 'achievements' | 'grades' | 'appearance' | 'settings';

export default function AdvancedProfileEditor() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<Partial<Profile>>({});
  
  useEffect(() => {
    if (user) {
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
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);

    // Filter out empties from lists and ensure IDs
    const ensureIdAndSort = (arr: any[]) => {
      return arr.map((item, index) => ({
        ...item,
        id: item.id || `id_${Math.random().toString(36).substring(2, 9)}`,
        order: index
      })).sort((a, b) => (a.order || 0) - (b.order || 0));
    };

    const updatedData = {
      ...formData,
      socialLinks: (formData.socialLinks || []).map((item, index) => ({
        ...item,
        order: index,
      })),
      projects: ensureIdAndSort(formData.projects || []),
      activities: ensureIdAndSort(formData.activities || []),
      achievements: ensureIdAndSort(formData.achievements || []),
      academicGrades: ensureIdAndSort(formData.academicGrades || [])
    };

    const result = await updateProfile(updatedData);

    setIsSaving(false);
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (!user) return null;

  // --- Handlers for list updates ---
  
  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...(prev.projects || []), { id: `proj_${Date.now()}`, title: '', description: '', role: '', technologies: [], links: {}, order: (prev.projects?.length || 0) }]
    }));
  };

  const addActivity = () => {
    setFormData(prev => ({
      ...prev,
      activities: [...(prev.activities || []), { id: `act_${Date.now()}`, name: '', organization: '', role: '', start_date: '', order: (prev.activities?.length || 0) }]
    }));
  };

  const addAchievement = () => {
    setFormData(prev => ({
      ...prev,
      achievements: [...(prev.achievements || []), { id: `ach_${Date.now()}`, title: '', description: '', date: '', issuer: '', order: (prev.achievements?.length || 0) }]
    }));
  };
  
  const addGrade = () => {
    setFormData(prev => ({
      ...prev,
      academicGrades: [...(prev.academicGrades || []), { id: `grd_${Date.now()}`, title: '', description: '', fileUrl: '', order: (prev.academicGrades?.length || 0) }]
    }));
  };

  const updateItem = (category: keyof Profile, index: number, field: string, value: any) => {
    setFormData(prev => {
      const list = [...(prev[category] as any[] || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [category]: list };
    });
  };

  const removeItem = (category: keyof Profile, index: number) => {
    setFormData(prev => {
      const list = [...(prev[category] as any[] || [])];
      list.splice(index, 1);
      return { ...prev, [category]: list };
    });
  };

  const moveItem = (category: keyof Profile, index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const list = [...(prev[category] as any[] || [])];
      if (direction === 'up' && index > 0) {
        const temp = list[index];
        list[index] = list[index - 1];
        list[index - 1] = temp;
      } else if (direction === 'down' && index < list.length - 1) {
        const temp = list[index];
        list[index] = list[index + 1];
        list[index + 1] = temp;
      }
      
      // Update order field
      list.forEach((item, i) => item.order = i);
      
      return { ...prev, [category]: list };
    });
  };

  // ── Social Link Handlers ──────────────────────────────────────────────────

  /** Predefined platform keys and their display info */
  const PREDEFINED_PLATFORMS: { key: SocialPlatform; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { key: 'github', label: 'GitHub', icon: <Code2 className="h-4 w-4" />, placeholder: 'https://github.com/username' },
    { key: 'facebook', label: 'Facebook', icon: <Camera className="h-4 w-4" />, placeholder: 'https://facebook.com/username' },
    { key: 'instagram', label: 'Instagram', icon: <Camera className="h-4 w-4" />, placeholder: 'https://instagram.com/username' },
    { key: 'tiktok', label: 'TikTok', icon: <Music2 className="h-4 w-4" />, placeholder: 'https://tiktok.com/@username' },
    { key: 'website', label: 'Website', icon: <Globe className="h-4 w-4" />, placeholder: 'https://yoursite.com' },
  ];

  /** Check if a predefined platform link already exists */
  const hasPlatformLink = (platform: SocialPlatform) => {
    return formData.socialLinks?.some(link => link.platform === platform && link.url);
  };

  /** Get an existing predefined platform link */
  const getPlatformLink = (platform: SocialPlatform) => {
    return formData.socialLinks?.find(link => link.platform === platform);
  };

  /** Add or update a predefined platform link */
  const setPlatformLink = (platform: SocialPlatform, url: string) => {
    setFormData(prev => {
      const links = [...(prev.socialLinks || [])];
      const existing = links.findIndex(l => l.platform === platform);
      const label = PREDEFINED_PLATFORMS.find(p => p.key === platform)?.label || platform;
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

  /** Toggle visibility of a social link */
  const toggleSocialVisibility = (index: number) => {
    setFormData(prev => {
      const links = [...(prev.socialLinks || [])];
      if (links[index]) {
        links[index] = { ...links[index], visible: !links[index].visible };
      }
      return { ...prev, socialLinks: links };
    });
  };

  /** Remove a social link */
  const removeSocialLink = (index: number) => {
    setFormData(prev => {
      const links = [...(prev.socialLinks || [])];
      links.splice(index, 1);
      return { ...prev, socialLinks: links };
    });
  };

  /** Add a custom social link */
  const addCustomLink = () => {
    setFormData(prev => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), { id: `sl_${Date.now()}`, platform: 'custom', label: '', url: '', visible: true, order: (prev.socialLinks?.length || 0) }],
    }));
  };

  /** Update a custom social link field */
  const updateCustomLink = (index: number, field: 'label' | 'url', value: string) => {
    setFormData(prev => {
      const links = [...(prev.socialLinks || [])];
      if (links[index] && links[index].platform === 'custom') {
        links[index] = { ...links[index], [field]: value };
      }
      return { ...prev, socialLinks: links };
    });
  };

  // ── Section Order Handlers ────────────────────────────────────────────────

  const SECTION_OPTIONS = [
    { key: 'projects', label: 'Projects', icon: <Briefcase className="h-4 w-4" /> },
    { key: 'activities', label: 'Activities', icon: <Globe className="h-4 w-4" /> },
    { key: 'achievements', label: 'Achievements', icon: <Award className="h-4 w-4" /> },
    { key: 'academicGrades', label: 'Academic Grades', icon: <BookOpen className="h-4 w-4" /> },
  ];

  const moveSection = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const order = [...(prev.sectionOrder || ['projects', 'activities', 'achievements', 'academicGrades'])];
      if (direction === 'up' && index > 0) {
        [order[index], order[index - 1]] = [order[index - 1], order[index]];
      } else if (direction === 'down' && index < order.length - 1) {
        [order[index], order[index + 1]] = [order[index + 1], order[index]];
      }
      return { ...prev, sectionOrder: order };
    });
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <User className="h-4 w-4" /> },
    { id: 'social', label: 'Social Links', icon: <Link2 className="h-4 w-4" /> },
    { id: 'projects', label: 'Projects', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'activities', label: 'Activities', icon: <Globe className="h-4 w-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="h-4 w-4" /> },
    { id: 'grades', label: 'Grades', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <LayoutTemplate className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> }
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 shrink-0 space-y-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-foreground-secondary hover:bg-background-secondary hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor Content */}
      <div className="flex-1 bg-background-card border border-border rounded-2xl p-6 shadow-sm min-h-[600px] flex flex-col">
        <div className="flex-1">
          {activeTab === 'basic' && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-bold text-foreground mb-4">Basic Information</h2>
              
              {/* Avatar Picker */}
              <div className="mb-6 pb-6 border-b border-border">
                <label className="text-sm font-medium text-foreground-muted mb-3 block">Avatar</label>
                <div className="flex items-start gap-6">
                  <AvatarImage avatar={formData.avatar || ''} name={formData.name || 'You'} size="xl" />
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-8 gap-2 mb-3">
                      {PRESET_AVATARS.map(preset => {
                        const presetKey = makePresetAvatarKey(preset.key);
                        const isSelected = formData.avatar === presetKey;
                        return (
                          <button
                            key={preset.key}
                            onClick={() => setFormData(p => ({ ...p, avatar: presetKey }))}
                            className={`relative p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${
                              isSelected
                                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                : 'border-border hover:border-foreground-muted bg-background-secondary'
                            }`}
                            title={preset.name}
                          >
                            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${preset.gradient} flex items-center justify-center text-xl`}>
                              {preset.emoji}
                            </div>
                            <span className="text-[10px] text-foreground-muted truncate w-full text-center">{preset.name}</span>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-foreground-muted font-medium">OR</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="mt-3">
                      <label className="text-xs text-foreground-muted block mb-1.5">Custom Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.avatar && !isPresetAvatar(formData.avatar) ? formData.avatar : ''}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setFormData(p => ({ ...p, avatar: val || '' }));
                          }}
                          className="flex-1 px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono text-xs"
                          placeholder="https://example.com/avatar.jpg"
                        />
                        {formData.avatar && !isPresetAvatar(formData.avatar) && (
                          <button
                            onClick={() => setFormData(p => ({ ...p, avatar: '' }))}
                            className="px-3 py-2 rounded-lg border border-border text-foreground-muted hover:text-error transition-colors text-sm cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground-muted mb-1.5 block">Display Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground-muted mb-1.5 block">Title / Headline</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground"
                    placeholder="e.g. Science Enthusiast & Tutor"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground-muted mb-1.5 block">Bio</label>
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground resize-none"
                    placeholder="Tell everyone a bit about yourself..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-bold text-foreground mb-4">Social Links</h2>
              <p className="text-sm text-foreground-muted mb-6 -mt-3">
                Connect your social accounts and choose which ones appear on your public profile.
              </p>

              {/* Predefined Platforms */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider">Platforms</h3>
                {PREDEFINED_PLATFORMS.map(platform => {
                  const existingLink = getPlatformLink(platform.key);
                  const currentUrl = existingLink?.url || '';
                  const isVisible = existingLink?.visible !== false;
                  const hasValue = !!currentUrl;
                  const linkIndex = formData.socialLinks?.findIndex(l => l.platform === platform.key) ?? -1;

                  return (
                    <div key={platform.key} className="flex items-center gap-3 p-3 rounded-xl bg-background-secondary border border-border">
                      <div className="text-foreground-muted shrink-0">{platform.icon}</div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-medium text-foreground-muted block mb-1">{platform.label}</label>
                        <input
                          type="url"
                          value={currentUrl}
                          onChange={(e) => setPlatformLink(platform.key, e.target.value)}
                          placeholder={platform.placeholder}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {hasValue && (
                          <>
                            <button
                              onClick={() => toggleSocialVisibility(linkIndex)}
                              className={`p-2 rounded-lg border transition-colors cursor-pointer ${isVisible ? 'border-primary/30 text-primary bg-primary/5' : 'border-border text-foreground-muted bg-background'}`}
                              title={isVisible ? 'Visible on profile' : 'Hidden on profile'}
                            >
                              {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => removeSocialLink(linkIndex)}
                              className="p-2 rounded-lg border border-border text-error/70 hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                              title="Remove link"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Links */}
              <div className="pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider">Custom Links</h3>
                  <button onClick={addCustomLink} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                    <Plus className="h-4 w-4" /> Add Link
                  </button>
                </div>
                {formData.socialLinks?.filter(l => l.platform === 'custom').length === 0 ? (
                  <p className="text-sm text-foreground-muted text-center py-6 border border-dashed border-border rounded-xl">
                    No custom links yet. Add links to your portfolio, Medium, YouTube, or any other profile.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.socialLinks?.filter(l => l.platform === 'custom').map((link, customIdx) => {
                      const globalIdx = formData.socialLinks?.findIndex(l => l.id === link.id) ?? 0;
                      return (
                        <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-background-secondary border border-border">
                          <div className="flex flex-col gap-1 items-center text-foreground-muted">
                            <button
                              onClick={() => moveSection(customIdx, 'up')}
                              disabled={customIdx === 0}
                              className="p-0.5 hover:text-foreground disabled:opacity-30 cursor-pointer text-xs"
                            >▲</button>
                            <GripVertical className="h-3 w-3" />
                            <button
                              onClick={() => moveSection(customIdx, 'down')}
                              disabled={customIdx === (formData.socialLinks?.filter(l => l.platform === 'custom').length || 0) - 1}
                              className="p-0.5 hover:text-foreground disabled:opacity-30 cursor-pointer text-xs"
                            >▼</button>
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => updateCustomLink(globalIdx, 'label', e.target.value)}
                              placeholder="Label (e.g. YouTube, Medium)"
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            />
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => updateCustomLink(globalIdx, 'url', e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                            />
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => toggleSocialVisibility(globalIdx)}
                              className={`p-2 rounded-lg border transition-colors cursor-pointer ${link.visible ? 'border-primary/30 text-primary bg-primary/5' : 'border-border text-foreground-muted bg-background'}`}
                              title={link.visible ? 'Visible on profile' : 'Hidden on profile'}
                            >
                              {link.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => removeSocialLink(globalIdx)}
                              className="p-2 rounded-lg border border-border text-error/70 hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                              title="Remove link"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Projects</h2>
                <button onClick={addProject} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  <Plus className="h-4 w-4" /> Add Project
                </button>
              </div>
              {formData.projects?.map((proj, idx) => (
                <PortfolioItemEditor
                  key={proj.id}
                  index={idx}
                  total={formData.projects?.length || 0}
                  isHidden={proj.isHidden}
                  onMove={(dir) => moveItem('projects', idx, dir)}
                  onRemove={() => removeItem('projects', idx)}
                  onToggleVisibility={() => updateItem('projects', idx, 'isHidden', !proj.isHidden)}
                >
                  <div className="grid gap-3">
                    <input type="text" value={proj.title} onChange={e => updateItem('projects', idx, 'title', e.target.value)} placeholder="Project Title" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-medium text-foreground" />
                    <textarea value={proj.description} onChange={e => updateItem('projects', idx, 'description', e.target.value)} placeholder="Description" rows={2} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground resize-none" />
                    <div className="flex gap-3">
                       <input type="text" value={proj.role || ''} onChange={e => updateItem('projects', idx, 'role', e.target.value)} placeholder="Your Role" className="w-1/2 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground" />
                       <input type="text" value={proj.technologies?.join(', ') || ''} onChange={e => updateItem('projects', idx, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Tech Stack (comma separated)" className="w-1/2 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground" />
                    </div>
                  </div>
                </PortfolioItemEditor>
              ))}
              {formData.projects?.length === 0 && <p className="text-sm text-foreground-muted text-center py-8 border border-dashed border-border rounded-xl">No projects added yet.</p>}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Activities & CCA</h2>
                <button onClick={addActivity} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  <Plus className="h-4 w-4" /> Add Activity
                </button>
              </div>
              {formData.activities?.map((act, idx) => (
                <PortfolioItemEditor
                  key={act.id}
                  index={idx}
                  total={formData.activities?.length || 0}
                  isHidden={act.isHidden}
                  onMove={(dir) => moveItem('activities', idx, dir)}
                  onRemove={() => removeItem('activities', idx)}
                  onToggleVisibility={() => updateItem('activities', idx, 'isHidden', !act.isHidden)}
                >
                  <div className="grid gap-3">
                    <input type="text" value={act.name} onChange={e => updateItem('activities', idx, 'name', e.target.value)} placeholder="Activity Name" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-medium text-foreground" />
                    <div className="flex gap-3">
                       <input type="text" value={act.organization} onChange={e => updateItem('activities', idx, 'organization', e.target.value)} placeholder="Organization" className="w-1/2 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground" />
                       <input type="text" value={act.role} onChange={e => updateItem('activities', idx, 'role', e.target.value)} placeholder="Role" className="w-1/2 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground" />
                    </div>
                    <textarea value={act.description || ''} onChange={e => updateItem('activities', idx, 'description', e.target.value)} placeholder="Description (Optional)" rows={2} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground resize-none" />
                  </div>
                </PortfolioItemEditor>
              ))}
               {formData.activities?.length === 0 && <p className="text-sm text-foreground-muted text-center py-8 border border-dashed border-border rounded-xl">No activities added yet.</p>}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Achievements</h2>
                <button onClick={addAchievement} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  <Plus className="h-4 w-4" /> Add Achievement
                </button>
              </div>
              {formData.achievements?.map((ach, idx) => (
                <PortfolioItemEditor
                  key={ach.id}
                  index={idx}
                  total={formData.achievements?.length || 0}
                  isHidden={ach.isHidden}
                  onMove={(dir) => moveItem('achievements', idx, dir)}
                  onRemove={() => removeItem('achievements', idx)}
                  onToggleVisibility={() => updateItem('achievements', idx, 'isHidden', !ach.isHidden)}
                >
                  <div className="grid gap-3">
                    <input type="text" value={ach.title} onChange={e => updateItem('achievements', idx, 'title', e.target.value)} placeholder="Achievement Title" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-medium text-foreground" />
                    <textarea value={ach.description || ''} onChange={e => updateItem('achievements', idx, 'description', e.target.value)} placeholder="Description (Optional)" rows={2} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground resize-none" />
                    <div className="flex gap-3">
                       <input type="text" value={ach.issuer || ''} onChange={e => updateItem('achievements', idx, 'issuer', e.target.value)} placeholder="Issuer (Optional)" className="w-1/2 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground" />
                       <input type="text" value={ach.date || ''} onChange={e => updateItem('achievements', idx, 'date', e.target.value)} placeholder="Date (e.g. 2024)" className="w-1/2 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground" />
                    </div>
                  </div>
                </PortfolioItemEditor>
              ))}
               {formData.achievements?.length === 0 && <p className="text-sm text-foreground-muted text-center py-8 border border-dashed border-border rounded-xl">No achievements added yet.</p>}
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Academic Grades & Certificates</h2>
                <button onClick={addGrade} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  <Plus className="h-4 w-4" /> Add Grade
                </button>
              </div>
              {formData.academicGrades?.map((grade, idx) => (
                <PortfolioItemEditor
                  key={grade.id}
                  index={idx}
                  total={formData.academicGrades?.length || 0}
                  isHidden={grade.isHidden}
                  onMove={(dir) => moveItem('academicGrades', idx, dir)}
                  onRemove={() => removeItem('academicGrades', idx)}
                  onToggleVisibility={() => updateItem('academicGrades', idx, 'isHidden', !grade.isHidden)}
                >
                  <div className="grid gap-3">
                    <input type="text" value={grade.title} onChange={e => updateItem('academicGrades', idx, 'title', e.target.value)} placeholder="Grade Title (e.g. IGCSE Results)" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-medium text-foreground" />
                    <input type="text" value={grade.fileUrl} onChange={e => updateItem('academicGrades', idx, 'fileUrl', e.target.value)} placeholder="PDF or Image URL" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground" />
                    <textarea value={grade.description || ''} onChange={e => updateItem('academicGrades', idx, 'description', e.target.value)} placeholder="Details (e.g. 8 A* 1 A)" rows={2} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground resize-none" />
                  </div>
                </PortfolioItemEditor>
              ))}
               {formData.academicGrades?.length === 0 && <p className="text-sm text-foreground-muted text-center py-8 border border-dashed border-border rounded-xl">No academic grades added yet.</p>}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-foreground mb-4">Appearance</h2>
              <p className="text-sm text-foreground-muted -mt-4 mb-2">
                Customize how your public profile looks and feels. Choose a theme, layout, and spacing.
              </p>

              {/* Theme Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider">Theme</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PROFILE_THEME_PRESETS.map(preset => {
                    const isActive = (formData.theme?.preset || 'default') === preset.key;
                    return (
                      <button
                        key={preset.key}
                        onClick={() => setFormData(p => ({ ...p, theme: { ...(p.theme || {}), preset: preset.key } }))}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-foreground-muted'
                        }`}
                        style={{ backgroundColor: preset.colors.card }}
                      >
                        <div className="flex gap-1.5 mb-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors.accent }} />
                          <div className="w-3 h-3 rounded-full bg-white/10" />
                          <div className="w-3 h-3 rounded-full bg-white/5" />
                        </div>
                        <p className="text-xs font-medium text-left" style={{ color: preset.colors.accent }}>
                          {preset.name}
                        </p>
                        {isActive && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Custom Color Overrides */}
                <div className="p-4 rounded-xl bg-background-secondary border border-border">
                  <h4 className="text-sm font-medium text-foreground mb-3">Custom Override (Optional)</h4>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-foreground-muted block mb-1.5">Accent Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={formData.theme?.accentColor || PROFILE_THEME_PRESETS.find(p => p.key === (formData.theme?.preset || 'default'))?.colors.accent || '#6366f1'}
                          onChange={(e) => setFormData(p => ({ ...p, theme: { ...(p.theme || { preset: 'default' }), accentColor: e.target.value } }))}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={formData.theme?.accentColor || ''}
                          onChange={(e) => setFormData(p => ({ ...p, theme: { ...(p.theme || { preset: 'default' }), accentColor: e.target.value || undefined } }))}
                          placeholder="Hex color (e.g. #ff6b6b)"
                          className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-foreground-muted block mb-1.5">Background Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={formData.theme?.backgroundColor || PROFILE_THEME_PRESETS.find(p => p.key === (formData.theme?.preset || 'default'))?.colors.background || '#0a0a0f'}
                          onChange={(e) => setFormData(p => ({ ...p, theme: { ...(p.theme || { preset: 'default' }), backgroundColor: e.target.value } }))}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={formData.theme?.backgroundColor || ''}
                          onChange={(e) => setFormData(p => ({ ...p, theme: { ...(p.theme || { preset: 'default' }), backgroundColor: e.target.value || undefined } }))}
                          placeholder="Hex color (e.g. #0a0a1a)"
                          className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout Options */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider">Layout</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'layout-a', label: 'Layout A', desc: 'Two-column with portfolio on left' },
                    { key: 'layout-b', label: 'Layout B', desc: 'Full-width single column' },
                    { key: 'layout-c', label: 'Layout C', desc: 'Two-column with sidebar' },
                  ].map(layout => (
                    <button
                      key={layout.key}
                      onClick={() => setFormData(p => ({ ...p, sectionLayout: layout.key as ProfileSectionLayout }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        (formData.sectionLayout || 'layout-a') === layout.key
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-foreground-muted bg-background-secondary'
                      }`}
                    >
                      <p className="text-sm font-semibold text-foreground">{layout.label}</p>
                      <p className="text-xs text-foreground-muted mt-1">{layout.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing & Width */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider">Spacing</h3>
                  <div className="flex gap-2">
                    {[
                      { key: 'compact', label: 'Compact' },
                      { key: 'spacious', label: 'Spacious' },
                    ].map(s => (
                      <button
                        key={s.key}
                        onClick={() => setFormData(p => ({ ...p, spacing: s.key as ProfileSpacing }))}
                        className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                          (formData.spacing || 'compact') === s.key
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-foreground-secondary hover:border-foreground-muted bg-background-secondary'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider">Width</h3>
                  <div className="flex gap-2">
                    {[
                      { key: 'contained', label: 'Contained' },
                      { key: 'full', label: 'Full Width' },
                    ].map(w => (
                      <button
                        key={w.key}
                        onClick={() => setFormData(p => ({ ...p, width: w.key as ProfileWidth }))}
                        className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                          (formData.width || 'contained') === w.key
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-foreground-secondary hover:border-foreground-muted bg-background-secondary'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-bold text-foreground mb-4">Profile Settings</h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-background-secondary flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Public Profile</h3>
                    <p className="text-sm text-foreground-muted">Allow others to see your profile.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.isPublic} onChange={e => setFormData(p => ({ ...p, isPublic: e.target.checked }))} />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="p-4 rounded-xl border border-border bg-background">
                  <h3 className="font-medium text-foreground mb-3">Section Visibility</h3>
                  <div className="grid gap-3">
                     {[
                       { key: 'projects', label: 'Projects' },
                       { key: 'activities', label: 'Activities' },
                       { key: 'achievements', label: 'Achievements' },
                       { key: 'academicGrades', label: 'Academic Grades' },
                     ].map(sec => (
                       <label key={sec.key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer w-fit">
                         <input 
                           type="checkbox" 
                           className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                           checked={formData.sectionVisibility?.[sec.key as keyof typeof formData.sectionVisibility] !== false}
                           onChange={e => setFormData(p => ({
                             ...p, 
                             sectionVisibility: { ...p.sectionVisibility, [sec.key]: e.target.checked }
                           }))}
                         />
                         Show {sec.label} Section
                       </label>
                     ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-background">
                  <h3 className="font-medium text-foreground mb-3">Section Order</h3>
                  <p className="text-sm text-foreground-muted mb-3">Drag or move sections to reorder them on your profile.</p>
                  <div className="space-y-2">
                    {(formData.sectionOrder || ['projects', 'activities', 'achievements', 'academicGrades']).map((sectionKey, idx) => {
                      const sectionInfo = SECTION_OPTIONS.find(s => s.key === sectionKey) || { key: sectionKey, label: sectionKey, icon: null };
                      return (
                        <div key={sectionKey} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-background-secondary border border-border">
                          <div className="flex flex-col gap-0.5 text-foreground-muted">
                            <button
                              onClick={() => moveSection(idx, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 hover:text-foreground disabled:opacity-30 cursor-pointer leading-none"
                            >▲</button>
                            <button
                              onClick={() => moveSection(idx, 'down')}
                              disabled={idx === (formData.sectionOrder?.length || 4) - 1}
                              className="p-0.5 hover:text-foreground disabled:opacity-30 cursor-pointer leading-none"
                            >▼</button>
                          </div>
                          {sectionInfo.icon && <span className="text-foreground-muted">{sectionInfo.icon}</span>}
                          <span className="text-sm font-medium text-foreground">{sectionInfo.label}</span>
                          <span className="ml-auto text-xs text-foreground-muted bg-background px-2 py-0.5 rounded-md">
                            Position {idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-background">
                  <h3 className="font-medium text-foreground mb-1">Pinned Item</h3>
                  <p className="text-sm text-foreground-muted mb-3">Select one item to highlight at the top of your portfolio.</p>
                  <select 
                    className="w-full px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm text-foreground cursor-pointer"
                    value={formData.pinnedItemId || ''}
                    onChange={e => setFormData(p => ({ ...p, pinnedItemId: e.target.value }))}
                  >
                    <option value="">None</option>
                    {formData.projects?.length ? (
                      <optgroup label="Projects">
                        {formData.projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </optgroup>
                    ) : null}
                    {formData.activities?.length ? (
                      <optgroup label="Activities">
                        {formData.activities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </optgroup>
                    ) : null}
                    {formData.achievements?.length ? (
                      <optgroup label="Achievements">
                        {formData.achievements.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </optgroup>
                    ) : null}
                    {formData.academicGrades?.length ? (
                      <optgroup label="Academic Grades">
                        {formData.academicGrades.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </optgroup>
                    ) : null}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
           <div className="flex gap-2">
             <button
               onClick={() => router.push(`/profile/${user.profile.username}`)}
               className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
             >
               View Public Profile
             </button>
           </div>
           <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-sm text-success font-medium animate-fade-in">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioItemEditor({ 
  children, index, total, isHidden, onMove, onRemove, onToggleVisibility 
}: { 
  children: React.ReactNode, index: number, total: number, isHidden?: boolean,
  onMove: (dir: 'up' | 'down') => void, onRemove: () => void, onToggleVisibility: () => void 
}) {
  return (
    <div className={cn("flex gap-3 p-4 rounded-xl border transition-all mb-3", isHidden ? "border-dashed border-border bg-background-secondary/50 opacity-60" : "border-border bg-background-secondary")}>
      <div className="flex flex-col gap-1 items-center justify-start text-foreground-muted">
         <button disabled={index === 0} onClick={() => onMove('up')} className="p-1 hover:text-foreground disabled:opacity-30 cursor-pointer">▲</button>
         <GripVertical className="h-4 w-4" />
         <button disabled={index === total - 1} onClick={() => onMove('down')} className="p-1 hover:text-foreground disabled:opacity-30 cursor-pointer">▼</button>
      </div>
      <div className="flex-1">
        {children}
      </div>
      <div className="flex flex-col gap-2 items-center">
         <button 
           onClick={onToggleVisibility} 
           className="p-2 bg-background border border-border rounded-lg text-foreground-muted hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
           title={isHidden ? "Show item" : "Hide item"}
         >
           {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
         </button>
         <button 
           onClick={onRemove} 
           className="p-2 bg-background border border-border rounded-lg text-error/70 hover:text-error hover:bg-error/10 hover:border-error/50 transition-colors cursor-pointer"
           title="Remove item"
         >
           <Trash2 className="h-4 w-4" />
         </button>
      </div>
    </div>
  );
}
