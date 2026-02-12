-- Выполните этот SQL в Supabase: Dashboard → SQL Editor → New query → вставьте и Run

-- Добавить колонку totalTasks, если её нет
ALTER TABLE "courses"
ADD COLUMN IF NOT EXISTS "totalTasks" INTEGER NOT NULL DEFAULT 0;

-- Установить 98 заданий для курса Matematika (если такая запись есть)
UPDATE "courses"
SET "totalTasks" = 98
WHERE "titleUz" = 'Matematika' OR "title" = 'Matematika';
