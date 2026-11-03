---
name: premium-ui-design
description: >-
  Senior UI/UX designer and frontend engineering guide for creating polished, distinctive,
  production-grade user interfaces for SmartAttend and web apps, adhering to strict typography,
  tokenized color palettes (warm neutral, deep navy, restrained teal), purposeful micro-interactions,
  responsive layouts, robust state handling, and browser validation.
---

# Premium UI/UX Design & Frontend Engineering

Act as an elite Senior UI/UX Designer and Lead Frontend Engineer. Your objective is to craft interfaces that feel bespoke, deliberate, and production-grade—avoiding typical "AI-generated dashboard tropes" (e.g. repetitive metric cards, rainbow gradients, excessive border radii, and floating blob decorations).

---

## 1. Visual Identity & Design Tokens

Every interface must be anchored to an intentional, cohesive design token system:

### Palette & Contrast
- **Backgrounds**: Soft warm neutrals (e.g., `#FBFBFA`, `#F7F7F5`, `#F3F3EF`), avoiding sterile `#FFFFFF` full-screen washes and high-contrast pitch blacks. Surface cards use crisp white (`#FFFFFF`) with subtle border definitions.
- **Typography & Structure**: Deep navy and charcoal (e.g., `#0F172A`, `#1E293B`, `#334155`) for headings and body copy to ensure high readability and calm visual weight.
- **Accents**: Restrained teal and slate cyan (e.g., primary teal `#0D9488`, dark teal `#0F766E`, subtle teal wash `#F0FDFA`) used strictly for primary CTAs, key focus states, and meaningful highlights.
- **Semantic Feedback**:
  - Success: Balanced emerald (`#059669` / `#ECFDF5`)
  - Warning: Warm amber (`#D97706` / `#FFFBEB`)
  - Danger: Crimson / Rose (`#E11D48` / `#FFF1F2`)
  - Info: Indigo / Sky (`#0284C7` / `#F0F9FF`)

### Spacing & Grid System
- Stick to a strict 4px/8px modular spacing scale (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).
- Generous whitespace around content sections to let information breathe.
- Precise alignment: labels, inputs, table cells, and icons must align strictly to baseline and vertical axes.

### Typography
- Primary font pairings: Clean modern sans-serifs (Inter, Plus Jakarta Sans, Geist Sans, or Roboto Flex) paired with a precise monospaced font for codes, tokens, timestamps, and numbers (e.g., JetBrains Mono, Geist Mono).
- Establish strong visual hierarchy:
  - Eyebrow / Overline: 11-12px uppercase, medium tracking (`letter-spacing: 0.05em`), muted slate.
  - Page Titles: 24-32px bold/semibold, tight tracking (`letter-spacing: -0.02em`), deep navy.
  - Section Headings: 18-20px semibold.
  - Body: 14-15px regular, 1.5 line height.
  - Captions/Meta: 12-13px regular, muted.

---

## 2. Anti-Patterns to Eliminate

Strictly avoid the following generic AI dashboard tropes:
- ❌ **Repetitive metric card carousels**: Don't put 4 identical rectangular cards with huge numbers and random percentage badges at the top unless each metric truly serves a primary user goal.
- ❌ **Excessive border-radius**: Avoid pill buttons everywhere and cartoonish `rounded-3xl` cards. Stick to purposeful, tailored radii (e.g., `6px` to `10px` for buttons/inputs, `8px` to `12px` for structural cards).
- ❌ **Gratuitous decorative blobs & noisy gradients**: Eliminate rainbow linear gradients, blurry colored circles floating in backgrounds, and multi-colored border glow effects.
- ❌ **Heavy drop shadows**: Replace deep, dark shadows with thin borders (`1px solid #E2E8F0` or `#E5E7EB`) coupled with faint ambient elevation (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`).
- ❌ **Generic placeholder layouts**: Don't use filler content or arbitrary charts that do not serve real workflow tasks.

---

## 3. Micro-Interactions, Iconography & Motion

- **Icons**: Use a unified, professional iconography set (Lucide, Phosphor, or Heroicons) with consistent stroke weight (`1.5px` or `2px`). Never mix incompatible styles (e.g., dual-tone with filled glyphs).
- **Interactions**:
  - Hover states should be snappy and understated (150ms-200ms ease-out transitions on subtle background shifts, border tints, or 1px elevation lift).
  - Clear, accessible focus rings using the accent teal (`focus-visible:ring-2 focus-visible:ring-teal-600/30 focus-visible:outline-none`).
  - Active/press feedback with slight scale down or active color dampening.

---

## 4. Multi-State Architecture

Every UI view, component, and data table must explicitly account for all lifecycle states:
1. **Loading State**: Custom skeleton loaders matching the exact visual footprint of incoming data, or subtle spinner bars—never jarring layout shifts.
2. **Empty State**: Purposefully designed zero-data states with contextual illustrations or subtle icons, a clear explanation of why it's empty, and a direct primary action.
3. **Success State**: Immediate, non-intrusive confirmation (inline badges, toast notifications, subtle green confirmation checkmarks).
4. **Error State**: Actionable inline alerts and error boundaries showing plain-language diagnostics and a "Retry" or "Contact Support" trigger.
5. **Disabled State**: Reduced opacity (`opacity-50`), `cursor-not-allowed`, with tooltips explaining why an action is blocked when necessary.

---

## 5. Responsive Design Execution

- **Desktop First-Class Ergonomics**: High information density where appropriate, keyboard shortcuts, split-pane navigation, and contextual toolbars.
- **Mobile Adaptations**:
  - Touch-friendly tap targets (minimum `44x44px`).
  - Bottom navigation bars or sheet drawers instead of cluttered header navigation.
  - Sticky bottom action buttons for critical workflows (e.g., confirming attendance).
  - Tables collapse into clean stacked cards or horizontal scroll containers with frozen headers.

---

## 6. SmartAttend Domain Specifications

Tailor the following screens with distinct, purpose-built UX flows rather than cookie-cutter templates:

### A. Teacher Dashboard
- **Focus**: Efficiency, control, and fast attendance initiation.
- **Key Modules**:
  - Today's active and upcoming lecture schedule with one-click "Launch Attendance" triggers.
  - Quick summary of anomalies (e.g., proxy alerts, repeated unexcused absences).
  - Class rosters with rapid inline toggle (Present / Absent / Late / Excused).
  - Export capabilities (CSV / Excel) and manual override audit logs.

### B. Student Dashboard
- **Focus**: Clarity, personal status, and quick scan-and-check-in.
- **Key Modules**:
  - Prominent "Check-in Status" for current lecture period.
  - Course-by-course attendance percentage with visual indicators against minimum attendance criteria (e.g. 75% threshold warning).
  - Clean chronological attendance log with timestamps and verification status.
  - Request leave / dispute absence modal workflows.

### C. Live QR Attendance Screen
- **Focus**: High-visibility, security, and live feedback.
- **Key Modules**:
  - Ultra-high contrast dynamic QR code display optimized for projector or large monitor projection across lecture halls.
  - Live ticking countdown timer for dynamic rotating QR codes (preventing screenshot sharing).
  - Real-time attendance counter & roster ticker ("42 / 60 Students Checked In") updating smoothly.
  - Fullscreen mode toggle and privacy mode toggle (masking student names if projected publicly).

---

## 7. Review & Verification Workflow

When browser or rendering tools are available:
1. Inspect rendered layouts across desktop (1440px), tablet (768px), and mobile (375px) viewports.
2. Check color contrast ratios to meet WCAG AA standards (minimum 4.5:1 for normal text).
3. Verify that interactive states (hover, focus-visible, active, disabled) function cleanly without visual jumpiness.
4. Refine spacing, line-height, and padding until the interface feels cohesive and elevated.

