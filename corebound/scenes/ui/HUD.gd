extends CanvasLayer

@onready var hp_bar: ProgressBar = $HPBar
@onready var depth_label: Label = $DepthLabel
@onready var hotbar_container: HBoxContainer = $Hotbar
@onready var notification_label: Label = $NotificationLabel

var _hotbar_slots: Array[Panel] = []
var _hotbar_labels: Array[Label] = []
var _notification_timer: float = 0.0

func _ready() -> void:
    InventoryManager.inventory_changed.connect(_refresh_hotbar)
    InventoryManager.item_added.connect(_on_item_added)
    _build_hotbar()
    _refresh_hotbar()

func _process(delta: float) -> void:
    _update_hp()
    _update_depth()
    if _notification_timer > 0:
        _notification_timer -= delta
        if _notification_timer <= 0:
            notification_label.visible = false

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
