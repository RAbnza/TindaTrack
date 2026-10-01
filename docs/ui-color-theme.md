# UI Color Theme: Storefront Slate

## Design Direction

The application should use a restrained, professional, Material-inspired visual system with shadcn-style semantic color tokens.

The theme should feel:
- calm
- operational
- modern
- mobile-friendly
- cohesive
- soft rather than highly saturated
- visually polished without looking overly decorative

The primary visual identity is:

**warm neutral surfaces + dusty blue-violet primary + muted semantic colors**

Do not use bright green as the brand color.
Green is reserved only for success states.

Avoid rainbow dashboards, highly saturated Tailwind colors, and feature-specific card colors.

---

## Core Palette

### Primary / Brand

Primary:
- `#5367A6`

Primary Hover:
- `#43558F`

Primary Soft / Accent:
- `#E8EBF7`

Primary Foreground:
- `#FFFFFF`

Use primary for:
- main CTAs
- active navigation
- selected rows/items
- focus rings
- active tabs
- important interactive emphasis

Do not use primary excessively for ordinary text or decorative surfaces.

---

### Backgrounds and Surfaces

Application Background:
- `#F8F7FA`

Card / Surface:
- `#FFFFFF`

Secondary Surface:
- `#F1F0F4`

Muted Surface:
- `#ECEBF0`

The majority of the UI should remain neutral.

Cards, panels, tables, forms, dashboards, and data-heavy views should primarily use neutral surfaces rather than semantic colors.

---

## Borders and Inputs

Default Border:
- `#DDDCE3`

Input Border:
- `#CBCAD2`

Focus Ring:
- `#6679B7`

Borders should remain subtle.

Do not use strong borders to separate every element.
Prefer spacing, background contrast, and typography before increasing border intensity.

---

## Text Hierarchy

Primary Text / Foreground:
- `#1B1B1F`

Secondary Text:
- `#47464D`

Muted Text:
- `#74737C`

Disabled / Placeholder Text:
- `#9A99A2`

Text rules:

- Main headings and important values → primary foreground
- Body text → primary or secondary text
- Labels and supporting information → secondary text
- Metadata, helper text, timestamps → muted text
- Disabled text and placeholders → disabled text

Avoid pure black (`#000000`).

---

## Semantic Colors

Semantic colors communicate application state.
They are not decorative brand colors.

### Success

Success:
- `#3E7C59`

Success Soft:
- `#E4F1E8`

Success Foreground:
- `#FFFFFF`

Use for:
- successful sale
- stock received
- saved successfully
- completed transaction
- positive status
- positive trend
- active confirmation

Do not use green for primary buttons.

---

### Warning

Warning:
- `#A96C16`

Warning Soft:
- `#FAECD6`

Warning Foreground:
- `#FFFFFF`

Use for:
- low stock
- reorder threshold
- attention required
- potentially risky action
- non-blocking warning

Warning states should usually use subtle backgrounds with amber text rather than large solid amber surfaces.

---

### Danger / Destructive

Danger:
- `#B84A4A`

Danger Soft:
- `#F8E3E3`

Danger Foreground:
- `#FFFFFF`

Use for:
- validation errors
- failed operations
- destructive actions
- deactivation
- insufficient stock
- transaction failure

Reserve solid destructive buttons for actions that actually modify or remove important data.

---

### Information

Info:
- `#3F6F9F`

Info Soft:
- `#E3EDF6`

Use for:
- informational banners
- neutral system messages
- instructional callouts
- contextual help

Do not use info blue as a second primary brand color.

---

# Semantic CSS Tokens

Use semantic tokens throughout the application instead of hardcoding Tailwind color families directly into components.

```css
:root {
  --background: #f8f7fa;
  --foreground: #1b1b1f;

  --card: #ffffff;
  --card-foreground: #1b1b1f;

  --popover: #ffffff;
  --popover-foreground: #1b1b1f;

  --primary: #5367a6;
  --primary-foreground: #ffffff;

  --secondary: #f1f0f4;
  --secondary-foreground: #303038;

  --muted: #ecebf0;
  --muted-foreground: #74737c;

  --accent: #e8ebf7;
  --accent-foreground: #354477;

  --destructive: #b84a4a;
  --destructive-foreground: #ffffff;

  --border: #dddce3;
  --input: #cbcad2;
  --ring: #6679b7;

  --success: #3e7c59;
  --success-soft: #e4f1e8;

  --warning: #a96c16;
  --warning-soft: #faecd6;

  --info: #3f6f9f;
  --info-soft: #e3edf6;

  --radius: 0.75rem;
}