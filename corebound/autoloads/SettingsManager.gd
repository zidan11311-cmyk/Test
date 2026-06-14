extends Node

signal settings_changed()

const SETTINGS_PATH := "user://settings.cfg"

var master_volume: float = 1.0
var music_volume: float = 0.7
var sfx_volume: float = 1.0
var joystick_size: int = 1         # 0=small, 1=medium, 2=large
var show_fps: bool = false
var haptic_feedback: bool = true
var screen_shake: bool = true

func _ready() -> void:
    load_settings()
    _apply_volumes()

func save_settings() -> void:
    var cfg := ConfigFile.new()
    cfg.set_value("audio", "master", master_volume)
    cfg.set_value("audio", "music", music_volume)
    cfg.set_value("audio", "sfx", sfx_volume)
    cfg.set_value("display", "joystick_size", joystick_size)
    cfg.set_value("display", "show_fps", show_fps)
    cfg.set_value("input", "haptic_feedback", haptic_feedback)
    cfg.set_value("display", "screen_shake", screen_shake)
    cfg.save(SETTINGS_PATH)

func load_settings() -> void:
    var cfg := ConfigFile.new()
    if cfg.load(SETTINGS_PATH) != OK:
        return
    master_volume  = cfg.get_value("audio",   "master",         1.0)
    music_volume   = cfg.get_value("audio",   "music",          0.7)
    sfx_volume     = cfg.get_value("audio",   "sfx",            1.0)
    joystick_size  = cfg.get_value("display", "joystick_size",  1)
    show_fps       = cfg.get_value("display", "show_fps",       false)
    haptic_feedback = cfg.get_value("input",  "haptic_feedback",true)
    screen_shake   = cfg.get_value("display", "screen_shake",   true)

func _apply_volumes() -> void:
    AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"),
        linear_to_db(master_volume))
    AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"),
        linear_to_db(music_volume))
    AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"),
        linear_to_db(sfx_volume))

func set_master_volume(v: float) -> void:
    master_volume = clamp(v, 0.0, 1.0)
    _apply_volumes()
    save_settings()
    emit_signal("settings_changed")

func set_music_volume(v: float) -> void:
    music_volume = clamp(v, 0.0, 1.0)
    _apply_volumes()
    save_settings()
    emit_signal("settings_changed")

func set_sfx_volume(v: float) -> void:
    sfx_volume = clamp(v, 0.0, 1.0)
    _apply_volumes()
    save_settings()
    emit_signal("settings_changed")

func trigger_haptic(duration_ms: int = 15) -> void:
    if haptic_feedback and OS.has_feature("mobile"):
        Input.vibrate_handheld(duration_ms)
