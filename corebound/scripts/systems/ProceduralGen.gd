class_name ProceduralGen

var _seed: int
var _cave_noise: FastNoiseLite
var _ore_noises: Dictionary  # tile_id -> FastNoiseLite

func _init(world_seed: int) -> void:
	_seed = world_seed
	_setup_noise()

func _setup_noise() -> void:
	_cave_noise = FastNoiseLite.new()
	_cave_noise.seed = _seed
	_cave_noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	_cave_noise.frequency = 0.025
	_cave_noise.fractal_octaves = 4

	# Per-ore noise instances
	var ore_configs := {
		"coal_ore":     { "freq": 0.08, "seed_offset": 1 },
		"copper_ore":   { "freq": 0.07, "seed_offset": 2 },
		"iron_ore":     { "freq": 0.07, "seed_offset": 3 },
		"tin_ore":      { "freq": 0.06, "seed_offset": 4 },
		"silver_ore":   { "freq": 0.06, "seed_offset": 5 },
		"gold_ore":     { "freq": 0.05, "seed_offset": 6 },
		"aluminum_ore": { "freq": 0.06, "seed_offset": 7 },
		"crystal_ore":  { "freq": 0.09, "seed_offset": 8 },
		"obsidian":     { "freq": 0.04, "seed_offset": 9 },
		"magma_ore":    { "freq": 0.08, "seed_offset": 10 },
		"core_ore":     { "freq": 0.10, "seed_offset": 11 },
	}
	for ore_id in ore_configs:
		var cfg: Dictionary = ore_configs[ore_id]
		var n := FastNoiseLite.new()
		n.seed = _seed + cfg["seed_offset"] * 1000
		n.noise_type = FastNoiseLite.TYPE_CELLULAR
		n.frequency = cfg["freq"]
		_ore_noises[ore_id] = n

func generate_chunk(chunk: ChunkData) -> void:
	if chunk.is_generated:
		return

	var origin := chunk.get_world_origin()

	for lx in Constants.CHUNK_SIZE:
		for ly in Constants.CHUNK_SIZE:
			var wx := origin.x + lx
			var wy := origin.y + ly
			var tile_id := _get_tile_id(wx, wy)
			if tile_id != "air":
				chunk.blocks[Vector2i(lx, ly)] = BlockData.new(tile_id)

	chunk.is_generated = true

func _get_tile_id(wx: int, wy: int) -> String:
	# Above surface
	if wy < 0:
		return "air"

	var layer := Constants.get_layer_for_depth(wy)
	var base_tile := _get_base_tile(layer)

	# Surface row: grass top
	if wy == 0:
		return "grass"

	# Dirt layer just below surface
	if wy < 5:
		return "dirt"

	# Sand patches on surface (noise-based)
	if wy < 8 and _cave_noise.get_noise_2d(wx * 0.3, wy * 0.3) > 0.5:
		return "sand"

	# Cave carving — open space inside the ground
	var cave_val := _cave_noise.get_noise_2d(float(wx), float(wy))

	# Trees on surface (wy=0 is grass, wx position)
	# Trees handled separately as above-ground structures; skip here

	# Determine if this tile is open (cave / tunnel)
	# Caves start from shallow underground (wy >= 15) to avoid surface holes
	var cave_threshold := 0.38
	if wy >= 15 and cave_val > cave_threshold:
		return "air"

	# Ore veins (only in solid rock)
	if wy >= 15:
		var ore := _pick_ore(wx, wy, layer, cave_val)
		if ore != "":
			return ore

	return base_tile

func _get_base_tile(layer: String) -> String:
	match layer:
		"surface":   return "stone"
		"shallow":   return "stone"
		"deep_rock": return "deep_stone"
		"crystal":   return "crystal_stone"
		"magma":     return "magma_stone"
		"core":      return "core_rock"
		_:           return "stone"

func _pick_ore(wx: int, wy: int, layer: String, cave_val: float) -> String:
	# Only place ores in solid rock (not near caves)
	if cave_val > 0.25:
		return ""

	# Ore placement rules per layer
	var candidates := []
	match layer:
		"shallow":
			candidates = ["coal_ore", "copper_ore", "iron_ore", "tin_ore"]
		"deep_rock":
			candidates = ["silver_ore", "gold_ore", "aluminum_ore", "coal_ore", "iron_ore"]
		"crystal":
			candidates = ["crystal_ore", "silver_ore", "gold_ore"]
		"magma":
			candidates = ["obsidian", "magma_ore"]
		"core":
			candidates = ["core_ore", "obsidian"]

	for ore_id in candidates:
		if _ore_noises.has(ore_id):
			var ore_val: float = _ore_noises[ore_id].get_noise_2d(float(wx), float(wy))
			var threshold := _get_ore_threshold(ore_id)
			if ore_val > threshold:
				return ore_id

	return ""

func _get_ore_threshold(ore_id: String) -> float:
	match ore_id:
		"coal_ore":     return 0.52
		"copper_ore":   return 0.55
		"iron_ore":     return 0.56
		"tin_ore":      return 0.55
		"silver_ore":   return 0.60
		"gold_ore":     return 0.62
		"aluminum_ore": return 0.58
		"crystal_ore":  return 0.50
		"obsidian":     return 0.58
		"magma_ore":    return 0.54
		"core_ore":     return 0.52
		_: return 0.60

func place_surface_trees(chunk: ChunkData) -> void:
	# Place tree trunks and leaves above surface tiles
	var origin := chunk.get_world_origin()
	if origin.y != 0:
		return  # Only surface chunk row

	var rng := RandomNumberGenerator.new()
	rng.seed = _seed ^ (origin.x * 31337)

	for lx in Constants.CHUNK_SIZE:
		var wx := origin.x + lx
		# Tree every ~8 tiles, noise-driven
		var tree_noise := _cave_noise.get_noise_2d(float(wx) * 0.15, 999.0)
		if tree_noise > 0.45 and rng.randf() > 0.5:
			# Place trunk at ly=-1, -2, -3 (above surface)
			for trunk_y in range(-3, 0):
				chunk.blocks[Vector2i(lx, trunk_y)] = BlockData.new("wood")
			# Leaves at -4 and around
			for lly in range(-6, -3):
				for llx in range(-2, 3):
					if abs(llx) + abs(lly + 5) < 3:
						var leaf_local := Vector2i(lx + llx, lly)
						if not chunk.blocks.has(leaf_local):
							chunk.blocks[leaf_local] = BlockData.new("leaves")
