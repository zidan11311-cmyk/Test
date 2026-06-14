extends Node

const SFX_POOL_SIZE := 12

const SFX_IDS := {
	# Mining
	"mine_tick":     "res://assets/audio/sfx/mine_tick.wav",
	"mine_break":    "res://assets/audio/sfx/mine_break.wav",
	"ore_spark":     "res://assets/audio/sfx/ore_spark.wav",
	# Building
	"place":         "res://assets/audio/sfx/place.wav",
	"remove":        "res://assets/audio/sfx/remove.wav",
	# Crafting
	"craft_done":    "res://assets/audio/sfx/craft_done.wav",
	"craft_fail":    "res://assets/audio/sfx/craft_fail.wav",
	# UI
	"ui_confirm":    "res://assets/audio/sfx/ui_confirm.wav",
	"ui_back":       "res://assets/audio/sfx/ui_back.wav",
	"ui_open":       "res://assets/audio/sfx/ui_open.wav",
	# Player
	"jump":          "res://assets/audio/sfx/jump.wav",
	"land":          "res://assets/audio/sfx/land.wav",
	"hurt":          "res://assets/audio/sfx/hurt.wav",
	"death":         "res://assets/audio/sfx/death.wav",
	# Vehicles
	"vehicle_mount":   "res://assets/audio/sfx/vehicle_mount.wav",
	"vehicle_drive":   "res://assets/audio/sfx/vehicle_drive.wav",
	"drill_loop":      "res://assets/audio/sfx/drill_loop.wav",
	"hover_loop":      "res://assets/audio/sfx/hover_loop.wav",
	# Machines
	"machine_start":   "res://assets/audio/sfx/machine_start.wav",
	"machine_hum":     "res://assets/audio/sfx/machine_hum.wav",
	"belt_tick":       "res://assets/audio/sfx/belt_tick.wav",
	"furnace_burn":    "res://assets/audio/sfx/furnace_burn.wav",
	# World
	"depth_layer_change": "res://assets/audio/sfx/depth_layer_change.wav",
	"tech_unlock":     "res://assets/audio/sfx/tech_unlock.wav",
	"lava_splash":     "res://assets/audio/sfx/lava_splash.wav",
	"cave_drip":       "res://assets/audio/sfx/cave_drip.wav",
}

var _sfx_pool: Array[AudioStreamPlayer] = []
var _music_a: AudioStreamPlayer
var _music_b: AudioStreamPlayer
var _current_music_player: AudioStreamPlayer
var _current_layer: String = ""

# In MVP, no audio files exist yet -- manager is wired up but silent
# When audio assets are added (Phase 7), populate _sfx_streams and _music_streams

var _sfx_streams: Dictionary = {}    # sfx_id -> AudioStream
var _music_streams: Dictionary = {}  # layer_name -> AudioStream

func _ready() -> void:
	for i in SFX_POOL_SIZE:
		var p := AudioStreamPlayer.new()
		p.bus = "SFX"
		add_child(p)
		_sfx_pool.append(p)

	_music_a = AudioStreamPlayer.new()
	_music_a.bus = "Music"
	_music_a.volume_db = -6.0
	add_child(_music_a)

	_music_b = AudioStreamPlayer.new()
	_music_b.bus = "Music"
	_music_b.volume_db = -80.0
	add_child(_music_b)

	_current_music_player = _music_a

	_load_sfx()

func _load_sfx() -> void:
	for sfx_id in SFX_IDS:
		var path: String = SFX_IDS[sfx_id]
		if ResourceLoader.exists(path):
			_sfx_streams[sfx_id] = load(path)

func play_sfx(sfx_id: String, volume_db: float = 0.0) -> void:
	if not _sfx_streams.has(sfx_id):
		return
	var player := _get_free_sfx_player()
	if player == null:
		return
	player.stream = _sfx_streams[sfx_id]
	player.volume_db = volume_db
	player.pitch_scale = 1.0
	player.play()

func play_sfx_pitch(sfx_id: String, pitch: float = 1.0, volume_db: float = 0.0) -> void:
	if not _sfx_streams.has(sfx_id):
		return
	var player := _get_free_sfx_player()
	if player == null:
		return
	player.stream = _sfx_streams[sfx_id]
	player.volume_db = volume_db
	player.pitch_scale = pitch
	player.play()

func play_sfx_positioned(sfx_id: String, world_pos: Vector2, max_dist: float = 800.0) -> void:
	if not _sfx_streams.has(sfx_id):
		return
	# Find camera position via player group
	var camera_pos := Vector2.ZERO
	var camera_nodes: Array = Engine.get_main_loop().get_nodes_in_group("camera") if Engine.get_main_loop() is SceneTree else []
	if camera_nodes.size() > 0 and camera_nodes[0] is Node2D:
		camera_pos = (camera_nodes[0] as Node2D).global_position
	var dist: float = camera_pos.distance_to(world_pos)
	if dist >= max_dist:
		return
	var t: float = 1.0 - clamp(dist / max_dist, 0.0, 1.0)
	# Convert linear falloff to dB attenuation (-80 at edge, 0 at centre)
	var volume_db: float = lerp(-80.0, 0.0, t)
	var player := _get_free_sfx_player()
	if player == null:
		return
	player.stream = _sfx_streams[sfx_id]
	player.volume_db = volume_db
	player.pitch_scale = 1.0
	player.play()

func play_music_for_layer(layer_name: String) -> void:
	if layer_name == _current_layer:
		return
	_current_layer = layer_name
	if not _music_streams.has(layer_name):
		return
	var inactive := _music_a if _current_music_player == _music_b else _music_b
	inactive.stream = _music_streams[layer_name]
	inactive.volume_db = -80.0
	inactive.play()
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(_current_music_player, "volume_db", -80.0, 2.0)
	tween.tween_property(inactive, "volume_db", -6.0, 2.0)
	_current_music_player = inactive

func stop_music() -> void:
	_music_a.stop()
	_music_b.stop()
	_current_layer = ""

func _get_free_sfx_player() -> AudioStreamPlayer:
	for p in _sfx_pool:
		if not p.playing:
			return p
	return _sfx_pool[0]  # recycle oldest
