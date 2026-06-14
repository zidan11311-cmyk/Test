extends CanvasLayer

@onready var hint_label: Label = $HintPanel/HintLabel
@onready var hint_panel: Panel = $HintPanel
@onready var dismiss_btn: Button = $HintPanel/DismissButton

var _hints_shown: Array = []
var _current_hint: int = -1
var _hint_timer: float = 0.0
const HINT_DURATION := 5.0

const HINTS := [
    { "id": "mine",     "text": "Tap and hold a block to mine it.\nMine resources to craft tools and machines." },
    { "id": "craft",    "text": "Press C (or the CRAFT button) to open the crafting menu.\nCraft a Stone Pickaxe for faster mining." },
    { "id": "build",    "text": "Press the BUILD button to place machines.\nMine stone + iron to craft a Mining Drill." },
    { "id": "power",    "text": "Machines need power!\nCraft a Coal Generator and place it near your machines." },
    { "id": "depth",    "text": "Dig deeper for better resources.\nEach layer has unique ores and hazards." },
    { "id": "vehicle",  "text": "Build vehicles to dig faster!\nThe Drill Vehicle is 3x faster than hand-mining." },
]

func _ready() -> void:
    add_to_group("tutorial")
    dismiss_btn.pressed.connect(_dismiss)
    hint_panel.visible = false
    # Load shown hints from settings
    var cfg := ConfigFile.new()
    if cfg.load("user://tutorial.cfg") == OK:
        _hints_shown = cfg.get_value("tutorial", "shown", [])

func _process(delta: float) -> void:
    if _current_hint >= 0:
        _hint_timer -= delta
        if _hint_timer <= 0:
            _hide_hint()

func show_hint(hint_id: String) -> void:
    if hint_id in _hints_shown:
        return
    for i in HINTS.size():
        if HINTS[i]["id"] == hint_id:
            _show_hint_at(i)
            return

func _show_hint_at(index: int) -> void:
    _current_hint = index
    _hint_timer = HINT_DURATION
    hint_label.text = HINTS[index]["text"]
    hint_panel.visible = true
    _hints_shown.append(HINTS[index]["id"])
    _save_shown()

func _dismiss() -> void:
    _hide_hint()

func _hide_hint() -> void:
    hint_panel.visible = false
    _current_hint = -1

func _save_shown() -> void:
    var cfg := ConfigFile.new()
    cfg.set_value("tutorial", "shown", _hints_shown)
    cfg.save("user://tutorial.cfg")
