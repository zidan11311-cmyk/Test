class_name Constants

# World
const TILE_SIZE := 32
const CHUNK_SIZE := 32
const WORLD_WIDTH_TILES := 512
const MAX_DEPTH_TILES := 1750
const ACTIVE_RADIUS := 2
const LOAD_RADIUS := 3

# Simulation
const TICK_RATE := 20
const TICK_INTERVAL := 1.0 / TICK_RATE

# Inventory
const INVENTORY_SIZE := 40
const HOTBAR_SIZE := 8
const STACK_MAX_RESOURCE := 500
const STACK_MAX_COMPONENT := 200
const STACK_MAX_GEAR := 1

# Player
const PLAYER_SPEED := 180.0
const PLAYER_JUMP_VELOCITY := -420.0
const PLAYER_GRAVITY := 980.0
const MINE_REACH_TILES := 4

# Offline
const OFFLINE_CAP_HOURS := 8.0

# Layer depth bounds (in tiles, y+ is down from surface y=0)
const LAYER_BOUNDS := {
	"surface":   Vector2i(0,   50),
	"shallow":   Vector2i(50,  250),
	"deep_rock": Vector2i(250, 625),
	"crystal":   Vector2i(625, 1125),
	"magma":     Vector2i(1125, 1750),
	"core":      Vector2i(1750, 99999),
}

# Block HP values
const BLOCK_HP := {
	"air": 0,
	"dirt": 30,
	"grass": 25,
	"stone": 80,
	"coal_ore": 100,
	"copper_ore": 110,
	"iron_ore": 120,
	"tin_ore": 110,
	"silver_ore": 150,
	"gold_ore": 160,
	"aluminum_ore": 140,
	"deep_stone": 150,
	"crystal_stone": 200,
	"crystal_ore": 220,
	"magma_stone": 250,
	"obsidian": 400,
	"magma_ore": 300,
	"core_rock": 500,
	"core_ore": 450,
	"sand": 20,
	"clay": 25,
	"wood": 40,
	"leaves": 10,
}

# Block drop table: block_id -> { item_id, min_count, max_count }
const BLOCK_DROPS := {
	"dirt":         { "item": "dirt",         "min": 1, "max": 2 },
	"grass":        { "item": "dirt",         "min": 1, "max": 1 },
	"stone":        { "item": "stone",        "min": 1, "max": 2 },
	"coal_ore":     { "item": "coal",         "min": 1, "max": 3 },
	"copper_ore":   { "item": "copper_ore",   "min": 1, "max": 2 },
	"iron_ore":     { "item": "iron_ore",     "min": 1, "max": 2 },
	"tin_ore":      { "item": "tin_ore",      "min": 1, "max": 2 },
	"silver_ore":   { "item": "silver_ore",   "min": 1, "max": 2 },
	"gold_ore":     { "item": "gold_ore",     "min": 1, "max": 2 },
	"aluminum_ore": { "item": "aluminum_ore", "min": 1, "max": 2 },
	"deep_stone":   { "item": "stone",        "min": 1, "max": 2 },
	"crystal_ore":  { "item": "crystal_shard","min": 1, "max": 3 },
	"obsidian":     { "item": "obsidian",     "min": 1, "max": 1 },
	"magma_ore":    { "item": "magma_ore",    "min": 1, "max": 2 },
	"core_ore":     { "item": "core_fragment","min": 1, "max": 2 },
	"sand":         { "item": "sand",         "min": 1, "max": 2 },
	"clay":         { "item": "clay",         "min": 1, "max": 2 },
	"wood":         { "item": "wood",         "min": 2, "max": 4 },
}

# Tile colors for programmatic placeholder art (RGBA hex)
const TILE_COLORS := {
	"air":          Color(0, 0, 0, 0),
	"grass":        Color(0.30, 0.65, 0.18),
	"dirt":         Color(0.55, 0.37, 0.20),
	"stone":        Color(0.50, 0.50, 0.50),
	"coal_ore":     Color(0.28, 0.28, 0.28),
	"copper_ore":   Color(0.72, 0.45, 0.20),
	"iron_ore":     Color(0.60, 0.40, 0.35),
	"tin_ore":      Color(0.55, 0.62, 0.68),
	"silver_ore":   Color(0.75, 0.75, 0.80),
	"gold_ore":     Color(0.90, 0.75, 0.10),
	"aluminum_ore": Color(0.70, 0.78, 0.82),
	"deep_stone":   Color(0.35, 0.35, 0.40),
	"crystal_stone":Color(0.55, 0.62, 0.78),
	"crystal_ore":  Color(0.40, 0.80, 0.95),
	"magma_stone":  Color(0.30, 0.15, 0.10),
	"obsidian":     Color(0.10, 0.08, 0.12),
	"magma_ore":    Color(0.85, 0.25, 0.05),
	"core_rock":    Color(0.18, 0.08, 0.20),
	"core_ore":     Color(0.95, 0.60, 0.95),
	"sand":         Color(0.90, 0.85, 0.55),
	"clay":         Color(0.70, 0.52, 0.42),
	"wood":         Color(0.55, 0.35, 0.18),
	"leaves":       Color(0.20, 0.55, 0.15),
	"water":        Color(0.20, 0.50, 0.90, 0.80),
	"lava":         Color(0.95, 0.35, 0.05, 0.90),
}

static func get_layer_for_depth(tile_y: int) -> String:
	for layer_name in LAYER_BOUNDS:
		var bounds: Vector2i = LAYER_BOUNDS[layer_name]
		if tile_y >= bounds.x and tile_y < bounds.y:
			return layer_name
	return "core"

static func get_stack_max(category: String) -> int:
	match category:
		"resource": return STACK_MAX_RESOURCE
		"component": return STACK_MAX_COMPONENT
		"gear", "tool", "vehicle_part", "machine": return STACK_MAX_GEAR
		_: return STACK_MAX_RESOURCE
