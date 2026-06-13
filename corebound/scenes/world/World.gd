extends Node2D

@onready var tilemap: TileMapLayer = $TileMapLayer

func _ready() -> void:
	# Generate a new world seed if starting fresh
	if WorldManager.world_seed == 0:
		WorldManager.world_seed = randi()
	WorldManager.initialize(WorldManager.world_seed, tilemap)

	# Load player
	var player_scene := preload("res://scenes/player/Player.tscn")
	var player := player_scene.instantiate()
	add_child(player)

	# Initial chunk load around spawn
	WorldManager.update_active_chunks(player.global_position)

func _process(_delta: float) -> void:
	pass  # chunk updates are handled by Player._physics_process
