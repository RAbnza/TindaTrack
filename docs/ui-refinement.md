# Visual refinement: October 2026

This pass follows the updated redesign brief: presentation changes only. The existing Harbor Blue palette, AppShell, routes, data sources, permissions, calculations, validation, and submission handlers remain in place. No backend, API, database, deployment, dependency, or pagination behavior changes were made.

## Shared components and tokens

All components in `client/src/components/ui/` were inspected. Buttons, cards, badges, inputs/selects, page headers, quantity controls, pagination, loading/empty/error states, confirmation dialogs, and toast presentation were refined. DataTable inherits the improved table styling; context and toast hooks retain their original behavior.

- Controls use an 8px radius, cards 12px, and floating surfaces 16px. Existing page spacing and typography tokens remain the foundation.
- `design-system.css` defines subtle, elevated, floating, and overlay shadows, plus 140ms/220ms motion timings.
- Buttons have light top highlights, controlled shadows, hover feedback, pressed feedback, keyboard focus rings, and existing disabled/loading behavior. Display styling now lives in the component CSS layer so Tailwind visibility utilities can override it reliably.
- Badges use rounded status shapes and the existing semantic foreground colors. Labels remain visible alongside the status dots.
- Fields have consistent borders, inset depth, focus treatment, and optional leading icons. The existing Input API is preserved with an optional presentation-only `icon` prop. Search fields receive a search icon automatically.
- `IconTile` is a reusable presentation component with primary, neutral, success, warning, danger, and information tones. PageHeader accepts an optional icon.
- Tables retain their original contents and behavior, with subtle row hover/focus highlighting. Pagination gains directional icons while preserving callbacks, page sizes, and accessible labels.

## Floating workspace and shell

The existing center `.page-preview` remains inside AppShell. On tablet and desktop, it has a near-opaque light surface, a white border highlight, a shared floating shadow, and modest 10px backdrop blur over two faint canvas tints. Cards inside remain opaque. The unsupported-filter fallback uses a near-opaque surface with the same border and shadow. Mobile uses a solid tinted surface and the existing collapsed navigation/detail panels.

Navigation and inspector surfaces have restrained tonal gradients. The active navigation item receives an inset selection marker. The previous transaction-page fix remains intact: New Sale, Receive Stock, and Adjust Stock do not render the unused workspace-details toggle.

Print styling removes blur, effects, and motion and keeps the existing receipt/report print rules.

## Icons and motion

The existing `AppIcon` SVG family was extended rather than introducing a library. Every icon uses the same 24px view box, 1.7px outline, and decorative `aria-hidden` treatment alongside visible text.

Icons reinforce page headings, metric categories, quick actions, stock cards, search/filter controls, pagination, transaction browsing/selection/actions, summary details, empty/error/toast states, public capabilities, and account fields. No external assets or icon dependencies were added.

Motion is limited to control hover/press states, selection and row highlights, a short workspace entrance, dialog/drawer/toast entrances, and the summary-details chevron. Loading spinners retain their existing purpose. Closing overlays and submitting forms are not delayed by animation. `prefers-reduced-motion: reduce` disables transitions, animations, and smooth scrolling, including loading-spinner rotation.

## Screens

| Area | Presentation changes | Preserved behavior |
| --- | --- | --- |
| Dashboard | Featured sales surface, metric icons and tones, clearer section headings, recognizable quick actions | Existing owner/staff metrics, formatting, low-stock list, selection, role-aware destinations |
| Inventory | Compact sticky search/filter panel, result-count icon, clearer product identities and categories, grouped price/stock blocks, selected-card depth | Name/SKU search, low-stock filter, supplied product values, detail selection |
| Landing | Shared brand mark, balanced hero, labeled example stock preview, capability icons, role cards, tinted sign-in call to action | Existing `/`, `/login`, and `#capabilities` destinations and actual product capabilities |
| Login | Shared split layout, focused form surface, email/password icons, clearer support text | Original heading, input names/types/autocomplete, required fields, authentication handler, loading/errors, links |
| Initial setup | Same account layout, first-owner identity treatment, field icons and supporting text | Single existing setup step, password constraints/matching, owner payload, conflict handling, sign-in redirect |
| Other workspaces | Shared primitives, consistent heading icons, clearer transaction/summary actions | Existing management, sales, receiving, adjustment, history, export, print, and pagination workflows |

No extra onboarding steps, account flows, analytics, charts, backend queries, or business features were introduced.

Follow-up: New Sale's existing Payment Method selector now appears in the summary action area, immediately above Record Sale. The single selector follows the summary between the desktop right panel and the inline mobile/tablet layout, remaining visible when optional summary details are collapsed. Its methods, state, selection/error handlers, submission lock, validation, and API payload are unchanged. Empty setup wrappers are omitted from workspaces without a setup section.

## Responsive and accessibility choices

The workspace retains its existing navigation and inspector breakpoints and container-based grids. The inventory toolbar stacks until its container has room for an inline filter. Product names wrap and SKU text can break rather than overflow. Dashboard metric grids retain the role-aware layout. Account screens show supporting content beside the form on desktop; smaller screens keep the form as the primary surface. Public sections stack on mobile and expand into grids at larger widths. Pagination controls can wrap. Dialogs have a viewport-bounded scrollable surface.

Existing labels, accessible names, native dialog focus behavior, form semantics, and minimum 44px action targets remain in place. New icons are hidden from assistive technology to prevent duplicate labels. Focus rings remain visible, stock states retain text labels, and semantic color pairs use the existing accessible palette. Cards stay opaque under the glass workspace to keep content readable.

## Validation and review

Existing functional tests were retained without edits. Additional workflow checks cover dashboard data/actions for both roles, inventory name/SKU search/filter/detail selection, and initial setup password matching, exact submission payload, and navigation. The existing tests cover login submission/loading/errors, role routing, sales, receiving, adjustments/confirmation, management dialogs, paginated selections/history, export/print, and summary responsiveness.

Validation: client TypeScript and production build, ESLint, all 28 client tests, and `git diff --check`. The final full test run used `npm.cmd test -- --no-file-parallelism`; all existing assertions and timeout limits were retained. Repetitive product-row button icons were removed to keep large catalog views light and uncluttered.

The local API URL is blank. The existing production API guard then becomes an unconditional throw, so Vite removes the unreachable application screens from the normal local build. The complete UI bundle was also built with a command-scoped `VITE_API_BASE_URL=http://localhost:3000`, and its screen/icon markers were verified in the output. This value was used only for build verification; environment files and deployment settings were not edited. Release builds still need the actual API URL as described in the deployment documentation.

Live visual browser review could not be completed: no browser surface was exposed by the browser connector, and launching the installed review browser returned an app-approval timeout. Still review desktop/tablet/mobile composition, long names/large totals, native dialog/drawer appearance and keyboard focus, reduced-motion behavior, and receipt/report print previews in an actual browser before release. The redesign has not been deployed.

## Main files

- `client/src/design-system.css` and its import in `index.css`
- Shared primitives under `client/src/components/ui/`, including new `IconTile.tsx`
- `client/src/components/AppIcon.tsx`
- `client/src/components/layout/AuthPageLayout.tsx`
- Transaction presentation under `client/src/components/workspace/`
- `client/src/features/inventory/ProductCard.tsx`
- Dashboard, Inventory, Landing, Login, and Setup pages; heading/action icons in the remaining workspace pages
- `client/src/test/presentation-workflows.test.tsx`
