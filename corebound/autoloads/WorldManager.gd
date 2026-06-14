extends Node

const BlockData = preload("res://scripts/core/BlockData.gd")
const ChunkData = preload("res://scripts/core/ChunkData.gd")
const MachineState = preload("res://scripts/core/MachineState.gd")
const VehicleState = preload("res://scripts/core/VehicleState.gd")
const ChunkCoords = preload("res://scripts/util/ChunkCoords.gd")
const Constants = preload("res://scripts/core/Constants.gd")
const ProceduralGen = preload("res://scripts/systems/ProceduralGen.gd")
const TileSetGenerator = preload("res://scripts/systems/TileSetGenerator.gd")

signal chunk_loaded(coord: Vector2i)
signal chunk_unloaded(coord: Vector2i)
signal block_changed(world_tile: Vector2i, new_tile_id: String)
signal machine_interacted(world_tile: Vector2i, ms: MachineState)
signal machine_placed(world_tile: Vector2i, ms: MachineState)
signal machine_removed(world_tile: Vector2i)
signal vehicle_spawned(vehicle_node: Node, vs: VehicleState)
signal vehicle_despawned(vs: VehicleState)

var world_seed: int = 0
var loaded_chunks: Dictionary = {}      # Vector2i -> ChunkData
var active_chunk_coords: Array = []     # currently simulating

var tilemap: TileMapLayer = null        # set by World scene after creation
var _tile_id_to_source: Dictionary = {}  # tile_id -> source_id in TileSet
var _proc_gen: ProceduralGen = null
var _tileset: TileSet = null

var vehicles: Array = []   # Array of VehicleState for persistence

func initialize(seed_val: int, tm: TileMapLayer) -> void:
	world_seed = seed_val
	tilemap = tm
	_proc_gen = ProceduralGen.new(seed_val)
	_tileset = TileSetGenerator.generate()
	tilemap.tile_set = _tileset
	_tile_id_to_source = TileSetGenerator.build_tile_id_map(_tileset)

func get_block(world_tile: Vector2i) -> BlockData:
	var chunk_coord := ChunkCoords.world_to_chunk(world_tile)
	var chunk := loaded_chunks.get(chunk_coord, null) as ChunkData
	if chunk == null:
		return null
	var local := ChunkCoords.world_to_local(world_tile)
	return chunk.get_block(local)

func set_block(world_tile: Vector2i, tile_id: String) -> void:
	var chunk_coord := ChunkCoords.world_to_chunk(world_tile)
	var chunk := _get_or_load_chunk(chunk_coord)
	var local := ChunkCoords.world_to_local(world_tile)
	if tile_id == "air" or tile_id == "":
		chunk.remove_block(local)
		_update_tilemap_cell(world_tile, "")
	else:
		chunk.set_block(local, BlockData.new(tile_id))
		_update_tilemap_cell(world_tile, tile_id)
	emit_signal("block_changed", world_tile, tile_id)

func damage_block(world_tile: Vector2i, damage: float) -> bool:
	var block := get_block(world_tile)
	if block == null or block.is_air():
		return false
	block.hp -= int(damage)
	if block.hp <= 0:
		_break_block(world_tile, block)
		return true
	return false

func _break_block(world_tile: Vector2i, block: BlockData) -> void:
	var drop := block.get_drop()
	if not drop.is_empty():
		var count := randi_range(drop["min"], drop["max"])
		InventoryManager.add_item(drop["item"], count)
	var chunk_coord := ChunkCoords.world_to_chunk(world_tile)
	var chunk := loaded_chunks.get(chunk_coord) as ChunkData
	if chunk:
		chunk.remove_block(ChunkCoords.world_to_local(world_tile))
	_update_tilemap_cell(world_tile, "")
	emit_signal("block_changed", world_tile, "air")

func _update_tilemap_cell(world_tile: Vector2i, tile_id: String) -> void:
	if tilemap == null:
		return
	if tile_id == "" or tile_id == "air":
		tilemap.erase_cell(world_tile)
		return
	var src_id: int = _tile_id_to_source.get(tile_id, -1)
	if src_id >= 0:
		tilemap.set_cell(world_tile, src_id, Vector2i.ZERO)

func update_active_chunks(camera_pixel_pos: Vector2) -> void:
	var cam_tile := ChunkCoords.pixel_to_tile(Vector2i(int(camera_pixel_pos.x), int(camera_pixel_pos.y)))
	var cam_chunk := ChunkCoords.world_to_chunk(cam_tile)

	var needed := ChunkCoords.chunks_in_radius(cam_chunk, Constants.LOAD_RADIUS)

	# Load new chunks
	for coord in needed:
		if not loaded_chunks.has(coord):
			_load_chunk(coord)

	# Update active set (ACTIVE_RADIUS)
	active_chunk_coords.clear()
	for coord in ChunkCoords.chunks_in_radius(cam_chunk, Constants.ACTIVE_RADIUS):
		if loaded_chunks.has(coord):
			active_chunk_coords.append(coord)

	# Unload far chunks
	var to_unload := []
	for coord in loaded_chunks:
		var dist := (Vector2(coord) - Vector2(cam_chunk)).length()
		if dist > Constants.LOAD_RADIUS + 1.5:
			to_unload.append(coord)
	for coord in to_unload:
		_unload_chunk(coord)

func _load_chunk(coord: Vector2i) -> ChunkData:
	var chunk := ChunkData.new(coord)
	_proc_gen.generate_chunk(chunk)
	if coord.y == 0:
		_proc_gen.place_surface_trees(chunk)
	loaded_chunks[coord] = chunk
	_render_chunk(chunk)
	emit_signal("chunk_loaded", coord)
	return chunk

func _get_or_load_chunk(coord: Vector2i) -> ChunkData:
	if loaded_chunks.has(coord):
		return loaded_chunks[coord]
	return _load_chunk(coord)

func _unload_chunk(coord: Vector2i) -> void:
	var chunk := loaded_chunks.get(coord) as ChunkData
	if chunk == null:
		return
	loaded_chunks.erase(coord)
	# Erase tiles from TileMapLayer
	var origin := chunk.get_world_origin()
	for lx in Constants.CHUNK_SIZE:
		for ly in Constants.CHUNK_SIZE:
			tilemap.erase_cell(Vector2i(origin.x + lx, origin.y + ly))
	emit_signal("chunk_unloaded", coord)

func _render_chunk(chunk: ChunkData) -> void:
	if tilemap == null:
		return
	var origin := chunk.get_world_origin()
	for local in chunk.blocks:
		var block: BlockData = chunk.blocks[local]
		if block.is_air():
			continue
		var world_tile := Vector2i(origin.x + local.x, origin.y + local.y)
		_update_tilemap_cell(world_tile, block.tile_id)

func get_block_at_pixel(pixel: Vector2) -> Vector2i:
	return ChunkCoords.pixel_to_tile(Vector2i(int(pixel.x), int(pixel.y)))

func load_from_save(chunks_data: Dictionary) -> void:
	for key in chunks_data:
		var chunk: ChunkData = ChunkData.deserialize(chunks_data[key]) as ChunkData
		loaded_chunks[chunk.coord] = chunk

func serialize_loaded_chunks() -> Dictionary:
	var result := {}
	for coord in loaded_chunks:
		var chunk: ChunkData = loaded_chunks[coord]
		if chunk.is_generated:
			var key := "%d,%d" % [coord.x, coord.y]
			result[key] = chunk.serialize()
	return result

func serialize_vehicles() -> Array:
	var result := []
	for vs in vehicles:
		result.append((vs as VehicleState).serialize())
	return result

func load_vehicles_from_save(vehicles_data: Array) -> void:
	vehicles.clear()
	for d in vehicles_data:
		var vs: VehicleState = VehicleState.deserialize(d) as VehicleState
		vehicles.append(vs)
		emit_signal("vehicle_spawned", null, vs)  # World.gd will instantiate the scene

func place_machine(world_tile: Vector2i, machine_type: String, direction: int) -> bool:
	# Check tile is empty (air or no block)
	var existing := get_block(world_tile)
	var chunk_coord := ChunkCoords.world_to_chunk(world_tile)
	var chunk := _get_or_load_chunk(chunk_coord)
	var local := ChunkCoords.world_to_local(world_tile)

	if chunk.machines.has(local):
		return false  # Already has a machine

	# Place machine state
	var ms := MachineState.new(machine_type, direction)
	chunk.machines[local] = ms

	# Register with power network
	PowerManager.register_machine(world_tile, ms)

	# Spawn visual node
	emit_signal("machine_placed", world_tile, ms)
	return true

func remove_machine(world_tile: Vector2i) -> bool:
	var chunk_coord := ChunkCoords.world_to_chunk(world_tile)
	var chunk := WorldManager.loaded_chunks.get(chunk_coord) as ChunkData
	if chunk == null: return false
	var local := ChunkCoords.world_to_local(world_tile)
	if not chunk.machines.has(local): return false
	var ms: MachineState = chunk.machines[local]
	chunk.machines.erase(local)
	PowerManager.unregister_machine(world_tile, ms.machine_type)
	emit_signal("machine_removed", world_tile)
	return true

func spawn_vehicle(vs: VehicleState) -> void:
	vehicles.append(vs)
	emit_signal("vehicle_spawned", null, vs)  # World.gd will instantiate the scene

func despawn_vehicle(vs: VehicleState) -> void:
	vehicles.erase(vs)
	emit_signal("vehicle_despawned", vs)

func place_rail(world_tile: Vector2i) -> bool:
	# Rails go into the normal block layer as a special tile type
	var existing := get_block(world_tile)
	if existing != null and not existing.is_air():
		return false  # Can't place on solid block
	set_block(world_tile, "rail")
	return true

func remove_rail(world_tile: Vector2i) -> void:
	var block := get_block(world_tile)
	if block != null and block.tile_id == "rail":
		set_block(world_tile, "air")
