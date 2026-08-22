import { z } from 'zod';

// ── User & Profile JSONB Schemas ──────────────────────────────────────────

export const SocialPlatformSchema = z.enum([
  'github',
  'facebook',
  'linkedin',
  'website',
  'twitter',
  'instagram',
  'youtube',
  'custom',
]);

export const SocialLinkItemSchema = z.object({
  id: z.string(),
  platform: SocialPlatformSchema,
  label: z.string(),
  url: z.string().url(),
  visible: z.boolean().default(true),
  order: z.number().optional(),
});
export const SocialLinksArraySchema = z.array(SocialLinkItemSchema);

export const ProjectItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  role: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  links: z
    .object({
      github: z.string().optional(),
      live: z.string().optional(),
      website: z.string().optional(),
      other: z.string().optional(),
    })
    .optional(),
  media: z.array(z.string()).optional(),
  isHidden: z.boolean().optional(),
  order: z.number().optional(),
});
export const ProjectsArraySchema = z.array(ProjectItemSchema);

export const ActivityItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  organization: z.string(),
  role: z.string(),
  start_date: z.string(),
  end_date: z.string().optional(),
  description: z.string().optional(),
  verification_link: z.string().optional(),
  isHidden: z.boolean().optional(),
  order: z.number().optional(),
});
export const ActivitiesArraySchema = z.array(ActivityItemSchema);

export const AchievementItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
  issuer: z.string().optional(),
  link: z.string().optional(),
  isHidden: z.boolean().optional(),
  order: z.number().optional(),
});
export const AchievementsArraySchema = z.array(AchievementItemSchema);

export const SectionVisibilitySchema = z.object({
  bio: z.boolean().optional(),
  social_links: z.boolean().optional(),
  projects: z.boolean().optional(),
  activities: z.boolean().optional(),
  achievements: z.boolean().optional(),
  certifications: z.boolean().optional(),
  stats: z.boolean().optional(),
});

export const StudyGoalsMetadataSchema = z.object({
  target_universities: z.array(z.string()).optional(),
  target_grades: z.record(z.string(), z.string()).optional(),
  weekly_study_hours_target: z.number().optional(),
  focus_areas: z.array(z.string()).optional(),
});

// ── Club JSONB Schemas ───────────────────────────────────────────────────

export const ClubFeaturesSchema = z.object({
  chat: z.boolean().optional().default(true),
  announcements: z.boolean().optional().default(true),
  resources: z.boolean().optional().default(true),
  milestones: z.boolean().optional().default(true),
  projects: z.boolean().optional().default(true),
  events: z.boolean().optional().default(true),
});

export const ClubLinkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  icon: z.string().optional(),
});
export const ClubLinksArraySchema = z.array(ClubLinkSchema);

// ── Timetable & Study Tools JSONB Schemas ─────────────────────────────────

export const RecurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  interval: z.number().optional(),
  byDay: z.array(z.string()).optional(),
  until: z.string().optional(),
  count: z.number().optional(),
});

export const NoteBlockSchema = z.object({
  id: z.string(),
  type: z.enum([
    'paragraph',
    'heading',
    'subheading',
    'heading_1',
    'heading_2',
    'heading_3',
    'bullet',
    'numbered',
    'code',
    'callout',
    'image',
    'math',
    'table',
    'divider',
    'quote',
    'todo',
  ]),
  content: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  children: z.array(z.any()).optional(),
});
export const NoteBlocksArraySchema = z.array(NoteBlockSchema);

// ── Quizzes & Assessment JSONB Schemas ───────────────────────────────────

export const QuizQuestionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean().optional(),
  explanation: z.string().optional(),
});

export const QuizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  type: z.enum(['multiple_choice', 'single_choice', 'true_false', 'short_answer']),
  options: z.array(QuizQuestionOptionSchema).optional(),
  correctAnswer: z.any().optional(),
  points: z.number().optional().default(1),
  explanation: z.string().optional(),
});
export const QuizQuestionsArraySchema = z.array(QuizQuestionSchema);

export const QuizAnswersSchema = z.record(z.string(), z.any());

// ── System & Audit Trail JSONB Schemas ───────────────────────────────────

export const VersionChangeItemSchema = z.object({
  field: z.string(),
  old_value: z.any().optional(),
  new_value: z.any().optional(),
  timestamp: z.string().optional(),
});
export const VersionChangesArraySchema = z.array(VersionChangeItemSchema);

export const ReviewFeedbackSchema = z.object({
  comments: z.string().optional(),
  rating: z.number().optional(),
  suggestions: z.array(z.string()).optional(),
  approved_fields: z.array(z.string()).optional(),
  rejected_fields: z.array(z.string()).optional(),
});

export const GenericMetadataSchema = z.record(z.string(), z.any());
