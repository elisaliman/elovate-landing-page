# design.md

be aware this is AI generated and if there are collisions with this document and the user the most important thing is to address the discrepency and solve it, not assume one way or the other

## Core style

Editorial fashion-tech minimalism with Swiss / neo-grotesk typography, airy sky-world atmospherics, and premium youth consumer UI.

Reference feeling:
- oversized black type
- pale icy-blue to white sky gradients
- floating cutout wardrobe imagery
- minimal rounded UI
- subtle sparkles / lens flare
- campus-social, not corporate SaaS
- premium, light, cool, and calm

---

## Voice & vibe

- light
- airy
- lowercase
- weightless
- editorial
- youthful
- social
- fashion-aware
- quietly playful
- premium, not luxury-stiff
- modern, not nostalgic-for-its-own-sake

Closest shorthand:
- editorial campus fashion-tech
- Swiss-inflected consumer product design
- soft futurist social utility

---

## Visual pillars

### 1. Typography-first art direction
- Arial only (sans-serif fallback)
- giant bold headlines carry the brand
- occasional italic emphasis for contrast / rhythm
- dense black type against open sky space
- headlines feel poster-like, editorial, immediate

### 2. Sky-world atmosphere
- full-bleed pale sky gradient background
- fixed cloud / sparkle / flare layer
- airy daylight, not saturated fantasy
- subtle depth, not dramatic 3D

### 3. Floating wardrobe collage
- outfit pieces are cut out and composed like a lookbook collage
- objects can float, bob, converge, shuffle, and recompose
- imagery should feel merchandised / styled, not ecommerce-grid flat

### 4. Quiet premium UI
- thin strokes
- restrained rounded corners
- black CTA buttons
- minimal iconography
- soft separators and subtle shadows
- consumer-social polish, never enterprise density

---

## Color tokens

### Light
- `--sky-1..4` = pale icy blues / soft near-whites
- `--ink` = `#000`
- `--ink-soft` = `#222`
- `--paper` = `#fff`
- `--join-back` = `#1a1a1a`
- `--flare-op` = `1`
- `--cloud-*` = soft white / cool gray cloud values

Overall palette:
- icy blue
- off-white
- black
- soft gray
- occasional very light periwinkle / lavender accents only

### Dark
- midnight navy sky stack, deliberately uniform
  - `--sky-1` ≈ `#070e22` → `--sky-4` ≈ `#102046`
  - very small hue / lightness travel between stops; the gradient should read as one deep night, not a sky that brightens into royal blue at the bottom
- `--ink` = `#fff`
- `--ink-soft` ≈ `#c7d2e0`
- `--paper` ≈ `#0b1430` (only used as a dark surface for inverted CTAs, not as a card fill)
- muted clouds (silhouettes against the night, not glowing smears)
- `--flare-op` = `0.35`

#### Dark-mode glass cards
- card fills are a near-neutral white lift, **not** a blue-tinted fill
  - `--glass-bg` ≈ `rgba(255, 255, 255, 0.030)`
  - `--glass-bg-strong` ≈ `rgba(255, 255, 255, 0.055)` (featured / CTA)
- rationale: a saturated blue overlay on top of the navy sky composites to a noticeably brighter, more cyan blue than the background, which breaks the "uniform night" feel. A low-alpha white lift inherits the sky hue underneath and only nudges luminance.
- border does most of the visible surface definition: `--glass-border` ≈ `rgba(170, 190, 230, 0.16)` — soft cool blue stroke
- `--glass-highlight` is barely there (`inset 0 1px 0 rgba(255,255,255,0.06)`)
- shadow is deepened for separation against the night: `0 8px 28px rgba(0, 0, 0, 0.32)`
- `--glass-blur` is shared with light mode; blur is for refraction, not for fog

Dark mode should feel like night air, not neon cyber UI. If the cards look like a different blue from the background, the fill is too saturated — pull it back toward neutral white-alpha.

---

## Typography

- font-family: Arial, sans-serif
- all copy lowercase by default
- oversized display headlines: `clamp(...)` roughly 80–120px
- very tight tracking on large headlines
- subtle positive tracking (`~0.02em`) on tiny utility text only
- use italic selectively for one key word / phrase in major headings
- avoid decorative type treatments

Typography tone:
- assertive headline
- restrained interface copy
- no slang-heavy UI labels
- no title-case brand puffery

---

## Layout primitives

- full-bleed sky background
- fixed clouds + sparkles + lens flare layer
- centered primary composition
- generous negative space
- hero sections feel staged, almost gallery-like
- cards and controls align to a clean invisible grid
- imagery can overlap type slightly when art-directed intentionally

---

## Components

### Buttons
- black primary CTA
- white / paper secondary surfaces
- crisp borders
- minimal radii
- no candy gloss, no heavy depth

### Inputs
- simple rectangular / lightly rounded fields
- thin border
- black text on paper
- clean inline layout

### Cards
- pale paper / blue-tinted surfaces
- soft, barely-there shadows
- thin outlines
- no chunky dashboard-card styling

### Icons
- simple outline icons
- small scale
- functional, not expressive
- no emoji as UI decoration

---

## Motion language

Motion should feel:
- light
- precise
- slightly playful
- non-bouncy
- atmospheric, not flashy

### Page-wide theme transition
- 700ms ease on color/background
- 800ms ease on sky/clouds

### Hover
- hover-in: `cubic-bezier(0.4, 0, 0.2, 1)`, 150–200ms
- hover-out: `cubic-bezier(0.4, 0, 1, 1)`, 100–150ms

### Outfit pieces
- `scale(1.03)` + `brightness(1.04)` on hover
- continuous bob keyframe
- motion should feel floating, not bouncing

### Login link
- text-decoration-thickness `1px → 2px`

### Join button
- 2x1 micro tile-flip
- ~200ms total
- low-contrast back face using `--join-back`

### Theme toggle
- vertical twist
- `scaleX 1→0`, `scaleY 1→1.25`, swap glyph, expand back
- ~170ms each phase

### Piece click
- 360° spin
- 600ms
- `cubic-bezier(0.45, 0, 0.55, 1)`
- re-entrancy guarded by `WeakSet`

### Form errors
- horizontal shake
- 280ms
- ±6px

### Outfit cycling
- every 10s
- one of the choreographies
- no back-to-back repeats
- 2–2.5s each

### Intro sequence
- 0ms sky
- 500ms ribbon
- 2200ms converge
- 2350ms tile flip
- ~3850ms fully visible landing

---

## Reduced-motion contract

`prefers-reduced-motion: reduce`
- disables hover transforms
- disables click spins
- disables theme twist
- keeps color and opacity transitions
- preserves readability and state clarity

---

## Asset pipeline

- raw images in `outfits/outfit_n/`
- normalized via `tools/normalize_outfits/README.md`
- page consumes `outfits_normalized/`

Imagery rules:
- cutout pieces only
- clean edges
- consistent apparent scale
- realistic shadows only if extremely subtle
- no loud drop-shadow stickers

---

## Do

- use oversized type as the main visual system
- keep compositions open and breathable
- treat outfit imagery like editorial collage
- use pale sky gradients and faint atmospheric effects
- keep UI chrome sparse and calm
- preserve lowercase tone
- let one or two details feel slightly playful

---

## Don’t

- gradient blobs
- Inter / Helvetica
- neon accents
- chrome silver
- rounded shadow cards with SaaS weight
- emoji as decoration
- frosted glass
- motion blur
- gamer / cyber styling
- meme-ironic visual jokes
- dense enterprise dashboard patterns
- serif luxury-fashion branding