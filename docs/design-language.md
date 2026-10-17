# Ansilum design language

Ansilum is a merchant operations console. The interface is quiet so the
merchant's data can be loud. Tokens live in `src/styles/theme.css`; keep this
document in sync with it.

## Principles

- **Data over chrome.** Every border, surface, colour and icon needs a reason.
- **Hierarchy through type and layout,** not through more boxes. No card inside a card.
- **Density without crowding.** Console-sized controls for a mouse, 44px targets on touch.
- **Orange is an accent,** not a theme: the key data series, the active tab, focus.
- **Colour follows meaning.** Status colours come from what a state means, never decoration.

## Tokens

| Group     | Tokens                                                                     | Use                                                      |
| --------- | -------------------------------------------------------------------------- | -------------------------------------------------------- |
| Surfaces  | `background` → `card` → `surface-subtle` → `surface-hover` → `surface-selected`, `popover` | Elevation by luminosity. Overlays use `popover`.          |
| Lines     | `border` (= `divider`), `divider-strong`, `input`                           | Hairlines between regions; `divider-strong` for controls. |
| Text      | `foreground`, `fg-secondary`, `fg-muted`                                   | Primary, supporting, metadata (all ≥ 4.5:1).              |
| Status    | `status-success`, `status-warning`, `status-danger`, `status-info`         | Text, icons and 10% tints. Use `STATUS_TONE` for badges.  |
| Data      | `series-primary`, `series-neutral`, `chart-grid`                           | Key series, baseline or de-emphasis, solid gridlines.     |
| Shell     | `--app-header-height` (56px), `shadow-overlay`                             | Only floating layers cast a shadow.                       |

`warning` / `success` (sun, leaf) are fills with their `-foreground` text, never
text colours on their own.

## Geometry and type

- Radius: controls `rounded-md` (6px), surfaces `rounded-lg` (8px); nothing above 12px.
  Pills only for statuses, tags and avatars.
- Spacing scale: 4, 8, 12, 16, 24, 32.
- Type: page title 20px semibold · section title 14px semibold · metric value 24px
  semibold · body 14px · tables and controls 13px · metadata 12px.
  Sentence case everywhere; no uppercase micro-headings.
- Controls: 36px default, 32px (`size='sm'`) in toolbars and tables; touch gets 44px.

## Primitives

| Need                         | Use                                                                   |
| ---------------------------- | --------------------------------------------------------------------- |
| Page title + scope           | `PageHeader` (`description` or `meta`, `actions`)                     |
| Query scope (outlet, range)  | `ContextToolbar` + `OutletSelect` + `DateRangePicker` (`sticky` on long pages) |
| Analytical surface           | `DataPanel`, regions split by `divider` hairlines                     |
| Region heading               | `SectionHeader`                                                       |
| Headline numbers             | `MetricGroup` + `Metric` + `Delta` (one strip, not tiles)             |
| Page sections                | `Tabs` with `TabsList variant='line'`                                 |
| Switching a view             | `SegmentedControl`, or default `Tabs`                                 |
| Record status                | `Badge` with a `STATUS_TONE` class                                    |
| No data / failure / refresh  | `EmptyState`, `ErrorState` (with retry), `DataFreshness`              |

## Charts

One axis per chart. One series = one colour (`series-primary`); a comparison or
de-emphasised series uses `series-neutral` and a different mark. Solid
`chart-grid` gridlines, `fg-muted` ticks, bars ≤ 24px with 4px rounded ends,
a tooltip with every value at that point, a legend for two or more series, and
a table view where the values matter. Hold the previous render dimmed while
refetching.

## Copy

Precise and operational: "Total sales", "Average order value", "Previous period",
"No sales in this period." Avoid marketing phrasing ("Understand your business").
