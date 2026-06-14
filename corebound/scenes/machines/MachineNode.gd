class_name MachineNode
extends Node2D

var world_tile: Vector2i
var machine_state: MachineState
var machine_def: Dictionary  # from machines.json via CraftingManager or a local lookup

# Visuals
var _body_rect: ColorRect
var _direction_indicator: ColorRect
var _active_indicator: ColorRect
var _progress_bar: ColorRect
var _label: Label

const DIR_OFFSETS := [
	Vector2(1, 0), Vector2(0, 1), Vector2(-1, 0), Vector2(0, -1)
]

func setup(tile: Vector2i, ms: MachineState) -> void:
	world_tile = tile
	machine_state = ms
	global_position = Vector2(
		tile.x * Constants.TILE_SIZE,
		tile.y * Constants.TILE_SIZE
	)
	_build_visuals()
	SimulationManager.tick_completed.connect(_on_tick)

func _build_visuals() -> void:
	var ts := Constants.TILE_SIZE

	# Main body
	_body_rect = ColorRect.new()
	_body_rect.size = Vector2(ts, ts)
	_body_rect.color = _get_machine_color()
	add_child(_body_rect)

	# 1px dark border via separate rects
	_draw_border(Color(0, 0, 0, 0.5))

	# Direction arrow (small rect pointing output direction)
	_direction_indicator = ColorRect.new()
	_direction_indicator.size = Vector2(8, 8)
	_direction_indicator.color = Color(1, 1, 0, 0.9)
	var dir_offset := DIR_OFFSETS[machine_state.direction]
	_direction_indicator.position = Vector2(ts * 0.5 + dir_offset.x * (ts * 0.35), ts * 0.5 + dir_offset.y * (ts * 0.35)) - Vector2(4, 4)
	add_child(_direction_indicator)

	# Active indicator (green dot when running)
	_active_indicator = ColorRect.new()
	_active_indicator.size = Vector2(6, 6)
	_active_indicator.color = Color(0.2, 0.9, 0.2)
	_active_indicator.position = Vector2(2, 2)
	add_child(_active_indicator)

	# Progress bar (thin bar at bottom of tile)
	_progress_bar = ColorRect.new()
	_progress_bar.size = Vector2(0, 3)
	_progress_bar.position = Vector2(0, ts - 3)
	_progress_bar.color = Color(0.3, 0.8, 1.0, 0.9)
	add_child(_progress_bar)

	# Short label (machine type)
	_label = Label.new()
	_label.text = _short_name()
	_label.position = Vector2(2, ts * 0.5 - 8)
	_label.add_theme_font_size_override("font_size", 8)
	_label.modulate = Color(1, 1, 1, 0.85)
	add_child(_label)

func _draw_border(color: Color) -> void:
	var ts := Constants.TILE_SIZE
	var top := ColorRect.new(); top.color = color; top.size = Vector2(ts, 1); top.position = Vector2(0, 0); add_child(top)
	var bot := ColorRect.new(); bot.color = color; bot.size = Vector2(ts, 1); bot.position = Vector2(0, ts - 1); add_child(bot)
	var lft := ColorRect.new(); lft.color = color; lft.size = Vector2(1, ts); lft.position = Vector2(0, 0); add_child(lft)
	var rgt := ColorRect.new(); rgt.color = color; rgt.size = Vector2(1, ts); rgt.position = Vector2(ts - 1, 0); add_child(rgt)

func _on_tick() -> void:
	if machine_state == null:
		return
	# Update active indicator color
	_active_indicator.color = Color(0.2, 0.9, 0.2) if machine_state.is_active else Color(0.6, 0.6, 0.6)
	# Update progress bar
	_progress_bar.size.x = Constants.TILE_SIZE * clamp(machine_state.progress, 0.0, 1.0)
	# Belt items: draw small dots
	if machine_state.machine_type in ["conveyor_belt", "fast_belt"]:
		_draw_belt_items()

func _draw_belt_items() -> void:
	pass  # Phase 6 will add item icons; for now items are represented by progress bar fill

func _get_machine_color() -> Color:
	var colors := {
		"mining_drill_mk1": Color(0.6, 0.4, 0.2),
		"mining_drill_mk2": Color(0.5, 0.5, 0.7),
		"conveyor_belt":    Color(0.8, 0.6, 0.1),
		"fast_belt":        Color(0.9, 0.8, 0.1),
		"stone_furnace":    Color(0.55, 0.45, 0.35),
		"electric_furnace": Color(0.3, 0.55, 0.75),
		"assembler_mk1":    Color(0.4, 0.65, 0.4),
		"coal_generator":   Color(0.25, 0.25, 0.25),
		"wooden_chest":     Color(0.6, 0.42, 0.22),
		"iron_chest":       Color(0.55, 0.55, 0.6),
	}
	return colors.get(machine_state.machine_type, Color(0.5, 0.5, 0.5))

func _short_name() -> String:
	var names := {
		"mining_drill_mk1": "Drill", "mining_drill_mk2": "Drill2",
		"conveyor_belt": "Belt", "fast_belt": "Belt+",
		"stone_furnace": "Furn", "electric_furnace": "EFurn",
		"assembler_mk1": "Asm", "coal_generator": "Gen",
		"wooden_chest": "Chest", "iron_chest": "Chest+",
	}
	return names.get(machine_state.machine_type, machine_state.machine_type.substr(0, 5))

func on_player_interact() -> void:
	# Signal to Main/HUD to open the right UI
	WorldManager.emit_signal("machine_interacted", world_tile, machine_state)
