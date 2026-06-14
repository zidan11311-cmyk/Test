extends Control

@onready var resume_btn: Button = $Panel/VBox/ResumeButton
@onready var save_btn: Button = $Panel/VBox/SaveButton
@onready var settings_btn: Button = $Panel/VBox/SettingsButton
@onready var quit_btn: Button = $Panel/VBox/QuitButton
@onready var save_label: Label = $Panel/VBox/SaveLabel

func _ready() -> void:
    resume_btn.pressed.connect(_on_resume)
    save_btn.pressed.connect(_on_save)
    settings_btn.pressed.connect(_on_settings)
    quit_btn.pressed.connect(_on_quit)
    visible = false

func _input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_cancel") and GameManager.state == GameManager.State.PLAYING:
        show_pause()
    elif event.is_action_pressed("ui_cancel") and GameManager.state == GameManager.State.PAUSED:
        _on_resume()

func show_pause() -> void:
    save_label.text = ""
    visible = true
    GameManager.pause()

func _on_resume() -> void:
    AudioManager.play_sfx("ui_back")
    visible = false
    GameManager.resume()

func _on_save() -> void:
    SaveManager.save(GameManager.current_save_slot)
    save_label.text = "Saved!"
    AudioManager.play_sfx("ui_confirm")
    await get_tree().create_timer(1.5).timeout
    if is_instance_valid(save_label):
        save_label.text = ""

func _on_settings() -> void:
    get_tree().get_first_node_in_group("settings_screen").visible = true

func _on_quit() -> void:
    AudioManager.play_sfx("ui_back")
    visible = false
    GameManager.return_to_menu()
    get_tree().get_first_node_in_group("main_menu").visible = true
