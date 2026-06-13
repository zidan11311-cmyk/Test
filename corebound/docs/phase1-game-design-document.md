# CoreBound — Game Design Document (Phase 1)

**Role labels used throughout:** [DIRECTOR] = Game Director/Designer · [FE] = Frontend Engineer · [BE] = Backend/Systems Engineer · [ART] = 2D Artist · [ANIM] = Technical Artist/Animator

---

## 1. Vision Statement

**[DIRECTOR]**

CoreBound is a 2D side-view sandbox survival game for iOS and Android. The player descends from a sunlit planet surface toward a molten core, hand-mining early on, then building automated factories, and finally piloting purpose-built vehicles through hostile underground biomes. The game is complete when the player reaches the core and harvests its energy.

The three inspirations map to three distinct gameplay layers that stack on top of each other:

| Layer | Inspiration | What it contributes |
|---|---|---|
| Digging & survival | Minecraft | Block-based world, crafting, health, progression through depth |
| Automation | Factorio | Drills, belts, smelters, assemblers, power networks |
| Feel & aesthetic | Roblox | Colorful blocky sprites, satisfying feedback, simple controls |

---

## 2. Design Pillars

**[DIRECTOR]**

1. **Dig deeper** — Vertical descent is the spine of every session. Depth unlocks new resources, new hazards, and new tech. Players should always feel pulled downward.
2. **Automate everything** — The player naturally graduates from tedious hand-work to elegant automated systems. Factories are rewarding to design and satisfying to watch run.
3. **One-thumb friendly** — Every core action must be reachable without a keyboard. Touch controls are the primary interface, not an afterthought.
4. **Always something to build toward** — The crafting and tech tree must always offer the player a clear next goal one or two steps away.

---

## 3. Core Game Loop

**[DIRECTOR]**

```
Mine resources (hand or drill)
        │
        ▼
Craft tools, machines, and components
        │
        ▼
Build automated production chains
        │
        ▼
Construct / upgrade a descent vehicle
        │
        ▼
Descend to a deeper, harder layer
        │
        ▼
     (repeat)
        │
        ▼
Reach The Core → Harvest core energy → Victory
```

### Session loop (5–15 minutes)
A typical play session fits inside a single depth layer. The player:
1. Lands at their base or previous dig site.
2. Collects resources from machines running while offline.
3. Crafts one or two upgrades.
4. Digs deeper and clears/explores the new area.
5. Sets up at least one new automated machine before closing.

Offline production (machines run at reduced rate) ensures every session starts with a small reward.

---

## 4. World: Depth Layers

**[BE] [ART]**

The world is generated procedurally in vertical chunk columns (see Technical Architecture for chunk dimensions). There are six named layers; boundaries are soft — transitional zones blend resources and hazards from adjacent layers.

### Layer 1 — Surface (depth 0–40 m)
- **Environment:** Daylight, grass tops, dirt fill, scattered surface stone. Trees grow near the starting zone.
- **Resources:** Dirt, stone, wood (chop trees), sand (pockets), clay (near water).
- **Hazards:** None. Tutorial zone. No enemies.
- **Lighting:** Full daylight. No artificial light needed.
- **Sky color:** Bright sky blue. Parallax cloud layers.
- **Music mood:** Upbeat, pastoral.

### Layer 2 — Shallow Underground (depth 40–200 m)
- **Environment:** First true caves. Natural torch light radius feels small. Stone walls with mineral veins.
- **Resources:** Coal, copper ore, iron ore, tin ore. Small water pockets.
- **Hazards:** Cave-ins (unsupported ceilings collapse after mining), darkness (reduced vision without torches).
- **Lighting:** Player carries torches; machines need power for light.
- **Music mood:** Curious, slightly tense.

### Layer 3 — Deep Rock (depth 200–500 m)
- **Environment:** Darker stone varieties. Wider cave chambers. Underground lakes.
- **Resources:** Silver, gold, aluminum, ruby/emerald gemstones.
- **Hazards:** Cave fauna (slow-moving hostile mobs). Pressure cracks (damaged walls occasionally burst water). Deeper darkness.
- **Lighting:** Powered lights required for full vision.
- **Music mood:** Atmospheric, mysterious.

### Layer 4 — Crystal Caverns (depth 500–900 m)
- **Environment:** Giant luminous crystal formations. Refracted light creates color patches. Dramatic vertical chambers.
- **Resources:** Crystal shards, diamond, exotic ore (crystallized alloy).
- **Hazards:** Crystal spike traps (pressure-triggered), energy discharge zones (static damage in unshielded areas), aggressive crystal fauna.
- **Lighting:** Crystals provide ambient glow, but partial — dark pockets still dangerous.
- **Music mood:** Ethereal, wonder-filled, slightly eerie.

### Layer 5 — Magma Layer (depth 900–1 400 m)
- **Environment:** Obsidian and igneous rock. Active lava flows. Extreme heat.
- **Resources:** Obsidian, magma ore, uranium, rare magma crystals.
- **Hazards:** Lava pools (instant death without heat protection), heat damage over time in unshielded zones, hostile fire fauna, pressure vents.
- **Lighting:** Lava glow illuminates wide areas but creates harsh shadows.
- **Music mood:** Intense, industrial, dramatic.

### Layer 6 — The Core (depth 1 400 m+)
- **Environment:** Plasma streams, core rock, extreme gravitational anomalies. The world's center.
- **Resources:** Core fragments, plasma/exotic energy, singularity shards.
- **Hazards:** Plasma bursts (area damage), gravity wells (movement disruption), core guardian boss, environmental decay (structures degrade over time).
- **Lighting:** Plasma glow everywhere — bright but flickering and unstable.
- **Music mood:** Epic, final, otherworldly.

---

## 5. Resource & Crafting Tree

**[DIRECTOR] [BE]**

### 5.1 Raw Resources (mined directly)

| Tier | Resources | Depth layer |
|---|---|---|
| 0 | Dirt, stone, wood, sand, clay | Surface |
| 1 | Coal, copper ore, iron ore, tin ore | Shallow underground |
| 2 | Silver ore, gold ore, aluminum ore, ruby, emerald, diamond | Deep rock |
| 3 | Crystal shards, exotic ore, diamond (richer) | Crystal caverns |
| 4 | Obsidian, magma ore, uranium, magma crystals | Magma layer |
| 5 | Core fragments, plasma energy, singularity shards | The Core |

### 5.2 Processed Resources (furnace/smelter)

| Output | Inputs | Machine |
|---|---|---|
| Charcoal | Wood × 4 | Campfire or furnace |
| Copper plate | Copper ore × 2 | Furnace |
| Iron plate | Iron ore × 2 | Furnace |
| Tin plate | Tin ore × 2 | Furnace |
| Bronze plate | Copper plate + tin plate | Alloy furnace |
| Steel plate | Iron plate × 3 + coal × 2 | Electric furnace |
| Silver plate | Silver ore × 2 | Electric furnace |
| Gold plate | Gold ore × 2 | Electric furnace |
| Aluminum plate | Aluminum ore × 3 | Electric furnace |
| Glass | Sand × 4 | Furnace |
| Brick | Clay × 4 | Kiln |
| Obsidian plate | Obsidian × 2 | Plasma furnace |
| Magma alloy | Magma ore × 2 + obsidian plate | Plasma furnace |
| Uranium rod | Uranium × 5 | Refinery |
| Refined core | Core fragment × 3 + plasma energy × 1 | Core refinery |

### 5.3 Components (assembler)

| Output | Inputs |
|---|---|
| Gear | Iron plate × 2 |
| Copper wire | Copper plate × 1 |
| Circuit board | Copper wire × 3 + glass × 1 + iron plate × 1 |
| Advanced circuit | Circuit board × 2 + gold plate × 1 + silicon × 2 |
| Battery | Copper plate × 2 + iron plate × 1 + coal × 2 |
| Energy cell | Advanced circuit × 1 + uranium rod × 1 |
| Motor | Gear × 3 + copper wire × 4 + iron plate × 2 |
| Drill head | Steel plate × 4 + diamond × 2 + gear × 2 |
| Hull plating | Steel plate × 6 + aluminum plate × 2 |
| Heat shield | Obsidian plate × 4 + magma alloy × 2 |
| Processor | Advanced circuit × 3 + gold plate × 2 |
| Energy core | Energy cell × 4 + processor × 2 + refined core × 1 |

### 5.4 Vehicle Parts (assembler — higher tier)

| Part | Inputs | Notes |
|---|---|---|
| Steel chassis | Hull plating × 4 + gear × 6 | Base frame for all vehicles |
| Engine Mk1 | Motor × 2 + circuit board × 4 + battery × 2 | Coal-powered |
| Engine Mk2 | Motor × 4 + advanced circuit × 4 + energy cell × 2 | Electric |
| Engine Mk3 | Motor × 6 + processor × 2 + energy core × 1 | Plasma-powered |
| Rail module | Steel plate × 8 + gear × 4 | Mining cart rail system |
| Drill module Mk1 | Drill head × 2 + motor × 1 + steel plate × 4 | Basic auto-drill |
| Drill module Mk2 | Drill head × 4 + motor × 2 + magma alloy × 4 | Heat-capable |
| Hover plate | Aluminum plate × 6 + energy cell × 4 + circuit board × 2 | Lava traversal |
| Excavator arm | Hull plating × 6 + drill head × 4 + processor × 2 | Late-game heavy |
| Treads | Steel plate × 8 + rubber × 4 + gear × 4 | Ground movement |

### 5.5 Structures & Machines

| Machine | Function | Power |
|---|---|---|
| Campfire | Basic cooking / charcoal | None (fuel) |
| Wooden chest | 20-slot storage | None |
| Iron chest | 40-slot storage | None |
| Steel vault | 80-slot storage | None |
| Hand furnace | Basic smelting (slow) | Fuel |
| Electric furnace | Fast smelting | Electric (2 kW) |
| Alloy furnace | Alloy recipes | Electric (3 kW) |
| Plasma furnace | Tier 4–5 recipes | Plasma (8 kW) |
| Core refinery | Tier 5 recipes | Plasma (15 kW) |
| Mining drill Mk1 | Auto-mines 1 block/sec | Electric (1 kW) |
| Mining drill Mk2 | Auto-mines 2 blocks/sec | Electric (2 kW) |
| Conveyor belt | Moves items 1 m/sec | Electric (0.2 kW/tile) |
| Fast belt | Moves items 3 m/sec | Electric (0.4 kW/tile) |
| Splitter | Divides belt into two | Electric (0.1 kW) |
| Assembler Mk1 | Crafts basic components | Electric (3 kW) |
| Assembler Mk2 | Crafts advanced components | Electric (5 kW) |
| Coal generator | Produces 5 kW | Fuel (coal) |
| Solar panel | Produces 3 kW (surface only) | None |
| Steam generator | Produces 15 kW | Fuel + water |
| Geothermal tap | Produces 30 kW (magma layer) | None |
| Fusion reactor | Produces 100 kW | Uranium rods |
| Plasma reactor | Produces 500 kW | Core energy |
| Torch | 6-tile radius light | None (consumes 1 coal over 10 min) |
| Electric lamp | 10-tile radius light | Electric (0.1 kW) |
| Kiln | Makes bricks | Fuel |
| Refinery | Processes uranium | Electric (10 kW) |
| Pump | Moves liquids | Electric (1 kW) |
| Pipe | Transports liquids | None |

### 5.6 Crafting/Tech Unlock Tree

Progress through the tech tree is gated by reaching a new depth layer (discovery unlock) and spending **Research Points** (earned by building and running machines).

```
[START]
  │
  ├─ Basic Tools (pickaxe, axe, shovel) — free
  ├─ Campfire — free
  ├─ Wooden Chest — free
  │
  ▼ [Reach Shallow Underground]
  ├─ Hand Furnace
  ├─ Mining Drill Mk1
  ├─ Conveyor Belt
  ├─ Coal Generator
  ├─ Torch / Electric Lamp
  │
  ▼ [Reach Deep Rock]
  ├─ Electric Furnace
  ├─ Alloy Furnace
  ├─ Assembler Mk1
  ├─ Steam Generator
  ├─ Mining Drill Mk2
  ├─ Fast Belt
  ├─ Mining Cart + Rail Module
  │
  ▼ [Reach Crystal Caverns]
  ├─ Assembler Mk2
  ├─ Refinery
  ├─ Drill Vehicle (basic)
  ├─ Advanced Circuits
  ├─ Batteries / Energy Cells
  │
  ▼ [Reach Magma Layer]
  ├─ Plasma Furnace
  ├─ Geothermal Tap
  ├─ Heat Shield components
  ├─ Hover Vehicle
  ├─ Fusion Reactor
  │
  ▼ [Reach The Core]
  ├─ Core Refinery
  ├─ Plasma Reactor
  ├─ Excavator/Mech
  ├─ Energy Core
  └─ [VICTORY: Harvest Core Energy]
```

---

## 6. Vehicles

**[DIRECTOR] [FE]**

### 6.1 Mining Cart
- **Unlock:** Deep Rock layer
- **Role:** Passive resource hauler along pre-placed rails
- **Operation:** Player places rail tiles; cart runs a loop automatically, depositing collected items at a connected chest
- **Stats:** Capacity 200 items, speed 4 m/s, no drill capability
- **Upgrade path:**
  - Mk1 (steel chassis + rail module): base stats
  - Mk2 (+engine Mk2): capacity 400, speed 6 m/s
  - Mk3 (+processor): capacity 800, auto-sorts items by type

### 6.2 Drill Vehicle
- **Unlock:** Crystal Caverns layer
- **Role:** Active drilling companion; player rides it for faster descent
- **Operation:** Player mounts vehicle; directional input drives it; front drill automatically breaks blocks in path
- **Stats:** Drill speed 3×hand speed, fuel: energy cells, HP 200
- **Upgrade path:**
  - Mk1 (drill module Mk1 + engine Mk2): basic stats
  - Mk2 (+drill module Mk2): 5× hand speed, heat-capable (operates in Magma layer)
  - Mk3 (+excavator arm): 8× hand speed, AOE drill (clears 3-wide tunnel)

### 6.3 Hover Vehicle
- **Unlock:** Magma Layer
- **Role:** Traversal over lava; required to cross lava pools
- **Operation:** Floats above lava and ground; player rides and steers; can carry cargo
- **Stats:** Speed 6 m/s horizontal, cargo 200 items, hover height 2 tiles, fuel: energy cells
- **Upgrade path:**
  - Mk1: base hover, no weapon
  - Mk2 (+heat shield × 2): full heat immunity, cargo 400
  - Mk3 (+processor + plasma cannon): combat capable, cargo 600

### 6.4 Excavator / Mining Mech
- **Unlock:** The Core
- **Role:** Heavy combat + mining at the core; required to fight the core guardian
- **Operation:** Player pilots from inside; large slow vehicle with wide drill AOE and projectile weapon
- **Stats:** HP 1000, drill AOE 5-wide, weapon: plasma burst, fuel: core energy
- **Upgrade:** Single-tier (end-game gear, no further upgrades — it's the final form)

---

## 7. Enemies & Hazards

**[DIRECTOR]**

### 7.1 Environmental Hazards
| Hazard | Layer | Effect | Counter |
|---|---|---|---|
| Darkness | Shallow+ | Reduced vision radius | Torches, electric lamps |
| Cave-in | Shallow+ | Ceiling collapses if unsupported | Place support beams |
| Water flood | Deep Rock | Fills tunnel, drowns player in ~10s | Pumps, waterproof doors |
| Crystal spikes | Crystal Caverns | Instant 30 dmg if triggered | Careful movement, shield |
| Heat zones | Magma | Ongoing heat damage | Heat shield gear |
| Lava | Magma | Instant death | Hover vehicle, lava boots |
| Plasma burst | Core | Large AoE damage | Dodge timing |
| Gravity wells | Core | Movement impaired | Stabilizer upgrade |

### 7.2 Enemies (creatures)
| Enemy | Layer | Behavior | Drop |
|---|---|---|---|
| Cave slug | Shallow | Slow patrol, contact damage | Slime |
| Stone golem | Deep Rock | Charges player, burrows | Iron ore, stone |
| Crystal spider | Crystal Caverns | Leaps, webs player briefly | Crystal shards |
| Lava serpent | Magma | Swims in lava, surfaces to attack | Magma ore |
| Core guardian | Core (boss) | Multi-phase boss | Core key (required for victory) |

### 7.3 Player Stats
- **HP:** 100 (upgradeable with armor to 250)
- **Heat resistance:** 0% base → up to 100% with full heat-resist gear
- **Oxygen:** Not used — simplifies mobile play
- **Hunger:** Not used — keeps focus on mining/automation

---

## 8. Player Progression & Inventory

**[DIRECTOR] [FE]**

### 8.1 Player Gear Slots
- Head · Chest · Legs · Boots · Accessory × 2
- Each slot has one active item (no stacking for gear)

### 8.2 Armor Sets
| Set | Materials | Bonus |
|---|---|---|
| Iron armor | Iron plates | +50 HP |
| Steel armor | Steel plates | +100 HP, +10% mining speed |
| Crystal armor | Crystal shards | +150 HP, +light radius |
| Obsidian armor | Obsidian plates + magma alloy | +200 HP, +50% heat resist |
| Core armor | Refined core + energy cores | +250 HP, +100% heat resist, grav stability |

### 8.3 Tools
| Tool | Material | Mining speed |
|---|---|---|
| Wooden pickaxe | Wood + stone | 1× (base) |
| Stone pickaxe | Stone | 1.5× |
| Iron pickaxe | Iron plates | 2× |
| Steel pickaxe | Steel plates | 3× |
| Diamond pickaxe | Diamond + steel | 5× |
| Plasma cutter | Energy core + processor | 8×, breaks any block |

### 8.4 Inventory
- 40 inventory slots (grid, 8 × 5)
- Hotbar: 8 slots (bottom of screen, quick access)
- Stacks: resources stack to 500; components to 200; gear doesn't stack
- Overflow goes to a linked base chest if within 20 tiles of player

---

## 9. Power System

**[BE] [DIRECTOR]**

Power is a network resource, not a per-machine fuel. All electric machines connect to the network within their built chunk.

- **Generation:** Generators produce kW into the local network.
- **Consumption:** Machines draw kW; if demand > supply, all machines slow proportionally (not shut off — prevents brick scenarios).
- **Storage:** Batteries store up to 50 kWh; energy cells store 200 kWh. Stored power fills during surplus and drains during deficit.
- **Network range:** Power connects automatically up to 30 tiles via placed wire or through adjacent powered machines. Long distances require power poles.
- **Power tiers:** Coal → Electric → Plasma (generators per layer match depth needs).

---

## 10. Controls & UI

**[FE] [DIRECTOR]**

### 10.1 Player Controls

| Action | Touch gesture |
|---|---|
| Move left / right | Virtual joystick (left thumb, lower-left) |
| Jump | Jump button (right thumb, lower-right) |
| Mine block | Tap a block; hold to continue mining |
| Place block / machine | Open build menu → select item → tap target tile |
| Interact (open chest, enter vehicle) | Tap interactable entity |
| Open inventory | Tap backpack icon (HUD) |
| Open crafting | Tap crafting icon (HUD) |
| Open tech tree | Tap research icon (HUD) |
| Open map | Tap map icon (HUD) |
| Quick-select hotbar | Tap item in hotbar strip |

### 10.2 Build Mode
Activated by long-pressing any machine/block in the hotbar:
- Enters a transparent placement overlay.
- Tap to place, swipe to rotate orientation.
- Valid positions shown in green, invalid in red.
- Exit by tapping X or pressing back.

### 10.3 Vehicle Controls
While mounted:
- Joystick steers (drill vehicle, hover vehicle).
- Tap drill icon to engage/disengage the drill.
- Dismount by tapping exit icon.

### 10.4 HUD Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [♥ HP]  [⚡ Power]  [🌡 Heat]        [Depth: 312 m ↓]     │
│                                                             │
│                                                             │
│            [ GAME WORLD ]                                   │
│                                                             │
│                                                             │
│  [🕹️ joystick]          [🎒][⚙️][🔬][🗺️]  [Jump]          │
│                                                             │
│  [Hotbar: 1][2][3][4][5][6][7][8]                          │
└─────────────────────────────────────────────────────────────┘
```

- **HP bar** (top-left): red fill, shows numeric value on tap
- **Power bar** (top-left below HP): yellow fill; shows kW in/out on tap
- **Heat gauge** (top-left): orange; visible only in Magma/Core layers
- **Depth meter** (top-right): shows current depth in meters, direction arrow
- **Mini-map** (top-right corner): toggleable; shows explored tiles
- **Hotbar** (bottom-center): 8 quick-access slots
- **Action buttons** (bottom-right): Jump, Interact
- **Menu icons** (bottom-right cluster): Inventory, Crafting, Tech Tree, Map
- **Joystick** (bottom-left): transparent, repositionable on first launch

### 10.5 Crafting Screen

Slides up from bottom on tap:
```
┌────────────────────────────────────┐
│ CRAFTING         [Filter: ▼ All]   │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ [Icon] Iron Plate            │  │
│  │ Iron Ore × 2 → 1 Plate       │  │
│  │ [CRAFT ×1] [CRAFT ×10]       │  │
│  └──────────────────────────────┘  │
│  [Item list scrollable...]         │
│                                    │
│  My resources: Iron Ore: 40        │
└────────────────────────────────────┘
```

- Items greyed out if missing ingredients
- Long-press an item to see full recipe chain
- Batch craft (×1, ×10, ×all) buttons

### 10.6 Inventory Screen

Full-screen grid overlay:
- Drag items between slots
- Tap + hold to split stack
- Filter/sort bar at top (by type, by tier)
- Quick-transfer to nearby chest with double-tap

---

## 11. Progression Pacing

**[DIRECTOR]**

Target session lengths and cumulative playtime estimates:

| Milestone | Estimated playtime |
|---|---|
| First coal furnace running | 15 min |
| First automated drill + belt loop | 45 min |
| Reach Deep Rock | 1.5 h |
| First mining cart operating | 2.5 h |
| Reach Crystal Caverns | 4 h |
| Drill vehicle built | 5.5 h |
| Reach Magma Layer | 8 h |
| Hover vehicle + geothermal | 10 h |
| Reach The Core | 14 h |
| Defeat core guardian + victory | 16 h |

These are intentionally rough; player exploration speed varies significantly. Idle/offline production should keep the pacing feel even for players who return after gaps.

---

## 12. Monetization (design-safe hooks only)

**[DIRECTOR]**

CoreBound is designed as a **premium purchase** (one-time buy) with an optional cosmetic DLC path. No pay-to-win, no energy timers.

- **Base price:** $4.99 (iOS/Android)
- **Cosmetic DLC (future):** Skin packs for player character, vehicle color variants, alternate tile themes
- **No ads** by default; an "ad-supported" free tier could be added later with a purchase-unlock option

---

## 13. Audio Direction

**[DIRECTOR]**

| Context | Style |
|---|---|
| Surface | Bright acoustic guitar loops, birds, wind |
| Shallow underground | Echoing cave ambience, drips, subtle percussion |
| Deep Rock | Heavier drums, bass drones, mineral clinks |
| Crystal Caverns | Ethereal pads, chime-like tones, reverb-heavy |
| Magma Layer | Industrial rhythms, deep rumbles, fire crackle |
| The Core | Orchestral tension, pulsing bass, alien tones |
| Mining hit | Short satisfying 'thunk'; pitch varies by block type |
| Automation running | Low hum; conveyor tick; furnace whoosh |
| Crafting complete | Bright ding |
| Level-up / unlock | Ascending 3-note fanfare |

---

## 14. Save System Design

**[BE]**

- **Auto-save:** Every 60 seconds and on app background/close.
- **Save slots:** 3 independent worlds.
- **Data stored:** Player position, inventory, HP, tech tree progress, all placed blocks and machines, machine states (in/out buffers), all entity positions.
- **Format:** JSON with optional zlib compression for block data.
- **Cloud save hook:** Save data serializes to a single portable struct — cloud sync can be added by uploading/downloading this struct from any key-value store (iCloud, Google Play, or custom backend).
- **Offline production:** On load, calculate elapsed real time since last save. Run simulation forward in a fast-forward pass (capped at 8 hours of accumulation) to produce offline resources.

---

## 15. Performance Targets

**[BE]**

- **Target:** 60 FPS on a mid-range phone (e.g., iPhone 12, Samsung Galaxy A54)
- **Active simulated entities:** Up to 500 machines/belts/items simultaneously
- **Tick rate:** Simulation ticks at 20 Hz (every 50 ms); rendering is independent at 60 FPS
- **Chunk size:** 32 × 32 tiles per chunk; only chunks within 2-chunk radius of camera are active
- **Culling:** Off-screen tiles are not rendered; off-chunk machines pause (continue in offline-production fast-forward on re-activation)

---

## 16. Open Questions for Phase 2 Review

**[DIRECTOR]**

The following items are intentionally left for the technical architecture phase:

1. **Multiplayer scope** — Roblox-inspired co-op (2–4 players sharing a world) is a stated aspiration. Confirm: is this in MVP scope or a post-ship feature?
2. **World size limits** — How wide is the world horizontally? (Proposed: 512 tiles wide, infinite chunks possible but generation stops at 1600 m depth)
3. **Liquid simulation** — Water and lava flowing realistically (cellular automaton) vs. static pools? Static is far cheaper; flowing is more Minecraft-like.
4. **Enemy AI complexity** — Simple patrol/aggro vs. pathfinding through dug tunnels?
5. **Controller support** — MFi controller on iOS / Bluetooth gamepad support needed?

---

*End of Phase 1 — Game Design Document.*
*Awaiting your feedback before proceeding to Phase 2: Technical Architecture.*
