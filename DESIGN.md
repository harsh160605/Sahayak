---
name: SmartAttend
description: Real-time anti-proxy attendance management and academic hierarchy platform
colors:
  primary: "#0D9488"
  primary-hover: "#0F766E"
  primary-light: "#F0FDFA"
  primary-dark: "#115E59"
  neutral-bg: "#FBFBFA"
  neutral-surface: "#FFFFFF"
  neutral-border: "#F0EFEA"
  neutral-subtle: "#F7F7F5"
  ink-primary: "#0F172A"
  ink-secondary: "#334155"
  ink-muted: "#64748B"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "JetBrains Mono, Geist Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.05em"
  caption:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
  micro:
    fontFamily: "JetBrains Mono, Geist Mono, monospace"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.neutral-subtle}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  card-default:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: SmartAttend

## Overview

**Creative North Star: "The Academic Ledger"**

SmartAttend embodies the calm, authoritative tactile clarity of a scholarly ledger combined with the cryptographic rigor of modern academic governance. Designed specifically for university lecture halls, administrative offices, and high-stakes attendance tracking, the interface prioritizes high information density, rapid scanability, and uncompromised legibility under demanding ambient conditions.

Surfaces evoke physical warm archival paper, grounded by deep ink typography and accented with a disciplined, restrained teal. The layout establishes order through subtle structural borders and typographic hierarchy rather than heavy drop shadows or unnecessary embellishments. Every interactive element feels precise, deliberate, and stable.

We explicitly reject hyperactive SaaS tropes: no purple neon glows, no synthetic floating glassmorphism, no rainbow gradients, and no gratuitous motion. Simultaneously, we reject the drab, sterile grey grids of legacy ERPs. SmartAttend is warm, dignified, and editorial.

**Key Characteristics:**
- **Warm Archival Substrates**: Restful off-white backgrounds that reduce eye fatigue during long administrative sessions.
- **Disciplined Chromatic Accent**: Teal serves as an operational beacon, strictly budgeted across the screen.
- **Monospace Rigor**: Cryptographic codes, join tokens, student IDs, and time slots are anchored in monospace clarity.
- **Tonal Layering**: Depth is achieved through warm neutral boundaries and ghost borders rather than heavy drop shadows.

## Colors

The palette balances warm archival neutrals with authoritative deep ink navy, punctuated by a surgical teal accent that signals active state, cryptographic synchrony, and primary intent.

### Primary
- **Restrained Academic Teal** (`#0D9488`): The signature focal point. Used strictly for primary calls to action, active navigation tabs, verified state confirmations, and live countdown indicators.
- **Deep Academic Teal (Hover)** (`#0F766E`): Hover and pressed states for primary interactive controls.
- **Teal Substrate** (`#F0FDFA`): Gentle tint used for active navigation pills, highlighted timetable slots, and informational notice banners.

### Neutral
- **Deep Ink Navy** (`#0F172A`): Primary text, headings, and high-contrast structural icon fills. Provides AAA readability.
- **Slate Secondary** (`#334155`): Secondary descriptive text, table column labels, and metadata subtitles.
- **Slate Muted** (`#64748B`): Inactive placeholders, helper captions, and unselected indicator states.
- **Warm Archival Canvas** (`#FBFBFA`): The global page background substrate, evoking warm parchment or scholarly archival paper.
- **Crisp Card Surface** (`#FFFFFF`): Isolated container cards, modal dialogs, and elevated working panels.
- **Ghost Border Sand** (`#F0EFEA`): Subtle boundary dividers separating table rows, sidebar panels, and dashboard cards.
- **Warm Neutral Substrate** (`#F7F7F5`): Secondary interactive button fills, table header rows, and badge backgrounds.

### Named Rules
**The 10% Teal Rule.** Teal is an active focal point and must occupy ≤10% of any viewport. It must never be applied as full-screen backgrounds, wide banners, or decorative wallpaper. Its power comes from scarcity.

**The Semantic Status Rule.** Semantic alerts follow traditional academic conventions: Amber (`#B45309`) for enrollment warnings and defaulter lists (&lt;75%), Crimson (`#B91C1C`) for security/conflict errors, and Emerald/Teal (`#0D9488`) for verified attendance.

## Typography

The type system pairs modern humanist sans-serif typography for effortless reading with crisp monospace precision for academic tokens and timestamps.

**Display Font:** Plus Jakarta Sans (with Inter and system-ui fallback)
**Body Font:** Plus Jakarta Sans (with Inter and system-ui fallback)
**Label/Mono Font:** JetBrains Mono (with Geist Mono and monospace fallback)

**Character:** Scholarly, authoritative, and contemporary. The geometric balance of Plus Jakarta Sans provides crisp legibility at small sizes, while JetBrains Mono gives mathematical exactness to administrative identifiers.

### Hierarchy
- **Display** (Bold 700, 2rem / 32px, line-height 1.2, letter-spacing -0.02em): Top-level institutional dashboard headings and live projector session titles.
- **Headline** (Bold 700, 1.5rem / 24px, line-height 1.25, letter-spacing -0.015em): Section headers, modal titles, and card group titles.
- **Title** (Semibold 600, 1.125rem / 18px, line-height 1.35, letter-spacing -0.01em): Department titles, course names, and division subtitles.
- **Body** (Regular 400, 0.875rem / 14px, line-height 1.5, letter-spacing 0): Core table data, form labels, administrative instructions, and student records. Max line length 65–75ch.
- **Label** (Semibold 600, 0.75rem / 12px, line-height 1.3, letter-spacing 0.05em, uppercase): Table column headers, status badges, join codes, and metadata tags.
- **Caption** (Medium 500, 0.6875rem / 11px, line-height 1.3): Subtitles, helper text, and secondary academic indicators.
- **Micro** (Semibold 600, 0.625rem / 10px, line-height 1.2, uppercase, monospace): Defaulter status pills, department badges, and join tokens.

### Named Rules
**The Monospace Token Rule.** All system codes, cryptographic seeds, student roll numbers, division letters, and clock timestamps (`HH:MM`) must be rendered in JetBrains Mono (`font-mono`) to guarantee tabular alignment and zero character ambiguity.

**The Strict Hierarchy Rule.** Never skip a typographic tier to emphasize content. An element below a `Headline` must be a `Title` or `Body`, never another `Headline` with a different color.

## Layout

SmartAttend follows an editorial grid structure with a fixed-width left navigation rail (240px) and a fluid, max-width bounded content canvas (`max-w-6xl` or `max-w-7xl` centered with `mx-auto`).

- **Grid Spacing Model**: Built on an 8px base rhythm (`gap-2`, `gap-4`, `gap-6`, `p-6`). Standard section spacing uses 24px (`space-y-6`).
- **Density**: Academic high density. Tables and lists favor compact rows (`py-2.5` to `py-3`) so administrators can evaluate entire rosters and weekly timetables without excessive vertical scrolling.
- **Responsive Adaptability**:
  - *Desktop (&gt;1024px)*: Persistent sidebar, multi-column dashboard statistics, horizontal timetable grid matrix.
  - *Tablet (768px–1024px)*: Collapsible navigation rail, 2-column card layouts.
  - *Mobile Phone (&lt;768px)*: Full-width stacked cards, top bar navigation drawer, camera viewfinder priority for students scanning dynamic QR codes.

## Elevation & Depth

SmartAttend relies on tonal layering and crisp ghost borders rather than dramatic drop shadows. Surfaces feel grounded like physical stationery resting neatly upon a wooden seminar desk.

Surfaces rest flat in their default state. Elevation is reserved strictly for ephemeral interactions: modal overlays, floating dropdown menus, and subtle interactive card hover states.

### Shadow Vocabulary
- **Subtle Rest** (`box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)`): Default container card and table elevation.
- **Card Focus** (`box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.03)`): Active or highlighted timetable slots and interactive selector panels.
- **Elevated Modal** (`box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`): Floating dialogue boxes, dropdown menus, and full-screen projector controls.

### Named Rules
**The Ghost Border Rule.** Every card, panel, and table container must carry a 1px border in Ghost Border Sand (`#F0EFEA`). Shadows alone are never trusted to define surface boundaries.

**The Flat-At-Rest Rule.** Non-modal surfaces must remain completely flat at rest. Elevation appears only as a functional response to hover, keyboard focus, or modal presentation.

## Shapes

The geometric vocabulary balances clean rectangular precision with gentle ergonomic radii:

- **Interactive Controls (Buttons, Inputs, Selects)**: Compact rounded corners with 6px radius (`rounded-md`) or 8px (`rounded-lg`).
- **Container Cards & Tables**: Sturdy 12px radius (`rounded-xl`).
- **Status Pills & Count Badges**: Fully pill-shaped with 9999px radius (`rounded-full`).
- **Dividers & Strokes**: Crisp 1px solid borders (`border border-warm-300`). No dashed or decorative double borders.

## Components

Components are refined, tactile, and restrained. They provide immediate feedback without distracting flare.

### Buttons
- **Shape:** Rounded rectangle (8px radius / `rounded-lg`).
- **Primary:** Background in Restrained Teal (`#0D9488`), crisp white text, padding 8px 16px (`px-4 py-2`), font-size 13px (`text-xs` or `text-sm`), font-weight 600.
- **Hover / Focus:** Transitions to Deep Teal (`#0F766E`) in 150ms. Focus outline in Teal with 2px offset.
- **Secondary / Ghost:** Warm neutral fill (`#F7F7F5`), Deep Ink text (`#0F172A`), 1px border in `#F0EFEA`. Hover transitions to `#F0EFEA`.

### Cards / Containers
- **Corner Style:** Rounded-xl (12px radius).
- **Background:** Crisp Card Surface (`#FFFFFF`).
- **Shadow Strategy:** Subtle rest shadow (`shadow-subtle`) paired with 1px Ghost Border (`border-warm-300`).
- **Internal Padding:** Generous 24px (`p-6`) for major cards; 16px (`p-4`) for sub-cards.

### Inputs / Fields
- **Style:** 1px stroke in `#F0EFEA`, background `#FFFFFF`, 8px radius (`rounded-lg`), font-size 14px (`text-sm`), text `#0F172A`.
- **Focus:** 1px border shift to Restrained Teal (`#0D9488`) with subtle ring (`ring-1 ring-primary/20`).
- **Error:** Border shift to Crimson (`#EF4444`) with accompanying red text caption.

### Navigation
- **Sidebar Rail:** Warm canvas background, 1px right border (`border-warm-300`).
- **Navigation Items:** Rounded-md (6px), 12px font (`text-xs`), semibold.
- **Active State:** Inverted Deep Navy fill (`bg-navy-900`) with white text and subtle micro-shadow.
- **Inactive Hover:** Warm neutral fill (`hover:bg-warm-200/70`) with `#0F172A` text.

### Chips / Status Badges
- **Shape:** Full pill radius (`rounded-full`).
- **Style:** Compact padding (2px 8px / `px-2 py-0.5`), font-size 10px or 11px, JetBrains Mono font (`font-mono`).
- **Defaulter Warning Pill:** Amber tint background (`bg-amber-50`), Amber text (`text-amber-800`), 1px border (`border-amber-200`).
- **Verified Success Pill:** Teal tint background (`bg-teal-50`), Teal text (`text-teal-800`), 1px border (`border-teal-200`).

### Signature Component: Rotating QR Projector Screen
- **Container**: High-contrast, presentation-optimized container with dark background option for auditorium projectors.
- **Rotating QR Canvas**: Central sharp QR matrix surrounded by an SVG countdown ring that smoothly sweeps every 3 or 5 seconds.
- **Security Indicator**: Live pulse badge showing remaining token lifespan, session geofence status, and real-time student scan count counter.

## Do's and Don'ts

### Do:
- **Do** wrap every card and table container in a 1px border of Ghost Border Sand (`#F0EFEA`).
- **Do** format all academic IDs, roll numbers, timetable hours (`09:15`), and join tokens in monospace typography (`font-mono`).
- **Do** budget Teal to ≤10% of any viewport, using it solely for primary actions and active states.
- **Do** maintain compact vertical rhythm (`py-2` to `py-3`) in data tables to support high-density administrative review.
- **Do** provide immediate tactile feedback on all action buttons with subtle hover transitions and loading spinners.

### Don't:
- **Don't** use multi-color neon gradients, purple button glows, or glassmorphic blur effects.
- **Don't** use heavy drop shadows (`shadow-2xl` or `shadow-xl`) on static cards.
- **Don't** use pure stark black (`#000000`) for body text; use Deep Ink Navy (`#0F172A`).
- **Don't** hide academic roll numbers or timetable conflicts inside nested tooltips; display them visibly with clear status indicators.
- **Don't** use unstyled browser form controls; always apply the standardized input styling with explicit focus rings.

