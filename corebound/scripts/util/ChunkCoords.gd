class_name ChunkCoords

const Constants = preload("res://scripts/core/Constants.gd")

static func world_to_chunk(world_tile: Vector2i) -> Vector2i:
	# Floor division (handles negative coords correctly)
	var cx := floori(float(world_tile.x) / Constants.CHUNK_SIZE)
	var cy := floori(float(world_tile.y) / Constants.CHUNK_SIZE)
	return Vector2i(cx, cy)

static func world_to_local(world_tile: Vector2i) -> Vector2i:
	var chunk := world_to_chunk(world_tile)
	return world_tile - chunk * Constants.CHUNK_SIZE

static func local_to_world(chunk_coord: Vector2i, local: Vector2i) -> Vector2i:
	return chunk_coord * Constants.CHUNK_SIZE + local

static func pixel_to_tile(pixel: Vector2) -> Vector2i:
	return Vector2i(
		floori(pixel.x / Constants.TILE_SIZE),
		floori(pixel.y / Constants.TILE_SIZE)
	)

static func tile_to_pixel_center(tile: Vector2i) -> Vector2:
	return Vector2(
		tile.x * Constants.TILE_SIZE + Constants.TILE_SIZE * 0.5,
		tile.y * Constants.TILE_SIZE + Constants.TILE_SIZE * 0.5
	)

static func chunk_origin_pixel(chunk_coord: Vector2i) -> Vector2:
	return Vector2(
		chunk_coord.x * Constants.CHUNK_SIZE * Constants.TILE_SIZE,
		chunk_coord.y * Constants.CHUNK_SIZE * Constants.TILE_SIZE
	)

static func chunks_in_radius(center_chunk: Vector2i, radius: int) -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	for dy in range(-radius, radius + 1):
		for dx in range(-radius, radius + 1):
			result.append(center_chunk + Vector2i(dx, dy))
	return result
