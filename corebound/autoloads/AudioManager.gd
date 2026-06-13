extends Node

const SFX_POOL_SIZE := 12

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

func play_sfx(sfx_id: String, volume_db: float = 0.0) -> void:
	if not _sfx_streams.has(sfx_id):
		return
	var player := _get_free_sfx_player()
	if player == null:
		return
	player.stream = _sfx_streams[sfx_id]
	player.volume_db = volume_db
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
