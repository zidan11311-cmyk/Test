extends Node

const PowerNetwork = preload("res://scripts/systems/PowerNetwork.gd")
const MachineState = preload("res://scripts/core/MachineState.gd")
const ChunkData = preload("res://scripts/core/ChunkData.gd")
const ChunkCoords = preload("res://scripts/util/ChunkCoords.gd")
const Constants = preload("res://scripts/core/Constants.gd")

signal power_updated(chunk_coord: Vector2i, ratio: float)

var _networks: Dictionary = {}   # Vector2i chunk_coord -> PowerNetwork

# Power draw (kW) and supply (kW) per machine type
const MACHINE_POWER := {
	"mining_drill_mk1": { "draw": 1.0,  "supply": 0.0 },
	"mining_drill_mk2": { "draw": 2.0,  "supply": 0.0 },
	"conveyor_belt":    { "draw": 0.2,  "supply": 0.0 },
	"fast_belt":        { "draw": 0.4,  "supply": 0.0 },
	"electric_furnace": { "draw": 2.0,  "supply": 0.0 },
	"assembler_mk1":    { "draw": 3.0,  "supply": 0.0 },
	"coal_generator":   { "draw": 0.0,  "supply": 5.0 },
}

func tick() -> void:
	for coord in _networks:
		var net: PowerNetwork = _networks[coord]
		var ratio := net.tick()
		_apply_ratio_to_chunk(coord, ratio)
		emit_signal("power_updated", coord, ratio)

func _apply_ratio_to_chunk(coord: Vector2i, ratio: float) -> void:
	var chunk := WorldManager.loaded_chunks.get(coord) as ChunkData
	if chunk == null:
		return
	for local in chunk.machines:
		var ms: MachineState = chunk.machines[local]
		if _is_electric(ms.machine_type):
			ms.power_ratio = ratio

func register_machine(world_tile: Vector2i, ms: MachineState) -> void:
	var coord := ChunkCoords.world_to_chunk(world_tile)
	var net := _get_or_create_network(coord)
	var power_def: Dictionary = MACHINE_POWER.get(ms.machine_type, {})
	if power_def.is_empty():
		return
	var draw: float = power_def.get("draw", 0.0)
	var supply: float = power_def.get("supply", 0.0)
	if supply > 0.0:
		net.register_generator(world_tile, supply)
	elif draw > 0.0:
		net.register_consumer(world_tile, draw)

func unregister_machine(world_tile: Vector2i, machine_type: String) -> void:
	var coord := ChunkCoords.world_to_chunk(world_tile)
	var net := _networks.get(coord) as PowerNetwork
	if net == null:
		return
	net.unregister(world_tile)

func rebuild_chunk(coord: Vector2i) -> void:
	var net := _get_or_create_network(coord)
	net.clear()
	var chunk := WorldManager.loaded_chunks.get(coord) as ChunkData
	if chunk == null:
		return
	var origin: Vector2i = coord * Constants.CHUNK_SIZE
	for local in chunk.machines:
		var ms: MachineState = chunk.machines[local]
		var world_tile: Vector2i = origin + local
		register_machine(world_tile, ms)

func get_ratio(chunk_coord: Vector2i) -> float:
	var net := _networks.get(chunk_coord) as PowerNetwork
	if net == null:
		return 1.0
	return net.get_ratio()

func get_network(chunk_coord: Vector2i) -> PowerNetwork:
	return _networks.get(chunk_coord)

func _get_or_create_network(coord: Vector2i) -> PowerNetwork:
	if not _networks.has(coord):
		_networks[coord] = PowerNetwork.new(coord)
	return _networks[coord]

func _is_electric(machine_type: String) -> bool:
	var pd: Dictionary = MACHINE_POWER.get(machine_type, {})
	return pd.get("draw", 0.0) > 0.0
