class_name Player
extends CharacterBody2D

var SPEED := Constants.PLAYER_SPEED
var JUMP_VELOCITY := Constants.PLAYER_JUMP_VELOCITY
var GRAVITY := Constants.PLAYER_GRAVITY
var MINE_REACH_PX := Constants.MINE_REACH_TILES * Constants.TILE_SIZE

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

# Death state
var _is_dead: bool = false

# Visual feedback
var _mine_progress_bar: ColorRect
var _sprite: ColorRect   # placeholder art: colored rectangle

# Animation
var _anim_controller: AnimationController

# Phase 6: Art & Animation additions
var _last_mine_tile_id: String = "stone"
var _was_on_floor: bool = false
var _spark_timer: float = 0.0

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

	# AnimationController
	_anim_controller = AnimationController.new(_sprite)

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

	# Connect block changed signal for mining particles
	WorldManager.block_changed.connect(_on_block_changed)

	# Restore position from save
	if InventoryManager.player_state:
		global_position = InventoryManager.player_state.position

	# Show tutorial hint for mining on first frame
	await get_tree().process_frame
	var tutorial := get_tree().get_first_node_in_group("tutorial")
	if tutorial:
		tutorial.show_hint("mine")

func _physics_process(delta: float) -> void:
	if GameManager.state != GameManager.State.PLAYING:
		return

	# Death check
	if InventoryManager.player_state.hp <= 0:
		_on_player_death()
		return

	# Skip player movement while mounted in a vehicle
	if not visible:
		return

	_apply_gravity(delta)
	_apply_movement()

	if InputManager.consume_jump() and is_on_floor():
		velocity.y = JUMP_VELOCITY
		AudioManager.play_sfx("jump")

	# Update animation before moving
	_anim_controller.update(delta, velocity, is_on_floor(), _mining_target != Vector2i(-9999, -9999), not visible)

	move_and_slide()

	# Landing dust effect
	if not _was_on_floor and is_on_floor():
		DustParticles.spawn(get_parent(), global_position)
		AudioManager.play_sfx("land")
	_was_on_floor = is_on_floor()

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
		_last_mine_tile_id = block.tile_id

func _stop_mining() -> void:
	_mining_target = Vector2i(-9999, -9999)
	_mine_accumulator = 0.0
	_mine_progress_bar.visible = false
	_spark_timer = 0.0

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

	# Ore spark particles every 0.1s while mining an ore tile
	if _last_mine_tile_id.ends_with("_ore"):
		_spark_timer += delta
		if _spark_timer >= 0.1:
			_spark_timer = 0.0
			var spark_pos := Vector2(
				_mining_target.x * Constants.TILE_SIZE + Constants.TILE_SIZE * 0.5,
				_mining_target.y * Constants.TILE_SIZE + Constants.TILE_SIZE * 0.5
			)
			SparkParticles.spawn(get_parent(), spark_pos)

	if _mine_accumulator >= block.max_hp:
		var broke := WorldManager.damage_block(_mining_target, block.max_hp)
		if broke:
			AudioManager.play_sfx("mine_break")
			_stop_mining()
	else:
		AudioManager.play_sfx("mine_tick")

func _on_block_changed(world_tile: Vector2i, new_tile_id: String) -> void:
	if new_tile_id == "air" or new_tile_id == "":
		var world_pos := Vector2(
			world_tile.x * Constants.TILE_SIZE + Constants.TILE_SIZE * 0.5,
			world_tile.y * Constants.TILE_SIZE + Constants.TILE_SIZE * 0.5
		)
		MiningParticles.spawn(get_parent(), world_pos, _last_mine_tile_id)
		# Tutorial: after first block is broken, hint about crafting
		var tutorial := get_tree().get_first_node_in_group("tutorial")
		if tutorial:
			tutorial.show_hint("craft")

func _on_player_death() -> void:
	if _is_dead:
		return
	_is_dead = true
	visible = false
	AudioManager.play_sfx("death")
	SettingsManager.trigger_haptic(50)
	var game_over := get_tree().get_first_node_in_group("game_over_screen")
	if game_over:
		game_over.show_game_over(get_depth_meters())

func take_damage(amount: int) -> void:
	if _is_dead:
		return
	InventoryManager.player_state.hp -= amount
	InventoryManager.player_state.hp = max(0, InventoryManager.player_state.hp)
	AudioManager.play_sfx("hurt")
	SettingsManager.trigger_haptic(20)
	if _anim_controller:
		_anim_controller.trigger_hurt()

func respawn() -> void:
	_is_dead = false
	visible = true
	_stop_mining()

func get_depth_meters() -> float:
	# Each tile is 32px; we define 2.5 tiles = 1 meter (arbitrary but readable)
	return (global_position.y / Constants.TILE_SIZE) / 2.5

func set_pickaxe_dps(dps: float) -> void:
	_pickaxe_dps = dps
