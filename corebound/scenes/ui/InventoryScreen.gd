extends Control

@onready var grid: GridContainer = $ScrollContainer/GridContainer
@onready var close_btn: Button = $CloseButton

var _slot_panels: Array[Panel] = []
var _slot_labels: Array[Label] = []
var _dragging_from: int = -1

func _ready() -> void:
    InventoryManager.inventory_changed.connect(_refresh)
    close_btn.pressed.connect(func(): visible = false)
    _build_grid()
    visible = false

func _build_grid() -> void:
    grid.columns = 8
    for i in Constants.INVENTORY_SIZE:
        var panel := Panel.new()
        panel.custom_minimum_size = Vector2(52, 52)
        grid.add_child(panel)
        _slot_panels.append(panel)

        var label := Label.new()
        label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
        label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
        label.add_theme_font_size_override("font_size", 10)
        panel.add_child(label)
        _slot_labels.append(label)

        var btn := Button.new()
        btn.flat = true
        btn.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
        btn.pressed.connect(_on_slot_pressed.bind(i))
        panel.add_child(btn)

func _refresh() -> void:
    for i in Constants.INVENTORY_SIZE:
        var slot := InventoryManager.get_slot(i)
        if slot.is_empty():
            _slot_labels[i].text = ""
            _slot_panels[i].modulate = Color(0.6, 0.6, 0.6)
        else:
            var def := CraftingManager.get_item_definition(slot["item"])
            var name_str := slot["item"] if def == null else def.display_name
            _slot_labels[i].text = name_str.substr(0, 8) + "\n×" + str(slot["count"])
            _slot_panels[i].modulate = Color.WHITE

func _on_slot_pressed(index: int) -> void:
    if _dragging_from == -1:
        if not InventoryManager.get_slot(index).is_empty():
            _dragging_from = index
            _slot_panels[index].modulate = Color(1.0, 0.9, 0.3)
    else:
        InventoryManager.swap_slots(_dragging_from, index)
        _slot_panels[_dragging_from].modulate = Color.WHITE
        _dragging_from = -1
        _refresh()

func show_inventory() -> void:
    visible = true
    _dragging_from = -1
    _refresh()
