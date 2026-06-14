extends Node

const MachineState = preload("res://scripts/core/MachineState.gd")
const ChunkData = preload("res://scripts/core/ChunkData.gd")
const Constants = preload("res://scripts/core/Constants.gd")
const BeltProcessor = preload("res://scripts/systems/BeltProcessor.gd")
const MachineProcessor = preload("res://scripts/systems/MachineProcessor.gd")

signal tick_completed
signal machine_updated(world_tile: Vector2i, ms: MachineState)

var _accumulator: float = 0.0
var _tick_count: int = 0

func _process(delta: float) -> void:
	if GameManager.state != GameManager.State.PLAYING:
		return
	_accumulator += delta
	while _accumulator >= Constants.TICK_INTERVAL:
		_accumulator -= Constants.TICK_INTERVAL
		_run_tick()

func _run_tick() -> void:
	_tick_count += 1
	var dt := Constants.TICK_INTERVAL

	# 1. Balance power networks
	PowerManager.tick()

	# 2. Process all active machines
	_tick_machines(dt)

	# 3. Advance belt items
	BeltProcessor.tick_belts(WorldManager.active_chunk_coords, dt)

	# 4. Drain machine output buffers onto adjacent belts/chests
	_push_machine_outputs()

	emit_signal("tick_completed")

func _tick_machines(dt: float) -> void:
	for coord in WorldManager.active_chunk_coords:
		var chunk := WorldManager.loaded_chunks.get(coord) as ChunkData
		if chunk == null:
			continue
		var origin: Vector2i = coord * Constants.CHUNK_SIZE
		for local in chunk.machines:
			var ms: MachineState = chunk.machines[local]
			var world_tile: Vector2i = origin + local
			MachineProcessor.process_machine(ms, world_tile, dt)

func _push_machine_outputs() -> void:
	for coord in WorldManager.active_chunk_coords:
		var chunk := WorldManager.loaded_chunks.get(coord) as ChunkData
		if chunk == null:
			continue
		var origin: Vector2i = coord * Constants.CHUNK_SIZE
		for local in chunk.machines:
			var ms: MachineState = chunk.machines[local]
			# Belts and chests have no output buffer to drain
			if ms.machine_type in ["conveyor_belt", "fast_belt", "wooden_chest", "iron_chest"]:
				continue
			var world_tile: Vector2i = origin + local
			BeltProcessor.push_machine_output(world_tile, ms, 0)

func get_tick_count() -> int:
	return _tick_count
