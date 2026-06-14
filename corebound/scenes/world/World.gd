extends Node2D

@onready var tilemap: TileMapLayer = $TileMapLayer

var _machine_nodes: Dictionary = {}  # Vector2i world_tile -> MachineNode

func _ready() -> void:
	# Generate a new world seed if starting fresh
	if WorldManager.world_seed == 0:
		WorldManager.world_seed = randi()
	WorldManager.initialize(WorldManager.world_seed, tilemap)

	# Connect machine lifecycle signals
	WorldManager.machine_placed.connect(_on_machine_placed)
	WorldManager.machine_removed.connect(_on_machine_removed)

	# Spawn machine nodes for any chunks that load (including saved ones)
	WorldManager.chunk_loaded.connect(_on_chunk_loaded)

	# Load player
	var player_scene := preload("res://scenes/player/Player.tscn")
	var player := player_scene.instantiate()
	add_child(player)

	# Initial chunk load around spawn
	WorldManager.update_active_chunks(player.global_position)

func _process(_delta: float) -> void:
	pass  # chunk updates are handled by Player._physics_process

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
