'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Complete Profile Form (Step 3)
// After OTP verification, the invited user fills in their profile details.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  UserCheck,
  Loader2,
  Eye,
  EyeOff,
  Globe,
  Link2,
  Code2,
  Share2,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkPasswordStrength } from '@/lib/utils';
import type { ProfileFormData } from '@/hooks/useContributorManager';

interface CompleteProfileFormProps {
  invitedName: string;
  invitedRole: string;
  onSubmit: (data: ProfileFormData) => void;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export default function CompleteProfileForm({
  invitedName,
  invitedRole,
  onSubmit,
  isLoading,
  error,
  success,
}: CompleteProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    password: '',
    confirmPassword: '',
    title: '',
    bio: '',
    website_url: '',
    facebook_url: '',
    linkedin_url: '',
    github_url: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = checkPasswordStrength(formData.password);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // ── Success State ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 animate-fade-in-up">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>
          {/* Decorative sparkles */}
          <div className="absolute -top-2 -right-2 text-2xl animate-float">✨</div>
          <div className="absolute -bottom-1 -left-3 text-xl animate-float delay-300">🎉</div>
        </div>
        <h3 className="text-xl font-bold text-foreground mt-2">
          Registration Complete!
        </h3>
        <p className="text-foreground-muted text-center mt-2 max-w-xs">
          <span className="font-semibold text-foreground">{invitedName}</span> has been
          successfully registered as a{' '}
          <span className="font-semibold text-primary">{invitedRole}</span>.
        </p>
        <p className="text-sm text-foreground-muted mt-3">
          They can now log in with their credentials.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-foreground">
          Complete Profile
        </h3>
        <p className="text-sm text-foreground-muted mt-1">
          Set up credentials and optional profile details for{' '}
          <span className="font-medium text-foreground">{invitedName}</span>
        </p>
      </div>

      {/* Password Section */}
      <div className="space-y-4 p-4 rounded-xl bg-background-secondary/50 border border-border">
        <p className="text-sm font-semibold text-foreground-secondary flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Credentials
        </p>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="profile-password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="profile-password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full px-4 py-3 pr-12 rounded-xl bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {/* Password strength bar */}
          {formData.password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      i <= passwordStrength.score
                        ? passwordStrength.color
                        : 'bg-border'
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-foreground-muted">{passwordStrength.label}</p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="profile-confirm" className="block text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="profile-confirm"
              type={showConfirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Re-enter password"
              className={cn(
                'w-full px-4 py-3 pr-12 rounded-xl bg-background-secondary border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200',
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'border-error focus:border-error'
                  : 'border-border focus:border-primary'
              )}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-xs text-error">Passwords do not match</p>
          )}
        </div>
      </div>

      {/* Profile Details Section */}
      <div className="space-y-4 p-4 rounded-xl bg-background-secondary/50 border border-border">
        <p className="text-sm font-semibold text-foreground-secondary flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          Profile Details <span className="text-xs font-normal text-foreground-muted">(optional)</span>
        </p>

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="profile-title" className="block text-sm font-medium text-foreground">
            Professional Title
          </label>
          <input
            id="profile-title"
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g. Physics Teacher, Curriculum Developer"
            className="w-full px-4 py-3 rounded-xl bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
            disabled={isLoading}
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label htmlFor="profile-bio" className="block text-sm font-medium text-foreground">
            Bio
          </label>
          <textarea
            id="profile-bio"
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="A short bio about the user's background and expertise..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 resize-none"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Social Links Section */}
      <div className="space-y-4 p-4 rounded-xl bg-background-secondary/50 border border-border">
        <p className="text-sm font-semibold text-foreground-secondary flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-info" />
          Social Links <span className="text-xs font-normal text-foreground-muted">(optional)</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Website */}
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => handleChange('website_url', e.target.value)}
              placeholder="Website URL"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              disabled={isLoading}
            />
          </div>

          {/* LinkedIn */}
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => handleChange('linkedin_url', e.target.value)}
              placeholder="LinkedIn URL"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              disabled={isLoading}
            />
          </div>

          {/* GitHub */}
          <div className="relative">
            <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="url"
              value={formData.github_url}
              onChange={(e) => handleChange('github_url', e.target.value)}
              placeholder="GitHub URL"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              disabled={isLoading}
            />
          </div>

          {/* Facebook */}
          <div className="relative">
            <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="url"
              value={formData.facebook_url}
              onChange={(e) => handleChange('facebook_url', e.target.value)}
              placeholder="Facebook URL"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm animate-fade-in">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !formData.password}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 cursor-pointer',
          isLoading || !formData.password
            ? 'bg-accent/30 cursor-not-allowed'
            : 'bg-accent hover:bg-accent-hover hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Account…
          </>
        ) : (
          <>
            <UserCheck className="w-5 h-5" />
            Complete Registration
          </>
        )}
      </button>
    </form>
  );
}
