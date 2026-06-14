class_name PowerNetwork

const Constants = preload("res://scripts/core/Constants.gd")

var chunk_coord: Vector2i
var supply_kw: float = 0.0
var demand_kw: float = 0.0
var stored_kwh: float = 0.0
var capacity_kwh: float = 0.0
var _ratio: float = 1.0

# Registered machine positions in this network
var generators: Dictionary = {}   # world_tile Vector2i -> supply_kw float
var consumers: Dictionary = {}    # world_tile Vector2i -> demand_kw float
var batteries: Dictionary = {}    # world_tile Vector2i -> capacity_kwh float

func _init(coord: Vector2i) -> void:
	chunk_coord = coord

func clear() -> void:
	generators.clear()
	consumers.clear()
	batteries.clear()
	supply_kw = 0.0
	demand_kw = 0.0
	capacity_kwh = 0.0
	stored_kwh = 0.0

func register_generator(tile: Vector2i, kw: float) -> void:
	generators[tile] = kw
	_recalc()

func register_consumer(tile: Vector2i, kw: float) -> void:
	consumers[tile] = kw
	_recalc()

func register_battery(tile: Vector2i, kwh: float) -> void:
	batteries[tile] = kwh
	_recalc()

func unregister(tile: Vector2i) -> void:
	generators.erase(tile)
	consumers.erase(tile)
	batteries.erase(tile)
	_recalc()

func _recalc() -> void:
	supply_kw = 0.0
	for kw in generators.values():
		supply_kw += kw
	demand_kw = 0.0
	for kw in consumers.values():
		demand_kw += kw
	capacity_kwh = 0.0
	for kwh in batteries.values():
		capacity_kwh += kwh

func tick() -> float:
	# Returns the power ratio (0.0–1.0) for this tick
	var net_kw := supply_kw - demand_kw
	var dt := Constants.TICK_INTERVAL

	if net_kw > 0:
		# Surplus: charge batteries
		stored_kwh = min(stored_kwh + net_kw * dt, capacity_kwh)
		_ratio = 1.0
	elif net_kw < 0:
		# Deficit: draw from batteries
		var deficit_kwh := -net_kw * dt
		if stored_kwh >= deficit_kwh:
			stored_kwh -= deficit_kwh
			_ratio = 1.0
		else:
			# Partial power: ratio based on what's available
			var available_kw := supply_kw + stored_kwh / dt
			stored_kwh = 0.0
			_ratio = clamp(available_kw / max(demand_kw, 0.001), 0.0, 1.0)
	else:
		_ratio = 1.0 if demand_kw == 0.0 else (supply_kw / max(demand_kw, 0.001))

	_ratio = clamp(_ratio, 0.0, 1.0)
	return _ratio

func get_ratio() -> float:
	return _ratio

func get_summary() -> String:
	return "%.1f kW / %.1f kW | %.2f kWh stored" % [supply_kw, demand_kw, stored_kwh]
