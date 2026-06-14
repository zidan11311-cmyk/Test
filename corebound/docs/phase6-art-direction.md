# CoreBound — Phase 6: Art Direction Document

**Game:** CoreBound  
**Platform:** iOS / Android (Godot 4)  
**Genre:** 2D Mobile Sandbox  
**Art Style:** Chunky Pixel  
**Document Version:** 1.0  
**Date:** 2026-06-14

---

## Table of Contents

1. [Art Style Overview](#1-art-style-overview)
2. [Color Palettes (Per Depth Layer)](#2-color-palettes-per-depth-layer)
3. [Tile Sprite Specifications](#3-tile-sprite-specifications)
4. [Player Sprite Specifications](#4-player-sprite-specifications)
5. [Machine Sprite Specifications](#5-machine-sprite-specifications)
6. [Vehicle Sprite Specifications](#6-vehicle-sprite-specifications)
7. [UI Art Specifications](#7-ui-art-specifications)
8. [Particle & VFX Specifications](#8-particle--vfx-specifications)
9. [Shader Effects List](#9-shader-effects-list)
10. [Animation Controller States](#10-animation-controller-states)
11. [Background Art Specifications](#11-background-art-specifications)
12. [Asset File List (Artist Handoff)](#12-asset-file-list-artist-handoff)
13. [Godot Import Settings](#13-godot-import-settings)
14. [Recommended Workflow for Artist](#14-recommended-workflow-for-artist)

---

## 1. Art Style Overview

### Style Name: "Chunky Pixel"

CoreBound uses a bold, friendly pixel art aesthetic that blends the colorful accessibility of Roblox with the tactile block world of Minecraft and the 2D depth progression of Terraria. The style must read clearly on small mobile screens without sacrificing character or depth.

### Core Principles

| Principle | Rule |
|---|---|
| Outlines | 2px total — 1px outer (darkened background color), 1px inner (slightly darker than fill) |
| Colors | Bold, saturated fills. No gradients. No dithering on primary shapes. |
| Shading | Maximum 2 shade levels per color area (highlight + base; no mid-tone blending) |
| Textures | No realistic textures. Use simple geometric marks: dots, hatches, small notches. |
| Palette size | Maximum 16 colors per biome palette (outlines + fills + accent colors) |
| Anti-aliasing | Never. Always nearest-neighbor rendering. |

### Character Design Rules

- Characters are cute and slightly rounded — squared edges softened by 1-pixel corner cuts.
- Eyes are 2×2 px or 2×3 px solid blocks — no pupils drawn separately.
- Limbs are chunky and short (arms are 3px wide minimum).
- Expressions are minimal: default neutral/happy face; hurt uses angled "X" or dot eyes.

### Animation Philosophy

- Animation cycles: **6–8 frames** per full action.
- Anticipation squash: **1–2 frames** of compression before jumps and impacts.
- Impact flash: **1 frame** of white-tinted brightness on hit/break.
- Snappy easing: fast acceleration, slow settle. No floating or loose motion.
- Idle animations should be subtle — breathing/blinking bob of 1–2 px maximum.

---

## 2. Color Palettes (Per Depth Layer)

Each palette has a maximum of 16 colors. Hex values listed as used in sprite work. The "common" colors (black outline, white highlight) are shared across all palettes.

**Shared across all palettes:**
- Outline/shadow: `#0D0D0D`
- Bright highlight: `#FFFFFF`

---

### Layer 1 — Surface (Tiles 0–50)

The world starts here: open sky, lush grass, warm earthy soil, scattered trees and sand.

| Role | Hex | Description |
|---|---|---|
| Sky fill | `#87CEEB` | Bright daytime sky blue |
| Sky horizon | `#B8E4F9` | Lighter sky near horizon |
| Grass bright | `#5CB830` | Top face of grass tiles |
| Grass mid | `#4A9A25` | Grass body / side blades |
| Grass shadow | `#357018` | Underside shadow on grass |
| Dirt light | `#A06030` | Lit surface of dirt |
| Dirt base | `#7A4A20` | Main dirt fill |
| Dirt dark | `#5A3010` | Dirt shadow / deep crevice |
| Bark light | `#8C5A28` | Lit side of wood log |
| Bark base | `#6B3F14` | Main trunk color |
| Bark ring | `#4E2C0A` | Annual ring marks on log |
| Leaf bright | `#6DD44A` | Sunlit leaf cluster |
| Leaf base | `#3D9E22` | Main leaf fill |
| Sand bright | `#E8D888` | Sunlit sand surface |
| Sand base | `#C8B860` | Main sand fill |
| Sand shadow | `#A09040` | Shadow in sand |

---

### Layer 2 — Shallow Underground (Tiles 50–250)

First cave layer. Cool greys, first ores appear. Coal veins turn stone dark. Copper brings warm orange. Iron adds rust.

| Role | Hex | Description |
|---|---|---|
| Stone light | `#909090` | Lit face of stone |
| Stone base | `#6E6E6E` | Main stone fill |
| Stone dark | `#4C4C4C` | Stone shadow / crack color |
| Stone crack | `#3A3A3A` | Thin crack marks in stone variants |
| Coal vein | `#1E1E1E` | Coal deposit veins in stone |
| Coal spec | `#2E2E2E` | Subtle coal glint |
| Copper bright | `#CC7230` | Lit copper ore dot |
| Copper base | `#A05018` | Main copper ore color |
| Iron vein | `#8A4E3A` | Iron ore vein fill |
| Iron rust | `#C06040` | Bright iron rust highlight |
| Tin light | `#A8B8C8` | Lit tin ore face |
| Tin base | `#7890A0` | Main tin ore color |
| Clay light | `#C08868` | Lit clay surface |
| Clay base | `#9A6848` | Main clay fill |
| Dirt deep | `#6A4018` | Deeper dirt appears darker |
| Shadow deep | `#282828` | Ambient cave shadow |

---

### Layer 3 — Deep Rock (Tiles 250–625)

Darker, denser geology. Silver and gold ores appear. The rock is heavier, more pressure-cracked. Blue-grey cold tones dominate.

| Role | Hex | Description |
|---|---|---|
| Deep stone light | `#6A6478` | Lit face of deep stone |
| Deep stone base | `#4A4455` | Main deep stone fill |
| Deep stone dark | `#2E2838` | Deep stone shadow |
| Deep crack | `#1A1620` | Crack and crevice marks |
| Silver bright | `#E0E0EC` | Lit silver ore vein |
| Silver base | `#B0B0C0` | Main silver ore fill |
| Silver shadow | `#808090` | Shadow edge of silver vein |
| Gold bright | `#FFD020` | Lit gold ore dot |
| Gold base | `#C89808` | Main gold ore fill |
| Gold dark | `#907000` | Gold vein shadow |
| Aluminum bright | `#C0D0DC` | Lit aluminum ore spot |
| Aluminum base | `#8CA0B0` | Main aluminum ore fill |
| Rock blue | `#3A4060` | Cool blue-grey ambient rock |
| Rock purple | `#3A2850` | Subtle purple tint in deep rock |
| Void dark | `#141020` | Darkest shadow / background |
| Mineral white | `#F0EEF8` | Quartz mineral speck |

---

### Layer 4 — Crystal Caverns (Tiles 625–1125)

Magical, luminous. Crystals grow from walls and ceiling. Everything glows cyan and teal. Magenta crystal variants provide contrast.

| Role | Hex | Description |
|---|---|---|
| Crystal stone light | `#8898C8` | Lit crystal-infused stone |
| Crystal stone base | `#5868A0` | Main crystal stone fill |
| Crystal stone dark | `#303860` | Shadow on crystal stone |
| Crystal bright | `#A0F0FF` | Brightest crystal highlight (glow tip) |
| Crystal mid | `#40C8F0` | Main crystal fill |
| Crystal shadow | `#1888B0` | Shadow inside crystal facet |
| Crystal teal | `#20B0A8` | Teal crystal variant |
| Crystal magenta | `#E040C0` | Magenta crystal accent / variant |
| Crystal white | `#F0FAFF` | Inner light core of crystal |
| Cavern teal | `#106858` | Teal ambient cave wall |
| Cavern dark | `#0A1C28` | Dark cavern background |
| Glow aura | `#60E8FF` | Soft glow halo color (semi-transparent in sprite) |
| Electric blue | `#2080FF` | Bright electric crystal accent |
| Frost white | `#E8F8FF` | Ice/quartz vein in crystal stone |
| Void teal | `#082018` | Deep shadow behind crystal clusters |
| Pulse cyan | `#00FFEE` | Animation frame peak glow color |

---

### Layer 5 — Magma Layer (Tiles 1125–1750)

Oppressive heat. Dark red and obsidian dominate. Lava pools glow from below. Air shimmers. Everything is scorched.

| Role | Hex | Description |
|---|---|---|
| Magma stone light | `#603020` | Lit face of magma stone |
| Magma stone base | `#3E1808` | Main magma stone fill |
| Magma stone dark | `#200800` | Deep shadow on magma stone |
| Obsidian bright | `#2E2038` | Subtle sheen highlight on obsidian |
| Obsidian base | `#180C20` | Main obsidian fill |
| Obsidian dark | `#0A0610` | Obsidian shadow edge |
| Lava bright | `#FFD020` | Lava glow hotspot (animation peak) |
| Lava mid | `#FF6010` | Main lava fill |
| Lava dark | `#C02000` | Cooling lava / flow shadow |
| Lava crust | `#401000` | Solidified lava crust |
| Magma ore glow | `#FF4010` | Glowing magma ore vein |
| Magma ore base | `#B82808` | Main magma ore color |
| Ember | `#FF9030` | Floating ember particle color |
| Scorch | `#281008` | Scorch mark on rock face |
| Heat dark | `#300800` | Oppressive ambient heat shadow |
| Ash grey | `#504030` | Ash-dusted rock surface |

---

### Layer 6 — The Core (Tiles 1750+)

The deepest layer. Alien and extreme. Violet-black rock, plasma-pink energy. The world's center radiates raw power.

| Role | Hex | Description |
|---|---|---|
| Core rock light | `#4A1858` | Lit face of core rock |
| Core rock base | `#280D35` | Main core rock fill |
| Core rock dark | `#100518` | Deep shadow on core rock |
| Core void | `#080010` | Near-black void fill |
| Core ore bright | `#FFB8FF` | Peak glow on core ore |
| Core ore mid | `#E060E0` | Main core ore fill |
| Core ore shadow | `#801880` | Shadow on core ore vein |
| Plasma white | `#FFF0FF` | Energy core discharge white |
| Plasma blue | `#4080FF` | Blue plasma streak |
| Energy pink | `#FF40A0` | Hot plasma pink |
| Violet deep | `#3A0060` | Deep violet ambient |
| Dark rim | `#200030` | Rim shadow on core shapes |
| Pulse purple | `#8020FF` | Animation peak pulse color |
| Plasma glow | `#C0A0FF` | Soft purple energy aura |
| Near black | `#0C0010` | Deepest background color |
| Core white | `#FFFFFF` | Bright energy discharge (animation only) |

---

## 3. Tile Sprite Specifications

### Base Rules

- **Canvas size:** 16×16 px per tile (Godot scales to 32×32 at runtime)
- **Variants:** Natural tiles use multiple variants for visual variety; placed tiles use 1 variant
- **Autotile:** Tiles that need to match neighbors (grass top, dirt sides) use Godot TileSet terrain autotile rules
- **Animated tiles:** Exported as horizontal spritesheets (frame width = 16px)
- **Outline:** 1px outer dark outline on all non-transparent edges

---

### Tile Detail Specifications

| Tile ID | Palette Layer | Variants | Autotile | Animated | Visual Description |
|---|---|---|---|---|---|
| `air` | — | 1 | No | No | Fully transparent (no sprite needed; placeholder is invisible) |
| `grass` | Surface | 3 | Yes | No | Top row: bright green with 2–3 px blade nubs poking up. Body: dirt brown with 2px green overlap strip at top. Autotile: top face shows blade nubs, sides show dirt, corners blend cleanly. Variant 2 adds a small flower dot. Variant 3 adds a tiny mushroom. |
| `dirt` | Surface | 4 | Yes | No | Base fill of warm brown. 3–4 small scattered pixel clusters (1×1 or 1×2) in dark brown to suggest loose soil. Variant 2 has a small pebble. Variant 3 has a worm-like curve mark. Variant 4 is plain for uniformity. Autotile: bottom/side edges have subtle banding. |
| `stone` | Shallow | 4 | No | No | Medium grey base. Each variant has 2–3 thin crack marks (1px wide, 2–4px long, irregular direction). Variant 1: single horizontal crack. Variant 2: two angled cracks crossing. Variant 3: large L-shaped crack. Variant 4: smooth with mineral speck (1×1 white dot). |
| `coal_ore` | Shallow | 3 | No | No | Stone base with dark grey/near-black vein overlay. Vein is 3–5px wide irregular blob shape. 1–2 small brighter speck inside vein (simulating coal glint). Variant 2 has wider vein. Variant 3 has two separate small vein pockets. |
| `copper_ore` | Shallow | 3 | No | No | Stone base with 3–4 orange-brown dots scattered asymmetrically. Dots are 2×2 px with a 1px bright highlight on upper-left corner. Variant 2 has slightly larger dots. Variant 3 has a connected blob instead of separate dots. |
| `iron_ore` | Shallow | 3 | No | No | Stone base with reddish-rust vein running diagonally across tile. Vein is 2px wide with a brighter rust highlight on the upper edge. Variant 2: horizontal vein. Variant 3: two short parallel veins. |
| `tin_ore` | Shallow / Deep | 2 | No | No | Stone base with silvery-blue oval patch in center. Patch is 5×4px, lighter blue-grey fill, 1px bright edge on top. Variant 2 shifts the patch to lower-right corner. |
| `silver_ore` | Deep Rock | 3 | No | No | Deep stone base with bright silver-white vein running vertically. Vein has a specular highlight (1px bright white line inside the vein center). Variant 2: branching vein. Variant 3: small cluster of 3 dots. |
| `gold_ore` | Deep Rock | 3 | No | No | Deep stone base with 2–3 golden-yellow dots. Each dot is 2×2 px with a bright yellow highlight. Dot edges are outlined in dark gold. Variant 2 has a connected gold vein bar. Variant 3 has a large 4×3 px gold blob. |
| `aluminum_ore` | Deep Rock | 2 | No | No | Deep stone base with 3 pale blue-grey rectangular patches (2×2 px each). Arranged in a loose triangle pattern. Variant 2 has them in a diagonal line. |
| `deep_stone` | Deep Rock | 4 | No | No | Darker blue-grey stone. Cracks are more pronounced and angular than regular stone. Subtle purple tint in fill. Variant 2 has a mineral white quartz speck. Variant 3 has crossed cracks. Variant 4 is plain. |
| `crystal_stone` | Crystal Caverns | 3 | No | No | Deep blue-grey base with small crystal shard protrusions on one or two edges (3–4px tall, 2px wide triangle pointing outward). Crystal is cyan-tinted. Variant 2 has crystal on opposite edge. Variant 3 has crystal stub from center. |
| `crystal_ore` | Crystal Caverns | 2 | No | Yes (4 frames) | Crystal-infused stone. Center features a 6×6 px crystal cluster shape — multi-faceted (3–4 triangular sub-shapes). Animates with glow pulse: frames alternate between dim fill and bright glow by shifting the crystal color from `#1888B0` → `#40C8F0` → `#A0F0FF` → `#40C8F0`. Outline adds a faint halo of semi-transparent cyan on brightest frame. |
| `magma_stone` | Magma Layer | 3 | No | No | Very dark reddish-brown base. Jagged crack marks (not curved — angular, sharp). Cracks have a faint red-orange glow along their edges (1px line of `#C02000` inside crack). Variant 2 has scorched upper face. Variant 3 has ash dusting (grey pixel flecks). |
| `obsidian` | Magma Layer | 2 | No | No | Near-black fill (`#180C20`). Highly polished look: a 2-pixel curved highlight along the top-left corner simulates reflectivity. A very faint purple sheen in the base fill. Variant 2 shifts the highlight to top-right for variety. No cracks — obsidian is smooth and unbroken. |
| `magma_ore` | Magma Layer | 2 | No | Yes (4 frames) | Dark magma stone base with bright orange-red glowing vein that pulses. Vein is irregular, like cracked lava. Animation: frames cycle glow from `#B82808` → `#FF4010` → `#FFD020` → `#FF4010`. Brightest frame adds a 1px outer glow halo pixel on vein edges. |
| `core_rock` | The Core | 3 | No | No | Near-black with deep violet fill. Surface has faint energy tracery — thin 1px lines of purple that branch like veins, covering 30% of the tile face. These energy lines do not animate (static). Variant 2 has denser tracery. Variant 3 is sparse (only 1–2 lines). |
| `core_ore` | The Core | 2 | No | Yes (4 frames) | Core rock base with a central energy node — a 5×5 px radial burst shape (star-like). Animates with bright energy pulse cycling through `#801880` → `#E060E0` → `#FFB8FF` → `#FFF0FF` → `#FFB8FF` → `#E060E0`. On peak frame, outer 1px halo appears. |
| `sand` | Surface | 3 | No | No | Warm yellow-beige base. Slight speckling with 1×1 px darker dots (4–6 scattered) to suggest grain texture. Top edge is slightly lighter (sunlit). Variant 2 has small stone pebble (2×2 px grey dot). Variant 3 has ripple marks (two thin horizontal arcs). |
| `clay` | Surface / Shallow | 2 | No | No | Reddish-tan fill. Smooth surface with subtle horizontal layering — 2px height bands in a slightly darker tone to suggest clay strata. Variant 2 shifts the band positions. |
| `wood` | Surface | 2 | No | No | Vertical log cross-section. Outer bark ring is dark brown. Inner wood fill is lighter warm brown. Annual ring marks: 2–3 concentric oval-ish marks in slightly darker brown (1px thick). Center has a small darker dot (heartwood). Looks like a cut log from the side. |
| `leaves` | Surface | 4 | No | No | Solid green fill with 4–6 small 1×1 px darker green speckles to break up the flat fill. Variant 2 has a lighter patch (sunlit spot). Variant 3 has a small gap/hole showing sky (transparent cluster of 2×2 px). Variant 4 is dense and uniform. Edges are irregular — use transparent pixels on corners to suggest leaf cluster. |
| `water` | Surface | 1 | No | Yes (6 frames) | Semi-transparent blue fill (25% opacity base). Top surface shows a sine-wave highlight (white, 1px, gentle undulation). Animation: the wave highlight scrolls horizontally across 6 frames (full cycle). Bubbles may appear: 2–3 single-pixel white dots at different heights per frame. The blue fill shifts subtly between `#3480E8` and `#1860C0`. |
| `lava` | Magma Layer | 1 | No | Yes (6 frames) | Fully opaque orange-red fill. Bright yellow hotspot areas (irregular blob shapes, 3–4px across) animate: they drift upward and fade over 6 frames simulating lava convection. Top surface has a bright yellow-white highlight line. Dark red "crust" islands drift across the surface in one or two frames. Color range: `#C02000` base → `#FF6010` body → `#FFD020` hotspot peaks. |
| `rail` | Shallow / all layers | 1 | Yes | No | Perspective top-down view of metal track. Background is transparent or thin grey stone ground. Two parallel horizontal lines (2px thick each) represent the rails — medium grey (`#909090`) with a bright highlight on top (`#C8C8C8`). Cross-ties (wooden sleepers) are 4px wide, 2px tall rectangles in dark brown (`#5A3010`), spaced every 6px. Rail junction at ends has connecting tab. Autotile: joins to adjacent rails — straight, corner L, T-junction, and cross variants. |

---

## 4. Player Sprite Specifications

### Overview

The player character is a small blocky explorer — short, sturdy, and immediately readable at mobile scale. The sprite is intentionally simple to allow quick animation and clear silhouetting against both bright surface and dark cave backgrounds.

### Sprite Sheet

- **File:** `player/player_spritesheet.png`
- **Base frame size:** 16×32 px per frame (width × height)
- **In-game display:** 32×64 px (scaled 2× by Godot)
- **Sheet layout:** Horizontal strip per animation state, states stacked vertically
- **Background:** Transparent

### Character Anatomy (at 16×32 px)

| Body Part | Size | Position |
|---|---|---|
| Head | 10×10 px | Top-center, y=1 to y=10 |
| Eyes | 2×2 px each | y=4–5, x=3–4 (left), x=8–9 (right) |
| Body / torso | 10×10 px | y=11 to y=20 |
| Legs (pair) | 4×8 px each | y=21 to y=28 |
| Arms (pair) | 3×8 px each | y=11 to y=18, sides of torso |
| Feet / boots | 4×4 px each | y=29 to y=32 |
| Helmet | 12×6 px | Sits atop head, y=-2 to y=3 (overdrawn) |

Clothing: overalls (blue/denim fill on torso and legs), boots (dark brown), gloves (tan/brown on hands at arm tips), helmet (varies by tier — see below).

### Animation States

| State | Frame Count | Frame Rate | Notes |
|---|---|---|---|
| `idle` | 4 | 4 fps | Subtle 1px vertical bob on frames 2–3. Eye blink on frame 3 (eyes close: solid 1px bar instead of 2×2 block). Arms hang slightly in frames 3–4. |
| `walk` | 6 | 12 fps | Clear alternating leg cycle. Left leg forward frames 1–3, right leg forward frames 4–6. Arms swing opposite to legs. Head stays steady. Boots lift 2px on leading step. |
| `jump` | 3 | 10 fps | Frame 1: crouch — body compresses 2px, legs bend (feet 2px higher). Frame 2: launch — body fully extended, arms raised, slight forward lean. Frame 3: airborne — legs tucked slightly, arms extended outward. |
| `fall` | 2 | 8 fps | Frame 1: arms out wide, legs slightly apart. Frame 2: legs closer together, body angled slightly downward. |
| `mine` | 4 | 12 fps | Arm on mining side swings pickaxe in arc. Frame 1: arm raised. Frame 2: arm at 45 degrees. Frame 3: impact (arm fully extended toward block). Frame 4: arm retracting. Body leans toward mining direction. |
| `mine_break` | 1 | — | Single impact flash frame: sprite briefly tints white. The block break VFX triggers simultaneously. |
| `mount_vehicle` | 2 | 6 fps | Frame 1: player crouching beside vehicle. Frame 2: player seated/straddling vehicle (legs disappear, body visible in cab). |
| `hurt` | 2 | 10 fps | Frame 1: recoil — body tilts backward 2px, arms flung out. Frame 2: flash frame (sprite tints red, eyes show "X" or dots). Returns to idle after 0.3s. |
| `death` | 4 | 8 fps | Frame 1: falling (same as hurt but more extreme tilt). Frame 2: on ground, body flat. Frame 3: body fades (eyes close). Frame 4: star/ghost pop (brief particle, then sprite hides). |

**Total frames:** 4+6+3+2+4+1+2+2+4 = 28 frames  
**Sheet dimensions:** 16×28 = 448 px wide, 32 px tall (single row; OR organized as vertical stack per state)

**Recommended sheet layout (vertical stacking by state):**
- Row 0 (y=0): idle — 4 frames — 64×32 px strip
- Row 1 (y=32): walk — 6 frames — 96×32 px strip
- Row 2 (y=64): jump — 3 frames — 48×32 px strip
- Row 3 (y=96): fall — 2 frames — 32×32 px strip
- Row 4 (y=128): mine — 4 frames — 64×32 px strip
- Row 5 (y=160): mine_break — 1 frame — 16×32 px strip
- Row 6 (y=192): mount_vehicle — 2 frames — 32×32 px strip
- Row 7 (y=224): hurt — 2 frames — 32×32 px strip
- Row 8 (y=256): death — 4 frames — 64×32 px strip

**Full sheet size:** 96×288 px (widest row × total height)

### Gear / Equipment Appearance

Gear changes are drawn into separate overlay sprite sheets or are baked into alternate player sheets per tier. Artist should produce a base (no helmet / default gear) and the following helmet variants:

| Tier | Helmet | Visual | Light Radius |
|---|---|---|---|
| 0 | None | Bare head | 0 (no light) |
| 1 | Basic Helmet | Grey dome with single round lamp nub on front (2px yellow dot) | Small (3 tiles) |
| 2 | Iron Helmet | Grey metal flat-top with visor line (1px horizontal mark), lamp is larger (3×2 px yellow-white) | Medium (5 tiles) |
| 3 | Crystal Helmet | Blue-tinted dome, cyan lamp, faint glow aura on helmet edges | Large (8 tiles) |
| 4 | Core Helmet | Violet-black dome, plasma-pink lamp glow, energy vein markings on sides | Full (12 tiles) |

---

## 5. Machine Sprite Specifications

### Base Rules

- **Canvas size:** 32×32 px per frame (displayed as 32×32 in-game, no scaling)
- **Working at:** 32×32 directly (machines are 1 tile, designed at native resolution)
- **Output side:** The "output" or "active" face is highlighted with a brighter accent color or arrow indicator
- **Facing:** Machines that face a direction (drills, furnaces) have a distinct front face
- **Animated:** Exported as horizontal spritesheet — frames × 32 px wide, 32 px tall

---

### Machine Visual Specifications

#### mining_drill_mk1
- **File:** `machines/mining_drill_mk1.png`
- **Frames:** 4 (drill rotation cycle)
- **Animated:** Yes — drill spin
- **Visual:** Grey metal box body occupying top 20px. Front face has bolt marks (2×2 px dark squares at corners). Bottom 12px shows drill cone: triangular shape with spiral groove marks. Dust particle pixels scatter from drill tip on frames 3–4. Accent color: none (raw metal grey). Output indicator: arrow on bottom face.
- **Colors:** Stone grey body, dark grey bolts, medium grey drill cone, dark outline

#### mining_drill_mk2
- **File:** `machines/mining_drill_mk2.png`
- **Frames:** 4 (drill rotation cycle, faster implied by sharper angles)
- **Animated:** Yes — drill spin
- **Visual:** Slightly larger drill cone than Mk1 (fills more of bottom face). Body is steel-blue tinted. Blue accent stripe on body sides (2px wide, electric blue). Drill has a brighter metallic sheen. Small blue LED indicator light on upper face (2×2 px cyan dot). Output indicator: blue glowing arrow on bottom.
- **Colors:** Steel blue body, blue accent, bright drill tip highlight, cyan LED

#### conveyor_belt
- **File:** `machines/conveyor_belt.png`
- **Frames:** 4 (belt scroll animation)
- **Animated:** Yes — horizontal arrow marks scroll
- **Visual:** Low-profile machine (only 8px tall, centered in 32×32 tile). Belt surface fills the width. Moving arrow marks (chevrons, 4px wide) travel in direction of output at 4 frames per scroll. Belt side shows roller drums (2×8 px cylinders at each end, medium grey). Belt color: dark yellow `#C89000`. Arrow marks: darker yellow `#A07000` with 1px bright outline.
- **Colors:** Dark yellow belt, medium grey rollers, dark outline

#### fast_belt
- **File:** `machines/fast_belt.png`
- **Frames:** 4 (faster scroll — arrow marks are denser / more of them visible)
- **Animated:** Yes — faster arrow scroll
- **Visual:** Same profile as conveyor_belt but belt color shifts to orange-yellow `#E8A000`. Arrow marks are slightly more numerous. Side rollers have orange accent. A thin speed-line streak is painted on belt edges (1px bright orange line).
- **Colors:** Orange-yellow belt, orange accent, grey rollers

#### stone_furnace
- **File:** `machines/stone_furnace.png`
- **Frames:** 4 (fire flicker)
- **Animated:** Yes — fire glow in window pulses
- **Visual:** Square stone-textured body (matching stone tile look). Front face has a small arched window (8×6 px opening). Inside the window: animated fire (frames cycle through no-fire → small flame → medium flame → dim ember using pixels of yellow, orange, red). Chimney nub on top (4×4 px raised block). Input slots implied by colored slots on sides. Stone body has crack marks for texture.
- **Colors:** Stone grey body, dark grey mortar lines, orange-yellow fire, red ember

#### electric_furnace
- **File:** `machines/electric_furnace.png`
- **Frames:** 4 (light pulse)
- **Animated:** Yes — blue glow pulses from window/vents
- **Visual:** Clean steel-blue metal body, no stone texture. Front has rectangular window (8×6 px) with cyan/blue inner glow (no flames — this is electric). Vent slits on sides (horizontal 1px openings). Blue LED status light on top (2×2 px). Glow animation: window color pulses from `#1060B0` → `#20A0FF` → `#80D0FF` → `#20A0FF`. Clean geometric look, minimal surface detail.
- **Colors:** Steel blue body, cyan glow, bright accent LEDs

#### assembler_mk1
- **File:** `machines/assembler_mk1.png`
- **Frames:** 6 (mechanical arm movement cycle)
- **Animated:** Yes — small mechanical arms visible on front face move
- **Visual:** Green-tinted metal box body. Front face shows a miniature assembly bay: two tiny mechanical arm stubs (2×4 px each) that rotate/pivot in animation. Center of front face has a 6×6 px "work area" (slightly recessed, darker green). Input/output slots indicated by colored ports on sides (orange = input, blue = output). Status indicator: green LED on top.
- **Colors:** Green body, dark green shadow, orange input ports, blue output port, small metal arm details

#### coal_generator
- **File:** `machines/coal_generator.png`
- **Frames:** 4 (smoke puff)
- **Animated:** Yes — smoke from chimney
- **Visual:** Dark grey blocky body with coal-black intake slot on front (4×4 px opening, dark interior). Chimney on top-right (4×8 px rectangular tube). Smoke animation: grey cloud pixel clusters pop from chimney top on frames 2–3 and drift upward/disperse by frame 4. Power output indicator: yellow lightning bolt icon (8×8 px) on front face center. Side has ventilation marks.
- **Colors:** Dark charcoal body, black intake, yellow lightning icon, grey smoke puffs

#### wooden_chest
- **File:** `machines/wooden_chest.png`
- **Frames:** 1 (static)
- **Animated:** No
- **Visual:** Classic wooden chest shape. Dark brown outline. Wood plank texture on body (horizontal plank lines every 4px, alternating light/dark brown). Metal clasp in center front: small grey rectangle (6×4 px) with a 2×2 px latch dot. Metal corner reinforcements at all 4 corners (2×2 px grey squares). Hinges implied on top edge (2 small grey squares).
- **Colors:** Medium brown planks, dark brown grain lines, grey metal clasp and corners

#### iron_chest
- **File:** `machines/iron_chest.png`
- **Frames:** 1 (static)
- **Animated:** No
- **Visual:** Same silhouette as wooden_chest but all metal. Grey metal plate body with faint surface texture (subtle criss-cross hatch marks, 1px grey-on-grey). Heavy lock mechanism in center front: larger grey square (8×6 px) with padlock shape. Corner rivets (1×1 px bright dots at all 4 corners, all mid-edges). Slightly darker than stone to suggest heavy iron.
- **Colors:** Medium grey body, dark grey lock, bright rivet dots

#### splitter
- **File:** `machines/splitter.png`
- **Frames:** 1 (static or optional 2-frame toggle)
- **Animated:** Optional (2 frames showing output direction alternating)
- **Visual:** Compact diamond-shaped body (within 32×32 square). Purple-tinted metal. Four belt connection ports on all four sides (small 4px notches). Center has a directional arrow icon (alternating left/right) indicating split behavior. If animated: arrow icon flips between left-pointing and right-pointing on 2 frames.
- **Colors:** Purple-grey body, bright purple accent arrow, dark outline

---

## 6. Vehicle Sprite Specifications

### Base Rules

- Vehicles are larger than a single tile and face left/right
- Each vehicle has mirrored frames for left-facing (or the game mirrors the sprite at runtime — document the "right-facing" master)
- All vehicle sprites use transparent backgrounds
- Animation strips are horizontal (frames × width)

---

### Vehicle Visual Specifications

#### Mining Cart

| Property | Value |
|---|---|
| File | `vehicles/mining_cart.png` |
| Base sprite size | 48×32 px |
| In-game display | 96×64 px (2× scale) |
| Facing direction | Faces direction of travel (needs left and right versions, or runtime-flip) |

**Visual Description:**  
Wooden cart body with rounded-rectangle silhouette. The body is 40×20 px of dark-outlined brown wood, with horizontal plank lines (every 4px) in alternating light/dark brown. Two large metal wheels (10px diameter circles) visible on the lower portion — spoke details inside each wheel (4 cross-spokes in dark grey against lighter wheel fill). Rope/chain handle loops from the front. Small cargo lip around the open top of the cart body. Wheels sit at y=22 to y=32.

**Animation Frames:**

| Animation | Frames | Frame Rate | Notes |
|---|---|---|---|
| `wheel_roll` | 4 | 12 fps | Spokes rotate 90° per frame (simulates rolling). Body stays static. |
| `idle` | 2 | 4 fps | Subtle 1px vertical bob — cart settles slightly then returns. |

**Colors:** Dark brown body, medium brown planks, grey metal wheels and axle, dark grey spokes, tan rope handle.

---

#### Drill Vehicle

| Property | Value |
|---|---|
| File | `vehicles/drill_vehicle.png` |
| Base sprite size | 64×48 px |
| In-game display | 128×96 px (2× scale) |
| Facing direction | Faces left or right |

**Visual Description:**  
Heavy tracked body (lower 16px of sprite) with continuous tank tread — a series of grey-brown rectangular tread plates linked together. Main body (upper 32px) is angular and boxy: steel-grey with riveted plates and a small rectangular cab window showing the player's helmet silhouette inside. A large front-mounted drill assembly extends from the facing direction: conical drill head (16×20 px), spiral groove texture along the cone, mounted on a short neck/arm. Drill tip is the brightest point. Exhaust stack on the rear top emits smoke when active.

**Animation Frames:**

| Animation | Frames | Frame Rate | Notes |
|---|---|---|---|
| `drive` | 6 | 12 fps | Tread plates scroll past on bottom — each plate shifts 2px per frame, simulating forward movement. Body rocks very slightly (0–1px). |
| `drill_spin` | 4 | 16 fps | Drill head spiral grooves rotate. Tip shows small spark/glow pixels on frames 3–4. |
| `idle` | 2 | 4 fps | Engine idle — subtle 1px body vibration. Exhaust puff frame on frame 2. |

**Colors:** Steel grey body, dark grey tread, bright drill tip, cab window tint (blue-grey), rivets as bright dots.

---

#### Hover Vehicle

| Property | Value |
|---|---|
| File | `vehicles/hover_vehicle.png` |
| Base sprite size | 80×32 px |
| In-game display | 160×64 px (2× scale) |
| Facing direction | Faces left or right |

**Visual Description:**  
Sleek horizontal hull — low-profile, aerodynamic wedge shape. Hull is 60×18 px, positioned in the upper-center of the sprite. Smooth metallic surface (minimal surface texture — this is a polished machine). Front comes to a point (or shallow wedge). Cockpit bubble sits center-top: a rounded dome (16×10 px) of semi-transparent blue-grey with a dark interior showing the player inside. Two hover pad assemblies hang below the hull, one near each end — each pad is 10×8 px with a downward-facing glow emitter (cyan/electric blue gradient disk, 2px glow halo). The glow pads are the signature visual feature.

**Animation Frames:**

| Animation | Frames | Frame Rate | Notes |
|---|---|---|---|
| `hover` | 4 | 8 fps | Gentle vertical bob — entire hull moves 0–2px up and down sinusoidally. Hover pad glow intensity pulses in sync (dim → bright → dim → bright). |
| `thrust` | 3 | 12 fps | Engine exhaust vents on rear emit thrust stream — streak pixels trail behind the vehicle for 8px. Frames 1–2 show full bright thrust, frame 3 dims. |

**Colors:** Silver-grey hull, cockpit dome (translucent blue), cyan hover pad glow, orange-white thrust exhaust.

---

## 7. UI Art Specifications

### Design Principles

- All UI panels use a consistent "dark semi-transparent stone" panel style
- Rounded corners: 4px radius (simulated with 4px corner bevels in pixel art)
- Primary dark panel color: `#1A1A2A` at ~80% opacity
- Border: 2px solid `#3A3A5A`
- All text rendered by Godot (not baked into sprites) — UI art provides backgrounds/frames only
- No gradients on UI panels — flat color with subtle 1px inner highlight along top edge

---

### Panel & Bar Specifications

#### Hotbar
- **File:** `ui/hotbar_bg.png`
- **Size:** 306×42 px (9 slots × 32px + 2px gaps + 2px border each side + padding)
- **Slot size:** 32×32 px per slot (includes 2px border inside slot)
- **Visual:** Dark panel with 9 equally-spaced slot outlines. Selected slot highlighted with bright outline (`#F0C040`). Slot interiors slightly lighter than panel background (`#242438`). Rounded panel corners. 1px bright top edge highlight.
- **Layout:** Single horizontal row, slots labeled 1–9 implied by order.

#### Inventory
- **File:** `ui/inventory_bg.png`
- **Size:** 266×170 px (8 slots wide × 32px + gaps/border; 5 rows × 32px + gaps/border)
- **Slot grid:** 8 columns × 5 rows = 40 slots
- **Visual:** Same panel style as hotbar but larger. Grid of 40 slots. Column dividers implied by spacing. Small tab or header bar at top where the title "INVENTORY" would be rendered by the game.

#### HP Bar
- **File:** `ui/hp_bar.png`
- **Size:** 128×16 px
- **Visual:** Background track: dark panel (`#1A1A2A`), 2px dark border, rounded ends (4px). Fill bar: red fill (`#E03020`), bright red highlight on top edge (`#FF6050`). Fill is dynamic (drawn by Godot shader/script using this as a mask/background). The empty sprite shows the track and border only; fill is layered separately.
- **Color:** Red fill `#E03020`, highlight `#FF6050`, track `#1A1A2A`

#### Fuel Bar
- **File:** `ui/fuel_bar.png`
- **Size:** 128×16 px
- **Visual:** Same structure as HP bar. Fill color: amber-yellow `#E09020`, highlight `#FFD040`. Represents fuel remaining in generators or vehicles.
- **Color:** Amber `#E09020`, highlight `#FFD040`

#### Power Bar
- **File:** `ui/power_bar.png`
- **Size:** 128×16 px
- **Visual:** Same structure. Fill color: cyan `#20C0E0`, highlight `#80F0FF`. Represents electrical power level in the network.
- **Color:** Cyan `#20C0E0`, highlight `#80F0FF`

---

### Build Mode Overlay

- **Green valid highlight:** `#40FF4060` (semi-transparent green, ~37% opacity) — drawn as a colored overlay tile over valid placement positions.
- **Red invalid highlight:** `#FF202060` (semi-transparent red) — drawn over invalid positions.
- These are not separate image assets — they are `ColorRect` or shader overlays applied at runtime. However, an optional tile overlay sprite can be created:
  - `ui/build_valid.png` — 32×32 px, solid green with 2px bright green border, ~37% fill opacity.
  - `ui/build_invalid.png` — 32×32 px, solid red with 2px bright red border, ~37% fill opacity.

---

### Buttons

- **File:** `ui/button_normal.png`, `ui/button_pressed.png`, `ui/button_hover.png`
- **Size:** 80×24 px (standard button; scale as needed)
- **Normal:** Dark panel fill, 2px dark border, 1px bright top-left highlight.
- **Hover:** Slightly lighter fill, border brightens.
- **Pressed:** Fill shifts darker, top highlight disappears, bottom edge brightens (press-down effect).

---

### Item Icons

All item icons are **16×16 px**. Each icon represents its item with a simple recognizable silhouette on a transparent background.

Icons should convey the item at a glance even at 16×16 scale: bold shapes, 2–3 colors max per icon, consistent with the tile/block art colors.

**Complete Icon List (42 icons required):**

| Item ID | Icon Description |
|---|---|
| `dirt` | Brown square with pixel soil marks |
| `stone` | Grey jagged-edged square |
| `wood` | Brown log cross-section with ring |
| `sand` | Yellow-tan granular pile |
| `clay` | Reddish-tan layered block |
| `coal` | Near-black shiny chunk |
| `copper_ore` | Orange-spotted grey chunk |
| `iron_ore` | Rust-veined grey chunk |
| `tin_ore` | Blue-grey metallic chunk |
| `silver_ore` | Silver-veined grey chunk |
| `gold_ore` | Gold-dotted grey chunk |
| `aluminum_ore` | Pale blue-grey chunk |
| `crystal_shard` | Cyan pointy crystal shard |
| `obsidian` | Near-black glassy slab with highlight |
| `magma_ore` | Dark rock with orange-red glowing streak |
| `core_fragment` | Dark violet chunk with pink energy glow |
| `copper_plate` | Flat orange-brown square plate |
| `iron_plate` | Flat grey-brown square plate |
| `tin_plate` | Flat silvery-blue square plate |
| `steel_plate` | Flat dark grey plate, slightly shiny |
| `silver_plate` | Flat silver square plate |
| `gold_plate` | Flat gold square plate |
| `aluminum_plate` | Flat pale blue-grey plate |
| `charcoal` | Dark grey-brown rough lump |
| `glass` | Pale blue transparent square (shown with a shine mark) |
| `brick` | Red-brown rectangular block shape |
| `gear` | Grey toothed circle gear (8 teeth visible at 16×16) |
| `copper_wire` | Orange coiled wire spool |
| `circuit_board` | Green board with copper trace marks |
| `battery` | Blue-grey rectangular cell with + terminal |
| `motor` | Grey cylindrical shape with winding marks |
| `drill_head` | Dark cone/triangle shape, hardened tip |
| `hull_plating` | Grey armored plate with bolt marks |
| `energy_cell` | Cyan glowing capsule shape |
| `wooden_pickaxe` | Brown handle + grey-brown pickaxe head |
| `stone_pickaxe` | Brown handle + grey stone pickaxe head |
| `iron_pickaxe` | Brown handle + grey-blue iron pickaxe head |
| `mining_cart` | Small side-view of wooden cart on wheels |
| `drill_vehicle` | Side-view miniature drill machine |
| `hover_vehicle` | Side-view miniature sleek hover craft |
| `rail` | Top-down two-rail track icon |
| `conveyor_belt` | Yellow belt with arrow pointing right |
| `fast_belt` | Orange belt with double-arrow |
| `stone_furnace` | Grey stone box with fire window |
| `electric_furnace` | Blue box with glow window |
| `assembler_mk1` | Green box with mechanical arm marks |
| `coal_generator` | Dark box with lightning bolt icon |
| `wooden_chest` | Brown chest with clasp |
| `iron_chest` | Grey chest with lock |
| `mining_drill_mk1` | Grey box with drill cone |
| `mining_drill_mk2` | Blue-steel box with larger drill |

---

## 8. Particle & VFX Specifications

All particles are 2D pixel art — no 3D particle meshes. Use Godot's `GPUParticles2D` or `CPUParticles2D`. Particle textures are small pixel art sprites in a shared spritesheet.

### Particle Sprite Sheet

- **File:** `fx/particles_sheet.png`
- **Layout:** Horizontal strip of particle shapes
- **Contents:** Square chip (4×4), circle/dot (3×3), spark (1×4 diagonal), star (5×5), shard (4×8 triangular), smoke puff (8×8 soft blob), droplet (3×5), ring (8×8 outline only)
- **Total sheet size:** ~64×8 px (8 shapes × 8px strip)

---

### Effect Specifications

| Effect | Trigger | Particle Count | Particle Size | Color(s) | Duration | Behavior |
|---|---|---|---|---|---|---|
| Block Break | Block fully mined | 8–12 | 4×4 px square chips | Match broken block's TILE_COLORS base color, ± 10% brightness variation | 0.4s | Explode outward from block center in random directions, arc downward under gravity, no bounce. Each chip is a different block-colored solid square. |
| Dust Puff | Player lands from jump or fall | 4–6 | 3×3 px circles | Light grey `#C8C8C8`, then fade to transparent | 0.3s | Emit horizontally outward from feet position, spread at low angle, fade alpha to 0 over lifetime. |
| Mining Sparks | Actively mining an ore tile | 6–8 | 1×4 px spark (thin line) | Orange `#FF8820` and yellow `#FFD040`, random between | 0.2s | Short burst — sparks fly toward camera-up direction from mining point, fall quickly. Very fast — high initial velocity, quick gravity. |
| Lava Splash | Player or object contacts lava | 10–15 | 3×5 px droplets | Red `#C02000`, orange `#FF6010`, yellow hotspot `#FFD020` | 0.6s | Arc upward in cone from contact point, fall back with gravity. Droplets rotate/tumble. Some stick briefly as small glowing dots before disappearing. |
| Crystal Shatter | Crystal ore mined | 12–16 | 4×8 px shards (triangular) | Cyan `#40C8F0`, white `#F0FAFF`, magenta `#E040C0` (1–2 per burst) | 0.5s | Explode outward with rotation. Each shard tumbles (rotates). Fades out with a brief bright flash on the first frame. |
| Drill Smoke | Drill vehicle actively drilling | Continuous: 3–4 per second | 8×8 px soft blob | Dark grey `#505050`, medium grey `#787878` | Loop (per puff: 1.5s) | Puffs rise from drill point/exhaust, expand slightly, fade alpha. Slight leftward/rightward drift. |
| Machine Smoke | Coal generator running | Continuous: 2 per second | 8×8 px soft blob | Grey `#787878`, light grey `#A0A0A0` | Loop (per puff: 2.0s) | Same as drill smoke but slower rise, more drift. Emits from chimney top. |
| Level Up / Tech Unlocked | New tech tree node unlocked | Burst: 20–25 | 5×5 px stars | Gold `#FFD040`, bright yellow `#FFFF60`, white `#FFFFFF` | 1.0s | Large radial burst from player center, particles fly outward and arc down slowly. Brief flash of screen brightness on trigger frame (handled by UI shader). |

---

## 9. Shader Effects List

All shaders are placed in `res://shaders/`. They are written in Godot's `GDShader` language (.gdshader extension).

| Shader File | Applied To | Effect Description |
|---|---|---|
| `lava_flow.gdshader` | Lava tile sprites (as material on TileMap layer) | Scrolls UV coordinates over time using `TIME` to simulate flowing movement. Adds a glow pulse effect: a sin(TIME) function modulates the emission brightness between base orange and bright yellow-white. Optional: layered noise to create irregular lava blob shapes rolling across the surface. Color output ranges from `#C02000` (base) to `#FFD020` (glow peak). |
| `crystal_glow.gdshader` | Crystal tiles, crystal_ore sprites | Adds pulsing emission using `sin(TIME * speed) * 0.5 + 0.5` to drive an emission multiplier. Crystal areas (detected by alpha or a specific color channel mask) glow cyan. Glow frequency: ~1.5 Hz. Output adds additive light on top of the base sprite — does not alter the base texture, only the emission channel. |
| `background_depth.gdshader` | Parallax background CanvasLayer sprites | Applies per-layer color tint (passed as a uniform `tint_color`). Adds slight UV offset based on camera position * parallax_factor (passed as uniform `parallax_factor`). Simple multiply blend of the tint with the background texture color. Optional: slight vignette at edges for depth feel. |
| `water_ripple.gdshader` | Water tile sprites | Distorts UV coordinates using a sine function based on `TIME` and the V coordinate. `offset = sin(UV.y * wave_freq + TIME * wave_speed) * amplitude`. This produces horizontal wave bands that roll through the water surface. Amplitude is very small (~0.01–0.02) to keep it subtle. Color remains the water tile color; only geometry is distorted. |
| `heat_shimmer.gdshader` | Air gap tiles above lava (magma layer) | Applies a vertical distortion to the background visible through the air tile. Uses a noise-based or sine-based U offset that changes over time. The distortion is weak (amplitude ~0.005) but persistent, creating the illusion of heat convection. Applied only to tiles tagged as `heat_shimmer_zone`. |
| `drill_glow.gdshader` | Drill bit portion of DrillVehicle sprite (via SubViewport or sub-sprite) | When the drill is active, adds a rotating heat glow around the drill tip. Uses a radial gradient emission centered on the drill tip position (passed as uniform). Color cycles from orange to bright yellow-white. Intensity modulated by `sin(TIME * 8.0)` for a fast flicker suggesting friction heat. |

---

## 10. Animation Controller States

The player uses an `AnimationStateMachine` (Godot `AnimationTree` with `AnimationNodeStateMachine`).

### State Transition Diagram

```
IDLE ──── move input ────────────────────────► WALK
IDLE ──── jump input + on_floor ─────────────► JUMP
WALK ──── no input ──────────────────────────► IDLE
WALK ──── jump input ────────────────────────► JUMP
JUMP ──── velocity.y > 0 ────────────────────► FALL
FALL ──── on_floor ──────────────────────────► IDLE
ANY  ──── tap block ─────────────────────────► MINE
ANY  ──── take damage ───────────────────────► HURT
HURT ──── after 0.3s ────────────────────────► IDLE
ANY  ──── mount vehicle ─────────────────────► MOUNT
MOUNT ─── dismount vehicle ──────────────────► IDLE (or FALL if airborne)
MINE ──── no block input ────────────────────► IDLE
MINE ──── mine_break trigger ────────────────► MINE_BREAK (1 frame) → MINE or IDLE
```

### State Details

| State | Blend | Interrupt Priority | Exit Condition |
|---|---|---|---|
| IDLE | None | Low | Any input |
| WALK | None | Low | Input stop |
| JUMP | None | Medium | velocity.y > 0 |
| FALL | None | Medium | on_floor signal |
| MINE | Blended with movement | High | No mining input |
| MINE_BREAK | None | Highest (interrupts MINE only) | Auto after 1 frame |
| HURT | None | High | Timer (0.3s) |
| MOUNT | None | Medium | Dismount input |
| DEATH | None | Absolute (uninterruptible) | Player respawn event |

### Implementation Note

The `mine` animation should be blended with movement states: the player can walk while mining, showing both the walk leg cycle and the arm swing. This is achieved with an `AnimationNodeBlend2` node combining walk/idle (lower body) with mine (upper body + arms only).

---

## 11. Background Art Specifications

### Structure

Each depth layer has a **3-layer parallax background**. Layers are rendered as large `Sprite2D` nodes in a `CanvasLayer` with parallax offsets, or as `ParallaxBackground` nodes.

| Layer | Scroll Speed | Detail Level |
|---|---|---|
| Layer 1 (far) | 0.1× camera speed | Distant silhouette — very low contrast, faded |
| Layer 2 (mid) | 0.3× camera speed | Mid detail — cave features, rock strata |
| Layer 3 (near) | 0.6× camera speed | Near rock face — highest texture/detail |

All background layers tile vertically and horizontally. Each layer sprite is at minimum **512×512 px** for seamless tiling.

---

### Per-Layer Background Specifications

#### Surface Sky
- **File set:** `backgrounds/surface_sky_L1.png`, `_L2.png`, `_L3.png`
- **L1 (sky):** Solid color gradient texture from `#87CEEB` (top) to `#E8D5A3` (bottom/horizon). Distant cloud silhouettes in white-grey, very diffuse.
- **L2 (far hills):** Rolling hill silhouette in muted green-grey (`#6A8A60`), tree tops as rounded bumps.
- **L3 (near ground):** Grass-topped terrain edge, bright green strip along the very bottom of the layer.
- **Tint shader:** `background_depth.gdshader` with `tint_color = Color(1,1,1,1)` (no tint, natural colors)

#### Shallow Underground
- **File set:** `backgrounds/shallow_L1.png`, `_L2.png`, `_L3.png`
- **L1:** Solid dark fill `#2A2A3A`, no detail. Very faint vignette at edges.
- **L2:** Rock wall with rough horizontal strata lines. Low contrast (1–2 shades of grey).
- **L3:** Cave wall face with more defined crack marks and occasional pebble shapes.
- **Gradient:** `#2A2A3A` (top) → `#1A1A28` (bottom)

#### Deep Rock
- **File set:** `backgrounds/deep_rock_L1.png`, `_L2.png`, `_L3.png`
- **L1:** Near-black `#1A1520`. Barely visible.
- **L2:** Deep rock wall, angular fracture patterns, subtle blue-purple tint.
- **L3:** Close rock face with visible mineral streaks (silver vein marks, 1px lines).
- **Gradient:** `#1A1520` (top) → `#0F0D18` (bottom)

#### Crystal Caverns
- **File set:** `backgrounds/crystal_L1.png`, `_L2.png`, `_L3.png`
- **L1:** Dark blue-black `#0D1A2A`. Very faint distant crystal glow — small scattered dots of `#20A0C0` at low opacity.
- **L2:** Cave wall with scattered large crystal formations — stalagmites/stalactites silhouetted in dark teal. Mild glow halos around crystal tips.
- **L3:** Close crystal wall — multi-faceted crystal cluster shapes. Lit from within by cyan/teal emission.
- **Gradient:** `#0D1A2A` (top) → `#0A1520` (bottom)
- **Shader:** `crystal_glow.gdshader` applied to L3 to animate the crystal cluster glow.

#### Magma Layer
- **File set:** `backgrounds/magma_L1.png`, `_L2.png`, `_L3.png`
- **L1:** Very dark red-black `#2A0A00`. Occasional faint orange smear at very low opacity suggesting distant lava.
- **L2:** Scorched rock wall with cracked surface. Lava seep lines (thin glowing orange lines in cracks). Heat shimmer on air pockets.
- **L3:** Near magma stone wall — heavy heat cracking, glowing crack edges, ash dust on floor.
- **Gradient:** `#2A0A00` (top) → `#1A0500` (bottom)
- **Shader:** `heat_shimmer.gdshader` applied to air gap areas.

#### The Core
- **File set:** `backgrounds/core_L1.png`, `_L2.png`, `_L3.png`
- **L1:** Near-black `#200020`. Distant plasma glow — very faint radial bloom of violet-pink at the absolute bottom of this layer.
- **L2:** Core rock wall with energy vein tracery. Purple energy lines pulse slowly.
- **L3:** Close core rock face — dense energy veins, plasma discharge arcs (thin bright lines that disappear and reappear).
- **Gradient:** `#200020` (top) → `#100010` (bottom)
- **Shader:** `crystal_glow.gdshader` re-used with violet/pink uniforms for the pulsing energy veins.

---

## 12. Asset File List (Artist Handoff)

This is the complete pixel art deliverable checklist. All files should be delivered as PNG with transparent backgrounds (where applicable), no anti-aliasing, nearest-neighbor scaling, consistent naming.

---

### Tiles (16×16 px per variant; 4-variant tiles delivered as 64×16 horizontal strip; 2-variant tiles as 32×16)

```
tiles/
├── air.png                  — N/A (transparent, no sprite needed)
├── grass.png                — 64×16 (3 variants + 1 padding, or 48×16 for 3 exact)
├── dirt.png                 — 64×16 (4 variants)
├── stone.png                — 64×16 (4 variants)
├── coal_ore.png             — 48×16 (3 variants)
├── copper_ore.png           — 48×16 (3 variants)
├── iron_ore.png             — 48×16 (3 variants)
├── tin_ore.png              — 32×16 (2 variants)
├── silver_ore.png           — 48×16 (3 variants)
├── gold_ore.png             — 48×16 (3 variants)
├── aluminum_ore.png         — 32×16 (2 variants)
├── deep_stone.png           — 64×16 (4 variants)
├── crystal_stone.png        — 48×16 (3 variants)
├── crystal_ore.png          — 32×16 (2 variants, 4-frame animation per variant)
│                              Deliver as: 32×16 static + 32×64 animated strip (4fr × 16px tall)
│                              Recommendation: crystal_ore_anim.png = 64×16 (4 anim frames, 1 variant)
├── magma_stone.png          — 48×16 (3 variants)
├── obsidian.png             — 32×16 (2 variants)
├── magma_ore.png            — 32×16 (2 variants, 4-frame animation)
│                              magma_ore_anim.png = 64×16 (4 anim frames)
├── core_rock.png            — 48×16 (3 variants)
├── core_ore.png             — 32×16 (2 variants, 4-frame animation)
│                              core_ore_anim.png = 64×16 (4 anim frames)
├── sand.png                 — 48×16 (3 variants)
├── clay.png                 — 32×16 (2 variants)
├── wood.png                 — 32×16 (2 variants)
├── leaves.png               — 64×16 (4 variants)
├── water.png                — 96×16 (6-frame animation strip: 6 × 16 wide)
├── lava.png                 — 96×16 (6-frame animation strip)
└── rail.png                 — 16×16 (straight) + autotile variants:
                               rail_straight_h.png  (16×16)
                               rail_straight_v.png  (16×16)
                               rail_corner_tl.png   (16×16)
                               rail_corner_tr.png   (16×16)
                               rail_corner_bl.png   (16×16)
                               rail_corner_br.png   (16×16)
                               rail_cross.png       (16×16)
                               — OR deliver as TileSet-compatible autotile atlas
```

**Total tile files:** ~30 PNGs (including animation strips and rail variants)

---

### Player

```
player/
└── player_spritesheet.png   — 96×288 px (see Section 4 for exact layout)
                               96 px wide (widest row = walk × 6 = 96)
                               288 px tall (9 animation rows × 32 px each)

    Alternate delivery (if preferred by artist):
    player_idle.png          — 64×32 (4 frames)
    player_walk.png          — 96×32 (6 frames)
    player_jump.png          — 48×32 (3 frames)
    player_fall.png          — 32×32 (2 frames)
    player_mine.png          — 64×32 (4 frames)
    player_mine_break.png    — 16×32 (1 frame)
    player_mount.png         — 32×32 (2 frames)
    player_hurt.png          — 32×32 (2 frames)
    player_death.png         — 64×32 (4 frames)

Helmet overlays (optional, for swappable gear system):
player/helmets/
    helmet_tier1.png         — 16×16 (helmet sprite, positioned at head height)
    helmet_tier2.png         — 16×16
    helmet_tier3.png         — 16×16
    helmet_tier4.png         — 16×16
```

---

### Machines

```
machines/
├── mining_drill_mk1.png     — 128×32 (4 frames × 32px)
├── mining_drill_mk2.png     — 128×32 (4 frames × 32px)
├── conveyor_belt.png        — 128×32 (4 frames × 32px)
├── fast_belt.png            — 128×32 (4 frames × 32px)
├── stone_furnace.png        — 128×32 (4 frames × 32px)
├── electric_furnace.png     — 128×32 (4 frames × 32px)
├── assembler_mk1.png        — 192×32 (6 frames × 32px)
├── coal_generator.png       — 128×32 (4 frames × 32px)
├── wooden_chest.png         — 32×32  (1 frame, static)
├── iron_chest.png           — 32×32  (1 frame, static)
└── splitter.png             — 64×32  (2 frames, optional animation)
```

---

### Vehicles

```
vehicles/
├── mining_cart.png          — Deliver separate files per animation:
│   mining_cart_wheel_roll.png  — 192×32 (4 frames × 48px)
│   mining_cart_idle.png        — 96×32  (2 frames × 48px)
│
├── drill_vehicle.png        — Deliver separate files per animation:
│   drill_vehicle_drive.png     — 384×48 (6 frames × 64px)
│   drill_vehicle_drill.png     — 256×48 (4 frames × 64px)
│   drill_vehicle_idle.png      — 128×48 (2 frames × 64px)
│
└── hover_vehicle.png        — Deliver separate files per animation:
    hover_vehicle_hover.png     — 320×32 (4 frames × 80px)
    hover_vehicle_thrust.png    — 240×32 (3 frames × 80px)
```

---

### UI

```
ui/
├── hotbar_bg.png            — 306×42
├── inventory_bg.png         — 266×170
├── hp_bar.png               — 128×16 (track/border only; fill drawn by game)
├── fuel_bar.png             — 128×16
├── power_bar.png            — 128×16
├── build_valid.png          — 32×32
├── build_invalid.png        — 32×32
├── button_normal.png        — 80×24
├── button_pressed.png       — 80×24
├── button_hover.png         — 80×24
│
└── icons/                   — All 16×16 px
    ├── dirt.png
    ├── stone.png
    ├── wood.png
    ├── sand.png
    ├── clay.png
    ├── coal.png
    ├── copper_ore.png
    ├── iron_ore.png
    ├── tin_ore.png
    ├── silver_ore.png
    ├── gold_ore.png
    ├── aluminum_ore.png
    ├── crystal_shard.png
    ├── obsidian.png
    ├── magma_ore.png
    ├── core_fragment.png
    ├── copper_plate.png
    ├── iron_plate.png
    ├── tin_plate.png
    ├── steel_plate.png
    ├── silver_plate.png
    ├── gold_plate.png
    ├── aluminum_plate.png
    ├── charcoal.png
    ├── glass.png
    ├── brick.png
    ├── gear.png
    ├── copper_wire.png
    ├── circuit_board.png
    ├── battery.png
    ├── motor.png
    ├── drill_head.png
    ├── hull_plating.png
    ├── energy_cell.png
    ├── wooden_pickaxe.png
    ├── stone_pickaxe.png
    ├── iron_pickaxe.png
    ├── mining_cart.png
    ├── drill_vehicle.png
    ├── hover_vehicle.png
    ├── rail.png
    ├── conveyor_belt.png
    ├── fast_belt.png
    ├── stone_furnace.png
    ├── electric_furnace.png
    ├── assembler_mk1.png
    ├── coal_generator.png
    ├── wooden_chest.png
    ├── iron_chest.png
    ├── mining_drill_mk1.png
    └── mining_drill_mk2.png
```

**Total icons:** 51 files (all 16×16 px)

---

### Backgrounds

```
backgrounds/
├── surface_sky_L1.png       — 512×512
├── surface_sky_L2.png       — 512×512
├── surface_sky_L3.png       — 512×512
├── shallow_L1.png           — 512×512
├── shallow_L2.png           — 512×512
├── shallow_L3.png           — 512×512
├── deep_rock_L1.png         — 512×512
├── deep_rock_L2.png         — 512×512
├── deep_rock_L3.png         — 512×512
├── crystal_L1.png           — 512×512
├── crystal_L2.png           — 512×512
├── crystal_L3.png           — 512×512
├── magma_L1.png             — 512×512
├── magma_L2.png             — 512×512
├── magma_L3.png             — 512×512
├── core_L1.png              — 512×512
├── core_L2.png              — 512×512
└── core_L3.png              — 512×512
```

**Total backgrounds:** 18 files

---

### FX / Particles

```
fx/
└── particles_sheet.png      — 64×8 (8 particle shapes × 8px each, horizontal strip)
    Contains: square chip (4×4), circle dot (3×3), spark (1×4), star (5×5),
              shard (4×8), smoke puff (8×8), droplet (3×5), ring (8×8 outline)
```

---

### Shaders (Programmer deliverable, not artist)

```
shaders/
├── lava_flow.gdshader
├── crystal_glow.gdshader
├── background_depth.gdshader
├── water_ripple.gdshader
├── heat_shimmer.gdshader
└── drill_glow.gdshader
```

---

### Grand Total Asset Count

| Category | File Count |
|---|---|
| Tiles | ~30 PNGs |
| Player | 9–10 PNGs (or 1 spritesheet + helmet overlays) |
| Machines | 11 PNGs |
| Vehicles | 6 PNGs (animation sets) |
| UI panels/bars/buttons | 9 PNGs |
| UI icons | 51 PNGs |
| Backgrounds | 18 PNGs |
| FX particles | 1 PNG |
| **Total** | **~135 PNG files** |

---

## 13. Godot Import Settings

Apply these settings in the Godot import panel (or via `.import` sidecar files) for all art assets.

### Pixel Art Tiles and Sprites

```
filter: Nearest
mipmaps: Disabled
compress: Lossless (PNG)
preset: "2D Pixel"
```

**Apply to:** All files in `tiles/`, `player/`, `machines/`, `vehicles/`, `fx/`, `ui/icons/`

### UI Panel and Bar Images

```
filter: Nearest
mipmaps: Disabled
compress: Lossless
preset: "2D Pixel"
repeat: Disabled (no tiling)
```

**Apply to:** All files in `ui/` (except icons, which share the pixel art preset)

### Background Sprites

```
filter: Nearest (to keep the pixelated look)
mipmaps: Disabled
compress: Lossy (VRAM-efficient for large backgrounds on mobile)
preset: "2D Pixel" with lossy compression override
repeat: Enabled (backgrounds tile)
```

**Apply to:** All files in `backgrounds/`

### TileSet Configuration

1. Create a `TileSet` resource in Godot.
2. Add each tile PNG as an **Atlas Source**.
3. Set the atlas tile size to **16×16 px** (the native pixel art size).
4. Godot renders the TileMap with `TILE_SIZE = 32` from `Constants.gd` — the TileMap scale handles the 2× upscale automatically (set TileMap's `scale = Vector2(2, 2)` or configure via project settings).
5. For animated tiles (`water`, `lava`, `crystal_ore`, `magma_ore`, `core_ore`): set up **Animation Columns** in the atlas source, pointing to the frame strip.
6. For autotile tiles (`grass`, `dirt`, `rail`): configure **Terrain Sets** in the TileSet with the appropriate neighbor matching rules for each variant.

### Spritesheet Animation Setup

For player and machine spritesheets, use `AnimationPlayer` + `AnimatedSprite2D`, or `AnimationTree` with `AnimatedSprite2D`:

1. Set `SpriteFrames` resource on the `AnimatedSprite2D`.
2. For each animation state, add frames by pointing to the correct row/column region in the spritesheet.
3. Frame region per player animation (16-wide, 32-tall frames):
   - idle: `Rect2(0, 0, 64, 32)` — 4 frames at x=0,16,32,48
   - walk: `Rect2(0, 32, 96, 32)` — 6 frames at x=0,16,32,48,64,80
   - (etc. per the layout defined in Section 4)

---

## 14. Recommended Workflow for Artist

### Tools

- **Primary:** Aseprite (pixel art editor with native animation support)
- **Export:** PNG, no anti-aliasing, exact pixel boundaries
- **Color management:** Disable all color profiles / ICC in export — raw RGB values must match the palettes in Section 2 exactly.

### Step-by-Step Process

1. **Load the palette.** Create a new Aseprite palette file with the 16 colors for your current layer. Lock the palette to prevent color creep. Start every new tile or sprite using only these colors.

2. **Work at native resolution (16×16 for tiles, 16×32 for player).** Never zoom-to-work at 2× or 4× and then downscale — always draw at the exact canvas size listed.

3. **Outlines.** All sprites should have a 1px outer dark outline on non-transparent edges. Use the darkened version of the background color, not pure black (unless the tile is very dark). Inner outline (1px between major shapes) uses a slightly-darker version of the fill color.

4. **Variants.** For tiles requiring 4 variants, duplicate the base tile 3 times and make small targeted changes to each: add/move cracks, shift mineral spots, adjust a speck or mark. Keep variants recognizably the same tile — do not change the overall color or shape.

5. **Export tiles.** Use Aseprite's "Export Sprite Sheet" to export all variants as a horizontal strip. For a 4-variant tile: set frame size 16×16, 4 columns, 1 row. Output: `64×16 px` PNG.

6. **Export animations.** For animated tiles: export each frame as a column in the horizontal strip. For machines/player: use the same approach — horizontal frames per animation. All frames must be the same pixel dimensions.

7. **Consistent frame sizes.** Every frame in a spritesheet must be the same width and height. No variable-size frames.

8. **No anti-aliasing.** Aseprite has this off by default. Verify before export: Edit → Preferences → Tools — ensure "Antialias" is unchecked. On PNG export, no sub-pixel blending.

9. **Transparent backgrounds.** All sprites with transparent areas (player, machines, vehicles, icons) must use true alpha transparency. No fake transparency with a background color.

10. **Color matching.** After export, spot-check hex values in an image viewer or via Aseprite's color picker. The greens, blues, and magentas in the deeper layers must match the Section 2 palette exactly — no approximation.

11. **Naming convention.** Follow the file names in Section 12 exactly. Lowercase, underscores only, no spaces. This must match Godot's `load()` paths in the codebase.

12. **Delivery format.** Submit all assets in a flat-structured zip matching the directory tree in Section 12. Include the Aseprite source files (`.ase` or `.aseprite`) in a separate `_source/` folder alongside the exported PNGs, so corrections can be made without starting from scratch.

---

*End of Phase 6 Art Direction Document*
