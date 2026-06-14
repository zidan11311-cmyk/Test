extends Node2D

@onready var tilemap: TileMapLayer = $TileMapLayer

var _machine_nodes: Dictionary = {}  # Vector2i world_tile -> MachineNode
var _vehicle_nodes: Dictionary = {}  # VehicleState -> Node

func _ready() -> void:
	# Add BackgroundLayer behind everything
	var bg := preload("res://scenes/world/BackgroundLayer.tscn").instantiate()
	add_child(bg)
	move_child(bg, 0)  # behind everything

	# Generate a new world seed if starting fresh
	if WorldManager.world_seed == 0:
		WorldManager.world_seed = randi()
	WorldManager.initialize(WorldManager.world_seed, tilemap)

	# Push tilemap behind machines and entities
	tilemap.z_index = -50

	# Connect machine lifecycle signals
	WorldManager.machine_placed.connect(_on_machine_placed)
	WorldManager.machine_removed.connect(_on_machine_removed)

	# Spawn machine nodes for any chunks that load (including saved ones)
	WorldManager.chunk_loaded.connect(_on_chunk_loaded)

	# Connect vehicle lifecycle signals
	WorldManager.vehicle_spawned.connect(_on_vehicle_spawned)
	WorldManager.vehicle_despawned.connect(_on_vehicle_despawned)

	# Connect block changed signal for ambient FX hook
	WorldManager.block_changed.connect(_on_block_changed_world)

	# Load player
	var player_scene := preload("res://scenes/player/Player.tscn")
	var player := player_scene.instantiate()
	add_child(player)

	# Initial chunk load around spawn
	WorldManager.update_active_chunks(player.global_position)

func _process(_delta: float) -> void:
	pass  # chunk updates are handled by Player._physics_process

func _on_block_changed_world(_world_tile: Vector2i, _new_tile_id: String) -> void:
	# Hook for future ambient world FX (e.g. lava glow, etc.)
	# Particle spawning on break is handled by Player._on_block_changed.
	pass

func _on_machine_placed(world_tile: Vector2i, ms: MachineState) -> void:
	var node := preload("res://scenes/machines/MachineNode.tscn").instantiate()
	node.setup(world_tile, ms)
	add_child(node)
	_machine_nodes[world_tile] = node

func _on_machine_removed(world_tile: Vector2i) -> void:
	if _machine_nodes.has(world_tile):
		_machine_nodes[world_tile].queue_free()
		_machine_nodes.erase(world_tile)

func _on_chunk_loaded(coord: Vector2i) -> void:
	var chunk = WorldManager.loaded_chunks.get(coord, null)
	if chunk == null:
		return
	for world_tile in chunk.machines:
		# Skip if a node already exists for this tile (avoid duplicates)
		if _machine_nodes.has(world_tile):
			continue
		var ms: MachineState = chunk.machines[world_tile]
		var node := preload("res://scenes/machines/MachineNode.tscn").instantiate()
		node.setup(world_tile, ms)
		add_child(node)
		_machine_nodes[world_tile] = node

func _on_vehicle_spawned(_vehicle_node_ignored, vs: VehicleState) -> void:
	var scene: PackedScene
	match vs.vehicle_type:
		VehicleState.VehicleType.MINING_CART:
			scene = preload("res://scenes/vehicles/MiningCart.tscn")
		VehicleState.VehicleType.DRILL_VEHICLE:
			scene = preload("res://scenes/vehicles/DrillVehicle.tscn")
		VehicleState.VehicleType.HOVER_VEHICLE:
			scene = preload("res://scenes/vehicles/HoverVehicle.tscn")
		_:
			push_error("World: unknown vehicle_type %d" % vs.vehicle_type)
			return

	var node := scene.instantiate()
	node.setup(vs)

	# Connect optional destruction signal
	if node.has_signal("vehicle_destroyed"):
		node.vehicle_destroyed.connect(func():
			_vehicle_nodes.erase(vs)
			node.queue_free()
		)

	node.add_to_group("vehicles")
	add_child(node)
	_vehicle_nodes[vs] = node

func _on_vehicle_despawned(vs: VehicleState) -> void:
	if _vehicle_nodes.has(vs):
		_vehicle_nodes[vs].queue_free()
		_vehicle_nodes.erase(vs)

func get_vehicle_node(vs: VehicleState) -> Node:
	return _vehicle_nodes.get(vs)
