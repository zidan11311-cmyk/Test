class_name MiningCart
extends Node2D

var vehicle_state: VehicleState
var _tile_pos: Vector2i     # current tile position (not pixel)
var _progress: float = 0.0  # 0.0–1.0 interpolation between current and next tile
var _moving: bool = true
var _body: ColorRect
var _label: Label

signal cart_destroyed()

func setup(vs: VehicleState) -> void:
	vehicle_state = vs
	_tile_pos = ChunkCoords.pixel_to_tile(Vector2i(int(vs.position.x), int(vs.position.y)))
	global_position = _tile_to_pixel(_tile_pos)
	_build_visuals()
	SimulationManager.tick_completed.connect(_on_tick)

func _build_visuals() -> void:
	var ts := Constants.TILE_SIZE
	_body = ColorRect.new()
	_body.size = Vector2(ts * 1.2, ts * 0.7)
	_body.position = Vector2(-ts * 0.1, ts * 0.15)
	_body.color = Color(0.5, 0.4, 0.3)
	add_child(_body)

	# Wheels (two small dark rects at bottom)
	for wx in [0.1, 0.8]:
		var wheel := ColorRect.new()
		wheel.size = Vector2(ts * 0.2, ts * 0.2)
		wheel.position = Vector2(ts * wx, ts * 0.7)
		wheel.color = Color(0.2, 0.2, 0.2)
		add_child(wheel)

	_label = Label.new()
	_label.text = "Cart"
	_label.position = Vector2(0, -14)
	_label.add_theme_font_size_override("font_size", 8)
	add_child(_label)

func _on_tick() -> void:
	if vehicle_state == null:
		return
	_try_collect_from_drills()
	_try_deposit_to_chests()
	_move_along_rails()
	_update_label()
	vehicle_state.position = global_position

func _move_along_rails() -> void:
	var stats := VehicleState.get_stats(VehicleState.VehicleType.MINING_CART, vehicle_state.upgrade_level)
	var speed: float = stats["speed"]  # tiles per second
	var tiles_per_tick := speed * Constants.TICK_INTERVAL

	_progress += tiles_per_tick

	if _progress >= 1.0:
		_progress -= 1.0
		# Advance to next tile
		var next := _get_next_rail_tile()
		if next == Vector2i(-9999, -9999):
			# Dead end — reverse
			vehicle_state.direction = 1 - vehicle_state.direction
			next = _get_next_rail_tile()
			if next == Vector2i(-9999, -9999):
				_moving = false
				return
		_tile_pos = next
		_moving = true

	# Interpolate position
	var target_pixel := _tile_to_pixel(_tile_pos)
	global_position = target_pixel

func _get_next_rail_tile() -> Vector2i:
	var dir_vec := Vector2i(1, 0) if vehicle_state.direction == 0 else Vector2i(-1, 0)
	var candidate := _tile_pos + dir_vec
	var block := WorldManager.get_block(candidate)
	if block != null and block.tile_id == "rail":
		return candidate
	# Try vertical rails (going down or up)
	for try_dir in [Vector2i(0, 1), Vector2i(0, -1)]:
		var vert := _tile_pos + try_dir
		var vb := WorldManager.get_block(vert)
		if vb != null and vb.tile_id == "rail":
			return vert
	return Vector2i(-9999, -9999)

func _try_collect_from_drills() -> void:
	# Check all 4 adjacent tiles for mining drills with output
	var cargo_total := 0
	for slot in vehicle_state.cargo:
		cargo_total += slot["count"]
	if cargo_total >= vehicle_state.max_cargo:
		return

	for offset in [Vector2i(0, -1), Vector2i(0, 1), Vector2i(-1, 0), Vector2i(1, 0)]:
		var neighbor := _tile_pos + offset
		var ms := _get_machine_at(neighbor)
		if ms == null:
			continue
		if ms.machine_type not in ["mining_drill_mk1", "mining_drill_mk2"]:
			continue
		var out := ms.get_output(0)
		if out.is_empty():
			continue
		var take := min(out["count"], vehicle_state.max_cargo - cargo_total)
		if take <= 0:
			continue
		vehicle_state.add_cargo(out["item"], take)
		var new_count := out["count"] - take
		if new_count <= 0:
			ms.set_output(0, "", 0)
		else:
			ms.set_output(0, out["item"], new_count)
		cargo_total += take

func _try_deposit_to_chests() -> void:
	if vehicle_state.cargo.is_empty():
		return
	for offset in [Vector2i(0, -1), Vector2i(0, 1), Vector2i(-1, 0), Vector2i(1, 0)]:
		var neighbor := _tile_pos + offset
		var ms := _get_machine_at(neighbor)
		if ms == null:
			continue
		if ms.machine_type not in ["wooden_chest", "iron_chest"]:
			continue
		# Deposit all cargo to chest
		var slot_count := 20 if ms.machine_type == "wooden_chest" else 40
		var storage: Array = ms.custom.get("storage", [])
		for cargo_slot in vehicle_state.cargo.duplicate():
			var item_id: String = cargo_slot["item"]
			var count: int = cargo_slot["count"]
			# Find existing stack
			var added := 0
			for chest_slot in storage:
				if chest_slot["item"] == item_id and chest_slot["count"] < 500:
					var add := min(500 - chest_slot["count"], count)
					chest_slot["count"] += add
					added += add
					count -= add
					if count <= 0:
						break
			# New slot if space
			if count > 0 and storage.size() < slot_count:
				storage.append({ "item": item_id, "count": count })
				added += count
				count = 0
			# Update cargo
			cargo_slot["count"] -= added
		vehicle_state.cargo = vehicle_state.cargo.filter(func(s): return s["count"] > 0)
		ms.custom["storage"] = storage

func _get_machine_at(world_tile: Vector2i) -> MachineState:
	var chunk_coord := ChunkCoords.world_to_chunk(world_tile)
	var chunk := WorldManager.loaded_chunks.get(chunk_coord) as ChunkData
	if chunk == null:
		return null
	var local := ChunkCoords.world_to_local(world_tile)
	return chunk.machines.get(local)

func _tile_to_pixel(tile: Vector2i) -> Vector2:
	return Vector2(tile.x * Constants.TILE_SIZE, tile.y * Constants.TILE_SIZE)

func _update_label() -> void:
	var total := 0
	for slot in vehicle_state.cargo:
		total += slot["count"]
	_label.text = "Cart [%d/%d]" % [total, vehicle_state.max_cargo]
