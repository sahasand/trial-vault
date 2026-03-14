# TrialVault

## Project Overview
TrialVault is a mobile-first web app that helps the clinical research
community save, search, and reference key details about clinical trials
in one shared, structured database. Users can add trials manually or
import from ClinicalTrials.gov, browse the full database, search by
NCT ID or name, and filter by phase or indication. No authentication
in V1 — shared database, open access.

## Tech Stack
- Framework: Next.js 14 (App Router, TypeScript)
- Styling: Tailwind CSS 4 + shadcn/ui (base-nova)
- Database: Firebase Firestore
- Validation: Zod (API route schemas)
- External API: ClinicalTrials.gov API v2 (no key required)
- Deployment: Vercel (https://trialvault.vercel.app)
- Repository: https://github.com/sahasand/trial-vault.git
- Package manager: npm

## Architecture Rules
- All pages in /app directory using App Router conventions
- Components in /components, split by feature (trials/) and ui (ui/)
- All Firestore queries in /lib/firebase.ts — no direct DB calls
  from components
- API routes in /app/api/ with Zod validation and structured logging
- Environment variables in .env.local — never commit this file
- TypeScript strict mode on all files
- Shared constants (phases, statuses, colors) in /lib/constants.ts
- Reusable hooks in /lib/hooks.ts (e.g. useTrialById)
- Error display via ErrorBanner component (/components/ui/error-banner.tsx)
- Brand colors defined as CSS custom properties (--brand, --accent-orange)
  in globals.css, not hardcoded hex values in components

## Key Libraries
- /lib/firebase.ts — Firestore CRUD (getAllTrials, getTrialById, createTrial, updateTrial, deleteTrial)
- /lib/ctgov.ts — ClinicalTrials.gov field mapping (mapCtgovToTrial, mapCtgovToSearchResult, NCT_ID_PATTERN)
- /lib/schemas.ts — Zod schemas (createTrialSchema, updateTrialSchema)
- /lib/logger.ts — Structured JSON logging (logger.info/warn/error)
- /lib/hooks.ts — React hooks (useTrialById)
- /lib/constants.ts — Shared constants (PHASES, STATUSES, STATUS_COLORS, PHASE_COLORS)
- /lib/types.ts — TypeScript types (Trial, UpdateTrialData)

## API Routes
- GET/POST /api/trials — list all trials, create trial
- GET/PUT/DELETE /api/trials/[id] — single trial CRUD
- GET /api/ctgov/[nctId] — proxy lookup to ClinicalTrials.gov by NCT ID
- GET /api/ctgov/search?q=... — proxy keyword search to ClinicalTrials.gov (max 5 results)

## ClinicalTrials.gov Integration
- Unified smart input in trial form: auto-detects NCT ID vs keyword search
- NCT ID (matches /^NCT\d{8,11}$/i) → direct lookup, instant auto-fill
- Keywords → search API, dropdown with up to 5 results to pick from
- Only fills empty form fields — never overwrites user input
- Field mapping from API: briefTitle→trialName, phases→phase,
  enrollmentInfo.count→sampleSize, conditions→indication,
  leadSponsor.name→sponsor, primaryOutcomes[0].measure→primaryEndpoint,
  overallStatus→status
- Works on both New Trial and Edit Trial pages

## Database Structure (Firestore)
Collection: trials
Document fields:
- id: string (auto-generated Firestore document ID)
- nctId: string (unique, e.g. "NCT04280705")
- trialName: string (required)
- phase: string (I, II, III, IV, N/A)
- sampleSize: number
- indication: string (therapeutic area)
- sponsor: string
- primaryEndpoint: string
- status: string (Recruiting, Active, Completed, Terminated, Unknown)
- notes: string
- createdAt: Timestamp (Firestore server timestamp)
- updatedAt: Timestamp (Firestore server timestamp)

## Search Strategy
- Client-side filtering for V1 (fetch all, filter in browser)
- Filter by phase: exact match on phase field
- Search: case-insensitive match on trialName and nctId
- Upgrade to Algolia in V2 if collection exceeds 500 documents

## Code Style
- Functional components only, no class components
- async/await everywhere, never raw promises
- Every API route needs try/catch with Zod validation and structured logging
- Files in kebab-case: trial-card.tsx
- Components in PascalCase: TrialCard
- Keep files under 200 lines — split if longer
- No inline styles — Tailwind classes only
- Use CSS custom properties for brand colors, not hardcoded hex values
- Form state consolidated into single useState object, not separate useState per field

## UI Approach
- Mobile-first: design for 375px width first, scale up
- Minimum tap target size: 44px on all buttons and inputs
- Navigation: sticky top nav, "Add Trial" button thumb-accessible
- Cards: single column mobile, 2 col tablet, 3 col desktop
- Forms: full-width inputs, large labels, no side-by-side fields
- Error banners: use ErrorBanner component, not inline div markup

## Build Commands
- Dev server: npm run dev
- Type check (safe while dev server runs): npx tsc --noEmit
- Build check: npm run build (do NOT run while dev server is active — overwrites .next)
- Lint: npm run lint
- Deploy: vercel --prod

## Deployment Notes
- Vercel project: sahasands-projects/trialvault
- Vercel CLI linked via `vercel link`
- Environment variables set via `printf` (not `echo`) to avoid trailing newlines
- 6 NEXT_PUBLIC_FIREBASE_* env vars configured for production, preview, and development
- Auto-deploys from GitHub are connected
- Delete confirmation requires typing trial name to prevent accidental deletions

## Important Constraints
- Do NOT modify working features when adding new ones
- Always verify dev server runs after changes
- Do NOT run `npm run build` while dev server is running — use `npx tsc --noEmit` instead
- Ask before installing new dependencies
- No authentication logic anywhere in V1
- All form fields validate before submission
- NCT ID stored uppercase and trimmed
- Never commit .env.local or firebase service account keys
- Clear .next cache (rm -rf .next) when dev server shows stale 404s
- When adding Vercel env vars via CLI, use `printf` not `echo` to avoid trailing newlines

## Current Status
- Phase: B (Core Features)
- Completed: Project setup, CRUD, ClinicalTrials.gov import (NCT ID + keyword search), code quality improvements (Zod, shared constants, ErrorBanner, logger, custom hooks), enhanced trial cards (status accent bars, conditional fields, relative timestamps), soft delete confirmation, brief title display on detail page, Vercel deployment with Firebase env vars
- In Progress: Nothing
- Blocked: Nothing
