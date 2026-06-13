class_name TileSetGenerator

# Returns a TileSet with one tile per block type.
# Each tile is a 32×32 solid-color square based on Constants.TILE_COLORS.
# Tiles are identified by their custom_data "tile_id" string.
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

		# Create a 32×32 image filled with the color + 1px darker border
		var img := Image.create(Constants.TILE_SIZE, Constants.TILE_SIZE, false, Image.FORMAT_RGBA8)
		img.fill(color)
		# Draw 1px border (slightly darker)
		var border_color := Color(color.r * 0.75, color.g * 0.75, color.b * 0.75, color.a)
		for px in Constants.TILE_SIZE:
			img.set_pixel(px, 0, border_color)
			img.set_pixel(px, Constants.TILE_SIZE - 1, border_color)
			img.set_pixel(0, px, border_color)
			img.set_pixel(Constants.TILE_SIZE - 1, px, border_color)

		var tex := ImageTexture.create_from_image(img)

		var src := TileSetAtlasSource.new()
		src.texture = tex
		src.texture_region_size = Vector2i(Constants.TILE_SIZE, Constants.TILE_SIZE)
		src.create_tile(Vector2i.ZERO)

		# Set tile_id custom data
		src.get_tile_data(Vector2i.ZERO, 0).set_custom_data("tile_id", tile_id)

		# Add physics polygon for solid tiles (non-liquid, non-air)
		var is_liquid := tile_id in ["water", "lava"]
		if not is_liquid:
			var td := src.get_tile_data(Vector2i.ZERO, 0)
			td.add_collision_polygon(0)
			td.set_collision_polygon_points(0, 0, PackedVector2Array([
				Vector2(-16, -16), Vector2(16, -16),
				Vector2(16, 16), Vector2(-16, 16)
			]))

		ts.add_source(src, source_id)
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
