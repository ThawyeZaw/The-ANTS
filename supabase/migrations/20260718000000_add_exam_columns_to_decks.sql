-- Add exam_board and syllabus_code columns to decks table
ALTER TABLE decks ADD COLUMN IF NOT EXISTS exam_board text;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS syllabus_code text;
