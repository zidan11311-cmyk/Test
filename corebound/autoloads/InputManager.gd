extends Node

const ChunkCoords = preload("res://scripts/util/ChunkCoords.gd")
const Constants = preload("res://scripts/core/Constants.gd")

signal tap_world(world_pos: Vector2)
signal hold_world(world_pos: Vector2)
signal tap_released()

# Joystick value set by VirtualJoystick UI node
var joystick_axis: Vector2 = Vector2.ZERO
var jump_pressed: bool = false
var _jump_consumed: bool = false

# Touch tracking
var _touch_positions: Dictionary = {}   # touch_index -> Vector2 (screen pos)
var _hold_tile: Vector2i = Vector2i(-9999, -9999)
var _hold_timer: float = 0.0
const HOLD_EMIT_INTERVAL := 0.1

func _ready() -> void:
	set_process_unhandled_input(true)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		var e := event as InputEventScreenTouch
		if e.pressed:
			_touch_positions[e.index] = e.position
			_on_tap(e.position)
		else:
			_touch_positions.erase(e.index)
			if _touch_positions.is_empty():
				emit_signal("tap_released")
				_hold_tile = Vector2i(-9999, -9999)
	elif event is InputEventScreenDrag:
		var e := event as InputEventScreenDrag
		_touch_positions[e.index] = e.position

func _process(delta: float) -> void:
	# Keyboard fallback for editor testing
	if OS.has_feature("editor") or OS.has_feature("pc"):
		var axis := Input.get_axis("move_left", "move_right")
		joystick_axis = Vector2(axis, 0.0)
		if Input.is_action_just_pressed("jump"):
			jump_pressed = true
			_jump_consumed = false

	# Hold-to-mine: emit periodically while finger is held on world
	if not _hold_tile == Vector2i(-9999, -9999):
		_hold_timer += delta
		if _hold_timer >= HOLD_EMIT_INTERVAL:
			_hold_timer = 0.0
			var world_pos := _tile_to_world(_hold_tile)
			emit_signal("hold_world", world_pos)

func _on_tap(screen_pos: Vector2) -> void:
	var world_pos := _screen_to_world(screen_pos)
	if world_pos == Vector2.ZERO:
		return
	_hold_tile = ChunkCoords.pixel_to_tile(Vector2i(int(world_pos.x), int(world_pos.y)))
	_hold_timer = 0.0
	emit_signal("tap_world", world_pos)

func consume_jump() -> bool:
	if jump_pressed and not _jump_consumed:
		_jump_consumed = true
		jump_pressed = false
		return true
	return false

func get_move_axis() -> float:
	return joystick_axis.x

func _screen_to_world(screen_pos: Vector2) -> Vector2:
	var tree := Engine.get_main_loop() as SceneTree
	if tree == null or tree.current_scene == null:
		return Vector2.ZERO
	var viewport := tree.root
	var cam := viewport.get_camera_2d()
	if cam == null:
		# Fallback: find camera in scene
		var cameras := tree.get_nodes_in_group("camera")
		if cameras.is_empty():
			return Vector2.ZERO
		cam = cameras[0]
	return cam.get_global_transform().affine_inverse() * screen_pos + cam.global_position

func _tile_to_world(tile: Vector2i) -> Vector2:
	return Vector2(
		tile.x * Constants.TILE_SIZE + Constants.TILE_SIZE * 0.5,
		tile.y * Constants.TILE_SIZE + Constants.TILE_SIZE * 0.5
	)
