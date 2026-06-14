class_name BeltProcessor

# Direction vectors: East, South, West, North
const DIR_VECTORS := [Vector2i(1, 0), Vector2i(0, 1), Vector2i(-1, 0), Vector2i(0, -1)]

static func tick_belts(active_chunks: Array, dt: float) -> void:
	# Collect all belt machines across active chunks
	var belts := []  # Array of { tile: Vector2i, ms: MachineState }
	for coord in active_chunks:
		var chunk := WorldManager.loaded_chunks.get(coord) as ChunkData
		if chunk == null:
			continue
		for local in chunk.machines:
			var ms: MachineState = chunk.machines[local]
			if ms.machine_type in ["conveyor_belt", "fast_belt"]:
				var world_tile := coord * Constants.CHUNK_SIZE + local
				belts.append({ "tile": world_tile, "ms": ms })

	# Tick each belt segment's items forward
	for entry in belts:
		var ms: MachineState = entry["ms"]
		var speed := 3.0 if ms.machine_type == "fast_belt" else 1.0
		_advance_belt_items(ms, speed, dt)

	# Push items from belt ends to adjacent belts/machines
	for entry in belts:
		_push_belt_outputs(entry["tile"], entry["ms"])

static func _advance_belt_items(ms: MachineState, speed: float, dt: float) -> void:
	var items := ms.belt_items
	if items.is_empty():
		return
	const SPACING := 0.35
	# Move from front (highest pos) to back so items don't stack through each other
	for i in range(items.size() - 1, -1, -1):
		var item: Dictionary = items[i]
		var target := item["pos"] + speed * dt
		# Don't overtake the item ahead (lower index = further along)
		if i + 1 < items.size():
			target = min(target, items[i + 1]["pos"] - SPACING)
		target = min(target, 1.0)  # 1.0 = end of this belt tile
		item["pos"] = target

static func _push_belt_outputs(world_tile: Vector2i, ms: MachineState) -> void:
	if ms.belt_items.is_empty():
		return
	var last: Dictionary = ms.belt_items[ms.belt_items.size() - 1]
	if last["pos"] < 1.0:
		return  # Not at end yet

	# Try to push to the next machine in this belt's direction
	var next_tile := world_tile + DIR_VECTORS[ms.direction]
	var pushed := _try_push_to(last["item"], next_tile, ms.direction)
	if pushed:
		ms.belt_items.pop_back()

static func _try_push_to(item_id: String, target_tile: Vector2i, from_dir: int) -> bool:
	var target_ms := _get_machine_state(target_tile)
	if target_ms == null:
		return false

	match target_ms.machine_type:
		"conveyor_belt", "fast_belt":
			# Insert at the start of the next belt if there is room
			if target_ms.belt_items.is_empty() or target_ms.belt_items[0]["pos"] > 0.35:
				target_ms.belt_items.insert(0, { "item": item_id, "pos": 0.0 })
				return true

		"stone_furnace", "electric_furnace":
			# Deliver to input slot 0 (ore)
			var leftover := target_ms.add_to_input(0, item_id, 1, 50)
			return leftover == 0

		"assembler_mk1":
			# Deliver to the first input slot that accepts this item type
			var recipe_id: String = target_ms.custom.get("recipe_id", "")
			if recipe_id.is_empty():
				return false
			var recipe := CraftingManager.get_recipe(recipe_id)
			if recipe == null:
				return false
			for i in recipe.inputs.size():
				if recipe.inputs[i]["item"] == item_id:
					var leftover := target_ms.add_to_input(i, item_id, 1, 50)
					return leftover == 0
			return false

		"wooden_chest", "iron_chest":
			# Add directly to chest storage dictionary
			var slot_count := 20 if target_ms.machine_type == "wooden_chest" else 40
			var leftover := _chest_add(target_ms, item_id, 1, slot_count)
			return leftover == 0

	return false

static func _chest_add(ms: MachineState, item_id: String, count: int, max_slots: int) -> int:
	var storage: Array = ms.custom.get("storage", [])
	# Fill existing stacks of the same item first
	for slot in storage:
		if slot["item"] == item_id and slot["count"] < 500:
			var add := min(500 - slot["count"], count)
			slot["count"] += add
			count -= add
			if count <= 0:
				ms.custom["storage"] = storage
				return 0
	# Open new slots for the remainder
	while storage.size() < max_slots and count > 0:
		var add := min(500, count)
		storage.append({ "item": item_id, "count": add })
		count -= add
	ms.custom["storage"] = storage
	return count

static func _get_machine_state(world_tile: Vector2i) -> MachineState:
	var chunk_coord := ChunkCoords.world_to_chunk(world_tile)
	var chunk := WorldManager.loaded_chunks.get(chunk_coord) as ChunkData
	if chunk == null:
		return null
	var local := ChunkCoords.world_to_local(world_tile)
	return chunk.machines.get(local) as MachineState

# Push one item from a machine's output slot onto the adjacent belt or chest.
# Called once per tick by SimulationManager after machine processing.
static func push_machine_output(world_tile: Vector2i, ms: MachineState, slot: int = 0) -> bool:
	var out := ms.get_output(slot)
	if out.is_empty():
		return false
	var next_tile := world_tile + DIR_VECTORS[ms.direction]
	var pushed := _try_push_to(out["item"], next_tile, ms.direction)
	if pushed:
		var new_count := out["count"] - 1
		if new_count <= 0:
			ms.set_output(slot, "", 0)
		else:
			ms.set_output(slot, out["item"], new_count)
		return true
	return false
