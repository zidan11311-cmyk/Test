class_name HoverVehicle
extends BaseVehicle

const HOVER_HEIGHT := 2.5 * Constants.TILE_SIZE   # pixels above ground
const HOVER_SPEED_VERT := 180.0                    # px/s for hover correction

var _stats: Dictionary
var _body_rect: ColorRect
var _thruster_l: ColorRect
var _thruster_r: ColorRect
var _fuel_bar: ColorRect
var _hp_bar: ColorRect
var _distance_traveled: float = 0.0
var _last_pos: Vector2

func _build_visuals() -> void:
	_stats = VehicleState.get_stats(VehicleState.VehicleType.HOVER_VEHICLE, vehicle_state.upgrade_level)
	_last_pos = global_position
	vehicle_state.max_fuel = _stats.get("fuel_capacity", 15.0) if _stats.has("fuel_capacity") else 15.0

	var ts := Constants.TILE_SIZE

	# Main hull
	_body_rect = ColorRect.new()
	_body_rect.size = Vector2(ts * 2.0, ts * 0.6)
	_body_rect.position = Vector2(-ts, -ts * 0.6)
	_body_rect.color = Color(0.6, 0.3, 0.7)
	add_child(_body_rect)

	# Left thruster
	_thruster_l = ColorRect.new()
	_thruster_l.size = Vector2(ts * 0.3, ts * 0.5)
	_thruster_l.position = Vector2(-ts * 0.9, -ts * 0.1)
	_thruster_l.color = Color(0.9, 0.5, 0.1)
	add_child(_thruster_l)

	# Right thruster
	_thruster_r = ColorRect.new()
	_thruster_r.size = Vector2(ts * 0.3, ts * 0.5)
	_thruster_r.position = Vector2(ts * 0.6, -ts * 0.1)
	_thruster_r.color = Color(0.9, 0.5, 0.1)
	add_child(_thruster_r)

	# Fuel bar
	_fuel_bar = ColorRect.new()
	_fuel_bar.size = Vector2(ts * 2.0, 4)
	_fuel_bar.position = Vector2(-ts, 4)
	_fuel_bar.color = Color(0.2, 0.8, 0.9)
	add_child(_fuel_bar)

	# HP bar
	_hp_bar = ColorRect.new()
	_hp_bar.size = Vector2(ts * 2.0, 4)
	_hp_bar.position = Vector2(-ts, -ts * 0.6 - 6)
	_hp_bar.color = Color(0.9, 0.2, 0.1)
	add_child(_hp_bar)

	# Collision
	var col := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(ts * 2.0, ts * 0.6)
	col.shape = shape
	col.position = Vector2(0, -ts * 0.3)
	add_child(col)

func _physics_process(delta: float) -> void:
	if not _is_player_mounted or GameManager.state != GameManager.State.PLAYING:
		return

	_apply_hover(delta)
	_apply_movement(delta)
	_drain_fuel(delta)
	_update_visuals()
	move_and_slide()
	_save_position()

	if Input.is_action_just_pressed("interact"):
		var player := get_tree().get_first_node_in_group("player")
		if player:
			dismount(player)

func _apply_hover(delta: float) -> void:
	# Cast a ray downward; maintain HOVER_HEIGHT above hit point
	var space := get_world_2d().direct_space_state
	var from := global_position
	var to := global_position + Vector2(0, HOVER_HEIGHT * 2)
	var query := PhysicsRayQueryParameters2D.create(from, to, 1)  # mask = world layer
	var result := space.intersect_ray(query)

	if result.is_empty():
		# Nothing below — float down slowly
		velocity.y = min(velocity.y + 200 * delta, 80.0)
	else:
		var hit_y: float = result["position"].y
		var target_y := hit_y - HOVER_HEIGHT
		var diff := target_y - global_position.y
		velocity.y = clamp(diff * 10.0, -HOVER_SPEED_VERT, HOVER_SPEED_VERT)

func _apply_movement(delta: float) -> void:
	var axis := InputManager.get_move_axis()
	var spd: float = _stats.get("speed", 200.0)
	velocity.x = axis * spd

	var moved := (global_position - _last_pos).length()
	_distance_traveled += moved
	_last_pos = global_position

func _drain_fuel(delta: float) -> void:
	if _distance_traveled > 0:
		var fpm: float = _stats.get("fuel_per_meter", 0.005)
		vehicle_state.fuel -= _distance_traveled * fpm
		vehicle_state.fuel = max(vehicle_state.fuel, 0.0)
		_distance_traveled = 0.0

	# Refuel from inventory if low
	if vehicle_state.fuel < 1.0 and InventoryManager.has_item("energy_cell", 1):
		InventoryManager.remove_item("energy_cell", 1)
		vehicle_state.fuel += 5.0
		vehicle_state.fuel = min(vehicle_state.fuel, vehicle_state.max_fuel)

func is_heat_immune() -> bool:
	var heat_immune = _stats.get("heat_immune", false)
	return _is_player_mounted and heat_immune

func _update_visuals() -> void:
	# Thruster flicker based on velocity
	var thrust_color := Color(0.9, 0.5 + randf() * 0.3, 0.1)
	_thruster_l.color = thrust_color
	_thruster_r.color = thrust_color

	if _fuel_bar:
		var ratio := clamp(vehicle_state.fuel / max(vehicle_state.max_fuel, 1.0), 0.0, 1.0)
		_fuel_bar.size.x = Constants.TILE_SIZE * 2.0 * ratio
	if _hp_bar:
		var ratio := clamp(float(vehicle_state.hp) / float(max(vehicle_state.max_hp, 1)), 0.0, 1.0)
		_hp_bar.size.x = Constants.TILE_SIZE * 2.0 * ratio
