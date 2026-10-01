# Application Workspace

The authenticated shell adapts the reference image’s three-panel composition to store operations. TindaTrack is an operational application rather than a page builder: the central surface is the working page, and the inspector shows record details and relevant workflow guidance. There are no simulated publishing, device-preview, or layout-editing controls.

## Structure

- A 56px top bar holds the brand, current navigation context, and New Sale action.
- The 224px left sidebar groups the existing role-aware routes and keeps account/sign-out controls at the bottom.
- The central workspace uses the documented background token and a bordered, lightly elevated page surface with a maximum width of 832px. It remains constrained when the inspector has no selected record.
- The 280px right inspector remains structurally present on desktop. Dashboard stock rows and Inventory’s View stock details controls show a selected product’s name, SKU, quantity, reorder level, and stock status. Without a selection, the panel shows a clear empty state and current-page guidance.

Inspector stock information is read-only. Quantities change through the existing sale, receipt, and adjustment workflows. Related links are filtered through the same role-aware navigation configuration; staff do not gain access to reports, adjustments, management, or audit routes.

Selected records use compact label/value property rows grouped under General and Stock. Inventory selections also show the existing category and selling price. Dashboard selections expose only the stock fields supplied by its API, preserving staff financial visibility. The property rows use semantic definition lists; their surfaces do not imply editable inputs.

Route changes move keyboard focus to the working page, while closing a sheet restores focus through the native dialog behavior. Soft status surfaces use darker labels and semantic color dots to preserve text contrast without altering the palette.

## Responsive behavior

| Viewport | Navigation | Inspector | Central surface |
| --- | --- | --- | --- |
| Below 768px | Left modal sheet | Right modal sheet | Full-width working page without a device frame |
| 768–1279px | Persistent sidebar | Right modal sheet | Framed and constrained; reduced outer spacing |
| 1280px and above | Persistent sidebar | Persistent inspector | Framed and constrained, with whitespace around it |

The outer shell gains a modest border and inset at 1024px. The center remains the dominant column; three columns are introduced only when enough space exists. The canvas, navigation list, and inspector scroll independently. Mobile sheets use native dialogs for keyboard focus containment, Escape dismissal, and focus restoration. Opening a selected product automatically shows the inspector sheet below 1280px. Context and sheet state reset when navigating to a different route.

Dashboard uses container queries on the page content. The primary metric row becomes two columns at 384px of content width, staff secondary metrics become three columns at 480px, owner secondary metrics become four columns at 608px, and the attention/actions sections sit side by side at 672px. These widths account for both side panels.

Inventory shares the page container, header, and loading/error/empty states. Its product collection becomes two columns at 576px of content width and remains one column on narrow surfaces. Search and low-stock filtering are unchanged. The sticky filter bar consumes the page-padding token so its borders align with the preview at each breakpoint.

## Design system

Colors remain those in [ui-color-theme.md](ui-color-theme.md), using semantic variables and utilities. Legacy pages now consume those tokens instead of green primary buttons and hard-coded slate/red/amber families. Success, warning, and danger colors retain their semantic purposes.

The color document lists secondary text as `#47464D` in prose and `#303038` in its semantic CSS example. This implementation follows the documented `--secondary-foreground: #303038` token, consistent with the existing application; the palette document itself remains unchanged.

The compact sans-serif scale, weight rules, and form-control defaults are documented in [project-typography system.md](project-typography%20system.md) and implemented in `client/src/index.css`. Shared cards and buttons use modest 8px corners. All primary click targets remain at least 44px tall.

## Browser review

Check 360px, 390px, 768px, 1024px, 1280px, and 1440px with owner and staff accounts. Review long product names and SKUs, scroll behavior, empty/loading/error states, selected-product highlighting, and sheets opened from both the header and a product. Verify Tab containment, Escape/backdrop dismissal, restored focus, and resizing an open sheet across its persistent-panel breakpoint. Existing operational forms should also be checked after the semantic color and typography migration.
