'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  ChevronUp,
  ChevronDown,
  Users,
} from 'lucide-react';
import {
  getOrgTeamMembers,
  addOrgTeamMember,
  updateOrgTeamMember,
  deleteOrgTeamMember,
  reorderOrgTeamMember,
} from '@/lib/mock/database';
import type { OrgTeamMember, OrgTeamMemberFormData, Profile } from '@/types';
import { cn } from '@/lib/utils';
import UserSearchCombobox from '@/components/about/UserSearchCombobox';

const EMPTY_FORM: OrgTeamMemberFormData = {
  name: '',
  title: '',
  bio: '',
  photoUrl: '',
  linkedProfileUsername: '',
  isAlumni: false,
};

export default function TeamManager() {
  const [members, setMembers] = useState<OrgTeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrgTeamMemberFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [linkedUser, setLinkedUser] = useState<Pick<Profile, 'id' | 'name' | 'username' | 'avatar' | 'role'> | null>(null);

  useEffect(() => {
    setMembers(getOrgTeamMembers());
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const refresh = () => setMembers(getOrgTeamMembers());

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setLinkedUser(null);
    setIsModalOpen(true);
  };

  const openEdit = (member: OrgTeamMember) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      title: member.title,
      bio: member.bio,
      photoUrl: member.photoUrl,
      linkedProfileUsername: member.linkedProfileUsername || '',
      isAlumni: member.isAlumni || false,
    });
    // Pre-populate linked user if member has a linked profile
    if (member.linkedProfileUsername) {
      setLinkedUser({
        id: '',
        name: member.name,
        username: member.linkedProfileUsername,
        avatar: member.photoUrl,
        role: 'student',
      });
    } else {
      setLinkedUser(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setLinkedUser(null);
    setFeedback(null);
  };

  const handleUserSelect = (user: Profile) => {
    setLinkedUser({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
    });
    setFormData((p) => ({
      ...p,
      name: user.name || p.name,
      photoUrl: user.avatar || p.photoUrl,
      linkedProfileUsername: user.username,
    }));
  };

  const handleUserClear = () => {
    setLinkedUser(null);
    setFormData((p) => ({
      ...p,
      linkedProfileUsername: '',
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.title.trim()) {
      showFeedback('error', 'Name and title are required.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      if (editingId) {
        const r = updateOrgTeamMember(editingId, formData);
        if (r.success) showFeedback('success', 'Member updated.');
        else showFeedback('error', r.error);
      } else {
        const r = addOrgTeamMember(formData);
        if (r.success) showFeedback('success', 'Member added.');
        else showFeedback('error', 'Failed to add member.');
      }
      setIsSaving(false);
      refresh();
      closeModal();
    }, 400);
  };

  const handleDelete = (id: string) => {
    const r = deleteOrgTeamMember(id);
    if (r.success) {
      showFeedback('success', 'Member removed.');
      refresh();
    }
    setConfirmDeleteId(null);
  };

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    reorderOrgTeamMember(id, direction);
    refresh();
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Our Team</h2>
          <p className="text-sm text-foreground-muted mt-1">
            Manage team members displayed on the public About page.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      {feedback && (
        <div
          className={cn(
            'px-4 py-3 rounded-xl text-sm font-medium animate-fade-in',
            feedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-red-500/15 text-red-400 border border-red-500/25'
          )}
        >
          {feedback.message}
        </div>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
          <p className="text-sm text-foreground-muted">No team members yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member, idx) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-4 p-4 bg-background-card border border-border rounded-xl hover:border-primary/10 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-background-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-foreground-muted">{member.name.charAt(0)}</span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground truncate">{member.name}</h3>
                    {member.isAlumni && (
                      <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                        Alumni
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary/70 truncate">{member.title}</p>
                  <p className="text-xs text-foreground-muted truncate mt-0.5">{member.bio}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 mr-1">
                  <button
                    onClick={() => handleReorder(member.id, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 rounded text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleReorder(member.id, 'down')}
                    disabled={idx === members.length - 1}
                    className="p-0.5 rounded text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => openEdit(member)}
                  className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>

                {confirmDeleteId === member.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(member.id)}
                    className="p-2 rounded-lg text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-background-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                {editingId ? 'Edit Member' : 'Add Member'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* User Search — auto-fill from platform */}
              <UserSearchCombobox
                onSelect={handleUserSelect}
                onClear={handleUserClear}
                selectedUser={linkedUser}
                label="Link to Platform User"
                description="Search for an existing user to auto-fill their details."
              />

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="e.g. Ko Zaw Win"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="e.g. Founder & Lead Mentor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  placeholder="Short bio..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Photo URL</label>
                <input
                  type="text"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData((p) => ({ ...p, photoUrl: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              {/* Alumni toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-background-secondary border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Alumni Status</p>
                  <p className="text-xs text-foreground-muted mt-0.5">Mark this member as an alumnus</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, isAlumni: !p.isAlumni }))}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors cursor-pointer',
                    formData.isAlumni ? 'bg-primary' : 'bg-foreground-muted/30'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                      formData.isAlumni ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-border">
              <button
                onClick={closeModal}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
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
