-- AlterTable
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "totalTasks" INTEGER NOT NULL DEFAULT 0;

-- Set total tasks for Matematika (1st grade: tab0 66 + tab1 16 + tab5 16 = 98)
UPDATE "courses" SET "totalTasks" = 98 WHERE "titleUz" = 'Matematika' OR "title" = 'Matematika';
