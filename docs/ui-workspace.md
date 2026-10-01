# Application Workspace

TindaTrack adapts the reference image's three-panel composition to store operations. Its center contains the working page; the right panel contains useful record details or the current transaction summary.

## Structure

- A 56px top bar holds the brand, route context, and New Sale action.
- The 224px left sidebar groups role-aware routes and account controls.
- The central canvas contains a bordered working surface with a maximum width of 832px.
- The 280px inspector contains product details on Dashboard/Inventory, a live summary on New Sale/Receive Stock/Adjust Stock, or relevant guidance on other pages.

Transaction pages reuse the existing inspector through a React portal. They do not add a fourth column or duplicate checkout controls. Transaction state remains owned by the page. Related navigation and route access keep the existing owner/staff boundaries.

Dashboard and Inventory selections remain read-only. Inventory details expose the existing selling price/category, while Dashboard uses only its supplied stock fields. Staff do not gain owner metrics or report access.

## Responsive behavior

| Viewport | Navigation | Context |
| --- | --- | --- |
| Below 768px | Left modal sheet | Product details in a right sheet; transaction summary within the page |
| 768–1279px | Persistent sidebar | Product details in a right sheet; transaction summary within the page |
| 1280px and above | Persistent sidebar | Persistent right details/transaction panel |

On tablet/mobile, the transaction summary is a compact sticky card before the item workspace. Item count, units, estimate, validation, and final action remain accessible. Metadata can be expanded through Details. Catalog browsing and selected-item editing are separate views at every size, with internal scrolling and pagination.

The inspector's generic Details button is hidden on transaction routes because their summary is already visible. Desktop resizing moves the same summary to/from the inspector. Route changes reset workspace context and move focus to the working page. Native navigation/product sheets retain focus containment, Escape dismissal, and focus restoration.

Dashboard/Inventory retain their existing container-query layouts. New filter grids respond to actual content width: at 480px they use horizontal space; below that controls stack. History tables have independently scrollable horizontal/vertical regions, sticky headers, and bounded pages.

## Design system

The palette and its implementation are synchronized in [ui-color-theme.md](ui-color-theme.md). Navigation uses a blue-gray tint; summaries and filter sections use a quieter tinted surface; selected records use an accent surface and primary edge. Existing typography remains documented in [project-typography system.md](project-typography%20system.md).

Shared buttons and cards use modest 8px corners. Primary targets remain at least 44px. Shared field controls, pagination, table regions, quantity controls, and workflow surfaces live under `client/src/components`.

Workflow and API decisions are documented in [ui-workflows-and-pagination.md](ui-workflows-and-pagination.md).

## Browser review

Review 360px, 390px, 768px, 1024px, 1280px, and 1440px with owner/staff accounts. Check long product names and references, catalog/selected-item scroll boundaries, direct quantity entry, cost validation on another item page, error/retry states, and summary resizing.

Check table horizontal scrolling, keyboard access to pagination/evidence/details, sheets and reduction confirmation, full-day CSV/print, and browser print pagination. Desktop visual inspection was possible; a complete mobile/tablet and cross-browser pass remains a manual QA item.
