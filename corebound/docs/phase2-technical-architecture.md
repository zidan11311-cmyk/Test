# CoreBound — Technical Architecture (Phase 2)

**Engine:** Godot 4.x (GDScript)  
**Platforms:** iOS + Android  
**Orientation:** Landscape only

---

## 1. Key Architectural Decisions

**[BE]**

| Decision | Choice | Reason |
|---|---|---|
| Engine | Godot 4 | Free, excellent 2D tooling, exports iOS + Android, GDScript is readable |
| Tile system | `TileMapLayer` (Godot 4.3+) | Built-in chunked rendering, physics layers, efficient draw calls |
| Simulation rate | 20 Hz fixed tick | Decoupled from render; cheap to run 500 entities; matches Factorio's model |
| World storage | Dictionary keyed by `Vector2i` chunk coords | O(1) lookup; serializes cleanly to JSON |
| Power network | Union-Find (disjoint-set) per chunk rebuild | Cheap to recalculate when topology changes; no per-frame traversal |
| Item transport | Circular buffer per belt segment | Zero allocation per tick; cache-friendly |
| Save format | JSON (block data zlib-compressed) | Human-readable during dev; compressible for ship |
| Scripting | GDScript only (no C# or GDExtension for MVP) | Simpler build pipeline for both platforms |
| UI | CanvasLayer + Control nodes | Native Godot; easy to scale for different screen sizes |

---

## 2. Project Folder Structure

```
res://
├── autoloads/                  # Singletons registered in Project Settings
│   ├── GameManager.gd          # Top-level state machine (menu/play/pause/gameover)
│   ├── WorldManager.gd         # Chunk loading, world data, procedural gen
│   ├── SimulationManager.gd    # 20 Hz tick loop, entity registration
│   ├── InventoryManager.gd     # Player inventory + nearby-chest overflow
│   ├── CraftingManager.gd      # Recipe lookup, craft queue
│   ├── PowerManager.gd         # Power network per chunk
│   ├── SaveManager.gd          # Serialize / deserialize world state
│   ├── AudioManager.gd         # Sound pool, music crossfade
│   └── InputManager.gd         # Touch abstraction layer
│
├── data/                       # Static data (read-only at runtime)
│   ├── items.json              # All item definitions
│   ├── recipes.json            # All crafting recipes
│   ├── machines.json           # Machine definitions (power draw, tick behavior)
│   ├── layers.json             # Depth layer parameters (biome, resources, hazards)
│   ├── vehicles.json           # Vehicle stats and upgrade trees
│   └── tech_tree.json          # Unlock requirements per tech node
│
├── resources/                  # Godot Resource (.tres/.res) files
│   ├── items/                  # ItemDefinition resources (one per item type)
│   ├── tiles/                  # TileSet resources per layer
│   └── themes/                 # UI Theme resources
│
├── scenes/
│   ├── world/
│   │   ├── World.tscn          # Root scene; holds TileMapLayer + entity containers
│   │   ├── Chunk.tscn          # Logical chunk node (not a visual scene)
│   │   └── WorldGenerator.gd   # Procedural generation (attached to World)
│   ├── player/
│   │   ├── Player.tscn         # CharacterBody2D + sprites + collision
│   │   └── PlayerController.gd
│   ├── machines/
│   │   ├── MiningDrill.tscn
│   │   ├── ConveyorBelt.tscn
│   │   ├── Furnace.tscn
│   │   ├── Assembler.tscn
│   │   ├── Generator.tscn
│   │   ├── Chest.tscn
│   │   └── BaseMachine.gd      # Shared machine logic
│   ├── vehicles/
│   │   ├── MiningCart.tscn
│   │   ├── DrillVehicle.tscn
│   │   ├── HoverVehicle.tscn
│   │   └── BaseVehicle.gd
│   ├── entities/
│   │   ├── DroppedItem.tscn    # Item on the ground
│   │   ├── Enemy.tscn
│   │   └── Projectile.tscn
│   ├── ui/
│   │   ├── HUD.tscn
│   │   ├── InventoryScreen.tscn
│   │   ├── CraftingScreen.tscn
│   │   ├── TechTreeScreen.tscn
│   │   ├── MapScreen.tscn
│   │   └── MainMenu.tscn
│   └── fx/
│       ├── MiningParticles.tscn
│       ├── ExplosionParticles.tscn
│       └── DustParticles.tscn
│
├── scripts/
│   ├── core/
│   │   ├── ItemStack.gd        # { item_id: String, count: int }
│   │   ├── ItemDefinition.gd   # Resource subclass, loaded from items.json
│   │   ├── Recipe.gd           # Resource subclass, loaded from recipes.json
│   │   ├── ChunkData.gd        # All block + entity state for one chunk
│   │   ├── BlockData.gd        # Single tile's runtime data
│   │   └── Constants.gd        # TILE_SIZE, CHUNK_SIZE, TICK_RATE, etc.
│   ├── systems/
│   │   ├── ProceduralGen.gd    # World generation algorithms
│   │   ├── PowerNetwork.gd     # Union-Find power graph
│   │   ├── BeltSegment.gd      # Circular buffer item transport
│   │   ├── OfflineProduction.gd # Fast-forward simulation on load
│   │   └── LightingSystem.gd   # Tile-based light propagation
│   └── util/
│       ├── SaveSerializer.gd
│       ├── ChunkCoords.gd      # World pos ↔ chunk coord ↔ tile coord helpers
│       └── MathUtil.gd
│
└── assets/
    ├── sprites/
    │   ├── tiles/              # Tilesheet PNGs per layer
    │   ├── player/
    │   ├── machines/
    │   ├── vehicles/
    │   ├── enemies/
    │   ├── items/              # 16×16 item icons
    │   └── ui/
    ├── audio/
    │   ├── music/
    │   └── sfx/
    └── fonts/
```

---

## 3. Core Constants

**`scripts/core/Constants.gd`**

```gdscript
class_name Constants

const TILE_SIZE        := 32          # pixels per tile
const CHUNK_SIZE       := 32          # tiles per chunk (32×32)
const TICK_RATE        := 20          # simulation ticks per second
const TICK_INTERVAL    := 1.0 / TICK_RATE  # 0.05 s
const ACTIVE_RADIUS    := 2           # chunks around camera that simulate
const LOAD_RADIUS      := 3           # chunks around camera that are loaded
const WORLD_WIDTH      := 512         # tiles wide (wraps at edges)
const MAX_DEPTH_TILES  := 1750        # ~1400 m at 32px/tile × 2.5 tiles/m
const STACK_MAX_RESOURCE := 500
const STACK_MAX_COMPONENT := 200
const OFFLINE_CAP_HOURS := 8.0       # max offline production accumulation

# Layer depth boundaries (in tiles from surface, y+ is down)
const LAYER_BOUNDS := {
    "surface":   [0,   50],
    "shallow":   [50,  250],
    "deep_rock": [250, 625],
    "crystal":   [625, 1125],
    "magma":     [1125, 1750],
    "core":      [1750, 99999],
}
```

---

## 4. Data Models

**[BE]**

### 4.1 ItemDefinition

```gdscript
# scripts/core/ItemDefinition.gd
class_name ItemDefinition extends Resource

@export var id: String          # unique key, e.g. "iron_plate"
@export var display_name: String
@export var icon: Texture2D
@export var category: String    # "resource" | "component" | "machine" | "vehicle_part" | "gear" | "tool"
@export var tier: int           # 0-5
@export var stack_max: int = 500
@export var is_placeable: bool = false
@export var place_scene: PackedScene  # scene to instantiate when placed
@export var fuel_value: float = 0.0  # kWh if used as fuel
@export var description: String
```

### 4.2 Recipe

```gdscript
# scripts/core/Recipe.gd
class_name Recipe extends Resource

@export var id: String
@export var output_item: String   # ItemDefinition.id
@export var output_count: int = 1
@export var inputs: Array[Dictionary]  # [{ "item": "iron_ore", "count": 2 }, ...]
@export var machine_type: String  # "hand" | "furnace" | "electric_furnace" | "assembler" | ...
@export var craft_time: float = 1.0   # seconds at base speed
@export var tech_required: String = ""  # tech node id that must be unlocked
```

### 4.3 BlockData

```gdscript
# scripts/core/BlockData.gd
class_name BlockData

var tile_id: String         # matches TileSet source name, e.g. "iron_ore"
var hp: int                 # remaining durability
var metadata: Dictionary    # machine state, ore amount, etc.

func _init(t: String, h: int) -> void:
    tile_id = t
    hp = h
    metadata = {}
```

### 4.4 ChunkData

```gdscript
# scripts/core/ChunkData.gd
class_name ChunkData

var coord: Vector2i                         # chunk grid coordinate
var blocks: Dictionary = {}                 # Vector2i(local) -> BlockData
var machines: Dictionary = {}              # Vector2i(local) -> MachineState
var entities: Array = []                   # DroppedItem, Enemy refs
var is_generated: bool = false
var last_active_time: float = 0.0          # used for offline production calc

func get_block(local_pos: Vector2i) -> BlockData:
    return blocks.get(local_pos, null)

func set_block(local_pos: Vector2i, data: BlockData) -> void:
    blocks[local_pos] = data

func remove_block(local_pos: Vector2i) -> void:
    blocks.erase(local_pos)
```

### 4.5 MachineState

```gdscript
# scripts/core/MachineState.gd
class_name MachineState

var machine_type: String           # "mining_drill_mk1", "conveyor_belt", etc.
var direction: int = 0             # 0=right, 1=down, 2=left, 3=up
var input_buffer: Array[Dictionary]   # [{ item, count }, ...]
var output_buffer: Array[Dictionary]
var fuel: float = 0.0              # kWh stored if fuel-based
var progress: float = 0.0          # 0.0-1.0 current operation progress
var is_active: bool = false        # powered and has work to do
var upgrade_level: int = 1
var custom_data: Dictionary = {}   # machine-specific extras
```

### 4.6 PlayerState

```gdscript
# scripts/core/PlayerState.gd
class_name PlayerState

var hp: int = 100
var max_hp: int = 100
var heat_resistance: float = 0.0   # 0.0–1.0
var position: Vector2
var inventory: Array[Dictionary]   # 40 slots: [{ item, count } or null]
var hotbar: Array[int]             # 8 slot indices into inventory
var active_vehicle: String = ""    # vehicle scene path if mounted
var tech_unlocked: Array[String] = []
var research_points: int = 0
var equipped_gear: Dictionary = {  # slot -> item_id
    "head": "", "chest": "", "legs": "", "boots": "",
    "accessory_1": "", "accessory_2": ""
}
var depth_reached: float = 0.0     # max y in world coords
```

### 4.7 WorldSaveData

```gdscript
# Root save envelope
{
    "version": 2,
    "save_time": 1718000000,          # Unix timestamp
    "player": { ...PlayerState... },
    "chunks": {
        "0,0": { ...ChunkData serialized... },
        "0,1": { ...ChunkData serialized... },
        # only chunks that have been visited or modified
    },
    "world_seed": 12345678,
    "playtime_seconds": 3600
}
```

---

## 5. Autoload (Singleton) APIs

**[BE]**

### 5.1 WorldManager

```gdscript
# autoloads/WorldManager.gd
# Responsibilities: chunk lifecycle, block read/write, world generation trigger

signal chunk_loaded(coord: Vector2i)
signal chunk_unloaded(coord: Vector2i)
signal block_changed(world_pos: Vector2i, new_data: BlockData)

var seed: int
var loaded_chunks: Dictionary = {}   # Vector2i -> ChunkData
var active_chunks: Set = {}          # chunks currently simulating

func get_block(world_pos: Vector2i) -> BlockData
func set_block(world_pos: Vector2i, data: BlockData) -> void
func remove_block(world_pos: Vector2i) -> void
func get_chunk(coord: Vector2i) -> ChunkData       # loads if not loaded
func world_to_chunk(world_pos: Vector2i) -> Vector2i
func world_to_local(world_pos: Vector2i) -> Vector2i
func is_chunk_active(coord: Vector2i) -> bool
func update_active_chunks(camera_world_pos: Vector2) -> void  # call each frame
```

### 5.2 SimulationManager

```gdscript
# autoloads/SimulationManager.gd
# Responsibilities: fixed 20 Hz tick, dispatches to all registered simulatable entities

signal tick(delta: float)   # emitted every 0.05 s

var _tick_accumulator: float = 0.0
var _registered_machines: Array = []

func _process(delta: float) -> void:
    _tick_accumulator += delta
    while _tick_accumulator >= Constants.TICK_INTERVAL:
        _tick_accumulator -= Constants.TICK_INTERVAL
        _run_tick()

func _run_tick() -> void:
    # Order matters — power before machines before belts before items
    PowerManager.tick()
    _tick_machines()
    _tick_belts()
    _tick_dropped_items()
    emit_signal("tick", Constants.TICK_INTERVAL)

func register(machine: Node) -> void
func unregister(machine: Node) -> void
```

### 5.3 PowerManager

```gdscript
# autoloads/PowerManager.gd
# Responsibilities: power network per chunk, supply/demand balance

signal power_changed(chunk_coord: Vector2i, supply_kw: float, demand_kw: float)

# One PowerNetwork object per active chunk
var _networks: Dictionary = {}  # chunk_coord -> PowerNetwork

func tick() -> void:
    for network in _networks.values():
        network.balance()

func get_supply(chunk_coord: Vector2i) -> float
func get_demand(chunk_coord: Vector2i) -> float
func get_ratio(chunk_coord: Vector2i) -> float   # supply/demand, capped at 1.0
func register_generator(chunk_coord: Vector2i, output_kw: float) -> void
func register_consumer(chunk_coord: Vector2i, draw_kw: float) -> void
func rebuild_network(chunk_coord: Vector2i) -> void
```

### 5.4 InventoryManager

```gdscript
# autoloads/InventoryManager.gd

signal inventory_changed()

var player_state: PlayerState

func add_item(item_id: String, count: int) -> int      # returns leftover
func remove_item(item_id: String, count: int) -> bool  # false if insufficient
func count_item(item_id: String) -> int
func has_item(item_id: String, count: int) -> bool
func get_slot(index: int) -> Dictionary                 # { item, count } or {}
func swap_slots(a: int, b: int) -> void
func split_stack(slot: int, amount: int) -> void
func overflow_to_nearby_chest(world_pos: Vector2, radius: float) -> int  # returns leftover
```

### 5.5 CraftingManager

```gdscript
# autoloads/CraftingManager.gd

var _recipes_by_id: Dictionary = {}          # id -> Recipe
var _recipes_by_machine: Dictionary = {}     # machine_type -> Array[Recipe]

func get_craftable(machine_type: String) -> Array[Recipe]
func can_craft(recipe_id: String) -> bool
func craft(recipe_id: String, count: int = 1) -> bool   # deducts ingredients, adds output
func get_recipe(id: String) -> Recipe
func load_recipes_from_json(path: String) -> void
```

### 5.6 SaveManager

```gdscript
# autoloads/SaveManager.gd

const SAVE_DIR := "user://saves/"
const AUTOSAVE_INTERVAL := 60.0

signal save_started()
signal save_completed()
signal load_completed()

func save(slot: int) -> void
func load_game(slot: int) -> void
func autosave() -> void
func list_save_slots() -> Array[Dictionary]  # [{ slot, timestamp, playtime, preview }]
func delete_slot(slot: int) -> void
```

---

## 6. World Generation

**[BE]**

### 6.1 Overview

The world is generated one chunk at a time when first entered. Generation is synchronous within a `Thread` to avoid frame stutters.

### 6.2 Generation Pipeline (per chunk)

```
1. Determine layer from chunk Y coordinate
2. Fill baseline block type (stone/magma_rock/core_rock etc.)
3. Apply noise-based cave carving (FastNoiseLite — domain-warped simplex)
4. Scatter ore veins (second noise pass per ore type, threshold by layer)
5. Place special features (crystal formations, lava pools, surface trees)
6. Mark chunk as generated, cache in WorldManager
```

### 6.3 Noise Parameters

```gdscript
# scripts/systems/ProceduralGen.gd (key parameters)

# Cave carving
var cave_noise := FastNoiseLite.new()
cave_noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
cave_noise.frequency = 0.025
cave_noise.fractal_octaves = 4
# Tile is carved (air) if cave_noise.get_noise_2d(wx, wy) > 0.35

# Ore placement — one noise instance per ore type
# Each ore checks: layer matches + ore_noise > ore_threshold + cave_noise < 0.2 (not in open air)
var ore_configs := {
    "coal_ore":   { "layer": "shallow", "freq": 0.08, "threshold": 0.55 },
    "copper_ore": { "layer": "shallow", "freq": 0.07, "threshold": 0.58 },
    "iron_ore":   { "layer": "shallow", "freq": 0.07, "threshold": 0.60 },
    # ... etc
}
```

### 6.4 Surface Generation

```
- Y=0 row: grass tiles
- Y=1 to Y=5: dirt
- Y=6+: stone (transitioning to shallow layer type)
- Trees: placed at surface when cave_noise < -0.4 (solid ground guaranteed)
- Starting area (±20 tiles of spawn): guaranteed flat, no ores, tutorial-friendly
```

---

## 7. Simulation Tick Pipeline

**[BE]**

All simulation runs inside `SimulationManager._run_tick()` at 20 Hz. The pipeline runs in dependency order to avoid one-frame lag between connected machines.

```
Tick pipeline (each call = 0.05 s of game time)
──────────────────────────────────────────────
1. PowerManager.tick()
   └─ For each active chunk network:
       a. Sum generator outputs (kW supply)
       b. Sum machine demands (kW demand)
       c. Compute ratio = min(supply / demand, 1.0)
       d. Broadcast ratio to all consumers in chunk

2. _tick_machines()
   └─ For each active MachineState in active chunks:
       a. Skip if ratio == 0 (no power)
       b. Advance progress by: (ratio × machine_speed × TICK_INTERVAL)
       c. If progress >= craft_time:
           - Consume input_buffer items
           - Push to output_buffer (or eject to adjacent belt/chest)
           - Reset progress

3. _tick_belts()
   └─ For each BeltSegment:
       a. Advance each item's position by belt_speed × TICK_INTERVAL
       b. If item reaches end of segment:
           - Try to push to next segment / machine input
           - If blocked: item stays at end (back-pressure)

4. _tick_dropped_items()
   └─ Items on ground with no belt: check if player is within pickup radius (3 tiles)
       - If yes: add to InventoryManager, remove entity

5. emit_signal("tick")  →  enemies, vehicles, environment effects listen here
```

### 7.1 Belt Segment Model

A belt segment is a contiguous straight run of conveyor tiles in one direction.

```gdscript
# scripts/systems/BeltSegment.gd
class_name BeltSegment

const SLOTS := 8           # positions per belt tile
var length: int            # tiles in this segment
var direction: Vector2i
var slots: Array           # circular buffer, size = length * SLOTS
                           # each slot: null | { item_id, count: 1 }
var speed: float = 1.0     # tiles per second (Mk1=1, Mk2=3)

func tick(dt: float) -> void:
    # shift items toward output end
    # items at output: try to push to next machine/belt

func push_item(item_id: String) -> bool:   # returns false if full
func pop_item() -> Dictionary:              # pops from output end
```

### 7.2 Mining Drill Behavior

```
Each tick:
1. Check power ratio > 0
2. Decrement target_block.hp by (drill_power × ratio × TICK_INTERVAL)
3. If target_block.hp <= 0:
   a. Drop ore item (push to output belt or internal buffer)
   b. Remove block from WorldManager
   c. Advance drill target to next block in its direction
4. If output buffer full: pause (drill doesn't break blocks it can't store)
```

### 7.3 Power Network (Union-Find)

Each time a machine is placed or removed in a chunk, `PowerManager.rebuild_network(chunk_coord)` is called. This is cheap — a chunk is at most 32×32=1024 tiles.

```gdscript
# scripts/systems/PowerNetwork.gd
class_name PowerNetwork

var supply_kw: float = 0.0
var demand_kw: float = 0.0
var stored_kwh: float = 0.0       # from batteries
var capacity_kwh: float = 0.0

func balance() -> void:
    var net := supply_kw - demand_kw
    if net > 0:
        stored_kwh = min(stored_kwh + net * Constants.TICK_INTERVAL, capacity_kwh)
    elif net < 0:
        var draw := -net * Constants.TICK_INTERVAL
        stored_kwh = max(stored_kwh - draw, 0.0)
    # ratio = effective_supply / demand
    var effective := supply_kw + (stored_kwh / Constants.TICK_INTERVAL if stored_kwh > 0 else 0)
    _ratio = clamp(effective / max(demand_kw, 0.001), 0.0, 1.0)

func get_ratio() -> float:
    return _ratio

var _ratio: float = 1.0
```

---

## 8. Rendering & Camera

**[FE]**

### 8.1 TileMapLayer Setup

Godot 4's `TileMapLayer` handles rendering. One `TileMapLayer` per visual layer:
- `TileMapLayer` 0 — background/wall tiles
- `TileMapLayer` 1 — foreground/solid tiles (collision here)
- `TileMapLayer` 2 — overlay (ores, decorations)
- `TileMapLayer` 3 — liquids (water/lava — rendered with shader)

Tile size: 32×32 px. TileSet atlases organized per depth layer (one atlas per biome).

### 8.2 Camera

```gdscript
# Attached to Player scene
var camera := Camera2D.new()
camera.zoom = Vector2(1.5, 1.5)     # adjusted per screen size
camera.position_smoothing_enabled = true
camera.position_smoothing_speed = 8.0
camera.limit_left = 0
camera.limit_right = Constants.WORLD_WIDTH * Constants.TILE_SIZE
camera.limit_top = -200             # small skybox above surface
camera.limit_bottom = Constants.MAX_DEPTH_TILES * Constants.TILE_SIZE
```

### 8.3 Chunk Activation

Each frame, `WorldManager.update_active_chunks(camera_pos)` is called:
1. Compute which chunk coords fall within `LOAD_RADIUS` of camera
2. Load any unloaded chunks (generate if new, deserialize if saved)
3. Activate simulation for chunks within `ACTIVE_RADIUS`
4. Deactivate simulation for chunks outside `ACTIVE_RADIUS + 1` (hysteresis)
5. Unload chunks outside `LOAD_RADIUS + 1` — serialize to memory, free nodes

### 8.4 Lighting

Tile-based flood-fill light propagation (not Godot's built-in 2D light — too expensive for large areas):

- Each light source has a radius (in tiles) and intensity.
- Light values stored in a 2D array per active chunk (0–15 scale, Minecraft-style).
- Re-propagated when blocks change in a chunk.
- Rendered as a `ColorRect` overlay with a shader sampling the light array.
- Player torch: radius 8. Electric lamp: radius 12. Lava tile: radius 6.

---

## 9. Player Controller

**[FE]**

```gdscript
# scenes/player/PlayerController.gd
extends CharacterBody2D

const SPEED := 180.0           # pixels/second
const JUMP_VELOCITY := -420.0
const GRAVITY := 980.0
const MINE_REACH := 4 * Constants.TILE_SIZE   # 4 tiles in any direction

var is_mining := false
var mine_target: Vector2i
var mine_progress: float = 0.0

func _physics_process(delta: float) -> void:
    _apply_gravity(delta)
    _read_input()
    move_and_slide()

func _read_input() -> void:
    # InputManager abstracts touch joystick + keyboard (for desktop testing)
    var dir := InputManager.get_move_axis()
    velocity.x = dir * SPEED

func try_mine(world_tile: Vector2i) -> void:
    # called by InputManager when player taps a tile within MINE_REACH
    var block := WorldManager.get_block(world_tile)
    if block == null:
        return
    mine_target = world_tile
    mine_progress += get_pickaxe_dps() * get_process_delta_time()
    if mine_progress >= block.hp:
        _break_block(world_tile, block)
        mine_progress = 0.0
```

---

## 10. Input System (Touch Abstraction)

**[FE]**

```gdscript
# autoloads/InputManager.gd
# Emits unified events regardless of touch vs. keyboard (useful for desktop testing)

signal tap(world_pos: Vector2)
signal hold_tap(world_pos: Vector2)
signal tap_released(world_pos: Vector2)

var _joystick_value: Vector2 = Vector2.ZERO  # set by VirtualJoystick UI node

func get_move_axis() -> float:
    # Keyboard fallback for testing in editor
    if OS.has_feature("editor"):
        return Input.get_axis("ui_left", "ui_right")
    return _joystick_value.x

func get_jump() -> bool:
    if OS.has_feature("editor"):
        return Input.is_action_just_pressed("ui_accept")
    return _jump_pressed

# Touch events are processed in _unhandled_input; world position is computed
# by transforming screen coords through the camera's transform
```

---

## 11. Save / Load

**[BE]**

### 11.1 Save pipeline

```
SaveManager.save(slot)
├─ Collect PlayerState from InventoryManager + Player node
├─ Iterate WorldManager.loaded_chunks
│   └─ ChunkData.serialize() → Dictionary
│       └─ blocks: encode as RLE string (run-length encoding) for dense chunks
│          then zlib compress if > 1 KB raw
├─ Build root save Dictionary
├─ JSON.stringify() → write to "user://saves/slot_{n}.json"
└─ emit save_completed
```

### 11.2 Load pipeline

```
SaveManager.load_game(slot)
├─ Read JSON file → parse root dictionary
├─ Restore PlayerState
├─ Restore world_seed (used for on-demand generation of unvisited chunks)
├─ Pre-load chunks near player position
├─ Run OfflineProduction.fast_forward(elapsed_seconds)
│   └─ For each saved chunk with machines:
│       Simulate N ticks = elapsed_seconds × TICK_RATE (capped at OFFLINE_CAP × TICK_RATE)
│       This fills output buffers as if machines ran offline
└─ emit load_completed
```

### 11.3 Offline Production

```gdscript
# scripts/systems/OfflineProduction.gd
static func fast_forward(chunk: ChunkData, ticks: int) -> void:
    # Run a simplified tick loop (no rendering, no signals)
    # Only: power balance → machine progress → belt movement
    # Items that overflow output buffers are dropped (lost) — cap prevents griefing
    var fake_power := _estimate_power(chunk)
    for i in ticks:
        for machine_state in chunk.machines.values():
            _tick_machine(machine_state, fake_power)
        _tick_belts_in_chunk(chunk)
```

---

## 12. UI Architecture

**[FE]**

All UI lives on a `CanvasLayer` (layer 10) above the world. Screens are hidden/shown, not loaded/unloaded (avoids instantiation cost mid-game).

```
CanvasLayer (layer 10)
├── HUD.tscn                  # always visible during play
│   ├── HPBar
│   ├── PowerBar
│   ├── HeatBar
│   ├── DepthLabel
│   ├── Hotbar
│   ├── VirtualJoystick
│   ├── JumpButton
│   └── MenuButtons (inventory, crafting, tech, map)
├── InventoryScreen.tscn      # shown on demand
├── CraftingScreen.tscn       # shown on demand
├── TechTreeScreen.tscn       # shown on demand
├── MapScreen.tscn            # shown on demand
└── PauseMenu.tscn
```

UI scaling: use `CanvasItem` → `Stretch Mode: viewport` in Project Settings. Design at 1280×720 base resolution; Godot scales to device.

---

## 13. Audio Architecture

**[FE]**

```gdscript
# autoloads/AudioManager.gd

const SFX_POOL_SIZE := 16     # AudioStreamPlayer pool to avoid allocation

var _sfx_pool: Array[AudioStreamPlayer]
var _music_players: Array[AudioStreamPlayer] = []  # two, for crossfade
var _current_layer: String = ""

func play_sfx(sfx_name: String, volume_db: float = 0.0) -> void:
    # Grab next free pool player, set stream, play
    
func play_music_for_layer(layer_name: String) -> void:
    if layer_name == _current_layer:
        return
    _current_layer = layer_name
    _crossfade_to(_music_tracks[layer_name])

func _crossfade_to(stream: AudioStream, duration: float = 2.0) -> void:
    # Tween volume: current player fades out, new player fades in
```

---

## 14. Performance Checklist

**[BE]**

| Risk | Mitigation |
|---|---|
| Too many `_process` nodes | All simulation goes through `SimulationManager.tick` signal; most nodes have no `_process` |
| GC pressure from Dictionary allocation | Pre-allocate ItemStack pools; reuse MachineState objects |
| TileMap overdraw | One `TileMapLayer` per visual depth; only render loaded chunks |
| Physics bodies | Only player + enemies use CharacterBody2D; machines are static data, no physics |
| Belt item count | Cap: 8 slots per tile × max 200 active belt tiles = 1600 item objects max |
| Cave generation stutter | Generation runs in a `Thread`; main thread shows a brief "Exploring..." label |
| Large save files | RLE + zlib on block data; typical 4-hour save ≈ 200–400 KB |
| Lighting recalc | Only recalculate the affected chunk + neighbors when blocks change |

---

## 15. Third-Party / Plugin Requirements

None required for MVP. Godot 4 built-ins cover everything:
- `FastNoiseLite` — procedural generation
- `TileMapLayer` — world rendering
- `JSON` — data loading and save format
- `FileAccess` — save file I/O
- `Thread` — background chunk generation
- `Tween` — UI animations and crossfades
- `AudioStreamPlayer` — sound pool

---

## 16. Build & Export Notes

**[FE]**

### Android
- Export template: Godot Android Export (no C++ required)
- Min SDK: 24 (Android 7.0) — covers 95%+ of active devices
- Architecture: `arm64-v2a` (primary) + `x86_64` (emulator)
- Permissions needed: none for MVP (no camera, mic, or network)
- Signed AAB for Play Store submission

### iOS
- Requires Mac + Xcode 15+
- Export template: Godot iOS Export
- Min iOS: 16 — covers ~95% of active iPhones
- Requires Apple Developer account ($99/year)
- Orientation: locked to landscape in `project.godot`

---

*End of Phase 2 — Technical Architecture.*  
*Awaiting your feedback before proceeding to Phase 3: Vertical Slice (runnable MVP code).*
