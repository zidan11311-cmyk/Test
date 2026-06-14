class_name BaseVehicle
extends CharacterBody2D

const VehicleState = preload("res://scripts/core/VehicleState.gd")
const Constants = preload("res://scripts/core/Constants.gd")

var vehicle_state: VehicleState
var _is_player_mounted: bool = false

signal player_mounted()
signal player_dismounted()
signal vehicle_destroyed()

func setup(vs: VehicleState) -> void:
	vehicle_state = vs
	global_position = vs.position
	_build_visuals()

func _build_visuals() -> void:
	pass  # Overridden by subclasses

func mount(player: Node) -> void:
	_is_player_mounted = true
	vehicle_state.is_player_mounted = true
	player.visible = false
	emit_signal("player_mounted")

func dismount(player: Node) -> void:
	_is_player_mounted = false
	vehicle_state.is_player_mounted = false
	player.global_position = global_position + Vector2(0, -Constants.TILE_SIZE * 1.5)
	player.visible = true
	emit_signal("player_dismounted")

func take_damage(amount: int) -> void:
	vehicle_state.hp -= amount
	if vehicle_state.hp <= 0:
		vehicle_state.hp = 0
		emit_signal("vehicle_destroyed")

func _save_position() -> void:
	if vehicle_state:
		vehicle_state.position = global_position

func get_depth_meters() -> float:
	return (global_position.y / Constants.TILE_SIZE) / 2.5
