extends Control

@onready var depth_label: Label = $Panel/VBox/DepthLabel
@onready var respawn_btn: Button = $Panel/VBox/RespawnButton
@onready var menu_btn: Button = $Panel/VBox/MenuButton

func _ready() -> void:
    respawn_btn.pressed.connect(_on_respawn)
    menu_btn.pressed.connect(_on_menu)
    visible = false

func show_game_over(depth_m: float) -> void:
    depth_label.text = "Depth reached: %.0f m" % depth_m
    visible = true
    GameManager.state = GameManager.State.GAME_OVER
    get_tree().paused = false

func _on_respawn() -> void:
    AudioManager.play_sfx("ui_confirm")
    if InventoryManager.player_state:
        InventoryManager.player_state.hp = InventoryManager.player_state.max_hp
    var player := get_tree().get_first_node_in_group("player")
    if player:
        # Respawn at surface
        player.global_position = Vector2(256 * Constants.TILE_SIZE, 5 * Constants.TILE_SIZE)
        player.visible = true
    visible = false
    GameManager.state = GameManager.State.PLAYING

func _on_menu() -> void:
    AudioManager.play_sfx("ui_back")
    visible = false
    GameManager.return_to_menu()
    get_tree().get_first_node_in_group("main_menu").visible = true
