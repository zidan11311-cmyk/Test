extends Node

signal inventory_changed()
signal item_added(item_id: String, count: int)
signal item_removed(item_id: String, count: int)

var player_state: PlayerState

func _ready() -> void:
	player_state = PlayerState.new()

func initialize(ps: PlayerState) -> void:
	player_state = ps
	emit_signal("inventory_changed")

func add_item(item_id: String, count: int) -> int:
	# Returns leftover that couldn't fit
	if item_id.is_empty() or count <= 0:
		return count

	var stack_max := _get_stack_max(item_id)
	var remaining := count

	# First pass: fill existing stacks of the same item
	for i in Constants.INVENTORY_SIZE:
		var slot: Dictionary = player_state.inventory[i]
		if slot.is_empty():
			continue
		if slot["item"] != item_id:
			continue
		var space := stack_max - slot["count"]
		if space <= 0:
			continue
		var add := min(space, remaining)
		slot["count"] += add
		remaining -= add
		if remaining <= 0:
			break

	# Second pass: fill empty slots
	if remaining > 0:
		for i in Constants.INVENTORY_SIZE:
			var slot: Dictionary = player_state.inventory[i]
			if not slot.is_empty():
				continue
			var add := min(stack_max, remaining)
			player_state.inventory[i] = { "item": item_id, "count": add }
			remaining -= add
			if remaining <= 0:
				break

	var added := count - remaining
	if added > 0:
		emit_signal("item_added", item_id, added)
		emit_signal("inventory_changed")

	return remaining  # leftover

func remove_item(item_id: String, count: int) -> bool:
	if not has_item(item_id, count):
		return false
	var remaining := count
	for i in Constants.INVENTORY_SIZE:
		var slot: Dictionary = player_state.inventory[i]
		if slot.is_empty() or slot["item"] != item_id:
			continue
		var take := min(slot["count"], remaining)
		slot["count"] -= take
		remaining -= take
		if slot["count"] <= 0:
			player_state.inventory[i] = {}
		if remaining <= 0:
			break
	emit_signal("item_removed", item_id, count)
	emit_signal("inventory_changed")
	return true

func has_item(item_id: String, count: int = 1) -> bool:
	return count_item(item_id) >= count

func count_item(item_id: String) -> int:
	var total := 0
	for slot in player_state.inventory:
		if slot is Dictionary and not slot.is_empty() and slot["item"] == item_id:
			total += slot["count"]
	return total

func get_slot(index: int) -> Dictionary:
	if index < 0 or index >= Constants.INVENTORY_SIZE:
		return {}
	return player_state.inventory[index]

func set_slot(index: int, item_id: String, count: int) -> void:
	if index < 0 or index >= Constants.INVENTORY_SIZE:
		return
	if item_id.is_empty() or count <= 0:
		player_state.inventory[index] = {}
	else:
		player_state.inventory[index] = { "item": item_id, "count": count }
	emit_signal("inventory_changed")

func swap_slots(a: int, b: int) -> void:
	var temp: Dictionary = player_state.inventory[a]
	player_state.inventory[a] = player_state.inventory[b]
	player_state.inventory[b] = temp
	emit_signal("inventory_changed")

func get_active_hotbar_item() -> Dictionary:
	var idx := player_state.hotbar_selection
	# Hotbar uses the first HOTBAR_SIZE inventory slots directly
	return player_state.inventory[idx]

func get_all_counts() -> Dictionary:
	var counts := {}
	for slot in player_state.inventory:
		if slot is Dictionary and not slot.is_empty():
			var id: String = slot["item"]
			counts[id] = counts.get(id, 0) + slot["count"]
	return counts

func _get_stack_max(item_id: String) -> int:
	var data := CraftingManager.get_item_definition(item_id)
	if data != null:
		return data.stack_max
	return Constants.STACK_MAX_RESOURCE
