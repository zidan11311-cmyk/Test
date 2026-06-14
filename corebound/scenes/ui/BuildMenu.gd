extends Control

signal machine_selected(machine_type: String)
signal build_cancelled()

@onready var item_list: VBoxContainer = $Panel/ScrollContainer/ItemList
@onready var title_label: Label = $Panel/TitleLabel
@onready var close_btn: Button = $Panel/CloseButton
@onready var rotate_btn: Button = $Panel/RotateButton
@onready var direction_label: Label = $Panel/DirectionLabel

var _selected_machine: String = ""
var _current_direction: int = 0  # 0=right,1=down,2=left,3=up

const DIR_NAMES := ["→ Right", "↓ Down", "← Left", "↑ Up"]
const MACHINE_ITEMS := ["mining_drill_mk1", "mining_drill_mk2", "conveyor_belt", "fast_belt",
	"stone_furnace", "electric_furnace", "assembler_mk1", "coal_generator", "wooden_chest", "iron_chest"]

func _ready() -> void:
	close_btn.pressed.connect(_cancel)
	rotate_btn.pressed.connect(_rotate_direction)
	InventoryManager.inventory_changed.connect(_refresh_list)
	visible = false

func show_menu() -> void:
	visible = true
	_selected_machine = ""
	_current_direction = 0
	direction_label.text = DIR_NAMES[0]
	_refresh_list()

func _refresh_list() -> void:
	for child in item_list.get_children():
		child.queue_free()

	var found_any := false
	for machine_id in MACHINE_ITEMS:
		var count := InventoryManager.count_item(machine_id)
		if count <= 0:
			continue
		found_any = true
		var def := CraftingManager.get_item_definition(machine_id)
		var name_str: String = machine_id if def == null else def.display_name

		var btn := Button.new()
		btn.text = "%s  [%d]" % [name_str, count]
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		if machine_id == _selected_machine:
			btn.modulate = Color(1.0, 0.9, 0.3)
		btn.pressed.connect(_on_machine_btn.bind(machine_id))
		item_list.add_child(btn)

	if not found_any:
		var lbl := Label.new()
		lbl.text = "No machines in inventory.\nCraft some first (C key)."
		item_list.add_child(lbl)

func _on_machine_btn(machine_id: String) -> void:
	_selected_machine = machine_id
	emit_signal("machine_selected", machine_id)
	_refresh_list()
	# Don't close — player now taps world to place

func _rotate_direction() -> void:
	_current_direction = (_current_direction + 1) % 4
	direction_label.text = DIR_NAMES[_current_direction]

func _cancel() -> void:
	_selected_machine = ""
	visible = false
	emit_signal("build_cancelled")

func get_selected_machine() -> String:
	return _selected_machine

func get_direction() -> int:
	return _current_direction
