extends Control

var _current_tile: Vector2i
var _current_ms: MachineState

@onready var title_label: Label = $Panel/TitleLabel
@onready var input_container: VBoxContainer = $Panel/InputContainer
@onready var output_container: VBoxContainer = $Panel/OutputContainer
@onready var fuel_label: Label = $Panel/FuelLabel
@onready var status_label: Label = $Panel/StatusLabel
@onready var close_btn: Button = $Panel/CloseButton

func _ready() -> void:
	close_btn.pressed.connect(func(): visible = false)
	SimulationManager.tick_completed.connect(_refresh)
	WorldManager.machine_interacted.connect(_on_machine_interacted)
	visible = false

func _on_machine_interacted(world_tile: Vector2i, ms: MachineState) -> void:
	_current_tile = world_tile
	_current_ms = ms
	visible = true
	_refresh()

func _refresh() -> void:
	if _current_ms == null or not visible:
		return

	title_label.text = _current_ms.machine_type.replace("_", " ").to_upper()

	# Input slots
	for child in input_container.get_children():
		child.queue_free()
	for i in _current_ms.input_slots.size():
		var slot := _current_ms.get_input(i)
		var lbl := Label.new()
		if slot.is_empty():
			lbl.text = "In %d: [empty]" % i
		else:
			var def := CraftingManager.get_item_definition(slot["item"])
			var name := slot["item"] if def == null else def.display_name
			lbl.text = "In %d: %s ×%d" % [i, name, slot["count"]]
		input_container.add_child(lbl)

		# Transfer button from player inventory
		if i == 0 or i == 1:
			var btn := Button.new()
			btn.text = "Add from inventory"
			btn.pressed.connect(_add_to_slot.bind(i))
			input_container.add_child(btn)

	# Output slots
	for child in output_container.get_children():
		child.queue_free()
	for i in _current_ms.output_slots.size():
		var slot := _current_ms.get_output(i)
		var lbl := Label.new()
		if slot.is_empty():
			lbl.text = "Out %d: [empty]" % i
		else:
			var def := CraftingManager.get_item_definition(slot["item"])
			var name := slot["item"] if def == null else def.display_name
			lbl.text = "Out %d: %s ×%d" % [i, name, slot["count"]]
		output_container.add_child(lbl)

		if not slot.is_empty():
			var take_btn := Button.new()
			take_btn.text = "Take all"
			take_btn.pressed.connect(_take_from_slot.bind(i))
			output_container.add_child(take_btn)

	fuel_label.text = "Fuel: %.2f kWh" % _current_ms.fuel_kwh if _current_ms.fuel_kwh > 0 else ""
	fuel_label.visible = _current_ms.fuel_kwh > 0
	status_label.text = "● Active" if _current_ms.is_active else "○ Idle"
	status_label.modulate = Color(0.3, 0.9, 0.3) if _current_ms.is_active else Color(0.7, 0.7, 0.7)

func _add_to_slot(slot_idx: int) -> void:
	if _current_ms == null: return
	# Let player pick an item — for MVP, just try to add the hotbar item
	var hotbar_item := InventoryManager.get_active_hotbar_item()
	if hotbar_item.is_empty(): return
	var leftover := _current_ms.add_to_input(slot_idx, hotbar_item["item"], 1, 50)
	if leftover == 0:
		InventoryManager.remove_item(hotbar_item["item"], 1)
	_refresh()

func _take_from_slot(slot_idx: int) -> void:
	if _current_ms == null: return
	var out := _current_ms.get_output(slot_idx)
	if out.is_empty(): return
	InventoryManager.add_item(out["item"], out["count"])
	_current_ms.set_output(slot_idx, "", 0)
	_refresh()
