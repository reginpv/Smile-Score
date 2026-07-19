# CLAUDE.md

This file provides Claude Code with project context. For the full technical reference, read `AGENTS.md` before making changes.

## Commands

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build
npm run lint         # ESLint

# Database (Prisma 7 + Neon)
npm run db:generate  # regenerate Prisma client
npm run db:push      # push schema to the database
npm run db:seed      # seed default admin
npm run db:studio    # Prisma Studio
```

> **See `AGENTS.md`** for: auth flow, caching strategy, server action patterns, soft-delete conventions, exact import paths, and all key gotchas.
