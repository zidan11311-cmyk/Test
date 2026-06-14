extends CanvasLayer

@onready var hp_bar: ProgressBar = $HPBar
@onready var depth_label: Label = $DepthLabel
@onready var hotbar_container: HBoxContainer = $Hotbar
@onready var notification_label: Label = $NotificationLabel

var _hotbar_slots: Array[Panel] = []
var _hotbar_labels: Array[Label] = []
var _notification_timer: float = 0.0
var _build_mode_label: Label = null

func _ready() -> void:
	InventoryManager.inventory_changed.connect(_refresh_hotbar)
	InventoryManager.item_added.connect(_on_item_added)
	_build_hotbar()
	_refresh_hotbar()

	# Build mode overlay label — created in code; also accepts one defined in the scene
	var existing := get_node_or_null("BuildModeLabel")
	if existing is Label:
		_build_mode_label = existing
	else:
		_build_mode_label = Label.new()
		_build_mode_label.name = "BuildModeLabel"
		_build_mode_label.text = "⚒ BUILD MODE"
		_build_mode_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		_build_mode_label.anchor_left = 0.5
		_build_mode_label.anchor_top = 0.0
		_build_mode_label.anchor_right = 0.5
		_build_mode_label.anchor_bottom = 0.0
		_build_mode_label.offset_left = -200.0
		_build_mode_label.offset_top = 90.0
		_build_mode_label.offset_right = 200.0
		_build_mode_label.offset_bottom = 120.0
		_build_mode_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.1))
		_build_mode_label.add_theme_font_size_override("font_size", 18)
		_build_mode_label.visible = false
		add_child(_build_mode_label)

	# BuildButton is optional — it may be defined in HUD.tscn
	var build_btn := get_node_or_null("BuildButton")
	if build_btn == null:
		pass  # Will be connected from Main.gd once the scene node exists

func _process(delta: float) -> void:
	_update_hp()
	_update_depth()
	if _notification_timer > 0:
		_notification_timer -= delta
		if _notification_timer <= 0:
			notification_label.visible = false
	_update_build_mode_overlay()

func _update_hp() -> void:
	var ps := InventoryManager.player_state
	if ps == null:
		return
	hp_bar.max_value = ps.max_hp
	hp_bar.value = ps.hp

func _update_depth() -> void:
	var player := get_tree().get_first_node_in_group("player") as Player
	if player == null:
		return
	var depth_m := player.get_depth_meters()
	if depth_m < 0:
		depth_label.text = "Surface"
	else:
		depth_label.text = "%.0f m" % depth_m
	# Update music based on depth layer
	var tile_y := int(player.global_position.y / Constants.TILE_SIZE)
	var layer := Constants.get_layer_for_depth(tile_y)
	AudioManager.play_music_for_layer(layer)

func _update_build_mode_overlay() -> void:
	if _build_mode_label == null:
		return
	var player := get_tree().get_first_node_in_group("player") as Player
	if player == null:
		_build_mode_label.visible = false
		return
	_build_mode_label.visible = player._build_mode

func _build_hotbar() -> void:
	for i in Constants.HOTBAR_SIZE:
		var panel := Panel.new()
		panel.custom_minimum_size = Vector2(52, 52)
		hotbar_container.add_child(panel)
		_hotbar_slots.append(panel)

		var label := Label.new()
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		label.add_theme_font_size_override("font_size", 10)
		panel.add_child(label)
		_hotbar_labels.append(label)

func _refresh_hotbar() -> void:
	for i in Constants.HOTBAR_SIZE:
		var slot := InventoryManager.get_slot(i)
		if slot.is_empty():
			_hotbar_labels[i].text = ""
		else:
			var def := CraftingManager.get_item_definition(slot["item"])
			var name_short := slot["item"].substr(0, 6) if def == null else def.display_name.substr(0, 8)
			_hotbar_labels[i].text = name_short + "\n×" + str(slot["count"])

func _on_item_added(item_id: String, count: int) -> void:
	var def := CraftingManager.get_item_definition(item_id)
	var name := item_id if def == null else def.display_name
	show_notification("+" + str(count) + " " + name)

func show_notification(text: String) -> void:
	notification_label.text = text
	notification_label.visible = true
	_notification_timer = 2.5
