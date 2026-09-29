---
name: Warm Contemporary Indian Hospitality
colors:
  surface: '#f9f9ff'
  surface-dim: '#d7dae3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fd'
  surface-container: '#ebeef7'
  surface-container-high: '#e5e8f2'
  surface-container-highest: '#dfe2ec'
  on-surface: '#181c23'
  on-surface-variant: '#58413f'
  inverse-surface: '#2d3138'
  inverse-on-surface: '#eef0fa'
  outline: '#8c716e'
  outline-variant: '#e0bfbc'
  surface-tint: '#ac3130'
  primary: '#972123'
  on-primary: '#ffffff'
  primary-container: '#b83a38'
  on-primary-container: '#ffdfdc'
  inverse-primary: '#ffb3ad'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#504f4a'
  on-tertiary: '#ffffff'
  tertiary-container: '#686762'
  on-tertiary-container: '#e9e6df'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#8b181c'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e5e2db'
  tertiary-fixed-dim: '#c9c6c0'
  on-tertiary-fixed: '#1c1c18'
  on-tertiary-fixed-variant: '#474742'
  background: '#f9f9ff'
  on-background: '#181c23'
  surface-variant: '#dfe2ec'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-xl-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: 0em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
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
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-xxl: 4rem
---

## Brand & Style

This design system translates the physical architectural presence of modern Indian boutique hospitality into a refined, welcoming digital space. It balances the timeless graciousness of *Atithi Devo Bhava* (guest reverence) with modern, understated luxury. The audience includes discerning business professionals, leisure travelers, event planners, and families seeking dependable comfort, polished service, and authentic warmth.

The design movement is a fusion of **Warm Minimalism** and **Editorial Hospitality Modernism**. It prioritizes generous negative space, crisp serif display typography, architectural lines, and subtle tactile grounding. Rather than relying on ornate traditional tropes or cold corporate SaaS sterility, the interface utilizes warm sand stone foundations, tailored borders, terracotta crimson focal points drawn from the facade architectural signage, and restrained champagne gold accents for premium moments.

## Colors

The color palette directly references the physical hotel architecture—combining exterior terracotta red, stone facade paneling, and warm illuminated accents:

- **Primary (`#B83A38`):** Crimson Terracotta. A confident, warm, earthy red derived from the property's exterior identity. Used for primary booking triggers, selected dates, active reservation markers, and prominent interactive focus states.
- **Secondary (`#D4AF37`):** Champagne Gold. Conveys refined hospitality, concierge privileges, loyalty tier badging, star ratings, and celebratory accents.
- **Tertiary (`#F4F1EA`):** Warm Sand Stone. The structural surface base that softens screens away from clinical white, creating an inviting, residential ambiance.
- **Neutral (`#1E2229`):** Deep Charcoal Slate. Provides editorial grounding for typography, deep navigation footers, and crisp outline structures without the harshness of pure black.

### Supporting Semantic Applications
- **Canvas Base:** `#FAF8F5` (Alabaster Warm White) ensures high readability while maintaining warm undertones.
- **Surface Elevation:** Pure `#FFFFFF` cards float above `#FAF8F5` or `#F4F1EA` backgrounds.
- **Borders & Dividers:** Subtle `#E6E1D6` (Warm Sand Hairline) reinforces architectural grid discipline.
- **Subdued Text / Metadata:** `#5F6572` balances contrast against charcoal copy.

## Typography

The typography system pairs **Playfair Display** for high-touch editorial hospitality moments with **Plus Jakarta Sans** for functional precision, booking engines, and information architecture.

- **Headlines & Editorial Titles:** Playfair Display introduces literary sophistication, timeless character, and warmth. Display and Headline tokens feature measured line heights to accommodate multi-line room names and amenity features gracefully.
- **Body & Numerical Readability:** Plus Jakarta Sans provides geometric clarity, open apertures, and friendly legibility across pricing matrices, booking calendars, and itinerary summaries.
- **Labels & Category Caps:** `label-caps` is styled with uppercase tracking (`letterSpacing: 0.1em`) to mark room categories, package flags, and status badges with architectural discipline.

## Layout & Spacing

The layout utilizes a structured 12-column fluid grid system on desktop (max width 1320px) transitioning to an 8-column layout on tablet, and a single- or 4-column flow on mobile viewports.

- **Rhythm & Proportions:** Vertical rhythm is built on an 8px base unit. Sections breathe with generous padding (`space-xl` and `space-xxl`), avoiding the packed density of standard OTAs to reinforce an atmosphere of relaxed leisure.
- **Booking Modules & Overlays:** The primary booking bar and availability engines overlay hero imagery seamlessly with unified `space-lg` internal cell padding, maintaining symmetric gutter spacing.
- **Mobile Reflow:** Split room cards (image left, specifications right) collapse into full-width stacked visual blocks with sticky bottom reservation summaries.

## Elevation & Depth

Elevation is managed through **tonal layering and warm ambient shadows**, reinforcing architectural solidity rather than simulated digital float.

- **Level 0 (Flat):** Structural backgrounds (`#FAF8F5`) and inset sections (`#F4F1EA`) use crisp 1px borders (`#E6E1D6`) without shadow.
- **Level 1 (Cards & Accommodation Panels):** Elevated cards on `#FFFFFF` carry subtle tinted shadows: `0px 4px 16px -2px rgba(30, 34, 41, 0.05), 0px 1px 2px rgba(30, 34, 41, 0.04)` with a hairline border (`rgba(230, 225, 214, 0.8)`).
- **Level 2 (Date Pickers & Booking Floating Bars):** Active search consoles and date range dropdowns feature higher ambient diffusion: `0px 12px 32px -4px rgba(30, 34, 41, 0.08), 0px 4px 8px -2px rgba(30, 34, 41, 0.04)`.
- **Level 3 (Modal Overlays & Suite Galleries):** Backdrop filter with `blur(8px)` combined with a tinted dark wash (`rgba(30, 34, 41, 0.45)`) and modal elevation: `0px 24px 48px -12px rgba(30, 34, 41, 0.16)`.

## Shapes

The design system employs a **Soft (`1`)** shape language (base corner radius `0.25rem` / 4px, `rounded-lg` at `0.5rem` / 8px, and `rounded-xl` at `0.75rem` / 12px). 

This tailored, low-radius curvature mirrors modern stone paneling and architectural lintels seen on the hotel exterior. Pill shapes are intentionally avoided for structural containers to preserve high-end architectural dignity, reserved only for discrete status tags and rating pills where maximum tap target or separation is essential.

## Components

### Buttons
- **Primary Action (Book Now, Reserve Room):** Solid Crimson Terracotta (`#B83A38`) background with pure white text, 4px border radius, 48px height (`px-6`, `py-3`), uppercase tracking `label-lg`. On hover: transition to `#A33230` with subtle elevation increase.
- **Secondary Action (View Details, Explore Amenities):** Transparent fill with 1.5px solid Charcoal (`#1E2229`) border, Charcoal text. On hover: fills `#1E2229` with white text.
- **Concierge / Luxury CTA (Special Offers, Wedding Inquiries):** Soft Champagne Gold border (`#D4AF37`) with pale gold tint background (`#FAF6EB`) and `#1E2229` text.

### Room & Suite Cards
- Architectural container using white background, 8px border radius, and a 1px `#E6E1D6` border.
- 16:10 aspect ratio photography with a subtle inner border treatment.
- Content zone structured with room classification in `label-caps` (`#B83A38`), room title in Playfair Display (`headline-sm`), key amenity icons in `#5F6572`, and right-aligned price per night anchored in bold charcoal Plus Jakarta Sans.

### Chips & Badges
- **Status Badges (Complimentary Breakfast, City View):** Background `#F4F1EA`, text `#1E2229`, 4px radius, padded with `py-1` `px-2.5`, styled with `label-md`.
- **Exclusive / Best Seller Badge:** Deep Charcoal (`#1E2229`) background with Champagne Gold (`#D4AF37`) text and gold border accent.

### Input Fields & Booking Selectors
- Flat `#FFFFFF` backgrounds bordered with 1px `#D9D4C7`.
- Inputs have 48px height, padded `px-4`, with floating labels in `label-md`.
- Focused state: 1.5px border in Primary Crimson (`#B83A38`) with soft red focus ring (`rgba(184, 58, 56, 0.15)`).

### Checkboxes & Radios
- Crisp 4px radius for checkboxes, circular for radios.
- Unchecked: 1.5px border in `#7C8290`.
- Checked: Solid `#B83A38` fill with crisp white checkmark or center pip.

### Date Picker & Calendar Days
- Header in Playfair Display (`headline-sm`).
- Selected date range highlights in a soft terracotta band (`rgba(184, 58, 56, 0.12)`) bounded by solid `#B83A38` start/end date blocks with white typography.