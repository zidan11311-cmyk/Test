extends Node

enum State { MAIN_MENU, LOADING, PLAYING, PAUSED, GAME_OVER }

signal state_changed(new_state: State)

var state: State = State.MAIN_MENU
var current_save_slot: int = 0
var _session_start_time: float = 0.0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func start_new_game(slot: int) -> void:
	current_save_slot = slot
	_session_start_time = Time.get_unix_time_from_system()
	_set_state(State.LOADING)
	# World scene loaded by Main scene listening to this signal
	await get_tree().process_frame
	_set_state(State.PLAYING)

func load_game(slot: int) -> void:
	current_save_slot = slot
	_session_start_time = Time.get_unix_time_from_system()
	_set_state(State.LOADING)
	SaveManager.load_game(slot)
	await get_tree().process_frame
	_set_state(State.PLAYING)

func pause() -> void:
	if state == State.PLAYING:
		_set_state(State.PAUSED)
		get_tree().paused = true

func resume() -> void:
	if state == State.PAUSED:
		get_tree().paused = false
		_set_state(State.PLAYING)

func game_over() -> void:
	_set_state(State.GAME_OVER)

func return_to_menu() -> void:
	SaveManager.save(current_save_slot)
	get_tree().paused = false
	WorldManager.world_seed = 0
	WorldManager.vehicles.clear()
	_set_state(State.MAIN_MENU)

func _set_state(new_state: State) -> void:
	state = new_state
	emit_signal("state_changed", new_state)

func get_session_time() -> float:
	return Time.get_unix_time_from_system() - _session_start_time
