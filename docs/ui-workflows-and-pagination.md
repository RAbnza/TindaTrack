# Transaction Workspaces and Database Pagination

## Interaction model

New Sale and Receive Stock separate **Browse products** from **Selected items** through shared view buttons. Browsing offers name/SKU search, category text filtering, and name/SKU sorting. A selected catalog row displays Selected and cannot add duplicates; out-of-stock products cannot be added to a sale.

The selected workspace uses compact editable rows with direct whole-quantity entry, increment/decrement, removal, and receiving unit cost. Ten rows display by default, with 25/50 options and a bounded scrolling region. Local item pagination affects presentation only: totals, validation, and submission include every selected item, including items on other pages. Item page boundaries clamp after removal.

Adjust Stock keeps the API's single-product model. Direction/reason remain compact and visible. A product's quantity and projected resulting stock appear in the selected workspace and summary. Reductions still require the existing confirmation dialog.

On desktop the summary uses the AppShell's existing right panel, independently of the bounded product/item workspace. On smaller viewports it is a compact sticky card near the top, with expandable metadata and an accessible final action. This avoids squeezing another column into the center or burying checkout beneath a large cart.

## Read architecture

| Dataset | Pagination | Reason |
| --- | --- | --- |
| Live transaction catalog | API/database, 10 by default | Catalogs can grow; fetch only a page and aggregate stock only for its product IDs |
| Selected transaction items | Client, 10 by default | The transaction draft is already local and must submit/validate all selected rows |
| Audit history | API/database, 25 by default | Unbounded growing evidence |
| Stock movements | API/database, 25 by default | Unbounded growing inventory ledger |
| Daily sales | API/database, 25 by default | Busy days can contain many transactions; aggregates cover the entire day |
| Explicit daily CSV/print | Full-day read on demand | Preserve complete historical exports; normal page visits do not load the whole day |

Authenticated layout no longer fetches the full catalog globally. Inventory and Product Management continue to use their existing full read locally; transaction/history routes use paginated endpoints. Injected transaction catalogs remain supported for embeddings and existing component tests and are bounded through local paging.

The new endpoints are additive, leaving existing public array/report contracts intact:

- `GET /api/products/browse`: page, pageSize, search, category, sort=name|sku.
- `GET /api/products/selection?ids=...`: up to 100 IDs per batch; refresh selected snapshots and ledger stock, including inactive records for validation.
- `GET /api/audit-logs/browse`: page, pageSize, search (actor/action/entity or numeric entity ID), filter=ALL|SALES|RECEIPTS|ADJUSTMENTS, from, to.
- `GET /api/stock-movements/browse`: page, pageSize, search (product/SKU), filter=ALL|RECEIPT|SALE|ADJUSTMENT, from, to.
- `GET /api/reports/daily-sales/browse`: date, page, pageSize.

Paged reads return `pagination: { page, pageSize, total, totalPages }`, with `items` for catalog/history or `sales` and whole-day aggregates for reports. Page sizes are bounded to 100; UI choices are 10/25/50. Out-of-range pages clamp to the last page. Stable ordering adds ID tie-breakers. Count, rows, and stock/report aggregates share a repeatable-read snapshot within each request. Records may shift across requests if other users insert data; this is standard offset pagination rather than a cross-request frozen snapshot.

Filters are validated, applied before database pagination, and reset the UI page to one. Date boundaries use inclusive-from/exclusive-after-through Manila business days. No unsupported sale status or invented transaction reference filter was added.

The index migration `20261002090000_workspace_pagination_indexes` supports active-product ordering and history/report ordering/filtering. Apply through the existing migration deployment workflow when releasing the backend. It has not been applied to the deployed database by this UI task. Offset queries bound response/memory use; very deep pages and contains searches can still scan records. Cursor/streaming exports can be considered if production volumes justify them.

## State and correctness

Search/filter requests are debounced by 200ms and superseded requests are aborted; late responses are ignored. Product snapshots retained in the draft survive page/filter changes. Explicit refresh uses bounded selected-ID batches instead of fetching the entire catalog or one request per line.

Mutation payloads and server calculations remain authoritative. Sale requests contain only product IDs, quantities, and payment method. Receipt requests keep supplier/reference/quantity/unit-cost values. Adjustment requests keep product/quantity delta/reason. Failed mutations preserve the draft. A failed stock refresh blocks submission and exposes retry. Editing is disabled while a transaction submits.

Daily report pagination does not change its count/total. Print and CSV explicitly fetch all selected-day transactions and preserve historical item prices. Export failures expose an error and leave the visible report intact.

## Shared patterns and verification

Components: TransactionWorkspace, TransactionSummary, ProductBrowser, SelectedItems, HistoryFilters, Pagination, DataTable, Input/Select/FormField, QuantityControl, and card surface variants. Audit evidence is extracted into AuditMetadataView, including its defensive fallback for unknown metadata.

Tests cover the existing three transaction mutations/confirmation, a 50-item cart with off-page validation, catalog selection persistence, rejected-sale stock refresh, server catalog/history pages with 120–135 records, date boundaries, stable ordering, historical prices, role restrictions, and complete-day export/print versus paged screen rows.

Manual review should cover mobile/tablet sticky-summary height, keyboard navigation/quantity editing, table horizontal scrolling, long references, native print layout, and panel relocation on resize. The local browser was actively in use during automation, so input-based responsive review was not forced.
