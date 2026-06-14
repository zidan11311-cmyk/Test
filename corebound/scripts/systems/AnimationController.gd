class_name AnimationController

# Manages the player's visual state without requiring sprite sheets.
# In Phase 6 MVP (no art assets yet), this drives the placeholder ColorRect
# visual with scale/color changes to simulate animation states.
# When real sprites are added, replace the ColorRect manipulation with
# AnimationPlayer calls.

enum PlayerState {
	IDLE, WALK, JUMP, FALL, MINE, HURT, MOUNTED
}

var _state: PlayerState = PlayerState.IDLE
var _body_rect: ColorRect   # The player's placeholder body
var _time: float = 0.0
var _hurt_timer: float = 0.0

const STATE_COLORS := {
	PlayerState.IDLE:    Color(0.25, 0.55, 0.95),
	PlayerState.WALK:    Color(0.20, 0.50, 0.90),
	PlayerState.JUMP:    Color(0.30, 0.65, 1.00),
	PlayerState.FALL:    Color(0.20, 0.45, 0.85),
	PlayerState.MINE:    Color(0.35, 0.60, 0.90),
	PlayerState.HURT:    Color(0.95, 0.30, 0.25),
	PlayerState.MOUNTED: Color(0.15, 0.40, 0.75),
}

func _init(body: ColorRect) -> void:
	_body_rect = body

func update(delta: float, velocity: Vector2, is_on_floor: bool, is_mining: bool, is_mounted: bool) -> void:
	_time += delta
	if _hurt_timer > 0:
		_hurt_timer -= delta

	var new_state := _determine_state(velocity, is_on_floor, is_mining, is_mounted)
	if new_state != _state:
		_on_state_enter(new_state)
		_state = new_state

	_animate(delta, velocity)

func trigger_hurt() -> void:
	_hurt_timer = 0.3
	_state = PlayerState.HURT
	if _body_rect:
		_body_rect.color = STATE_COLORS[PlayerState.HURT]

func _determine_state(vel: Vector2, on_floor: bool, mining: bool, mounted: bool) -> PlayerState:
	if _hurt_timer > 0:
		return PlayerState.HURT
	if mounted:
		return PlayerState.MOUNTED
	if mining:
		return PlayerState.MINE
	if not on_floor:
		return PlayerState.FALL if vel.y > 0 else PlayerState.JUMP
	if abs(vel.x) > 10:
		return PlayerState.WALK
	return PlayerState.IDLE

func _on_state_enter(new_state: PlayerState) -> void:
	if _body_rect == null:
		return
	_body_rect.color = STATE_COLORS.get(new_state, Color(0.25, 0.55, 0.95))
	# Squash/stretch on state transitions
	match new_state:
		PlayerState.JUMP:
			_body_rect.scale = Vector2(0.85, 1.2)
		PlayerState.FALL:
			_body_rect.scale = Vector2(1.1, 0.9)
		PlayerState.IDLE:
			_body_rect.scale = Vector2(1.0, 1.0)
		_:
			_body_rect.scale = Vector2(1.0, 1.0)

func _animate(delta: float, vel: Vector2) -> void:
	if _body_rect == null:
		return

	match _state:
		PlayerState.IDLE:
			# Subtle bob: scale Y pulses slightly
			var bob := sin(_time * 2.5) * 0.02
			_body_rect.scale = Vector2(1.0, 1.0 + bob)

		PlayerState.WALK:
			# Squash/stretch on walk cycle
			var cycle := sin(_time * 12.0)
			_body_rect.scale = Vector2(1.0 - cycle * 0.04, 1.0 + cycle * 0.04)

		PlayerState.MINE:
			# Lean in direction of mining
			var lean := sin(_time * 20.0) * 0.08
			_body_rect.scale = Vector2(1.0 + lean, 1.0 - lean * 0.5)

		PlayerState.FALL:
			# Stretch vertically
			var stretch := minf(abs(vel.y) / 400.0, 0.15)
			_body_rect.scale = Vector2(1.0 - stretch, 1.0 + stretch)

		PlayerState.JUMP:
			# Squash back to normal during upward phase
			_body_rect.scale = _body_rect.scale.lerp(Vector2(1.0, 1.0), delta * 8.0)

func get_state() -> PlayerState:
	return _state

func get_state_name() -> String:
	return PlayerState.keys()[_state]
