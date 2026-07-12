'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/ui/BackButton';
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  ImageIcon,
  X,
  Save,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getOrgTimelineItems,
  addOrgTimelineItem,
  updateOrgTimelineItem,
  deleteOrgTimelineItem,
} from '@/lib/mock/database';
import type { OrgTimelineItem, OrgTimelineItemFormData } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_OPTIONS = [
  { value: 'milestone', label: 'Milestone' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'competition', label: 'Competition' },
  { value: 'camp', label: 'Camp' },
  { value: 'community', label: 'Community' },
  { value: 'other', label: 'Other' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  milestone: 'bg-primary/15 text-primary border-primary/25',
  workshop: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  competition: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  camp: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  community: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  other: 'bg-foreground-muted/15 text-foreground-muted border-foreground-muted/25',
};

const EMPTY_FORM: OrgTimelineItemFormData = {
  title: '',
  description: '',
  date: '',
  category: 'workshop',
  imageUrls: [],
  location: '',
};

export default function ManageOrgPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<OrgTimelineItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrgTimelineItemFormData>(EMPTY_FORM);
  const [imageInput, setImageInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isMainContributor = user?.profile?.role === 'main_contributor';

  useEffect(() => {
    if (user && !isMainContributor) router.replace('/dashboard');
    else setItems(getOrgTimelineItems());
  }, [user, isMainContributor, router]);

  if (!isMainContributor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const refresh = () => setItems(getOrgTimelineItems());

  const openCreate = () => {
    setEditingId(null); setFormData(EMPTY_FORM); setImageInput(''); setIsModalOpen(true);
  };

  const openEdit = (item: OrgTimelineItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title, description: item.description, date: item.date,
      category: item.category, imageUrls: [...item.imageUrls], location: item.location || '',
      showOnTimeline: item.showOnTimeline,
    });
    setImageInput(''); setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setImageInput(''); setFeedback(null); };

  const addImage = () => {
    const url = imageInput.trim(); if (!url) return;
    setFormData((p) => ({ ...p, imageUrls: [...p.imageUrls, url] })); setImageInput('');
  };

  const removeImage = (index: number) => {
    setFormData((p) => ({ ...p, imageUrls: p.imageUrls.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.date.trim()) {
      showFeedback('error', 'Title and date are required.'); return;
    }
    setIsSaving(true);
    setTimeout(() => {
      if (editingId) {
        const r = updateOrgTimelineItem(editingId, formData);
        if (r.success) showFeedback('success', 'Item updated.'); else showFeedback('error', r.error);
      } else {
        const r = addOrgTimelineItem(formData);
        if (r.success) showFeedback('success', 'Item created.'); else showFeedback('error', 'Failed to create.');
      }
      setIsSaving(false); refresh(); closeModal();
    }, 400);
  };

  const handleDelete = (id: string) => {
    const r = deleteOrgTimelineItem(id);
    if (r.success) { showFeedback('success', 'Item deleted.'); refresh(); }
    setConfirmDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <BackButton href="/org-activities" label="Back" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Manage Timeline & Activities</h1>
            <p className="text-sm text-foreground-secondary mt-1">Add milestones, events, workshops, and more to <span className="font-brand">The ANTs</span> timeline.</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl text-sm font-semibold transition-all cursor-pointer">
            <Plus className="h-4 w-4" /> New Item
          </button>
        </div>

        {feedback && (
          <div className={cn('mb-6 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in', feedback.type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25')}>
            {feedback.message}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
            <p className="text-sm text-foreground-muted">No items yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-4 bg-background-card border border-border rounded-xl hover:border-primary/10 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <span className={cn('shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border', CATEGORY_COLORS[item.category || 'other'])}>{item.category || 'other'}</span>
                  {item.showOnTimeline && (
                    <span className="shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-primary/15 text-primary border border-primary/25">
                      Timeline
                    </span>
                  )}
                  <span className="shrink-0 text-xs font-mono text-foreground-muted">{item.date}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{item.title}</h3>
                    <p className="text-xs text-foreground-muted truncate mt-0.5">{item.description}</p>
                    {(item.imageUrls.length > 0 || item.location) && (
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-foreground-muted">
                        {item.imageUrls.length > 0 && <span>{item.imageUrls.length} image(s)</span>}
                        {item.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleDelete(item.id)} className="px-2 py-1 rounded-lg text-[11px] font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer">Confirm</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 rounded-lg text-[11px] font-medium text-foreground-muted hover:text-foreground transition-colors cursor-pointer">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(item.id)} className="p-2 rounded-lg text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-background-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editingId ? 'Edit Item' : 'New Item'}</h2>
              <button onClick={closeModal} className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors" placeholder="e.g. IGCSE Intensive Bootcamp" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Date / Year *</label>
                  <input type="text" value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors" placeholder="e.g. 2024 Q1 or 2025-06-10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Category</label>
                  <select value={formData.category || ''} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as OrgTimelineItemFormData['category'] }))} className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer">
                    {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Show on Timeline Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-background-secondary border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Show on Timeline</p>
                  <p className="text-xs text-foreground-muted mt-0.5">Display this item on the public About page timeline</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, showOnTimeline: !p.showOnTimeline }))}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    formData.showOnTimeline ? 'bg-primary' : 'bg-foreground-muted/30'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      formData.showOnTimeline ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Location</label>
                <input type="text" value={formData.location || ''} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors" placeholder="e.g. Online (Zoom), Yangon" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={4} className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors resize-none" placeholder="Describe..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Images (URLs)</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={imageInput} onChange={(e) => setImageInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addImage()} className="flex-1 px-3 py-2 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors" placeholder="Paste image URL and press Add" />
                  <button onClick={addImage} className="px-4 py-2 bg-background-secondary border border-border rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer">Add</button>
                </div>
                {formData.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.imageUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <div className="w-20 h-20 rounded-lg bg-background-secondary border border-border overflow-hidden">
                          <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
                        </div>
                        <button onClick={() => removeImage(idx)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-border">
              <button onClick={closeModal} className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
