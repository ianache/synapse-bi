---
name: Crimson Slate Minimal
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#59413e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#8d706d'
  outline-variant: '#e1bfbb'
  surface-tint: '#b02d29'
  primary: '#760009'
  on-primary: '#ffffff'
  primary-container: '#991b1b'
  on-primary-container: '#ffaaa1'
  inverse-primary: '#ffb4ac'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#2f374c'
  on-tertiary: '#ffffff'
  tertiary-container: '#464e64'
  on-tertiary-container: '#b8bfd9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ac'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#8e1214'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 3rem
    fontWeight: '800'
    lineHeight: 3.5rem
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 2.25rem
    fontWeight: '800'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 1.625rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system expresses quiet authority, architectural precision, and tactile refinement. It balances the dramatic weight of deep crimson with the structural composure of cool slate and crystalline white surfaces. Designed primarily for mobile-first workflows that demand immediate focus, the visual style blends Modern Editorial Minimalism with understated tactile surface feedback.

### Emotional Disposition
- **Composed & Authoritative:** High-contrast pigment anchoring without loud decorative distractions.
- **Precise & Deliberate:** Clear structural planes, generous negative space, and disciplined layout rhythm.
- **Tactile & Responsive:** Refined touch feedback that feels physical, grounded, and instant.

### Style Directives
- Avoid ornamental skeuomorphism, loud gradients, and harsh pure-black borders.
- Construct depth through subtle micro-borders, clean white foreground planes, and warm ambient light falloff.
- Reserve the deep crimson primary for intentional points of action, primary focus targets, and structural anchors.

## Colors

The palette leverages high contrast against pristine paper-like surfaces. The primary color is a saturated, authoritative deep red that brings warmth and precision. The secondary and neutral families are anchored in slate and cool charcoal to maintain an editorial, high-end feel.

### Role Allocations

- **Primary (`#991B1B`):** Reserved for primary interactive controls, active toggle indicators, critical navigation nodes, and high-impact branding anchors. Hover/pressed states resolve to `#7F1D1D`.
- **Secondary (`#334155`):** Structural accents, secondary controls, icons requiring distinct emphasis, and badge foundations.
- **Tertiary / Base Dark (`#0F172A`):** Headlines, prominent card titles, and high-contrast iconography.
- **Neutral Core (`#64748B`):** Supporting body text, secondary icons, and muted control outlines.
- **Surface Foundations:**
  - `surface-canvas`: `#FFFFFF`
  - `surface-subtle`: `#F8FAFC`
  - `surface-container`: `#F1F5F9`
  - `surface-border`: `#E2E8F0`
- **Functional Semantics:**
  - `success`: `#15803D` (Surface tint: `#F0FDF4`)
  - `warning`: `#B45309` (Surface tint: `#FFFBEB`)
  - `error`: `#991B1B` (Surface tint: `#FEF2F2`)
  - `info`: `#0284C7` (Surface tint: `#F0F9FF`)

### Contrast & Legibility Rules
All body text must achieve an APCA-compliant contrast level on its immediate container. Text placed over the primary crimson token must strictly use `#FFFFFF`. Never apply primary crimson to long paragraphs of text.

## Typography

Typography pairs the structural, architectural precision of **Hanken Grotesk** for headlines with the clarity, balanced counters, and legibility of **Plus Jakarta Sans** for interface labels and long-form reading.

### Hierarchy & Composition Rules
- **Display & Large Headlines:** Set with tight tracking (-0.02em to -0.03em) to convey editorial refinement and compact visual presence on narrow mobile viewports.
- **Body Rhythm:** All body copy adheres strictly to a 1.4–1.5 line-height ratio, ensuring reading comfort across dense data interfaces.
- **Micro-labels & Status Markers:** Small labels (`label-sm`, `label-md`) use semi-bold or bold weights with positive letter spacing (+0.02em to +0.04em) to maintain crisp legibility at small sizes.

## Layout & Spacing

The layout is built around a mobile-first fluid grid structured on an 8pt baseline rhythm, supplemented by 4pt micro-steps for tight component alignments.

### Grid & Layout Structure
- **Mobile (< 640px):** 4-column layout, `margin`: `1rem` (16px), `gutter`: `1rem` (16px). All full-width actionable controls span all 4 columns or lock to floating sticky bottom sheets.
- **Tablet (640px – 1024px):** 8-column layout, `margin`: `2rem` (32px), `gutter`: `1.25rem` (20px). Cards collapse into 2-column or 4-column balanced sets.
- **Desktop (> 1024px):** 12-column layout with a maximum content container width of `1200px`, centered, `gutter`: `1.5rem` (24px).

### Spacing Principles
- Dynamic padding relies on `space-md` for standard card interiors on mobile, scaling to `space-lg` on larger viewports.
- Stack spacing between distinct content sections uses `space-xl` (32px) on mobile and `space-2xl` (48px) on desktop to guarantee uncluttered breathability.

## Elevation & Depth

Visual hierarchy relies on structural planes and diffused ambient shadows rather than stark high-contrast drops. The goal is a crisp, tactile, clean-room finish.

### Elevation Tiers
1. **Level 0 (Flat Canvas):** `#FFFFFF` or `#F8FAFC`. Zero elevation, zero shadow.
2. **Level 1 (Subtle Inset / Base Card):**
   - Background: `#FFFFFF`
   - Border: 1px solid `#E2E8F0`
   - Shadow: `0px 1px 3px 0px rgba(15, 23, 42, 0.04), 0px 1px 2px -1px rgba(15, 23, 42, 0.04)`
   - Used for content lists, standard cards, and form containers.
3. **Level 2 (Interactive Floating / Active State):**
   - Background: `#FFFFFF`
   - Border: 1px solid `#CBD5E1`
   - Shadow: `0px 8px 16px -4px rgba(15, 23, 42, 0.06), 0px 4px 6px -2px rgba(15, 23, 42, 0.03)`
   - Used for cards on hover/touch focus, active dropdown menus, and search bars.
4. **Level 3 (Overlays & Bottom Sheets):**
   - Background: `#FFFFFF`
   - Border: 1px solid rgba(226, 232, 240, 0.8)
   - Shadow: `0px 20px 25px -5px rgba(15, 23, 42, 0.08), 0px 8px 10px -6px rgba(15, 23, 42, 0.04)`
   - Used for mobile bottom sheets, modal dialogs, and floating bottom navigation anchors.

## Shapes

The design system implements a rounded shape language (Level 2) customized for contemporary mobile interactions:
- **Base Components (`rounded` / 0.5rem):** Checkboxes, form inputs, small badges, and micro-chips.
- **Medium Components (`rounded-lg` / 1rem):** Primary and secondary buttons, segmented controls, standard card containers.
- **Large Surfaces (`rounded-xl` / 1.5rem):** Modals, mobile bottom-sheet top corners, featured interactive hero banners.
- **Pill Elements (`rounded-full`):** Floating action buttons, avatar masks, status indicator dots, and micro numeric badges.

## Components

### Buttons
- **Primary:** Deep red (`#991B1B`) solid background, `#FFFFFF` bold text. Height: 48px on mobile for optimal tap ergonomics. Border-radius: `1rem`. Active state: `#7F1D1D` with a subtle scale transform (`scale(0.98)`).
- **Secondary:** Surface tint (`#F1F5F9`) background, slate (`#334155`) text, 1px border (`#E2E8F0`). Active state: `#E2E8F0`.
- **Ghost:** Transparent background, slate (`#334155`) text. Active state: `#F8FAFC`.

### Form Inputs
- **Container:** Height 48px, background `#FFFFFF`, border: 1px solid `#E2E8F0`, corner radius: `0.5rem`.
- **Typography:** `body-md` text in `#0F172A`, placeholder in `#94A3B8`.
- **Focus State:** 1.5px solid `#991B1B` border with an outer ring of `3px rgba(153, 27, 27, 0.12)`. No harsh default browser rings.

### Selection Controls
- **Checkboxes & Radios:** Dimensions 20x20px. Inactive: border 1.5px solid `#94A3B8`, background `#FFFFFF`. Active: background `#991B1B`, border `#991B1B`, check icon `#FFFFFF`. Checkbox corner radius: 4px; radio corner radius: full circle.

### Cards & Grouped Lists
- **Standard Card:** Background `#FFFFFF`, 1px solid `#E2E8F0`, corner radius `1rem`, interior padding `1rem`.
- **Divided List Group:** Contained in a Level 1 card surface. List items divided by `1px solid #F1F5F9`. Tappable rows feature an explicit active ripple/highlight (`#F8FAFC`) with trailing slate chevrons (`#94A3B8`).

### Chips & Filter Tags
- **Default:** Height 32px, background `#F8FAFC`, border 1px solid `#E2E8F0`, text `#334155`, corner radius `full`.
- **Selected:** Background `#991B1B`, border 1px solid `#991B1B`, text `#FFFFFF`.

### Mobile Floating Sheet / Bottom Nav
- Background `#FFFFFF` with top border 1px solid `#E2E8F0`. Elevation Level 3. Fixed to the bottom safe area with top corner radius `1.5rem`.