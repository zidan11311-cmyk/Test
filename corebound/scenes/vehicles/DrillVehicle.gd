class_name DrillVehicle
extends BaseVehicle

var GRAVITY := Constants.PLAYER_GRAVITY
const JUMP_VEL := -380.0

var _stats: Dictionary
var _drill_accumulator: float = 0.0
var _face_dir: int = 1   # 1=right, -1=left
var _body_rect: ColorRect
var _drill_rect: ColorRect
var _fuel_bar: ColorRect
var _hp_bar: ColorRect
var _distance_traveled: float = 0.0
var _last_pos: Vector2

func _build_visuals() -> void:
	_stats = VehicleState.get_stats(VehicleState.VehicleType.DRILL_VEHICLE, vehicle_state.upgrade_level)
	_last_pos = global_position

	var ts := Constants.TILE_SIZE

	# Body
	_body_rect = ColorRect.new()
	_body_rect.size = Vector2(ts * 1.5, ts)
	_body_rect.position = Vector2(-ts * 0.75, -ts)
	_body_rect.color = Color(0.4, 0.55, 0.7)
	add_child(_body_rect)

	# Drill bit (front protrusion)
	_drill_rect = ColorRect.new()
	_drill_rect.size = Vector2(ts * 0.5, ts * 0.6)
	_drill_rect.position = Vector2(ts * 0.75, -ts * 0.8)
	_drill_rect.color = Color(0.7, 0.6, 0.3)
	add_child(_drill_rect)

	# Fuel bar (yellow, bottom)
	_fuel_bar = ColorRect.new()
	_fuel_bar.size = Vector2(ts * 1.5, 4)
	_fuel_bar.position = Vector2(-ts * 0.75, 2)
	_fuel_bar.color = Color(0.9, 0.8, 0.1)
	add_child(_fuel_bar)

	# HP bar (red, above body)
	_hp_bar = ColorRect.new()
	_hp_bar.size = Vector2(ts * 1.5, 4)
	_hp_bar.position = Vector2(-ts * 0.75, -ts - 6)
	_hp_bar.color = Color(0.9, 0.2, 0.1)
	add_child(_hp_bar)

	# Collision shape
	var col := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(ts * 1.5, ts)
	col.shape = shape
	col.position = Vector2(0, -ts * 0.5)
	add_child(col)

func _physics_process(delta: float) -> void:
	if not _is_player_mounted or GameManager.state != GameManager.State.PLAYING:
		return

	_apply_gravity(delta)
	_apply_movement(delta)
	_drill_ahead(delta)
	_drain_fuel(delta)
	_update_visuals()
	move_and_slide()
	_save_position()

	# Dismount check
	if Input.is_action_just_pressed("interact"):
		var player := get_tree().get_first_node_in_group("player")
		if player:
			dismount(player)

func _apply_gravity(delta: float) -> void:
	if not is_on_floor():
		velocity.y += GRAVITY * delta
		velocity.y = min(velocity.y, 800.0)
	else:
		velocity.y = 0.0

func _apply_movement(delta: float) -> void:
	var axis := InputManager.get_move_axis()
	var spd: float = _stats.get("speed", 120.0)
	velocity.x = axis * spd

	if axis > 0.05:
		_face_dir = 1
		_flip_drill(1)
	elif axis < -0.05:
		_face_dir = -1
		_flip_drill(-1)

	if InputManager.consume_jump() and is_on_floor():
		velocity.y = JUMP_VEL

	# Track distance for fuel
	var moved := (global_position - _last_pos).length()
	_distance_traveled += moved
	_last_pos = global_position

func _flip_drill(dir: int) -> void:
	if _drill_rect == null or _body_rect == null:
		return
	var ts := float(Constants.TILE_SIZE)
	if dir > 0:
		_drill_rect.position = Vector2(ts * 0.75, -ts * 0.8)
	else:
		_drill_rect.position = Vector2(-ts * 1.25, -ts * 0.8)

func _drill_ahead(delta: float) -> void:
	if vehicle_state.fuel <= 0:
		return

	var dps: float = _stats.get("drill_dps", 90.0)
	# Tile directly in front of the drill
	var drill_tile_offset := Vector2i(_face_dir, 0)
	var center_tile := ChunkCoords.pixel_to_tile(Vector2i(int(global_position.x), int(global_position.y - Constants.TILE_SIZE * 0.5)))
	var target_tile := center_tile + drill_tile_offset

	var block := WorldManager.get_block(target_tile)
	if block == null or block.is_air() or block.tile_id == "rail":
		_drill_accumulator = 0.0
		return

	_drill_accumulator += dps * delta
	if _drill_accumulator >= block.max_hp:
		_drill_accumulator = 0.0
		WorldManager.damage_block(target_tile, block.max_hp)
		AudioManager.play_sfx("mine_break")

func _drain_fuel(delta: float) -> void:
	if _distance_traveled > 0:
		var fuel_per_meter: float = _stats.get("fuel_per_meter", 0.01)
		vehicle_state.fuel -= _distance_traveled * fuel_per_meter
		vehicle_state.fuel = max(vehicle_state.fuel, 0.0)
		_distance_traveled = 0.0

	# Refuel from inventory if low
	if vehicle_state.fuel < 1.0 and InventoryManager.has_item("energy_cell", 1):
		InventoryManager.remove_item("energy_cell", 1)
		vehicle_state.fuel += 5.0  # energy_cell fuel value
		vehicle_state.fuel = min(vehicle_state.fuel, vehicle_state.max_fuel)

func _update_visuals() -> void:
	if _fuel_bar:
		var ratio := clamp(vehicle_state.fuel / max(vehicle_state.max_fuel, 1.0), 0.0, 1.0)
		_fuel_bar.size.x = Constants.TILE_SIZE * 1.5 * ratio
	if _hp_bar:
		var ratio := clamp(float(vehicle_state.hp) / float(max(vehicle_state.max_hp, 1)), 0.0, 1.0)
		_hp_bar.size.x = Constants.TILE_SIZE * 1.5 * ratio
