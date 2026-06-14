class_name TileSetGenerator

const Constants = preload("res://scripts/core/Constants.gd")

# Returns a TileSet with one tile per block type.
# Each tile is a 32×32 procedurally drawn image based on Constants.TILE_COLORS.
# Tiles are identified by their custom_data "tile_id" string.

# Ore tile IDs — get a stone base + colored ore dot clusters
const ORE_TILES := [
	"coal_ore", "copper_ore", "iron_ore", "tin_ore", "silver_ore",
	"gold_ore", "aluminum_ore", "crystal_ore", "magma_ore", "core_ore"
]

# Ore vein dot colors (brighter accent overlaid on stone base)
const ORE_VEIN_COLORS := {
	"coal_ore":     Color(0.15, 0.15, 0.15),
	"copper_ore":   Color(0.95, 0.60, 0.25),
	"iron_ore":     Color(0.85, 0.55, 0.50),
	"tin_ore":      Color(0.78, 0.88, 0.95),
	"silver_ore":   Color(0.95, 0.95, 1.00),
	"gold_ore":     Color(1.00, 0.95, 0.20),
	"aluminum_ore": Color(0.88, 0.95, 1.00),
	"crystal_ore":  Color(0.60, 1.00, 1.00),
	"magma_ore":    Color(1.00, 0.55, 0.10),
	"core_ore":     Color(1.00, 0.78, 1.00),
}

static func generate() -> TileSet:
	var ts := TileSet.new()
	ts.tile_size = Vector2i(Constants.TILE_SIZE, Constants.TILE_SIZE)

	# Add physics layer for solid tiles
	ts.add_physics_layer(0)
	ts.set_physics_layer_collision_layer(0, 1)  # layer "world"
	ts.set_physics_layer_collision_mask(0, 0)

	# Add custom data layer to store tile_id
	ts.add_custom_data_layer(0)
	ts.set_custom_data_layer_name(0, "tile_id")
	ts.set_custom_data_layer_type(0, TYPE_STRING)

	var source_id := 0
	for tile_id in Constants.TILE_COLORS:
		if tile_id == "air":
			continue
		var color: Color = Constants.TILE_COLORS[tile_id]

		var img := _draw_tile(tile_id, color)
		var tex := ImageTexture.create_from_image(img)

		var src := TileSetAtlasSource.new()
		src.texture = tex
		src.texture_region_size = Vector2i(Constants.TILE_SIZE, Constants.TILE_SIZE)
		src.create_tile(Vector2i.ZERO)

		# Add to TileSet FIRST so TileData has access to physics/custom_data layers
		ts.add_source(src, source_id)

		# Set tile_id custom data (requires tile_set connection)
		src.get_tile_data(Vector2i.ZERO, 0).set_custom_data("tile_id", tile_id)

		# Add physics polygon for solid tiles (non-liquid, non-air)
		var is_liquid: bool = tile_id in ["water", "lava"]
		if not is_liquid:
			var td := src.get_tile_data(Vector2i.ZERO, 0)
			td.add_collision_polygon(0)
			td.set_collision_polygon_points(0, 0, PackedVector2Array([
				Vector2(-16, -16), Vector2(16, -16),
				Vector2(16, 16), Vector2(-16, 16)
			]))
		source_id += 1

	return ts

# Returns a Dictionary mapping tile_id -> source_id in the generated TileSet
static func build_tile_id_map(ts: TileSet) -> Dictionary:
	var map := {}
	for src_id in ts.get_source_count():
		var real_src_id := ts.get_source_id(src_id)
		var src := ts.get_source(real_src_id) as TileSetAtlasSource
		if src == null:
			continue
		var td := src.get_tile_data(Vector2i.ZERO, 0)
		if td == null:
			continue
		var tile_id: String = td.get_custom_data("tile_id")
		map[tile_id] = real_src_id
	return map

# ---------------------------------------------------------------------------
# Per-tile drawing dispatch
# ---------------------------------------------------------------------------
static func _draw_tile(tile_id: String, color: Color) -> Image:
	var img := Image.create(Constants.TILE_SIZE, Constants.TILE_SIZE, false, Image.FORMAT_RGBA8)

	match tile_id:
		"grass":
			_draw_grass(img, color)
		"sand":
			_draw_sand(img, color)
		"lava":
			_draw_lava(img, color)
		"wood":
			_draw_wood(img, color)
		"leaves":
			_draw_leaves(img, color)
		"crystal_stone":
			_draw_crystal_stone(img, color)
		"magma_stone":
			_draw_magma_stone(img, color)
		_:
			if tile_id in ORE_TILES:
				_draw_ore(img, tile_id, color)
			else:
				_draw_stone_base(img, color, tile_id)

	return img

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

# Fill the image with color, add salt-and-pepper noise, 2px dark border,
# and 1px bright top-left inner highlight.
static func _draw_stone_base(img: Image, color: Color, seed_key: String) -> void:
	var sz := Constants.TILE_SIZE
	img.fill(color)

	# Salt-and-pepper noise: 15% of pixels darkened by 20%
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_key.hash()
	for y in sz:
		for x in sz:
			if rng.randf() < 0.15:
				var c := img.get_pixel(x, y)
				img.set_pixel(x, y, Color(c.r * 0.80, c.g * 0.80, c.b * 0.80, c.a))

	_draw_border_and_highlight(img, color)

# 2px dark border + 1px bright top/left inner highlight
static func _draw_border_and_highlight(img: Image, base_color: Color) -> void:
	var sz := Constants.TILE_SIZE
	var border := Color(base_color.r * 0.65, base_color.g * 0.65, base_color.b * 0.65, base_color.a)
	var highlight := Color(
		minf(base_color.r * 1.35, 1.0),
		minf(base_color.g * 1.35, 1.0),
		minf(base_color.b * 1.35, 1.0),
		base_color.a
	)

	# 2px border: outer and inner row/col
	for px in sz:
		img.set_pixel(px, 0, border)
		img.set_pixel(px, sz - 1, border)
		img.set_pixel(0, px, border)
		img.set_pixel(sz - 1, px, border)
		img.set_pixel(px, 1, border)
		img.set_pixel(px, sz - 2, border)
		img.set_pixel(1, px, border)
		img.set_pixel(sz - 2, px, border)

	# 1px top-left inner highlight (inside the 2px border, i.e. at row/col 2)
	for px in range(2, sz - 2):
		img.set_pixel(px, 2, highlight)
		img.set_pixel(2, px, highlight)

# Draw a 2×2 ore dot cluster at (cx, cy) with the given color
static func _draw_ore_dot(img: Image, cx: int, cy: int, ore_color: Color) -> void:
	var sz := Constants.TILE_SIZE
	for dy in 2:
		for dx in 2:
			var px := cx + dx
			var py := cy + dy
			if px >= 0 and px < sz and py >= 0 and py < sz:
				img.set_pixel(px, py, ore_color)

# ---------------------------------------------------------------------------
# Specific tile drawing routines
# ---------------------------------------------------------------------------

static func _draw_grass(img: Image, color: Color) -> void:
	var sz := Constants.TILE_SIZE
	var dirt_color := Color(0.55, 0.37, 0.20)
	var grass_top := Color(0.38, 0.75, 0.22)  # bright green
	var grass_dark_border := Color(0.18, 0.45, 0.08)

	# Bottom 24px = dirt
	for y in range(8, sz):
		for x in sz:
			img.set_pixel(x, y, dirt_color)

	# Top 8px = bright green grass
	for y in range(0, 8):
		for x in sz:
			img.set_pixel(x, y, grass_top)

	# Salt-and-pepper noise on grass top band
	var rng := RandomNumberGenerator.new()
	rng.seed = "grass".hash()
	for y in range(0, 8):
		for x in sz:
			if rng.randf() < 0.12:
				var c := img.get_pixel(x, y)
				img.set_pixel(x, y, Color(c.r * 0.85, c.g * 0.85, c.b * 0.85, c.a))

	# Dirt noise
	for y in range(8, sz):
		for x in sz:
			if rng.randf() < 0.15:
				var c := img.get_pixel(x, y)
				img.set_pixel(x, y, Color(c.r * 0.80, c.g * 0.80, c.b * 0.80, c.a))

	# 2px dark green border on very top edge
	for x in sz:
		img.set_pixel(x, 0, grass_dark_border)
		img.set_pixel(x, 1, grass_dark_border)

	# Standard 2px border on left/right/bottom (use dirt border color)
	var dirt_border := Color(dirt_color.r * 0.65, dirt_color.g * 0.65, dirt_color.b * 0.65)
	for px in sz:
		img.set_pixel(px, sz - 1, dirt_border)
		img.set_pixel(px, sz - 2, dirt_border)
		img.set_pixel(0, px, dirt_border)
		img.set_pixel(1, px, dirt_border)
		img.set_pixel(sz - 1, px, dirt_border)
		img.set_pixel(sz - 2, px, dirt_border)

	# 1px bright highlight on inside top-left (at y=2 and x=2, inside border)
	var hl := Color(minf(grass_top.r * 1.3, 1.0), minf(grass_top.g * 1.3, 1.0), minf(grass_top.b * 1.3, 1.0))
	for px in range(2, sz - 2):
		img.set_pixel(2, px, hl)

static func _draw_sand(img: Image, color: Color) -> void:
	var sz := Constants.TILE_SIZE
	img.fill(color)

	# Subtle diagonal stripes: every 4th pixel on a diagonal gets slightly darker
	var stripe_color := Color(color.r * 0.88, color.g * 0.88, color.b * 0.80)
	for y in sz:
		for x in sz:
			if (x + y) % 5 == 0:
				img.set_pixel(x, y, stripe_color)

	# Light noise
	var rng := RandomNumberGenerator.new()
	rng.seed = "sand".hash()
	for y in sz:
		for x in sz:
			if rng.randf() < 0.08:
				var c := img.get_pixel(x, y)
				img.set_pixel(x, y, Color(c.r * 0.90, c.g * 0.90, c.b * 0.85, c.a))

	_draw_border_and_highlight(img, color)

static func _draw_lava(img: Image, color: Color) -> void:
	var sz := Constants.TILE_SIZE
	var cx := sz / 2
	var cy := sz / 2
	var max_dist := float(cx)  # approx max distance from center

	# Radial gradient: bright orange center to dark red edges
	var center_color := Color(1.00, 0.70, 0.10, color.a)
	var edge_color := Color(0.50, 0.05, 0.00, color.a)

	for y in sz:
		for x in sz:
			var dx := float(x - cx)
			var dy := float(y - cy)
			var dist := sqrt(dx * dx + dy * dy)
			var t := clampf(dist / max_dist, 0.0, 1.0)
			img.set_pixel(x, y, center_color.lerp(edge_color, t))

	# Animated-feel noise: some brighter hotspot flecks
	var rng := RandomNumberGenerator.new()
	rng.seed = "lava".hash()
	for _i in 12:
		var rx := rng.randi_range(8, 24)
		var ry := rng.randi_range(8, 24)
		img.set_pixel(rx, ry, Color(1.0, 0.90, 0.40, color.a))

	# 2px border
	var border := Color(0.35, 0.02, 0.00, color.a)
	for px in sz:
		img.set_pixel(px, 0, border)
		img.set_pixel(px, sz - 1, border)
		img.set_pixel(0, px, border)
		img.set_pixel(sz - 1, px, border)
		img.set_pixel(px, 1, border)
		img.set_pixel(px, sz - 2, border)
		img.set_pixel(1, px, border)
		img.set_pixel(sz - 2, px, border)

static func _draw_wood(img: Image, color: Color) -> void:
	var sz := Constants.TILE_SIZE
	img.fill(color)

	var cx := sz / 2
	var cy := sz / 2

	# Concentric lighter rings: pixels whose distance from center falls in ring bands
	# get progressively lighter toward center
	for y in sz:
		for x in sz:
			var dx := float(x - cx)
			var dy := float(y - cy)
			var dist := sqrt(dx * dx + dy * dy)
			# Ring period = 4px, brightness boost peaks at even multiples
			var ring_t := (cos(dist * TAU / 7.0) + 1.0) * 0.5  # 0..1
			var brightness := 1.0 + ring_t * 0.20
			var c := img.get_pixel(x, y)
			img.set_pixel(x, y, Color(
				clampf(c.r * brightness, 0.0, 1.0),
				clampf(c.g * brightness, 0.0, 1.0),
				clampf(c.b * brightness, 0.0, 1.0),
				c.a
			))

	# Center highlight (cross-section pith is lightest)
	for dy in range(-2, 3):
		for dx in range(-2, 3):
			var px := cx + dx
			var py := cy + dy
			if px >= 0 and px < sz and py >= 0 and py < sz:
				var c := img.get_pixel(px, py)
				img.set_pixel(px, py, Color(
					clampf(c.r * 1.30, 0.0, 1.0),
					clampf(c.g * 1.25, 0.0, 1.0),
					clampf(c.b * 1.15, 0.0, 1.0),
					c.a
				))

	_draw_border_and_highlight(img, color)

static func _draw_leaves(img: Image, color: Color) -> void:
	var sz := Constants.TILE_SIZE
	# Base: darker green
	var dark_green := Color(color.r * 0.75, color.g * 0.75, color.b * 0.75)
	img.fill(dark_green)

	var light_green := color  # brighter shade for clusters

	# Random 4×4 clusters of the lighter shade scattered across the tile
	var rng := RandomNumberGenerator.new()
	rng.seed = "leaves".hash()
	for _i in 10:
		var cx := rng.randi_range(0, sz - 4)
		var cy := rng.randi_range(0, sz - 4)
		for dy in 4:
			for dx in 4:
				# Only paint some pixels of each cluster for organic look
				if rng.randf() < 0.65:
					img.set_pixel(cx + dx, cy + dy, light_green)

	_draw_border_and_highlight(img, dark_green)

static func _draw_crystal_stone(img: Image, color: Color) -> void:
	var sz := Constants.TILE_SIZE
	img.fill(color)

	# Salt-and-pepper noise
	var rng := RandomNumberGenerator.new()
	rng.seed = "crystal_stone".hash()
	for y in sz:
		for x in sz:
			if rng.randf() < 0.15:
				var c := img.get_pixel(x, y)
				img.set_pixel(x, y, Color(c.r * 0.80, c.g * 0.80, c.b * 0.80, c.a))

	# Sine-based brightness variation: simulate glow with brighter center column
	var cx := float(sz) / 2.0
	for y in sz:
		for x in sz:
			var dist_x: float = abs(float(x) - cx) / cx  # 0 at center, 1 at edge
			var glow := (1.0 + cos(dist_x * PI)) * 0.5  # 1 at center, 0 at edge
			var boost := 1.0 + glow * 0.25
			var c := img.get_pixel(x, y)
			img.set_pixel(x, y, Color(
				clampf(c.r * boost, 0.0, 1.0),
				clampf(c.g * boost, 0.0, 1.0),
				clampf(c.b * boost, 0.0, 1.0),
				c.a
			))

	_draw_border_and_highlight(img, color)

static func _draw_magma_stone(img: Image, color: Color) -> void:
	var sz := Constants.TILE_SIZE
	img.fill(color)

	# Salt-and-pepper noise
	var rng := RandomNumberGenerator.new()
	rng.seed = "magma_stone".hash()
	for y in sz:
		for x in sz:
			if rng.randf() < 0.15:
				var c := img.get_pixel(x, y)
				img.set_pixel(x, y, Color(c.r * 0.80, c.g * 0.80, c.b * 0.80, c.a))

	# Faint red glow gradient rising from bottom edge
	var glow_color := Color(0.45, 0.05, 0.00)
	for y in sz:
		# t=0 at top, t=1 at bottom — glow intensifies near bottom
		var t := float(y) / float(sz - 1)
		var glow_strength := t * t * 0.40  # quadratic fade
		for x in sz:
			var c := img.get_pixel(x, y)
			img.set_pixel(x, y, Color(
				clampf(c.r + glow_color.r * glow_strength, 0.0, 1.0),
				clampf(c.g + glow_color.g * glow_strength, 0.0, 1.0),
				clampf(c.b + glow_color.b * glow_strength, 0.0, 1.0),
				c.a
			))

	_draw_border_and_highlight(img, color)

static func _draw_ore(img: Image, tile_id: String, color: Color) -> void:
	var sz := Constants.TILE_SIZE

	# Stone base fill with noise
	_draw_stone_base(img, color, tile_id)

	# Ore dot clusters: 5–7 clusters of 2×2 dots using seeded RNG
	var rng := RandomNumberGenerator.new()
	rng.seed = tile_id.hash()
	var ore_color: Color = ORE_VEIN_COLORS.get(tile_id, Color(1.0, 1.0, 1.0))
	var num_clusters := rng.randi_range(5, 7)

	for _i in num_clusters:
		# Keep clusters away from the 2px border (stay in range 3..sz-5)
		var cx := rng.randi_range(3, sz - 5)
		var cy := rng.randi_range(3, sz - 5)
		_draw_ore_dot(img, cx, cy, ore_color)
