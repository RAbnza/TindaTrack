# Typography System

## Primary Font

Use:

Inter

Fallback stack:

font-family:
  "Inter",
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;

Inter should be used throughout the application for:

- navigation
- forms
- tables
- dashboard metrics
- buttons
- dialogs
- badges
- labels
- reports
- body text

Do not mix multiple font families unless there is a strong design reason.

---

## Font Personality

The typography should feel:

- clean
- practical
- modern
- readable
- neutral
- professional
- compact without feeling cramped

Avoid fonts that feel:

- overly futuristic
- playful
- handwritten
- strongly geometric
- editorial
- decorative

This is an operational business application, not a marketing website.

---

## Font Weights

Use a restrained weight scale.

Regular:
- 400

Medium:
- 500

Semibold:
- 600

Bold:
- 700

Avoid excessive use of bold.

Default body text:
- 400

Labels and buttons:
- 500

Section headings:
- 600

Important dashboard numbers:
- 600 or 700

---

## Type Scale

### Page Title

Examples:
- Products
- Inventory
- Sales
- Dashboard

Size:
- 24px–28px

Weight:
- 600

Line height:
- 1.2

Example:

text-2xl font-semibold tracking-tight

---

### Section Heading

Examples:
- Product Details
- Recent Sales
- Low Stock
- Stock Movements

Size:
- 18px–20px

Weight:
- 600

Example:

text-lg font-semibold

or

text-xl font-semibold

---

### Card Title

Size:
- 14px–16px

Weight:
- 500 or 600

Color:
- primary foreground

Example:

text-sm font-medium

or

text-base font-semibold

---

### Body Text

Size:
- 14px–16px

Weight:
- 400

Line height:
- 1.5–1.6

Recommended default:

text-sm

for dense application UI.

Use:

text-base

for longer explanatory content.

---

### Labels

Size:
- 13px–14px

Weight:
- 500

Example:

text-sm font-medium

Labels should be clear but visually quieter than headings.

---

### Muted / Helper Text

Size:
- 12px–14px

Weight:
- 400

Color:
- muted foreground

Example:

text-xs text-muted-foreground

or

text-sm text-muted-foreground

Use for:

- timestamps
- helper text
- SKU
- metadata
- descriptions
- secondary information

---

## Dashboard Numbers

Important numeric values should receive stronger hierarchy without becoming oversized.

Examples:

₱8,420.00
127
14 items

Recommended:

text-2xl font-semibold tracking-tight

Large dashboard value:

text-3xl font-semibold tracking-tight

Avoid giant 48px+ dashboard numbers unless the screen specifically needs them.

---

## Tables

Table header:

text-xs font-medium
text-muted-foreground

Optional:

uppercase tracking-wide

Use uppercase sparingly.

Table body:

text-sm font-normal

Important cells:

text-sm font-medium

Numeric values should be easy to scan.

Where supported, use tabular numbers:

font-variant-numeric: tabular-nums;

This is especially useful for:

- prices
- quantities
- totals
- transaction values
- dates

---

## Buttons

Button text:

14px

Weight:
500

Example:

text-sm font-medium

Do not use bold button text by default.

Button labels should be short and action-oriented.

Examples:

Add Product
Complete Sale
Save Changes
Receive Stock

---

## Inputs

Input text:

14px–16px

Mobile inputs should preferably use at least:

16px

when necessary to avoid mobile browser zoom behavior.

Labels:

14px / 500

Helper text:

12px–14px / 400

Error text:

12px–14px / 400 or 500

---

## Letter Spacing

Use normal or slightly tighter tracking for large headings.

Headings:

tracking-tight

Body:

tracking-normal

Small uppercase labels:

tracking-wide

Do not use exaggerated letter spacing throughout the application.

---

## Line Height

Heading:
1.2–1.3

Body:
1.5–1.6

Compact UI:
1.4

Avoid extremely tight line-height on mobile.

---

## Recommended Tailwind Defaults

Application:

className="font-sans text-sm text-foreground"

Page title:

className="text-2xl font-semibold tracking-tight"

Section heading:

className="text-lg font-semibold tracking-tight"

Body:

className="text-sm leading-6"

Muted:

className="text-sm text-muted-foreground"

Label:

className="text-sm font-medium"

Button:

className="text-sm font-medium"

Dashboard number:

className="text-2xl font-semibold tracking-tight tabular-nums"

Table header:

className="text-xs font-medium text-muted-foreground"

Table cell:

className="text-sm"

Numeric table cell:

className="text-sm tabular-nums"

---

## Overall Typography Rule

The typography should support scanning, not compete for attention.

Use hierarchy through:

1. size
2. weight
3. color
4. spacing

Do not rely on bold text everywhere.

When unsure:

- use Inter
- use `text-sm`
- use `font-normal`
- use `font-medium` for controls
- use `font-semibold` for headings
- use `text-muted-foreground` for secondary information