# Copilot Instructions for joker-sun-stock-main

## Project Overview

- **Architecture:** Vite + React + TypeScript + shadcn-ui + Tailwind CSS. UI components are modularized under `src/components`, with feature-specific folders (e.g., `inventory`, `layout`, `ui`).
- **State & Auth:** Context-based authentication (`src/contexts/AuthContext.tsx`), with protected routes and custom hooks for mobile and toast notifications.
- **Data & Services:** Data flows through service modules in `src/services` (e.g., `inventory.ts`, `sales.ts`, `auth.ts`). Supabase integration is handled via `src/lib/supabase.ts` and `src/services/supabaseClient.ts`.
- **Pages:** Route-level components in `src/pages`, with admin-specific pages in `src/pages/admin`. Uses role-based access control.

## Developer Workflows

- **Start Dev Server:** `npm run dev` (uses Vite for hot-reloading)
- **Build:** `npm run build` or `npm run build:dev` (development mode)
- **Lint:** `npm run lint` (uses ESLint with TypeScript support)
- **Preview:** `npm run preview` (serves production build)
- **Dependencies:** Managed via npm. While there's a `bun.lockb` file, npm is the primary package manager.
- **Lovable Integration:** Project can be edited via Lovable platform at lovable.dev (see project URL in README)

## Project-Specific Conventions

- **Component Aliases:** Path aliases defined in `components.json` (e.g., `@/components`, `@/lib/utils`). Use these for consistent imports.
- **UI Components:** Use shadcn-ui and Radix UI primitives. All common components are in `src/components/ui/`.
- **Forms:** `react-hook-form` + Zod schema validation. See `AdminCredit.tsx` or `CreditSaleModal.tsx` for examples.
- **Notifications:** `sonner` for toasts via custom hook (`src/hooks/use-toast.ts`).
- **Data Visualization:** `recharts` for charts/graphs. Examples in admin dashboard components.
- **Authentication:** Custom auth context with Supabase integration. Protected routes use `ProtectedRoute` component.

## Integration Points

- **Supabase:** Backend data access via Supabase client (`src/lib/supabase.ts`). SQL migrations in `supabase/migrations/`.
- **Routing:** `react-router-dom` v6 with protected routes. Admin routes in `src/pages/admin/`.
- **Database Schema:** Credit sales and inventory tables defined in `.sql` files at root.
- **Feature Organization:** Each major feature (inventory, sales, credit) has:
  - UI components in `src/components/[feature]/`
  - Service layer in `src/services/[feature].ts`
  - Page components in `src/pages/` or `src/pages/admin/`

## Examples

- **Adding New Feature:**
  1. Create component(s) in `src/components/[feature]/`
  2. Add service layer in `src/services/[feature].ts`
  3. Create page component in `src/pages/` or `src/pages/admin/`
  4. Update auth context if needed for new roles/permissions
- **UI Component Example:**
  - Add component to `src/components/ui/`
  - Update `components.json` aliases if needed
  - Follow shadcn-ui patterns for consistent styling

## References

- **Key files:**
  - `src/contexts/AuthContext.tsx` (auth logic)
  - `src/lib/supabase.ts` (Supabase client)
  - `src/services/` (feature services)
  - `src/components/ui/` (UI primitives)
  - `components.json` (aliases)
  - `tailwind.config.ts` (styling)
  - `package.json` (scripts and dependencies)
  - `.sql` files (database schema)

---

If any section is unclear or missing, please provide feedback to improve these instructions.
