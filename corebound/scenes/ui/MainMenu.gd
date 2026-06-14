extends Control

@onready var new_game_btn: Button = $Panel/VBox/NewGameButton
@onready var load_game_btn: Button = $Panel/VBox/LoadGameButton
@onready var settings_btn: Button = $Panel/VBox/SettingsButton
@onready var version_label: Label = $VersionLabel
@onready var save_slots_panel: Panel = $SaveSlotsPanel
@onready var slots_container: VBoxContainer = $SaveSlotsPanel/VBox
@onready var title_label: Label = $TitleLabel
@onready var subtitle_label: Label = $SubtitleLabel

var _action: String = ""   # "new" or "load"
var _anim_time: float = 0.0

func _ready() -> void:
    new_game_btn.pressed.connect(_on_new_game)
    load_game_btn.pressed.connect(_on_load_game)
    settings_btn.pressed.connect(_on_settings)
    if has_node("SaveSlotsPanel/VBox/BackButton"):
        $SaveSlotsPanel/VBox/BackButton.pressed.connect(func(): save_slots_panel.visible = false)
    save_slots_panel.visible = false
    version_label.text = "v0.1.0 MVP"
    _animate_title()

func _process(delta: float) -> void:
    _anim_time += delta
    # Gentle subtitle pulse
    subtitle_label.modulate.a = 0.6 + sin(_anim_time * 1.5) * 0.4

func _animate_title() -> void:
    title_label.modulate.a = 0.0
    var tween := create_tween()
    tween.tween_property(title_label, "modulate:a", 1.0, 1.2)
    tween.tween_interval(0.3)
    tween.tween_property(subtitle_label, "modulate:a", 1.0, 0.8)

func _on_new_game() -> void:
    _action = "new"
    _show_save_slots()

func _on_load_game() -> void:
    _action = "load"
    _show_save_slots()

func _on_settings() -> void:
    get_tree().get_first_node_in_group("settings_screen").visible = true

func _show_save_slots() -> void:
    save_slots_panel.visible = true
    for child in slots_container.get_children():
        if child.name != "BackButton":
            child.queue_free()

    var slots := SaveManager.list_slots()
    for slot_info in slots:
        var row := HBoxContainer.new()
        slots_container.add_child(row)
        slots_container.move_child(row, 0)

        var lbl := Label.new()
        lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
        if slot_info["exists"]:
            var pt: float = slot_info.get("playtime", 0)
            var h := int(pt / 3600)
            var m := int(fmod(pt, 3600) / 60)
            lbl.text = "Slot %d — %dh %dm" % [slot_info["slot"] + 1, h, m]
        else:
            lbl.text = "Slot %d — Empty" % (slot_info["slot"] + 1)
        row.add_child(lbl)

        var btn := Button.new()
        var slot_num: int = slot_info["slot"]
        if _action == "new":
            btn.text = "New"
            btn.pressed.connect(_start_new.bind(slot_num))
        else:
            btn.text = "Load"
            btn.disabled = not slot_info["exists"]
            btn.pressed.connect(_start_load.bind(slot_num))
        row.add_child(btn)

        if slot_info["exists"]:
            var del_btn := Button.new()
            del_btn.text = "Del"
            del_btn.pressed.connect(_delete_slot.bind(slot_num))
            row.add_child(del_btn)

func _start_new(slot: int) -> void:
    AudioManager.play_sfx("ui_confirm")
    save_slots_panel.visible = false
    GameManager.current_save_slot = slot
    get_tree().get_first_node_in_group("main").start_new_game_slot(slot)

func _start_load(slot: int) -> void:
    AudioManager.play_sfx("ui_confirm")
    save_slots_panel.visible = false
    GameManager.current_save_slot = slot
    get_tree().get_first_node_in_group("main").load_game_slot(slot)

func _delete_slot(slot: int) -> void:
    SaveManager.delete_slot(slot)
    _show_save_slots()
