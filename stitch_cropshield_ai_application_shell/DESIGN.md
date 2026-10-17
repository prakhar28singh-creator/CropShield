---
name: Agro-Enterprise Precision
colors:
  surface: '#e8ffef'
  surface-dim: '#c9dfd1'
  surface-bright: '#e8ffef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e2f9ea'
  surface-container: '#ddf3e4'
  surface-container-high: '#d7eedf'
  surface-container-highest: '#d1e8d9'
  on-surface: '#0c1f16'
  on-surface-variant: '#404943'
  inverse-surface: '#21342a'
  inverse-on-surface: '#e0f6e7'
  outline: '#707972'
  outline-variant: '#bfc9c1'
  surface-tint: '#2a6a4b'
  primary: '#054f33'
  on-primary: '#ffffff'
  primary-container: '#276749'
  on-primary-container: '#a1e3bd'
  inverse-primary: '#93d4af'
  secondary: '#566159'
  on-secondary: '#ffffff'
  secondary-container: '#dae5db'
  on-secondary-container: '#5c675f'
  tertiary: '#00467d'
  on-tertiary: '#ffffff'
  tertiary-container: '#215e9b'
  on-tertiary-container: '#bcd7ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aff1ca'
  primary-fixed-dim: '#93d4af'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#0a5135'
  secondary-fixed: '#dae5db'
  secondary-fixed-dim: '#bec9c0'
  on-secondary-fixed: '#141e18'
  on-secondary-fixed-variant: '#3f4942'
  tertiary-fixed: '#d3e4ff'
  tertiary-fixed-dim: '#a2c9ff'
  on-tertiary-fixed: '#001c38'
  on-tertiary-fixed-variant: '#004881'
  background: '#e8ffef'
  on-background: '#0c1f16'
  surface-variant: '#d1e8d9'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system projects agricultural authority, biological precision, and enterprise-grade reliability. Tailored for agronomists, farm operators, and agricultural supply chain managers, the interface prioritizes clarity, data integrity, and direct usability across field workstations, ruggedized tablets, and desktop offices.

The visual style blends **Corporate Modern** with a **Tactile Naturalist** discipline. It relies on crisp 1px borders, subtle surface tinting, modest corner radii, and high-legibility typographic hierarchies. Decorative embellishments, heavy glassmorphism, glowing neon tones, and theatrical gradients are entirely excluded in favor of calm, utilitarian surfaces that evoke healthy soil, thriving crops, and systematic scientific control.

## Colors

The palette is rooted in deep agricultural tones and natural soil neutrals, engineered strictly for high-contrast daylight reading.

### Core Swatches
- **Primary Green (`#276749`)**: The operational anchor. Used for primary interactive controls, active navigation items, brand indicators, and key metric emphasis.
- **Primary Hover (`#1F523A`)**: Deepened tone for active and hovered primary states.
- **Pale Sage Surface (`#E8F3E9`)**: Subtle secondary tint used for selected row backgrounds, metric card accents, and secondary button fills.
- **Main Background (`#F7FAF6`)**: Calming, low-strain off-white canvas that prevents harsh screen glare during extended outdoor or indoor monitor sessions.
- **Surface Card (`#FFFFFF`)**: Pure white base for modular data tiles, tables, and modal dialogs.
- **Border & Dividers (`#DCE6DD`)**: Structural containment lines separating analytical data without visual clutter.

### Typography & Readability
- **Primary Text (`#203329`)**: Earthy charcoal green providing deep contrast against pure white and sage surfaces.
- **Secondary Text (`#607267`)**: Muted slate green reserved for metadata, timestamps, table headers, and helper instructions.

### Functional Alert Badges & Metric Surfaces
- **Information**: Surface `#EAF3FC` paired with `#1E5C99` for borders, icons, and text (e.g., weather updates, sensor diagnostics).
- **Warning**: Surface `#FFF1CD` paired with `#8C6200` for moderate crop risk, irrigation drift, or pest thresholds.
- **Critical Risk**: Surface `#FBE7E2` paired with `#B42318` for severe blight alerts, frost warnings, or immediate chemical intervention.

## Typography

The type system prioritizes rapid optical parsing of telemetry, batch identifiers, scientific crop taxonomy, and risk indicators. 

- **Primary Stack**: `Inter, system-ui, -apple-system, sans-serif`. Used for all numeric readouts, standard English copy, labels, and navigational chrome.
- **Multilingual & Indic Support**: When localized into Hindi or regional farming dialects, the system cascades to `'Noto Sans Devanagari', Inter, sans-serif` to preserve baseline alignment, diacritic clearance, and vertical rhythm.
- **Tabular Numerics**: Telemetry values, chemical volume measurements, and parcel acreages must enable tabular figures (`font-variant-numeric: tabular-nums`) to ensure strict vertical alignment in data tables and dashboard matrices.

## Layout & Spacing

The structural layout adheres to an engineered administrative grid with fixed navigational boundaries and fluid analytical work areas.

### Chrome Architecture
- **Sidebar**: Fixed width of `248px` on desktop viewport. Houses core module navigation, field parcel switcher, and device sync status.
- **Topbar**: Fixed height of `68px`. Contains global search, active harvest season toggle, weather summary chip, and operator profile.
- **Content Canvas**: Fluid canvas with maximum width constraint of `1600px` for ultra-wide field monitors, centered with auto-margins.

### Breakpoints & Responsive Behavior
- **Desktop (1024px and above)**: Persistent 248px sidebar, 12-column grid, `1.5rem` (24px) gutters, `2rem` (32px) margins.
- **Tablet (768px – 1023px)**: Sidebar collapses to an icon-only rail (72px) or a sheet overlay. 8-column grid with `1.25rem` (20px) gutters.
- **Mobile (< 768px)**: Off-canvas drawer navigation. Single or 2-column stacked layout, `1rem` (16px) margins and gutters. Cards take full container width.

## Elevation & Depth

Visual hierarchy is maintained primarily via structural borders and subtle surface tiering rather than vertical shadows. This eliminates optical muddying under direct sun exposure.

- **Surface Tiers**:
  - `Canvas`: `#F7FAF6`
  - `Card / Table Row`: `#FFFFFF`
  - `Accent / Selected Surface`: `#E8F3E9`
- **Low-Contrast Outlines**: Every card, panel, input, and modal uses a crisp, non-distracting 1px solid border (`#DCE6DD`).
- **Minimal Ambient Shadow**: Standard components utilize an extremely subtle ambient grounding: `box-shadow: 0 1px 3px rgba(32, 51, 41, 0.06)`.
- **Flyout & Dropdown Menus**: Elevation increases solely for floating context menus, tooltips, and date pickers: `box-shadow: 0 4px 12px rgba(32, 51, 41, 0.08)`.

## Shapes

The design uses tight, disciplined corner radii that convey technical precision rather than playful consumer software.

- **Standard Elements (inputs, buttons, table cell badges, dropdown items)**: `6px` to `8px` (`roundedness: 1`, border-radius: `0.375rem` to `0.5rem`).
- **Containers & Surfaces (analytic cards, inspection modals, slide-overs)**: `8px` to `10px` (`0.5rem` to `0.625rem`).
- **Status Indicators & Avatars**: Circular (`50%` / `9999px`) reserved only for connectivity status dots, sensor pings, and operator initials.

## Components

### Buttons & Interactive Controls
- **Primary Button**: Background `#276749`, text `#FFFFFF`, border none. Hover: `#1F523A`. Minimum touch height `42px` (standard) to `44px` (touch optimization). Horizontal padding `1.25rem` (20px). Corner radius `6px`.
- **Secondary Button**: Background `#FFFFFF`, border `1px solid #DCE6DD`, text `#203329`. Hover: background `#E8F3E9`, border `#276749`.
- **Destructive Button**: Background `#FFFFFF`, border `1px solid #FBE7E2`, text `#B42318`. Hover: background `#FBE7E2`.
- **Focus Rings**: Strict high-visibility keyboard focus outline: `2px solid #276749` with an offset of `2px`.

### Badges, Status Chips & Risk Pills
- Compact badges (height `24px`, padding `0 8px`, radius `6px`, font size `12px`, font weight `500`).
- **Normal / Healthy**: Background `#E8F3E9`, text `#276749`, border `1px solid #C6DEC8`.
- **Advisory / Info**: Background `#EAF3FC`, text `#1E5C99`, border `1px solid #B9D7F6`.
- **Attention / Warning**: Background `#FFF1CD`, text `#8C6200`, border `1px solid #E8D18C`.
- **Critical / Blight Alert**: Background `#FBE7E2`, text `#B42318`, border `1px solid #F2B8B1`.

### Data Cards & Metric Displays
- Base background `#FFFFFF`, border `1px solid #DCE6DD`, radius `8px`, padding `1.25rem` (20px).
- KPI metric displays feature a small uppercase label (`label-sm`, `#607267`), an oversized numerical read (`display-sm`, `#203329`), and a contextual comparison chip or subtle sparkline directly below.

### Inputs, Selects & Field Filters
- Height `42px`, background `#FFFFFF`, border `1px solid #DCE6DD`, radius `6px`, padding `0 0.875rem` (14px).
- Text color `#203329`, placeholder color `#8C9E93`.
- Active focus state transitions border color to `#276749` with `box-shadow: 0 0 0 1px #276749`.

### Selection Controls (Checkbox & Radio)
- Size `18px x 18px`.
- Unchecked: `#FFFFFF` background with `1.5px solid #DCE6DD`.
- Checked: `#276749` solid fill with crisp white checkmark or center pip.
- Hover: Border color `#276749`.

### Tables & Telemetry Lists
- Header: Background `#F7FAF6`, border-bottom `1px solid #DCE6DD`, typography `label-sm` in `#607267`, uppercase with `0.02em` tracking.
- Row: Height `52px`, background `#FFFFFF`, border-bottom `1px solid #DCE6DD`.
- Row Hover: Background `#F7FAF6`. Selected Row: Background `#E8F3E9`.