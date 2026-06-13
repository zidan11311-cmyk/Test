class_name ChunkData

var coord: Vector2i
var blocks: Dictionary = {}       # Vector2i (local tile pos) -> BlockData
var machines: Dictionary = {}     # Vector2i (local tile pos) -> Dictionary (machine state)
var is_generated: bool = false
var last_tick_time: float = 0.0   # real-time timestamp when chunk was last active

func _init(p_coord: Vector2i) -> void:
	coord = p_coord

func get_block(local: Vector2i) -> BlockData:
	return blocks.get(local, null)

func set_block(local: Vector2i, data: BlockData) -> void:
	if data == null or data.is_air():
		blocks.erase(local)
	else:
		blocks[local] = data

func remove_block(local: Vector2i) -> void:
	blocks.erase(local)

func has_block(local: Vector2i) -> bool:
	return blocks.has(local)

func get_world_origin() -> Vector2i:
	return coord * Constants.CHUNK_SIZE

func serialize() -> Dictionary:
	var blocks_serial := {}
	for pos in blocks:
		var key := "%d,%d" % [pos.x, pos.y]
		blocks_serial[key] = blocks[pos].serialize()
	return {
		"coord": { "x": coord.x, "y": coord.y },
		"blocks": blocks_serial,
		"machines": machines,
		"generated": is_generated,
		"last_tick": last_tick_time,
	}

static func deserialize(d: Dictionary) -> ChunkData:
	var c_dict: Dictionary = d["coord"]
	var chunk := ChunkData.new(Vector2i(c_dict["x"], c_dict["y"]))
	var bd: Dictionary = d.get("blocks", {})
	for key in bd:
		var parts := key.split(",")
		var local := Vector2i(int(parts[0]), int(parts[1]))
		chunk.blocks[local] = BlockData.deserialize(bd[key])
	chunk.machines = d.get("machines", {})
	chunk.is_generated = d.get("generated", false)
	chunk.last_tick_time = d.get("last_tick", 0.0)
	return chunk
