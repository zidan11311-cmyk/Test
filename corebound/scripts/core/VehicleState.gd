class_name VehicleState

enum VehicleType { MINING_CART, DRILL_VEHICLE, HOVER_VEHICLE }

var vehicle_type: VehicleType
var upgrade_level: int = 1           # 1, 2, or 3
var position: Vector2                # world pixel position
var direction: int = 0               # 0=right, 1=left (for mining cart); for others: last move direction
var fuel: float = 0.0                # energy cells consumed as fuel (kWh equivalent)
var max_fuel: float = 10.0           # capacity depends on type+upgrade
var cargo: Array = []                # Array of { "item": String, "count": int } — vehicle inventory
var max_cargo: int = 200             # item count
var hp: int = 100
var max_hp: int = 100
var is_player_mounted: bool = false
var drill_active: bool = false
var custom: Dictionary = {}          # type-specific extras

# Upgrade stats by type and level
static func get_stats(vtype: VehicleType, level: int) -> Dictionary:
	match vtype:
		VehicleType.MINING_CART:
			var stats := [
				{ "speed": 4.0, "cargo": 200, "fuel_per_meter": 0.0 },   # Mk1 no fuel
				{ "speed": 6.0, "cargo": 400, "fuel_per_meter": 0.0 },   # Mk2
				{ "speed": 8.0, "cargo": 800, "fuel_per_meter": 0.0 },   # Mk3
			]
			return stats[clamp(level - 1, 0, 2)]
		VehicleType.DRILL_VEHICLE:
			var stats := [
				{ "speed": 120.0, "drill_dps": 90.0, "cargo": 0, "fuel_per_meter": 0.01 },
				{ "speed": 150.0, "drill_dps": 180.0, "cargo": 0, "fuel_per_meter": 0.015 },
				{ "speed": 180.0, "drill_dps": 300.0, "cargo": 0, "fuel_per_meter": 0.02 },
			]
			return stats[clamp(level - 1, 0, 2)]
		VehicleType.HOVER_VEHICLE:
			var stats := [
				{ "speed": 200.0, "cargo": 200, "fuel_per_meter": 0.005, "heat_immune": false },
				{ "speed": 220.0, "cargo": 400, "fuel_per_meter": 0.005, "heat_immune": true },
				{ "speed": 250.0, "cargo": 600, "fuel_per_meter": 0.005, "heat_immune": true },
			]
			return stats[clamp(level - 1, 0, 2)]
	return {}

func serialize() -> Dictionary:
	return {
		"type": vehicle_type,
		"upgrade": upgrade_level,
		"pos": { "x": position.x, "y": position.y },
		"dir": direction,
		"fuel": fuel,
		"max_fuel": max_fuel,
		"cargo": cargo,
		"max_cargo": max_cargo,
		"hp": hp,
		"max_hp": max_hp,
		"custom": custom,
	}

static func deserialize(d: Dictionary) -> Object:
	var vs = load("res://scripts/core/VehicleState.gd").new()
	vs.vehicle_type = d.get("type", VehicleType.MINING_CART)
	vs.upgrade_level = d.get("upgrade", 1)
	var pos: Dictionary = d.get("pos", { "x": 0, "y": 0 })
	vs.position = Vector2(pos["x"], pos["y"])
	vs.direction = d.get("dir", 0)
	vs.fuel = d.get("fuel", 0.0)
	vs.max_fuel = d.get("max_fuel", 10.0)
	vs.cargo = d.get("cargo", [])
	vs.max_cargo = d.get("max_cargo", 200)
	vs.hp = d.get("hp", 100)
	vs.max_hp = d.get("max_hp", 100)
	vs.custom = d.get("custom", {})
	return vs

func add_cargo(item_id: String, count: int) -> int:
	var total: int = 0
	for slot in cargo:
		total += slot["count"] as int
	var space: int = max_cargo - total
	var add: int = min(count, space)
	if add <= 0:
		return count  # all leftover
	# Fill existing stack
	for slot in cargo:
		if slot["item"] == item_id:
			slot["count"] += add
			return count - add
	# New slot
	cargo.append({ "item": item_id, "count": add })
	return count - add

func dump_to_inventory() -> void:
	for slot in cargo:
		InventoryManager.add_item(slot["item"], slot["count"])
	cargo.clear()
