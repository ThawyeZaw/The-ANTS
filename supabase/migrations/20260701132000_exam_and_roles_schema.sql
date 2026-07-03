-- 1. Create a specialized evaluation status enum
CREATE TYPE evaluation_status AS ENUM ('draft', 'pending_review', 'approved', 'revision_requested');

-- 2. Expand profiles role enum and ensure explicit constraints
ALTER TYPE user_role ADD VALUE 'main_contributor';

-- 3. Syllabus Schedules & Official Exam Board Sequences
CREATE TABLE exam_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    paper_code TEXT NOT NULL, -- e.g., "4MA1/1F" or "9709/12"
    official_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT4 NOT NULL,
    session_type TEXT, -- e.g., "AM", "PM"
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Role Change Audit Logs (Locks down the "No Downgrade" rule)
CREATE TABLE role_upgrade_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requested_role user_role NOT NULL,
    status evaluation_status DEFAULT 'pending_review',
    reviewer_id UUID REFERENCES profiles(id),
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
