# Smile Score

A **Next.js 16** app where logged-in users upload a selfie and get an on-device smile score — computed entirely in the browser via MediaPipe face detection, no server-side inference — shown in a public gallery on the homepage. Built on a production-ready full-stack CRUD boilerplate with authentication, user management, file uploads, and email, all deployed on Vercel with Neon PostgreSQL and Vercel Blob.

---

## Features

- **Authentication** — Email/password login via NextAuth.js v4 (Credentials provider, JWT sessions)
- **User management** — Role-based access control (`SUPERADMIN`, `ADMIN`, `USER`), soft-delete, paginated user table
- **Profile management** — Users update their own name, email, avatar image, and password
- **File uploads** — Avatar images stored on Vercel Blob
- **Email** — Password reset via Nodemailer + Brevo SMTP
- **Data tables** — Paginated, server-side sorted user list
- **UI** — Tailwind CSS 4, Lucide icons, Sonner toasts, responsive layouts (desktop + mobile)
- **Smile Score** — Reference feature: logged-in users upload a selfie, get an on-device smile score (MediaPipe face detection, no server-side inference), and see it in a public gallery on the homepage

---

## Tech Stack

| Layer | Package |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth.js v4 |
| Database | Neon PostgreSQL via Prisma 7 |
| File storage | Vercel Blob |
| Email | Nodemailer + Brevo SMTP |
| State (client) | Zustand 5 |
| Toasts | Sonner |
| Icons | Lucide React |
| CSS | Tailwind CSS 4 (PostCSS, no config file) |
| Language | TypeScript (strict mode OFF) |
| Face detection | MediaPipe (`@mediapipe/tasks-vision`), client-side only |

*Exact versions are documented in `AGENTS.md` for CI/CD reproducibility.*

---

## Terminology & Conventions

### Role hierarchy

```
SUPERADMIN  →  ADMIN  →  USER
```

- `SUPERADMIN` has full access (can manage all users, including admins).
- `ADMIN` can manage regular users.
- `USER` has no admin access — profile and security only.

### Soft delete

Users are never hard-deleted. When deleted, their `deletedAt` field is set to the current timestamp. Every query for active users must filter `deletedAt: null`. This is the single most important convention in the codebase.

### Template system

Pages use layouts defined in `templates/`:

| Template | Layout | Used for |
|---|---|---|
| `Default` | Header + main + Footer | Public pages (home, etc.) |
| `Blank` | Main only | Auth pages (login, signup, password reset) |
| `Dashboard` | Aside + HeaderDashboard + main + Footer | All `/dashboard/*` routes |

Route protection is done per-page using `getServerSession()` — there is no middleware.

### Authentication model

JWT sessions (no database session table). Session max age is 1 day. The session user object contains `id`, `name`, `email`, `role`, and `image`. The JWT is refreshed when the user updates their profile (you must call `update()` on the client after mutation).

### Caching (two distinct mechanisms)

1. **`'use cache'`** — Persistent, tag-based caching for read queries (list and detail). Tags like `users` and `user-{id}` are invalidated after mutations.
2. **`react cache()`** — Per-request deduplication only (used by `getMe()`). Lives for one HTTP request, not shared across requests.

Do not mix the two up. See `AGENTS.md` for exact code patterns.

### Zustand — client UI state only

Zustand stores hold purely presentational state (sidebar minimized, mobile drawer open). They **never** store server data. A `<HydrationZustand>` wrapper prevents SSR hydration mismatches.

### Smile Score

A public gallery on the homepage. Logged-in users upload a selfie; a MediaPipe `FaceLandmarker` running entirely in the browser (WASM/GPU) scores the smile as the average of the `mouthSmileLeft`/`mouthSmileRight` blendshapes, scaled to 0–100. The photo (via the existing Vercel Blob upload) and score are saved and shown to everyone, logged in or not. Only the uploader can delete their own entry.

---

## Architecture Overview

### Auth flow

```
Browser                  Next.js Server                 Neon DB
   │                         │                            │
   │── POST /login ──────────┤                            │
   │    { email, password }  │                            │
   │                         │── findUnique(email) ───────┤
   │                         │◄── { id, name, role, … } ──┤
   │                         │                            │
   │                         │── bcrypt.compare(password)  │
   │                         │── update loggedInAt ───────┤
   │                         │                            │
   │                         │── Sign JWT (id, name,      │
   │                         │    email, image, role)      │
   │◄── Set httpOnly cookie ──┤                            │
```

### Data flow (server actions)

All mutations go through server actions in `lib/actions/`. They follow this pattern:

1. Client form calls server action via `useActionState`
2. Server action validates session (`getServerSession`)
3. Mutates database via Prisma
4. Revalidates cache tags if needed
5. Returns `{ success: boolean, message: string, payload?: any }`

Read queries use `'use cache'` with tags for automatic deduplication and manual invalidation. `getMe()` uses `react cache()` for per-request dedup only.

### Directory layout

```
app/                        # Next.js App Router
  api/auth/[...nextauth]/   # NextAuth API handler
  dashboard/                # Protected pages (users, profile, security)
  login/                    # Public auth pages
  signup/
  forgot-password/
  reset-password/

components/
  forms/                    # Login, Signup, Profile, Security forms
  globals/                  # Header, Footer, Aside, Drawer
  users/UsersTable.tsx      # Paginated user list
  smile-score/              # Smile Score gallery + upload widget

config/constants.ts         # APP_NAME, APP_BASE_URL, SMTP constants, USERS_PER_PAGE

lib/
  authOptions.ts            # NextAuth config
  prisma.ts                 # Prisma singleton (Neon adapter)
  mediapipe/faceLandmarker.ts # MediaPipe FaceLandmarker singleton + smile score math
  actions/                  # Server actions (user.ts, me.ts, media.ts, smileScore.ts, guard.ts, util.ts)

prisma/
  schema.prisma             # Database schema
  seed.ts                   # Seeds default admin user
  migrations/               # Migration history

store/                      # Zustand stores (useAside, useDrawer)

templates/                  # Layout templates (Default, Dashboard, Blank)

types/                      # Shared TypeScript types
```

---

## Setup

### Prerequisites

- **Node.js v22.14.x** (use `nvm`)
- **Vercel CLI** (`npm i -g vercel`)
- **Vercel account** (hobby tier is fine)

### 1. Get the code

**Fork it** (recommended) if you're building your own project on top of this boilerplate — you'll want your own GitHub repo to connect to Vercel and push future commits to:

```bash
# Click "Fork" on GitHub first, then:
git clone https://github.com/<your-username>/<your-fork>.git .
```

**Clone it directly** if you just want to run it locally or experiment:

```bash
git clone https://github.com/reginpv/next-crud-boilerplate.git .
```

Either way, once you have the code locally:

```bash
npm install
```

### 2. Create a Vercel project

```bash
vercel login
vercel link       # creates/links a Vercel project for this directory
```

Or import the repo from the Vercel dashboard (**Add New… → Project**). You need a Vercel project before provisioning storage, since the DB and Blob store are attached to it.

### 3. Provision the database (Neon Postgres via Vercel)

1. In the Vercel dashboard, open your project → **Storage** tab → **Create Database**.
2. Choose **Neon (Serverless Postgres)** and create it in the same region as your project.
3. Connect it to your project — this auto-adds Postgres connection env vars to the project.
4. Open **Settings → Environment Variables** and confirm/rename the pooled and direct connection strings to exactly **`DATABASE_URL`** (pooled, used at runtime by `lib/prisma.ts`) and **`DATABASE_URL_UNPOOLED`** (direct, used by the Prisma CLI — `db:push`, `db:studio`, etc.) — the integration's default names don't always match what this codebase expects.

### 4. Provision file storage (Vercel Blob)

1. Same **Storage** tab → **Create Database** → **Blob**.
2. Connect it to your project — this adds a **`BLOB_READ_WRITE_TOKEN`** env var automatically.
3. Each Blob store gets its own public hostname (e.g. `xxxxxxxx.public.blob.vercel-storage.com`). Find yours under the store's **Settings**, then add it to `images.remotePatterns` in [`next.config.ts`](next.config.ts) — otherwise `<Image>` will refuse to render uploaded photos/avatars. This is easy to miss when forking into a fresh Vercel project, since a new store means a new hostname.

### 5. Set the remaining environment variables

In the Vercel dashboard (**Settings → Environment Variables**), add:

| Variable | How to get it |
|---|---|
| `NEXTAUTH_SECRET` | Generate one: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your deployed URL (e.g. `https://your-app.vercel.app`); `http://localhost:3000` for local dev |
| `SMTP_HOST` / `SMTP_KEY` | From your [Brevo](https://www.brevo.com/) account → SMTP & API settings (used for password-reset emails) |

`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `BLOB_READ_WRITE_TOKEN` should already be set from steps 3–4.

### 6. Pull env vars locally and initialize the database

```bash
vercel env pull .env.local
npm run db:push            # Push schema to Neon
npm run db:seed            # Create default admin account
npm run dev                # Start dev server on :3000
```

### Default admin credentials

```
email:    admin@domain.com
password: defaultpass
role:     SUPERADMIN
```

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema to the database |
| `npm run db:seed` | Seed default admin user |
| `npm run db:studio` | Open Prisma Studio |

---

## Environment Variables

All loaded from `.env.local` (pulled via `vercel env pull` after provisioning in the Vercel dashboard — see [Setup](#setup) for where each one comes from):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Neon connection (runtime) |
| `DATABASE_URL_UNPOOLED` | Direct Neon connection (Prisma CLI: `db:push`, `db:studio`, etc.) |
| `NEXTAUTH_SECRET` | JWT signing key |
| `NEXTAUTH_URL` | Base URL for auth callbacks |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob API token |
| `SMTP_HOST` | Brevo SMTP host |
| `SMTP_KEY` | Brevo SMTP API key |

---

## Deployment (Vercel)

1. Connect the repo to Vercel
2. Set **build command** to: `prisma generate && next build`
3. Add all environment variables in Vercel dashboard
4. Deploy

The Vercel Blob storage domain is allowlisted in `next.config.ts` for use with `<Image>`.

---

## For AI Agents

If you're an AI agent working on this codebase, read `AGENTS.md` for the full technical reference — exact import paths, caching gotchas, auth callback internals, and code conventions that are critical for correct code generation.
