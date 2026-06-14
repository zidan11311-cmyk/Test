extends Control

@onready var master_slider: HSlider = $Panel/VBox/MasterVBox/MasterSlider
@onready var music_slider: HSlider = $Panel/VBox/MusicVBox/MusicSlider
@onready var sfx_slider: HSlider = $Panel/VBox/SFXVBox/SFXSlider
@onready var fps_toggle: CheckButton = $Panel/VBox/FPSToggle
@onready var haptic_toggle: CheckButton = $Panel/VBox/HapticToggle
@onready var shake_toggle: CheckButton = $Panel/VBox/ShakeToggle
@onready var close_btn: Button = $Panel/CloseButton

func _ready() -> void:
    add_to_group("settings_screen")
    close_btn.pressed.connect(func():
        SettingsManager.save_settings()
        AudioManager.play_sfx("ui_back")
        visible = false
    )
    master_slider.value_changed.connect(func(v): SettingsManager.set_master_volume(v))
    music_slider.value_changed.connect(func(v): SettingsManager.set_music_volume(v))
    sfx_slider.value_changed.connect(func(v): SettingsManager.set_sfx_volume(v))
    fps_toggle.toggled.connect(func(on): SettingsManager.show_fps = on; SettingsManager.save_settings())
    haptic_toggle.toggled.connect(func(on): SettingsManager.haptic_feedback = on; SettingsManager.save_settings())
    shake_toggle.toggled.connect(func(on): SettingsManager.screen_shake = on; SettingsManager.save_settings())
    visible = false

func _notification(what: int) -> void:
    if what == NOTIFICATION_VISIBILITY_CHANGED and visible:
        _refresh()

func _refresh() -> void:
    master_slider.value = SettingsManager.master_volume
    music_slider.value  = SettingsManager.music_volume
    sfx_slider.value    = SettingsManager.sfx_volume
    fps_toggle.button_pressed   = SettingsManager.show_fps
    haptic_toggle.button_pressed = SettingsManager.haptic_feedback
    shake_toggle.button_pressed  = SettingsManager.screen_shake
