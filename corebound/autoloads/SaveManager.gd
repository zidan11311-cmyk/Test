extends Node

signal save_started()
signal save_completed()
signal load_started()
signal load_completed()
signal load_failed(reason: String)

const SAVE_DIR := "user://saves/"
const SAVE_VERSION := 1
const AUTOSAVE_INTERVAL := 60.0

var _autosave_timer: float = 0.0

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)

func _process(delta: float) -> void:
	if GameManager.state != GameManager.State.PLAYING:
		return
	_autosave_timer += delta
	if _autosave_timer >= AUTOSAVE_INTERVAL:
		_autosave_timer = 0.0
		save(GameManager.current_save_slot)

func save(slot: int) -> void:
	emit_signal("save_started")

	var player_node := _get_player()
	if player_node and InventoryManager.player_state:
		InventoryManager.player_state.position = player_node.global_position
		InventoryManager.player_state.playtime_seconds += GameManager.get_session_time()

	var data := {
		"version": SAVE_VERSION,
		"save_time": Time.get_unix_time_from_system(),
		"world_seed": WorldManager.world_seed,
		"player": InventoryManager.player_state.serialize() if InventoryManager.player_state else {},
		"chunks": WorldManager.serialize_loaded_chunks(),
		"vehicles": WorldManager.serialize_vehicles(),
	}

	var path := SAVE_DIR + "slot_%d.json" % slot
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		push_error("SaveManager: cannot write to " + path)
		return
	file.store_string(JSON.stringify(data, "\t"))
	file.close()
	emit_signal("save_completed")

func load_game(slot: int) -> void:
	emit_signal("load_started")
	var path := SAVE_DIR + "slot_%d.json" % slot

	if not FileAccess.file_exists(path):
		emit_signal("load_failed", "Save file not found")
		return

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		emit_signal("load_failed", "Cannot read save file")
		return
	var text := file.read_as_text()
	file.close()

	var data = JSON.parse_string(text)
	if data == null:
		emit_signal("load_failed", "Corrupt save file")
		return

	WorldManager.world_seed = data.get("world_seed", randi())

	var ps := PlayerState.deserialize(data.get("player", {}))
	InventoryManager.initialize(ps)

	var chunks_data: Dictionary = data.get("chunks", {})
	WorldManager.load_from_save(chunks_data)

	var vehicles_data: Array = data.get("vehicles", [])
	WorldManager.load_vehicles_from_save(vehicles_data)

	emit_signal("load_completed")

func slot_exists(slot: int) -> bool:
	return FileAccess.file_exists(SAVE_DIR + "slot_%d.json" % slot)

func list_slots() -> Array:
	var result := []
	for slot in range(3):
		var path := SAVE_DIR + "slot_%d.json" % slot
		if not FileAccess.file_exists(path):
			result.append({ "slot": slot, "exists": false })
			continue
		var file := FileAccess.open(path, FileAccess.READ)
		if file == null:
			result.append({ "slot": slot, "exists": false })
			continue
		var data = JSON.parse_string(file.read_as_text())
		file.close()
		if data == null:
			result.append({ "slot": slot, "exists": false })
			continue
		result.append({
			"slot": slot,
			"exists": true,
			"save_time": data.get("save_time", 0),
			"playtime": data.get("player", {}).get("playtime", 0),
		})
	return result

func delete_slot(slot: int) -> void:
	var path := SAVE_DIR + "slot_%d.json" % slot
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)

func _get_player() -> Node:
	var tree := Engine.get_main_loop() as SceneTree
	if tree == null:
		return null
	return tree.get_first_node_in_group("player")
