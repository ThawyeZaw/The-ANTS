## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `text` |  Unique |
| `full_name` | `text` |  |
| `avatar_url` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |
| `role` | `user_role` |  Nullable |

## Table `student_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `target_exam_year` | `int4` |  Nullable |
| `study_goals_metadata` | `jsonb` |  Nullable |

## Table `teacher_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `institution_name` | `text` |  Nullable |
| `is_verified_teacher` | `bool` |  Nullable |

## Table `contributor_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  Nullable |
| `bio` | `text` |  Nullable |
| `website_url` | `text` |  Nullable |
| `facebook_url` | `text` |  Nullable |
| `linkedin_url` | `text` |  Nullable |
| `github_url` | `text` |  Nullable |
| `verification_documents_url` | `text` |  Nullable |

## Table `curriculums`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `qualification` | `text` |  Nullable |
| `exam_board` | `text` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `status` | `text` |  Nullable |
| `is_public` | `bool` |  Nullable |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |

## Table `subjects`

### Columns

| Name            | Type   | Constraints |
| -----------------| --------| -------------|
| `id`            | `uuid` | Primary     |
| `curriculum_id` | `uuid` |             |
| `title`         | `text` |             |
| `description`   | `text` | Nullable    |
| `order_no`      | `int4` | Nullable    |

## Table `topics`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `subject_id` | `uuid` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `order_no` | `int4` |  Nullable |

## Table `user_curriculums`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `curriculum_id` | `uuid` |  |
| `selected_at` | `timestamp` |  Nullable |

## Table `topic_progress`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `topic_id` | `uuid` |  |
| `confidence_level` | `int4` |  Nullable |
| `status` | `text` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |

## Table `resources`

### Columns

| Name             | Type        | Constraints |
| ------------------| -------------| -------------|
| `id`             | `uuid`      | Primary     |
| `curriculum_id`  | `uuid`      | Nullable    |
| `contributor_id` | `uuid`      | Nullable    |
| `title`          | `text`      |             |
| `content`        | `text`      | Nullable    |
| `resource_type`  | `text`      | Nullable    |
| `status`         | `text`      | Nullable    |
| `is_public`      | `bool`      | Nullable    |
| `created_at`     | `timestamp` | Nullable    |
| `updated_at`     | `timestamp` | Nullable    |

## Table `editor_submissions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `contributor_id` | `uuid` |  |
| `submission_type` | `text` |  Nullable |
| `entity_id` | `uuid` |  Nullable |
| `status` | `text` |  Nullable |
| `reviewer_id` | `uuid` |  Nullable |
| `feedback` | `text` |  Nullable |
| `submitted_at` | `timestamp` |  Nullable |
| `reviewed_at` | `timestamp` |  Nullable |

## Table `classrooms`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `description` | `text` |  Nullable |
| `teacher_id` | `uuid` |  |
| `invite_code` | `text` |  Nullable Unique |
| `created_at` | `timestamp` |  Nullable |

## Table `classroom_members`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `classroom_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `joined_at` | `timestamp` |  Nullable |

## Table `classroom_curriculums`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `classroom_id` | `uuid` |  |
| `curriculum_id` | `uuid` |  |

## Table `assignments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `classroom_id` | `uuid` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `due_date` | `timestamp` |  Nullable |
| `priority` | `text` |  Nullable |
| `created_by` | `uuid` |  |
| `created_at` | `timestamp` |  Nullable |

## Table `assignment_submissions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `assignment_id` | `uuid` |  |
| `student_id` | `uuid` |  |
| `submission_text` | `text` |  Nullable |
| `status` | `text` |  Nullable |
| `submitted_at` | `timestamp` |  Nullable |

## Table `clubs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `description` | `text` |  Nullable |
| `created_by` | `uuid` |  |
| `join_mode` | `text` |  Nullable |
| `invite_code` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

## Table `club_members`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `role` | `text` |  Nullable |
| `membership_status` | `text` |  Nullable |
| `joined_at` | `timestamp` |  Nullable |

## Table `club_messages`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `sender_id` | `uuid` |  |
| `message` | `text` |  |
| `created_at` | `timestamp` |  Nullable |

## Table `club_announcements`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `created_by` | `uuid` |  |
| `title` | `text` |  Nullable |
| `content` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

## Table `club_links`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `title` | `text` |  Nullable |
| `url` | `text` |  Nullable |
| `shared_by` | `uuid` |  |
| `created_at` | `timestamp` |  Nullable |

## Table `timetable_events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `title` | `text` |  |
| `event_type` | `text` |  Nullable |
| `start_time` | `timestamp` |  Nullable |
| `end_time` | `timestamp` |  Nullable |
| `all_day` | `bool` |  Nullable |
| `is_recurring` | `bool` |  Nullable |
| `recurrence_pattern` | `jsonb` |  Nullable |
| `color_code` | `text` |  Nullable |
| `metadata` | `jsonb` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

## Table `pomodoro_sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `duration_minutes` | `int4` |  Nullable |
| `task_name` | `text` |  Nullable |
| `category` | `text` |  Nullable |
| `completed_at` | `timestamp` |  Nullable |

## Table `decks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `owner_id` | `uuid` |  |
| `curriculum_id` | `uuid` |  Nullable |
| `name` | `text` |  Nullable |
| `description` | `text` |  Nullable |
| `is_public` | `bool` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

## Table `cards`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `deck_id` | `uuid` |  |
| `front_text` | `text` |  Nullable |
| `back_text` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

## Table `card_reviews`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `card_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `interval_days` | `int4` |  Nullable |
| `ease_factor` | `numeric` |  Nullable |
| `next_review_date` | `timestamp` |  Nullable |
| `last_rating` | `text` |  Nullable |

## Table `exams`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `curriculum_id` | `uuid` |  |
| `title` | `text` |  Nullable |
| `exam_series` | `text` |  Nullable |
| `exam_date` | `timestamp` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

## Table `exam_countdowns`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `exam_id` | `uuid` |  Nullable |
| `custom_title` | `text` |  Nullable |
| `target_date` | `timestamp` |  Nullable |
| `priority_indicator` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

## Table `grade_boundaries`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `exam_id` | `uuid` |  |
| `grade` | `text` |  Nullable |
| `min_mark` | `numeric` |  Nullable |
| `max_mark` | `numeric` |  Nullable |

## Table `grade_entries`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `exam_id` | `uuid` |  Nullable |
| `component_name` | `text` |  Nullable |
| `raw_score` | `numeric` |  Nullable |
| `max_score` | `numeric` |  Nullable |
| `weight` | `numeric` |  Nullable |
| `predicted_grade` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

