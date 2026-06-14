class_name MachineState

# Machine type IDs match machines.json keys
var machine_type: String = ""
var direction: int = 0          # 0=right, 1=down, 2=left, 3=up (output direction)
var input_slots: Array = []     # Array of { "item": String, "count": int } or {}
var output_slots: Array = []    # same format
var fuel_kwh: float = 0.0       # stored fuel energy (for fuel-based machines)
var progress: float = 0.0       # 0.0–1.0 current operation cycle progress
var power_ratio: float = 1.0    # set by PowerManager each tick (0.0–1.0)
var is_active: bool = false     # true = has work and power
var upgrade_level: int = 1
var belt_items: Array = []      # for conveyor belts: Array of { "item": String, "pos": float }
var custom: Dictionary = {}     # machine-specific extras

func _init(mtype: String = "", dir: int = 0) -> void:
	machine_type = mtype
	direction = dir
	input_slots = [{}]
	output_slots = [{}]

func get_input(slot: int = 0) -> Dictionary:
	if slot >= input_slots.size(): return {}
	return input_slots[slot]

func get_output(slot: int = 0) -> Dictionary:
	if slot >= output_slots.size(): return {}
	return output_slots[slot]

func set_input(slot: int, item_id: String, count: int) -> void:
	while input_slots.size() <= slot:
		input_slots.append({})
	if item_id.is_empty() or count <= 0:
		input_slots[slot] = {}
	else:
		input_slots[slot] = { "item": item_id, "count": count }

func set_output(slot: int, item_id: String, count: int) -> void:
	while output_slots.size() <= slot:
		output_slots.append({})
	if item_id.is_empty() or count <= 0:
		output_slots[slot] = {}
	else:
		output_slots[slot] = { "item": item_id, "count": count }

func add_to_input(slot: int, item_id: String, count: int, max_stack: int = 50) -> int:
	# Returns leftover
	var cur := get_input(slot)
	if cur.is_empty():
		var add: int = min(count, max_stack)
		set_input(slot, item_id, add)
		return count - add
	if cur["item"] != item_id:
		return count
	var space: int = max_stack - (cur["count"] as int)
	var add: int = min(count, space)
	if add > 0:
		set_input(slot, item_id, (cur["count"] as int) + add)
	return count - add

func take_from_output(slot: int, count: int) -> Dictionary:
	var cur := get_output(slot)
	if cur.is_empty(): return {}
	var take: int = min(count, cur["count"] as int)
	var item_id: String = cur["item"]
	var remaining: int = (cur["count"] as int) - take
	if remaining <= 0:
		output_slots[slot] = {}
	else:
		output_slots[slot] = { "item": item_id, "count": remaining }
	return { "item": item_id, "count": take }

func serialize() -> Dictionary:
	return {
		"type": machine_type,
		"dir": direction,
		"in": input_slots,
		"out": output_slots,
		"fuel": fuel_kwh,
		"prog": progress,
		"active": is_active,
		"upgrade": upgrade_level,
		"belt": belt_items,
		"custom": custom,
	}

static func deserialize(d: Dictionary) -> Object:
	var ms = load("res://scripts/core/MachineState.gd").new(d.get("type", ""), d.get("dir", 0))
	ms.input_slots = d.get("in", [{}])
	ms.output_slots = d.get("out", [{}])
	ms.fuel_kwh = d.get("fuel", 0.0)
	ms.progress = d.get("prog", 0.0)
	ms.is_active = d.get("active", false)
	ms.upgrade_level = d.get("upgrade", 1)
	ms.belt_items = d.get("belt", [])
	ms.custom = d.get("custom", {})
	return ms
