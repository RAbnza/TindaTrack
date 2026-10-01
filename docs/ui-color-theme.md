# UI Color Theme: Harbor Blue

The operational theme combines a deep blue brand, cool ink text, blue-gray canvas, and gently tinted work surfaces. It gives navigation, selected products, summaries, and important metrics a recognizable identity while keeping data tables readable.

The implementation lives in `client/src/index.css`. Layout patterns in `client/src/workspace.css` consume the same tokens; they do not define another palette.

## Semantic tokens

| Token | Value | Purpose |
| --- | --- | --- |
| background | #EDF1F6 | Workspace canvas |
| foreground / card-foreground / popover-foreground | #182C42 | Headings and primary text |
| card / popover | #FFFFFF | Elevated editable and record surfaces |
| primary | #3157A0 | Primary actions, key metrics, interactive emphasis |
| primary-hover | #254580 | Primary hover |
| primary-foreground | #FFFFFF | Text on primary actions |
| secondary | #E8EDF5 | Table headers, secondary sections |
| secondary-foreground | #40546B | Body text, field labels, status labels |
| muted | #DFE6EF | Quiet surface contrast |
| muted-foreground | #53647A | Supporting metadata |
| accent | #DCE7FB | Active navigation, selected rows, primary metric surfaces |
| accent-foreground | #254580 | Text on selected surfaces |
| surface-tint | #F0F4FB | Summary panels, filters, contextual areas |
| navigation | #E6EDF8 | Persistent navigation identity |
| border | #CAD5E3 | Restrained structural dividers |
| input | #7C8DA6 | Identifiable form-control boundaries |
| ring | #3157A0 | Keyboard focus |
| success / success-soft | #256345 / #E0F1E8 | Successful or positive inventory states |
| warning / warning-soft | #86520E / #FFF0D7 | Low stock or attention |
| destructive / destructive-soft | #A53043 / #FCE9ED | Errors, reductions, destructive actions |
| destructive-foreground | #FFFFFF | Solid destructive-action labels |
| info / info-soft | #235F87 / #E0EFF9 | Informational states |
| disabled-foreground | #63738A | Placeholders and unavailable controls |

## Usage

- Keep forms and record bodies on white; use tinted filters, headers, and summaries to separate their jobs.
- Use the primary brand for interactions and selected states. Green belongs to success, rather than the default action.
- Selected catalog rows combine an accent surface, a primary edge, and the word Selected. Stock status combines text and color.
- Shared badges retain dark labels with semantic dots. Status does not rely on color alone.
- Cards expose default, tint, and accent surface variants. Avoid conflicting background utilities on a card.
- Use solid destructive buttons only for actions that reduce/remove data; errors use a soft surface or explicit text.
- Avoid feature-specific palettes, strong gradients, neon surfaces, and colored table bodies.

## Contrast and typography

Primary on white is approximately 7.00:1; white on primary is the same. Ink text on white is 14.21:1, secondary text is 7.78:1, and muted text is 6.05:1. Muted text on the tinted surface is 5.48:1. Success, warning, destructive, and informational text on their corresponding soft surfaces measure 6.07:1, 5.79:1, 5.81:1, and 5.85:1 respectively.

These values exceed WCAG AA's 4.5:1 threshold for ordinary text in these combinations. Disabled controls are visually distinct; focus rings and input borders use stronger contrast than structural borders.

The native sans-serif scale remains the existing documented system in [project-typography system.md](project-typography%20system.md). The redesign changes semantic colors and surface hierarchy rather than introducing a second typography system.
