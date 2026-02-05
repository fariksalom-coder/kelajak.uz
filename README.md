# Kelajak.uz

Educational platform: parent/child accounts, courses, statistics, and feedback.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Prisma + SQLite (локально) / PostgreSQL
- next-auth (Credentials + JWT)
- next-intl (UZ / RU)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment:

   ```bash
   cp .env.example .env
   ```

3. В `.env` задайте переменные. Для быстрого старта без PostgreSQL используйте SQLite:

   ```
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-at-least-32-characters-long"
   ```

4. Create DB and run migrations:

   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. Seed courses and subjects (optional):

   ```bash
   npm run db:seed
   ```

6. Run dev server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Register as Parent or Child. Parents can add children and buy courses (mock); children see Main / Stats / Profile tabs.

## Deploy to Vercel (PostgreSQL)

В Environment Variables задайте `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH_TRUST_HOST=true` и **`DATABASE_URL`** (PostgreSQL, не SQLite).  
Чтобы избежать ошибки **«prepared statement already exists» (42P05)** в serverless, добавьте в конец `DATABASE_URL` параметр **`pgbouncer=true`**, например:

`https://...@...neon.tech/neondb?sslmode=require&pgbouncer=true`

После изменения переменных сделайте Redeploy.

## Routes

- `/`, `/login`, `/register` — auth
- `/parent` — parent dashboard (add child, list children, go to child profile)
- `/parent/children/add` — add child form
- `/parent/children/[childId]` — child view (stats, “what studied”, buy courses)
- `/parent/children/[childId]/recent` — feedback by subject/topic
- `/parent/children/[childId]/courses` — buy courses (mock payment)
- `/parent/children/select` — choose child then open child profile
- `/child?asChild=id` (parent) or `/child` (child) — child area with Main / Stats / Profile
- `/child/profile` — profile, parent gate, invite friend, contact, logout
- `/child/referral`, `/child/contact` — referral link and contact admin

## i18n

- Default locale: `uz`. Russian: prefix `/ru` (e.g. `/ru/parent`).
- Language switcher in header.
