#!/bin/sh
# Baseline: отметить старые миграции как применённые, затем применить новую (lesson_completions)
set -e
cd "$(dirname "$0")/.."

echo "1. Marking existing migrations as applied..."
npx prisma migrate resolve --applied "20250205120000_remove_course_title_ru"
npx prisma migrate resolve --applied "20250212000000_add_course_total_tasks"

echo "2. Deploying new migration (lesson_completions)..."
npx prisma migrate deploy

echo "Done."
