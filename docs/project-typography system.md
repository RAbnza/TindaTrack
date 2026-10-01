# Typography System

TindaTrack uses a compact, neutral sans-serif system inspired by the reference workspace interface. Text should support scanning without turning every label into a heading. These rules apply to the shell, inspector, Dashboard, public forms, and existing operational pages.

## Font family

Use the native sans-serif stack throughout the application:

```css
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

This uses the platform’s UI font, including Segoe UI on Windows. The previous implementation declared Inter without loading it. The new system makes the native-font behavior intentional and avoids a remote font dependency. Use a single family for navigation, forms, tables, metrics, and dialogs.

The stack is defined once as `--font-sans` in `client/src/index.css` and consumed by the body. Form controls inherit the family without overriding their size and weight utilities.

## Weights

- **400:** body text, navigation, metadata, helper text.
- **500:** controls, active navigation, labels, product names, important table cells.
- **600:** page and section headings, brand name, dashboard values.

Routine UI does not use 700. Existing `font-bold` utilities resolve to 600 through the shared weight token; updated pages explicitly use `font-semibold`. Preserve hierarchy through size, spacing, and semantic text colors.

## Type scale

All rem values assume the browser’s normal 16px root size; do not override the user’s root font size.

| Role | Tailwind utility / token | Size | Line height | Weight |
| --- | --- | --- | --- | --- |
| Page title | `text-page` / `--text-page` | 22px | 1.35 | 600 |
| Section heading | `text-section` / `--text-section` | 16px | 1.5 | 600 |
| Brand name | `text-brand` / `--text-brand` | 16px | 1.4 | 600 |
| Body and form label | `text-sm` | 14px | 1.5 | 400 / 500 |
| Navigation and compact chrome | `text-ui` / `--text-ui` | 13px | 1.45 | 400 / 500 |
| Caption, SKU, helper text | `text-caption` / `--text-caption` | 12px | 1.5 | 400 |
| Standard dashboard value | `text-metric` / `--text-metric` | 24px | 1.25 | 600 |
| Primary dashboard value | `text-metric-primary` / `--text-metric-primary` | 30px | 1.25 | 600 |
| Mobile input | Base input style / `text-base` | 16px | 1.5 | 400 |

The semantic utilities are defined in Tailwind’s inline theme. Prefer them when modifying shared chrome or Dashboard. Existing utilities remain available: `text-lg` is 17px, `text-xl` is 20px, `text-2xl` is 22px, `text-3xl` is 30px, and `text-4xl` is 32px. These aliases keep older pages within the same restrained scale.

Use 12px only for short metadata. Instructions, errors, body copy, and form labels should normally stay at 14px. Do not shrink text to fit a crowded layout; allow wrapping or collapse secondary panels.

## Forms and controls

Labels and buttons use 14px / 500. The shell may use 13px for short navigation or compact action labels. Targets remain at least 44px tall; compact typography does not mean tiny hit areas.

Inputs, textareas, and selects default to 16px on mobile and 14px at widths of 768px and above. An explicit `text-base` utility may keep a form at 16px on desktop, including Login and Setup. Base control rules live in `@layer base` so they do not silently override utility font sizes or weights.

Errors remain near the relevant form and use the existing destructive text token. Helper text uses 12px or 14px and comfortable line height.

## Tables, records, and numeric values

Use 12px / 500 for short table headers and 14px / 400 for table bodies. Product titles use 14px or 16px / 500–600. Use `tabular-nums` for prices, quantities, totals, and dashboard values.

Keep identifiers readable: allow SKUs and long record names to wrap rather than widening the workspace. Numeric emphasis should come from size and weight; warning and danger accents communicate stock state.

## Tracking and colors

Headings may use slightly tight tracking. Body text and controls use normal tracking. Avoid decorative uppercase and wide tracking for everyday navigation or metadata.

Use the semantic colors defined by [UI Color Theme: Storefront Slate](ui-color-theme.md):

- Headings and important values: `text-foreground`.
- Body text and labels: `text-secondary-foreground` or `text-foreground`.
- Short supporting metadata: `text-muted-foreground`.
- Disabled text and placeholders: `text-disabled-foreground`.
- Selected navigation: `text-accent-foreground` with `bg-accent`.

The documented color palette is unchanged. Typography changes do not introduce a new brand color.

Small text on soft semantic backgrounds uses the existing secondary foreground for readable contrast. Status badges retain their semantic background and colored dot, along with an explicit status label. Muted text remains suitable on white surfaces; use secondary foreground for helpers on the application background.

## Implementation examples

```tsx
<h1 className="text-page font-semibold tracking-tight">Dashboard</h1>
<h2 className="text-section font-semibold">Needs attention</h2>
<p className="text-sm leading-6 text-secondary-foreground">Store overview</p>
<span className="text-caption text-muted-foreground">SKU: COKE-1L</span>
<p className="text-metric-primary font-semibold tabular-nums">₱4,820.50</p>
```

Dashboard layout responds to the actual width of its page container, rather than the browser width alone. This preserves readable text when the left navigation and inspector reduce the central workspace.
