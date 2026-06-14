class_name Player
extends CharacterBody2D

const SPEED := Constants.PLAYER_SPEED
const JUMP_VELOCITY := Constants.PLAYER_JUMP_VELOCITY
const GRAVITY := Constants.PLAYER_GRAVITY
const MINE_REACH_PX := Constants.MINE_REACH_TILES * Constants.TILE_SIZE

# Mining state
var _mining_target: Vector2i = Vector2i(-9999, -9999)
var _mine_accumulator: float = 0.0
var _pickaxe_dps: float = 30.0   # damage per second; upgraded via gear

# Build mode state
var _build_mode: bool = false
var _build_machine_type: String = ""
var _build_direction: int = 0

# Vehicle state
var _is_mounted: bool = false

# Visual feedback
var _mine_progress_bar: ColorRect
var _sprite: ColorRect   # placeholder art: colored rectangle

signal depth_changed(new_depth_tiles: float)

func _ready() -> void:
	add_to_group("player")
	add_to_group("camera")   # so InputManager can find the camera

	# Placeholder sprite (32×48 colored rectangle)
	_sprite = ColorRect.new()
	_sprite.size = Vector2(Constants.TILE_SIZE, Constants.TILE_SIZE * 1.5)
	_sprite.position = Vector2(-Constants.TILE_SIZE * 0.5, -Constants.TILE_SIZE * 1.5)
	_sprite.color = Color(0.25, 0.55, 0.95)
	add_child(_sprite)

	# Mining progress bar (thin red bar above player)
	_mine_progress_bar = ColorRect.new()
	_mine_progress_bar.size = Vector2(Constants.TILE_SIZE, 4)
	_mine_progress_bar.position = Vector2(-Constants.TILE_SIZE * 0.5, -Constants.TILE_SIZE * 1.5 - 8)
	_mine_progress_bar.color = Color(0.9, 0.2, 0.1)
	_mine_progress_bar.visible = false
	add_child(_mine_progress_bar)

	# Collision shape
	var col := CollisionShape2D.new()
	var shape := CapsuleShape2D.new()
	shape.radius = Constants.TILE_SIZE * 0.45
	shape.height = Constants.TILE_SIZE * 1.4
	col.shape = shape
	col.position = Vector2(0, -Constants.TILE_SIZE * 0.7)
	add_child(col)

	# Connect input signals
	InputManager.tap_world.connect(_on_tap_world)
	InputManager.hold_world.connect(_on_hold_world)
	InputManager.tap_released.connect(_on_tap_released)

	# Restore position from save
	if InventoryManager.player_state:
		global_position = InventoryManager.player_state.position

func _physics_process(delta: float) -> void:
	if GameManager.state != GameManager.State.PLAYING:
		return

	# Skip player movement while mounted in a vehicle
	if not visible:
		return

	_apply_gravity(delta)
	_apply_movement()

	if InputManager.consume_jump() and is_on_floor():
		velocity.y = JUMP_VELOCITY

	move_and_slide()
	_check_vehicle_interact()
	_update_depth_tracking()
	_tick_mining(delta)
	_update_camera_chunks()

func _apply_gravity(delta: float) -> void:
	if not is_on_floor():
		velocity.y += GRAVITY * delta
		velocity.y = min(velocity.y, 800.0)  # terminal velocity

func _apply_movement() -> void:
	var axis := InputManager.get_move_axis()
	velocity.x = axis * SPEED
	# Flip sprite based on direction
	if axis > 0.1:
		_sprite.scale.x = 1.0
	elif axis < -0.1:
		_sprite.scale.x = -1.0

func _update_camera_chunks() -> void:
	WorldManager.update_active_chunks(global_position)

func _update_depth_tracking() -> void:
	var depth_tiles := global_position.y / Constants.TILE_SIZE
	if depth_tiles > InventoryManager.player_state.depth_reached_tiles:
		InventoryManager.player_state.depth_reached_tiles = depth_tiles
		emit_signal("depth_changed", depth_tiles)

func _check_vehicle_interact() -> void:
	# Already mounted — nothing to do here
	if not visible:
		return

	if not Input.is_action_just_pressed("interact"):
		return

	var nearest := _find_nearest_vehicle()
	if nearest == null:
		return

	# DrillVehicle / HoverVehicle: mount the player
	if nearest.has_method("mount"):
		nearest.mount(self)
	# MiningCart: open its inventory (if it supports it)
	elif nearest.has_method("open_inventory"):
		nearest.open_inventory()

func _find_nearest_vehicle() -> Node:
	var interact_range := 2.0 * Constants.TILE_SIZE
	var best_node: Node = null
	var best_dist := interact_range + 1.0

	for vehicle in get_tree().get_nodes_in_group("vehicles"):
		var dist := global_position.distance_to(vehicle.global_position)
		if dist <= interact_range and dist < best_dist:
			best_dist = dist
			best_node = vehicle

	return best_node

func _on_tap_world(world_pos: Vector2) -> void:
	if _build_mode:
		_try_place_machine(world_pos)
	else:
		_try_start_mining(world_pos)

func _on_hold_world(world_pos: Vector2) -> void:
	if _build_mode:
		_try_place_machine(world_pos)
	else:
		_try_start_mining(world_pos)

func _on_tap_released() -> void:
	_stop_mining()

func enter_build_mode(machine_type: String, direction: int) -> void:
	_build_mode = true
	_build_machine_type = machine_type
	_build_direction = direction
	_stop_mining()

func exit_build_mode() -> void:
	_build_mode = false
	_build_machine_type = ""
	_build_direction = 0

func _try_place_machine(world_pos: Vector2) -> void:
	var tile := ChunkCoords.pixel_to_tile(Vector2i(int(world_pos.x), int(world_pos.y)))
	var dist := (world_pos - global_position).length()
	if dist > MINE_REACH_PX:
		return
	if not InventoryManager.has_item(_build_machine_type, 1):
		return
	var placed := WorldManager.place_machine(tile, _build_machine_type, _build_direction)
	if placed:
		InventoryManager.remove_item(_build_machine_type, 1)
		AudioManager.play_sfx("place")

func _try_remove_machine(world_pos: Vector2) -> void:
	var tile := ChunkCoords.pixel_to_tile(Vector2i(int(world_pos.x), int(world_pos.y)))
	var dist := (world_pos - global_position).length()
	if dist > MINE_REACH_PX:
		return
	WorldManager.remove_machine(tile)

func _try_start_mining(world_pos: Vector2) -> void:
	var target_tile := ChunkCoords.pixel_to_tile(Vector2i(int(world_pos.x), int(world_pos.y)))
	var dist := (world_pos - global_position).length()
	if dist > MINE_REACH_PX:
		_stop_mining()
		return
	var block := WorldManager.get_block(target_tile)
	if block == null or block.is_air():
		_stop_mining()
		return
	if target_tile != _mining_target:
		_mining_target = target_tile
		_mine_accumulator = 0.0

func _stop_mining() -> void:
	_mining_target = Vector2i(-9999, -9999)
	_mine_accumulator = 0.0
	_mine_progress_bar.visible = false

func _tick_mining(delta: float) -> void:
	if _mining_target == Vector2i(-9999, -9999):
		return

	var block := WorldManager.get_block(_mining_target)
	if block == null or block.is_air():
		_stop_mining()
		return

	_mine_accumulator += _pickaxe_dps * delta

	# Update visual progress bar
	var progress := clamp(_mine_accumulator / block.max_hp, 0.0, 1.0)
	_mine_progress_bar.visible = true
	_mine_progress_bar.size.x = Constants.TILE_SIZE * progress

	if _mine_accumulator >= block.max_hp:
		var broke := WorldManager.damage_block(_mining_target, block.max_hp)
		if broke:
			AudioManager.play_sfx("mine_break")
			_stop_mining()
	else:
		AudioManager.play_sfx("mine_tick")

func get_depth_meters() -> float:
	# Each tile is 32px; we define 2.5 tiles = 1 meter (arbitrary but readable)
	return (global_position.y / Constants.TILE_SIZE) / 2.5

func set_pickaxe_dps(dps: float) -> void:
	_pickaxe_dps = dps
