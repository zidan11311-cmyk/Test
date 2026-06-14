class_name BackgroundLayer
extends Node2D

const Constants = preload("res://scripts/core/Constants.gd")

# Each layer is a ColorRect covering the screen + overflow
# They are positioned relative to camera with parallax factor

const PARALLAX_SPEEDS := [0.05, 0.15, 0.35]

# Colors per layer name [top_color, bottom_color]
const LAYER_COLORS := {
	"surface":   [Color(0.53, 0.81, 0.92), Color(0.88, 0.84, 0.63)],
	"shallow":   [Color(0.16, 0.16, 0.23), Color(0.10, 0.10, 0.16)],
	"deep_rock": [Color(0.10, 0.09, 0.13), Color(0.06, 0.05, 0.10)],
	"crystal":   [Color(0.05, 0.10, 0.16), Color(0.03, 0.08, 0.12)],
	"magma":     [Color(0.16, 0.04, 0.00), Color(0.10, 0.02, 0.00)],
	"core":      [Color(0.12, 0.00, 0.12), Color(0.06, 0.00, 0.06)],
}

var _layers: Array[ColorRect] = []
var _camera: Camera2D = null
var _current_layer: String = "surface"
var _viewport_size: Vector2

func _ready() -> void:
	_viewport_size = get_viewport().get_visible_rect().size
	z_index = -100  # Behind everything
	_build_layers()
	get_tree().root.size_changed.connect(_on_resize)

func _build_layers() -> void:
	# 3 background rects, each slightly different shade
	for i in 3:
		var rect := ColorRect.new()
		# Extra-wide to avoid edge gaps during parallax scroll
		rect.size = _viewport_size * Vector2(3.0, 2.0)
		rect.color = _get_layer_color("surface", i)
		_layers.append(rect)
		add_child(rect)

func _process(_delta: float) -> void:
	if _camera == null:
		_find_camera()
		if _camera == null:
			return

	var cam_pos := _camera.global_position
	var vp := _viewport_size

	# Determine current depth layer
	var tile_y := int(cam_pos.y / Constants.TILE_SIZE)
	var new_layer := Constants.get_layer_for_depth(tile_y)
	if new_layer != _current_layer:
		_current_layer = new_layer
		_update_colors()

	# Position each rect with parallax offset
	for i in 3:
		var parallax: float = PARALLAX_SPEEDS[i]
		var rect := _layers[i]
		rect.global_position = Vector2(
			cam_pos.x - vp.x * 1.5 + cam_pos.x * parallax * -1.0,
			cam_pos.y - vp.y + cam_pos.y * parallax * -0.5
		)

func _update_colors() -> void:
	for i in 3:
		_layers[i].color = _get_layer_color(_current_layer, i)

func _get_layer_color(layer_name: String, depth_index: int) -> Color:
	var colors: Array = LAYER_COLORS.get(layer_name, LAYER_COLORS["shallow"])
	var t: float = float(depth_index) / 2.0
	var base: Color = (colors[0] as Color).lerp(colors[1], t)
	# Darken deeper parallax layers
	return base * (1.0 - depth_index * 0.1)

func _find_camera() -> void:
	var cameras := get_tree().get_nodes_in_group("camera")
	if not cameras.is_empty():
		_camera = cameras[0] as Camera2D
		if _camera == null and cameras[0] is Node:
			# Camera might be a child Camera2D
			for child in cameras[0].get_children():
				if child is Camera2D:
					_camera = child
					break

func _on_resize() -> void:
	_viewport_size = get_viewport().get_visible_rect().size
	for rect in _layers:
		rect.size = _viewport_size * Vector2(3.0, 2.0)
