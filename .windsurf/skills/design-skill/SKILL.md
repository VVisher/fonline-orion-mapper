---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces. Use this skill when building any web UI - components, pages, websites, landing pages, dashboards, e-commerce, React apps, HTML/CSS layouts, or when styling/beautifying any interface. Generates polished code with high design quality that avoids generic AI aesthetics.
---

# Frontend Design

This skill creates distinctive, crafted interfaces for any frontend work — from enterprise dashboards to creative landing pages. The philosophy: every interface deserves intentional design decisions, not defaults. Avoid the generic "AI slop" aesthetic at all costs.

---

## Design Direction (REQUIRED)

**Before writing any code, commit to a design direction.** Don't default. Think about what this specific product needs to feel like.

### Think About Context

- **What does this product do?** A finance tool needs different energy than a creative portfolio.
- **Who uses it?** Power users want density. Occasional users want guidance.
- **What's the emotional job?** Trust? Efficiency? Delight? Focus? Excitement?
- **What would make this memorable?** Every product has a chance to feel distinctive.
- **Is this enterprise/SaaS or creative/marketing?** This fundamentally changes the approach.

### Choose a Personality

UI has more range than most AI-generated interfaces suggest. Consider these directions:

#### Enterprise & SaaS Personalities

**Precision & Density** — Tight spacing, monochrome, information-forward. For power users who live in the tool. Think Linear, Raycast, terminal aesthetics.

**Warmth & Approachability** — Generous spacing, soft shadows, friendly colors. For products that want to feel human. Think Notion, Coda, collaborative tools.

**Sophistication & Trust** — Cool tones, layered depth, financial gravitas. For products handling money or sensitive data. Think Stripe, Mercury, enterprise B2B.

**Boldness & Clarity** — High contrast, dramatic negative space, confident typography. For products that want to feel modern and decisive. Think Vercel, minimal dashboards.

**Utility & Function** — Muted palette, functional density, clear hierarchy. For products where the work matters more than the chrome. Think GitHub, developer tools.

**Data & Analysis** — Chart-optimized, technical but accessible, numbers as first-class citizens. For analytics, metrics, business intelligence.

#### Creative & Marketing Personalities

**Brutally Minimal** — Extreme restraint, vast whitespace, typography as the hero. Anti-decoration. Think luxury fashion, high-end architecture firms.

**Maximalist Chaos** — Controlled visual overload, layered elements, unexpected compositions. Think streetwear brands, music festivals, avant-garde publications.

**Retro-Futuristic** — Blend vintage aesthetics with futuristic elements. Chrome gradients meet pixel fonts. Think Y2K revival, synthwave, cyberpunk.

**Organic & Natural** — Soft shapes, earthy palettes, hand-drawn elements, natural textures. Think wellness brands, sustainable products, artisanal goods.

**Art Deco & Geometric** — Strong geometric patterns, metallic accents, luxurious symmetry. Think premium spirits, high-end hospitality, classic elegance.

**Playful & Whimsical** — Bouncy animations, unexpected interactions, joyful colors. Think children's products, creative tools, entertainment.

**Editorial & Magazine** — Strong typographic hierarchy, dramatic imagery, sophisticated grid breaks. Think fashion magazines, cultural publications.

**Dark & Moody** — Deep shadows, dramatic lighting, cinematic atmosphere. Think gaming, nightlife, premium audio.

**Lo-Fi & Zine** — Raw, unpolished, authentic. Handwritten elements, paper textures, DIY aesthetic. Think indie music, underground culture.

#### E-commerce Personalities

**Trust & Conversion** — Clean product presentation, prominent CTAs, security signals, social proof. For stores where trust drives purchase decisions. Think Apple Store, premium D2C brands, Shopify themes.

**Catalog & Discovery** — Grid-dense, filter-forward, comparison-ready. Clear pricing, quick-add buttons, efficient scanning. For large inventories where browsing matters. Think Amazon, marketplaces, multi-product stores.

**Boutique & Artisanal** — Story-driven, photography-forward, minimal UI. Product as hero, narrative selling. For products sold on craft, origin, and quality narrative. Think artisan food, handmade goods, single-product brands.

**Luxury & Premium** — Restrained typography, dramatic imagery, elevated whitespace. Pricing de-emphasized, experience emphasized. For high-ticket items where aspiration matters more than comparison. Think fashion houses, jewelry, premium spirits.

Pick one. Or blend two. But commit to a direction that fits the product.

---

## Anti-AI-Slop Manifesto

Generic AI-generated interfaces share telltale signs. Avoid these at all costs:

### The AI Aesthetic to Avoid

- **The purple-to-blue gradient** — Every AI demo uses it. Find another palette.
- **Rounded rectangles with soft shadows everywhere** — Not every card needs to float.
- **Generic hero sections** — "Welcome to [Product]" with abstract blob illustrations.
- **The same Tailwind defaults** — `rounded-lg shadow-lg` on everything.
- **Emoji as design** — Lazy visual shorthand.
- **Stock illustration styles** — Those flat vector humans with tiny heads.
- **Safe, inoffensive color palettes** — Muted pastels that say nothing.
- **Symmetrical layouts without tension** — Everything perfectly centered, perfectly boring.

### What Makes Design Distinctive

- **Unexpected typography choices** — A font that makes someone ask "what font is that?"
- **Color commitment** — A bold palette used with conviction, not timid hints.
- **Asymmetry with purpose** — Visual tension that creates interest.
- **Texture and depth** — Noise, grain, gradients that feel tactile.
- **White space as a statement** — Dramatic emptiness, not just default margins.
- **One surprising element** — Something that breaks the pattern intentionally.

---

## Accessibility (Non-Negotiable)

These rules apply to ALL contexts — Enterprise, Creative, E-commerce. No exceptions.

### Focus Management

- Every focusable element shows a visible focus ring
- Use `:focus-visible` over `:focus` to avoid distracting pointer users
- Implement focus traps in modals and drawers
- Return focus to trigger element when closing overlays

```css
/* Focus ring that doesn't annoy mouse users */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Hit Targets

- **Desktop:** ≥24px minimum touch/click target
- **Mobile:** ≥44px minimum
- If the visual element is smaller, expand the hit area invisibly:

```css
/* Expand hit target without changing visual size */
.icon-button {
  position: relative;
  padding: 8px;
}
.icon-button::before {
  content: '';
  position: absolute;
  inset: -8px; /* Expands clickable area */
}
```

### Input Behavior

- **Never disable paste** — users paste passwords, addresses, codes
- **Never disable browser zoom** — accessibility requirement
- **Input font ≥16px on mobile** — prevents iOS Safari auto-zoom on focus
- **Never use `user-select: none`** on content users might want to copy

### Semantic Structure

- Use native elements before ARIA: `<button>`, `<a>`, `<input>`, `<select>`
- Icon-only buttons need `aria-label`:
  ```jsx
  <button aria-label="Close dialog"><XIcon /></button>
  ```
- Maintain hierarchical headings (h1 → h2 → h3, no skipping)
- Include "Skip to content" link for keyboard users
- Use `aria-hidden="true"` on decorative elements

### Keyboard Navigation

- All interactive elements reachable via Tab
- Logical tab order (no `tabindex` hacks unless necessary)
- Escape closes modals/dropdowns
- Arrow keys navigate within components (tabs, menus, lists)

---

## Interactions

### URL as State

Persist meaningful state in the URL so sharing, refreshing, and Back/Forward navigation work:

- Filters, search queries, pagination
- Active tabs, expanded panels
- Selected items, view modes

```tsx
// Use nuqs, useSearchParams, or similar
const [filter, setFilter] = useQueryState('filter')
```

**Deep-link everything that has state.** If a user can reach a view, they should be able to share a link to it.

### Loading States

Prevent loading flicker with intentional timing:

- **Show-delay:** 150-300ms before showing spinner (fast responses never show it)
- **Minimum visible:** 300-500ms once shown (prevents flash)
- **Keep original button label** during loading — add spinner alongside, don't replace text

```tsx
<button disabled={isLoading}>
  {isLoading && <Spinner className="mr-2" />}
  Save Changes
</button>
```

### Optimistic Updates

Update the UI immediately when success is likely:

1. Apply change to UI instantly
2. Send request to server
3. On success: done
4. On failure: show error, rollback or offer undo

Use for: likes, follows, form saves, drag-and-drop reordering.

### Touch (Mobile)

- `touch-action: manipulation` on buttons/controls — prevents double-tap zoom delay
- Use `h-dvh` instead of `h-screen` for proper viewport handling
- Apply `safe-area-inset-*` on fixed elements:

```css
.fixed-bottom-bar {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Scroll Behavior

- `overscroll-behavior: contain` on modals/drawers — prevents background scroll
- Preserve scroll position on Back/Forward navigation
- Set `scroll-margin-top` on anchor targets for fixed headers:

```css
[id] {
  scroll-margin-top: 80px; /* Height of fixed header */
}
```

---

## Forms

### Submission Behavior

- **Enter submits** when a text input is focused (if single control)
- **⌘/⌃+Enter submits** in `<textarea>` (Enter inserts newline)
- Keep submit button **enabled until in-flight** — allow submitting incomplete forms to surface validation errors
- Disable and show spinner **only during submission**
- Include idempotency key to prevent duplicate submissions

### Validation

- Show errors **next to their fields**, not in a distant summary
- On submit failure, **focus the first error field**
- **Allow any input** in fields — don't block keystrokes for "numbers only" fields, show validation feedback instead
- **Trim whitespace** from values before validation (text replacements add trailing spaces)

### Autofill

- Set meaningful `name` and `autocomplete` attributes for browser autofill:
  ```html
  <input name="email" type="email" autocomplete="email" />
  <input name="phone" type="tel" autocomplete="tel" />
  ```
- Disable spellcheck for emails, codes, usernames: `spellcheck="false"`
- Use correct `type` and `inputmode` for appropriate mobile keyboards

### Destructive Actions

- Require **confirmation** or provide **undo** for destructive actions
- Use AlertDialog components (not `window.confirm`)
- Confirmation button should name the action: "Delete Project" not "OK"

---

## Context-Aware Typography

Typography choices depend heavily on context. Don't apply the same rules everywhere.

### Enterprise/SaaS Context

System fonts, Inter, Geist are acceptable choices — they're fast, readable, and don't distract from the work. The interface should be invisible.

```css
/* Acceptable for enterprise/utility interfaces */
font-family: system-ui, -apple-system, sans-serif;
font-family: 'Inter', sans-serif;
font-family: 'Geist', sans-serif;
```

### Creative/Marketing Context

**AVOID these overused fonts:**
- Inter — It's everywhere. It says nothing.
- Roboto — The Android default. Generic.
- Open Sans — The safe choice. Forgettable.
- Arial/Helvetica — Unless it's an intentional Swiss design reference.
- System fonts — Fine for apps, invisible for marketing.

**SEEK distinctive alternatives:**
- **Geometric:** Satoshi, General Sans, Outfit, Space Grotesk
- **Humanist:** Source Serif, Fraunces, Newsreader
- **Display:** Clash Display, Cabinet Grotesk, Bebas Neue
- **Experimental:** Monument Extended, Right Grotesk, Migra

The font should contribute to the personality. If you can swap it for Inter without anyone noticing, you chose wrong.

### Typography Hierarchy (Universal)

- Headlines: 600 weight, tight letter-spacing (-0.02em)
- Body: 400-500 weight, standard tracking
- Labels: 500 weight, slight positive tracking for uppercase
- Scale: 11px, 12px, 13px, 14px (base), 16px, 18px, 24px, 32px, 48px, 64px

### Text Wrapping

Modern CSS for better text wrapping:

```css
/* Headings: balanced line lengths */
h1, h2, h3 {
  text-wrap: balance;
}

/* Body text: avoid orphans/widows */
p {
  text-wrap: pretty;
}
```

- `text-wrap: balance` — distributes text evenly across lines (best for short headings)
- `text-wrap: pretty` — prevents orphans/single words on last line (best for paragraphs)

### Numeric Data

- Use `tabular-nums` for numbers that need columnar alignment (tables, prices, scores)
- Use the ellipsis character `…` not three periods `...`
- Format numbers, dates, currencies for user's locale

---

## Color Strategy

### Enterprise Context: Color for Meaning

Gray builds structure. Color only appears when it communicates: status, action, error, success. Decorative color is noise.

When building data-heavy interfaces, ask whether each use of color is earning its place. Score bars don't need traffic-light colors — typography can do the hierarchy work.

### Creative Context: Color as Expression

Color can be the entire personality. Commit to a palette with conviction:

- **Monochromatic drama** — One hue, full range of values
- **High contrast pairs** — Black/yellow, navy/coral, forest/gold
- **Unexpected neutrals** — Olive, mauve, slate, sand instead of gray
- **Bold primaries** — Unapologetic red, blue, yellow used directly
- **Neon accents** — Electric highlights against dark backgrounds

### Color Foundation Options

- **Warm foundations** (creams, warm grays) — approachable, comfortable, human
- **Cool foundations** (slate, blue-gray) — professional, trustworthy, serious
- **Pure neutrals** (true grays, black/white) — minimal, bold, technical
- **Tinted foundations** (slight color cast) — distinctive, memorable, branded
- **Dark foundations** — technical, focused, premium, immersive

### Contrast & Accessibility

**Prefer APCA over WCAG 2** for more accurate perceptual contrast. APCA (Accessible Perceptual Contrast Algorithm) better reflects how humans actually perceive contrast.

- **Interactive states increase contrast** — `:hover`, `:active`, `:focus` should have MORE contrast than rest state
- **Don't rely on color alone** — always include text labels, icons, or patterns alongside color indicators
- **Use colorblind-friendly palettes** for charts and data visualization

### Browser Integration

```html
<!-- Match browser UI to your background -->
<meta name="theme-color" content="#000000">
```

```css
/* Ensure scrollbars have proper contrast in dark mode */
html {
  color-scheme: dark;
}
```

---

## Core Craft Principles

These apply regardless of design direction. This is the quality floor.

### The 4px Grid

All spacing uses a 4px base grid:
- `4px` - micro spacing (icon gaps)
- `8px` - tight spacing (within components)
- `12px` - standard spacing (between related elements)
- `16px` - comfortable spacing (section padding)
- `24px` - generous spacing (between sections)
- `32px` - major separation
- `48px`, `64px`, `96px` - dramatic spacing for creative layouts

### Symmetrical Padding (Enterprise)

**For enterprise UI, TLBR should match.** If top padding is 16px, left/bottom/right should also be 16px.

```css
/* Good for enterprise */
padding: 16px;
padding: 12px 16px; /* Only when horizontal needs more room */

/* Bad for enterprise */
padding: 24px 16px 12px 16px;
```

### Asymmetrical Tension (Creative)

For creative/marketing contexts, intentional asymmetry creates visual interest:

```css
/* Acceptable for creative layouts */
padding: 64px 24px 32px 24px; /* Top-heavy for dramatic headers */
margin-left: 15%; /* Off-center positioning */
```

### Border Radius Consistency

Stick to the 4px grid. Sharper corners feel technical, rounder corners feel friendly. Pick a system and commit:

- Sharp: 2px, 4px, 6px (developer tools, technical products)
- Soft: 8px, 12px (friendly, approachable products)
- Round: 16px, 24px, full (playful, creative products)
- None: 0px (brutalist, editorial)

Don't mix systems within the same interface.

### Depth & Elevation Strategy

**Match your depth approach to your design direction:**

**Borders-only (flat)** — Clean, technical, dense. Linear, Raycast approach. Just subtle borders to define regions.

**Subtle single shadows** — Soft lift without complexity. `0 1px 3px rgba(0,0,0,0.08)` for approachable products.

**Layered shadows** — Rich, premium, dimensional. Multiple layers for substantial feel. Stripe/Mercury approach.

**Surface color shifts** — Background tints establish hierarchy without shadows.

**Hard shadows** — Graphic, bold, intentional. For playful or retro aesthetics.

```css
/* Hard shadow for creative contexts */
box-shadow: 4px 4px 0 #000;
```

Choose ONE approach and commit.

```css
/* Borders-only approach */
--border: rgba(0, 0, 0, 0.08);
border: 0.5px solid var(--border);

/* Single shadow approach */
--shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

/* Layered shadow approach */
--shadow-layered:
  0 0 0 0.5px rgba(0, 0, 0, 0.05),
  0 1px 2px rgba(0, 0, 0, 0.04),
  0 2px 4px rgba(0, 0, 0, 0.03),
  0 4px 8px rgba(0, 0, 0, 0.02);
```

---

## Creative Enhancements

For marketing pages, landing pages, and creative contexts, consider these techniques:

### Background Textures

```css
/* Subtle noise overlay */
background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
opacity: 0.03;

/* Grain effect */
background: linear-gradient(transparent, transparent),
  url('/noise.png');
background-blend-mode: overlay;
```

### Gradient Techniques

```css
/* Mesh gradient (approximation) */
background:
  radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0, transparent 50%),
  radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0, transparent 50%),
  radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0, transparent 50%);

/* Avoid: the generic AI gradient */
/* background: linear-gradient(to right, #667eea, #764ba2); */
```

### Unexpected Layouts

- **Overlapping elements** — Cards that break grid boundaries
- **Rotated sections** — Subtle 1-2 degree rotations for energy
- **Mixed media** — Photography meeting illustration meeting typography
- **Scroll-triggered reveals** — Content that earns attention through interaction
- **Broken grids** — Intentional misalignment that creates tension

### Visual Effects (Use Sparingly)

```css
/* Glassmorphism (when appropriate) */
backdrop-filter: blur(10px);
background: rgba(255, 255, 255, 0.1);

/* Glow effects */
box-shadow: 0 0 40px rgba(99, 102, 241, 0.3);

/* Text gradients */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## Animation Guidelines

### Reduced Motion (Required)

**Always respect `prefers-reduced-motion`.** Some users experience motion sickness, vestibular disorders, or simply prefer less movement.

```css
/* Provide reduced-motion alternative */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Or selectively reduce specific animations while keeping essential feedback.

### Animation Principles (Universal)

- **GPU-accelerated only:** Use `transform` and `opacity` — avoid `width`, `height`, `top`, `left`
- **Interruptible:** Animations should be cancelable by user input
- **Never `transition: all`:** Explicitly list only properties you intend to animate

### Enterprise Context

- 150ms for micro-interactions, 200-250ms for larger transitions
- Easing: `cubic-bezier(0.25, 1, 0.5, 1)`
- Subtle, functional animations only
- No spring/bouncy effects

```css
/* Enterprise transitions */
transition: opacity 150ms cubic-bezier(0.25, 1, 0.5, 1),
            transform 150ms cubic-bezier(0.25, 1, 0.5, 1);
```

### Creative Context

Animation can be part of the personality:

- **Playful bounce** — Spring physics for joyful interfaces
- **Dramatic reveals** — Staggered entrances, scale transforms
- **Micro-delights** — Hover states that surprise
- **Scroll animations** — Parallax, reveals, transformations

```css
/* Playful spring */
transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1);

/* Dramatic entrance */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

One surprising animation moment per page is more memorable than animation everywhere.

---

## Component Craft

### Card Layouts

Monotonous card layouts are lazy design. A metric card doesn't have to look like a plan card doesn't have to look like a settings card.

Design each card's internal structure for its specific content — but keep the surface treatment consistent: same border weight, shadow depth, corner radius, padding scale. Cohesion comes from the container, not from forcing every card into the same template.

### Isolated Controls

UI controls deserve container treatment. Date pickers, filters, dropdowns should feel like crafted objects, not plain text with click handlers.

**Never use native form elements for styled UI.** Native `<select>`, `<input type="date">` render OS-native elements that cannot be styled. Build custom components:

- Custom select: trigger button + positioned dropdown menu
- Custom date picker: input + calendar popover
- Custom checkbox/radio: styled div with state management

**Custom select triggers must use `display: inline-flex` with `white-space: nowrap`** to keep text and chevron icons on the same row.

### Monospace for Data

Numbers, IDs, codes, timestamps belong in monospace. Use `tabular-nums` for columnar alignment.

```css
font-variant-numeric: tabular-nums;
font-family: 'SF Mono', 'Fira Code', monospace;
```

### Iconography

Use **Phosphor Icons** (`@phosphor-icons/react`) or **Lucide** (`lucide-react`). Icons clarify, not decorate — if removing an icon loses no meaning, remove it.

For creative contexts, consider custom or thematic icon sets that match the personality.

### Contrast Hierarchy

Build a four-level system: foreground (primary) → secondary → muted → faint. Use all four consistently.

```css
--foreground: hsl(0 0% 9%);
--secondary: hsl(0 0% 32%);
--muted: hsl(0 0% 55%);
--faint: hsl(0 0% 75%);
```

---

## Navigation Context

Screens need grounding. A data table floating in space feels like a component demo, not a product. Consider including:

- **Navigation** — sidebar or top nav showing where you are
- **Location indicator** — breadcrumbs, page title, active nav state
- **User context** — who's logged in, what workspace/org

When building sidebars, consider using the same background as main content with a subtle border for separation (Linear, Vercel approach).

---

## Dark Mode Considerations

**Borders over shadows** — Shadows are less visible on dark backgrounds. Use borders for definition. A border at 10-15% white opacity is often enough.

**Adjust semantic colors** — Status colors often need desaturation for dark backgrounds to avoid feeling harsh.

**Same structure, different values** — The hierarchy system still applies with inverted values.

**Dark as default for creative** — Dark interfaces feel premium, immersive, dramatic. Consider dark-first for entertainment, gaming, creative tools.

---

## Performance Checklist

Design decisions that affect performance. Keep these in mind during implementation.

### Network & Loading

- **POST/PATCH/DELETE:** Complete in <500ms
- **Preconnect** to CDN/API origins: `<link rel="preconnect" href="https://cdn.example.com">`
- **Preload critical fonts** to prevent flash of unstyled text
- **Lazy-load** images below the fold
- **Explicit image dimensions** — prevent Cumulative Layout Shift (CLS)

### Lists & Data

- **Virtualize lists** with 50+ items (use `virtua`, `react-window`, or `content-visibility: auto`)
- **Paginate** large datasets instead of infinite scroll where possible

### Fonts

- **Subset fonts** — only ship code points you use
- Limit variable font axes to what you need
- Use `font-display: swap` or `optional` depending on importance

### CSS

- Avoid animating `width`, `height`, `top`, `left` — use `transform` and `opacity`
- Minimize `backdrop-filter: blur()` on large surfaces — expensive on mobile
- Don't apply `will-change` except during active animations

---

## React Design Patterns

> **Performance patterns are in the `/react-best-practices` skill.**
> This section covers design-specific React patterns only.

### Component Libraries

Use accessible headless primitives — they handle keyboard navigation, ARIA, and focus management:

- **Radix UI** — most popular, great defaults
- **React Aria** (Adobe) — most comprehensive accessibility
- **Base UI** (MUI) — minimal, flexible

**Don't mix primitive systems** on the same interaction surface. Pick one and commit.

### Styling Utilities

Use the `cn()` utility (clsx + tailwind-merge) for conditional class composition:

```tsx
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
<button className={cn(
  'px-4 py-2 rounded',
  isActive && 'bg-blue-500',
  className
)} />
```

### Animation Libraries

- **motion/react** (formerly framer-motion) — for JS-driven animations, gestures, layout animations
- **tw-animate-css** — for Tailwind entrance/exit animations
- Respect `prefers-reduced-motion` in motion components:

```tsx
import { motion, useReducedMotion } from 'motion/react'

const shouldReduceMotion = useReducedMotion()
```

### Navigation

- Use `<Link>` from your router (React Router, Next.js), never `<button onClick={navigate}>`
- Preserve browser behaviors: Cmd/Ctrl+Click opens new tab, middle-click works, right-click shows context menu
- Use `<a>` with `target="_blank" rel="noopener noreferrer"` for external links

### Form Libraries

- **React Hook Form** — for complex forms with validation
- Integrate with **Zod** schemas for type-safe validation
- Use `<Controller>` for custom inputs from Radix/etc:

```tsx
<Controller
  name="status"
  control={control}
  render={({ field }) => (
    <Select value={field.value} onValueChange={field.onChange}>
      {/* Radix Select options */}
    </Select>
  )}
/>
```

---

## Anti-Patterns

### Never Do This (Universal)

- Dramatic drop shadows (`box-shadow: 0 25px 50px...`)
- Large border radius (16px+) on small elements
- Pure white cards on colored backgrounds
- Thick borders (2px+) for decoration
- Multiple competing accent colors
- Generic stock illustrations
- The purple-blue AI gradient

### Never Do This (Enterprise)

- Asymmetric padding without clear reason
- Excessive spacing (margins > 48px between sections)
- Spring/bouncy animations
- Gradients for decoration
- Emoji as UI elements

### Never Do This (Creative)

- Playing it safe with every choice
- Using Inter/Roboto for hero text
- Perfectly centered, perfectly symmetrical, perfectly boring layouts
- Following every "best practice" — rules are for breaking intentionally

### Always Question

- "Did I make intentional choices, or did I accept defaults?"
- "Would a human designer be proud of this, or is it obviously AI-generated?"
- "What's the one thing that makes this memorable?"
- "Does every element earn its place?"
- "Is my visual language consistent throughout?"

---

## The Standard

Every interface should look designed by someone who cares about 1-pixel differences. Not stripped — *crafted*. And designed for its specific context.

Different products want different things. A developer tool wants precision and density. A creative portfolio wants drama and surprise. A financial product wants trust and sophistication. A lifestyle brand wants warmth and texture.

**The goal: distinctive interfaces with appropriate personality. Same quality bar, context-driven execution.**

No more generic AI slop. Every interface is an opportunity to create something worth looking at.
