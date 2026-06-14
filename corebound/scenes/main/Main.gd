extends Node

@onready var hud: CanvasLayer = $HUD
@onready var inventory_screen: Control = $InventoryScreen
@onready var crafting_screen: Control = $CraftingScreen
@onready var build_menu: Control = $BuildMenu
@onready var machine_screen: Control = $MachineScreen
@onready var background: ColorRect = $Background
@onready var vehicle_hud: CanvasLayer = $VehicleHUD

var _world_scene: Node = null

func _ready() -> void:
	GameManager.state_changed.connect(_on_state_changed)
	_connect_hud_buttons()

	# Connect vehicle lifecycle signals for HUD management
	WorldManager.vehicle_spawned.connect(_on_vehicle_node_spawned)

	# Auto-start a new game for MVP (no main menu yet)
	await get_tree().process_frame
	_start_new_game()

func _start_new_game() -> void:
	WorldManager.world_seed = randi()
	var world_scene := preload("res://scenes/world/World.tscn").instantiate()
	_world_scene = world_scene
	add_child(world_scene)
	move_child(world_scene, 0)  # Behind UI

	# Initialize player state
	var ps := PlayerState.new()
	InventoryManager.initialize(ps)

	GameManager.state = GameManager.State.PLAYING
	hud.visible = true

	# Wait for build_menu and machine_screen to be ready before connecting
	await build_menu.ready
	await machine_screen.ready
	build_menu.machine_selected.connect(_on_machine_selected)
	build_menu.build_cancelled.connect(_on_build_cancelled)

func _connect_hud_buttons() -> void:
	# Connect after HUD is ready
	await hud.ready
	if hud.has_node("JumpButton"):
		hud.get_node("JumpButton").pressed.connect(_on_jump_button)
	if hud.has_node("InventoryButton"):
		hud.get_node("InventoryButton").pressed.connect(_toggle_inventory)
	if hud.has_node("CraftingButton"):
		hud.get_node("CraftingButton").pressed.connect(_toggle_crafting)
	if hud.has_node("BuildButton"):
		hud.get_node("BuildButton").pressed.connect(_toggle_build_menu)

func _on_jump_button() -> void:
	InputManager.jump_pressed = true
	InputManager._jump_consumed = false

func _toggle_inventory() -> void:
	crafting_screen.visible = false
	if inventory_screen.visible:
		inventory_screen.visible = false
	else:
		inventory_screen.show_inventory()

func _toggle_crafting() -> void:
	inventory_screen.visible = false
	if crafting_screen.visible:
		crafting_screen.visible = false
	else:
		crafting_screen.show_crafting()

func _toggle_build_menu() -> void:
	if build_menu.visible:
		build_menu.visible = false
		var player := get_tree().get_first_node_in_group("player") as Player
		if player:
			player.exit_build_mode()
	else:
		build_menu.show_menu()

func _on_machine_selected(machine_type: String) -> void:
	var player := get_tree().get_first_node_in_group("player") as Player
	if player:
		player.enter_build_mode(machine_type, build_menu.get_direction())
	# Keep build_menu visible so player can change direction

func _on_build_cancelled() -> void:
	var player := get_tree().get_first_node_in_group("player") as Player
	if player:
		player.exit_build_mode()

func _on_state_changed(new_state: GameManager.State) -> void:
	match new_state:
		GameManager.State.PLAYING:
			hud.visible = true
		GameManager.State.PAUSED:
			pass
		GameManager.State.MAIN_MENU:
			if _world_scene:
				_world_scene.queue_free()
				_world_scene = null

func _on_vehicle_node_spawned(_ignored, vs: VehicleState) -> void:
	# Wait a frame so World._on_vehicle_spawned has run and added the node
	await get_tree().process_frame
	if _world_scene == null:
		return
	if not _world_scene.has_method("get_vehicle_node"):
		return
	var vehicle_node: Node = _world_scene.get_vehicle_node(vs)
	if vehicle_node == null:
		return

	# Connect mount/dismount signals to show/hide the vehicle HUD (rideable vehicles only)
	if vehicle_node.has_signal("player_mounted"):
		vehicle_node.player_mounted.connect(func(_player):
			vehicle_hud.show_vehicle_hud(vehicle_node)
		)
	if vehicle_node.has_signal("player_dismounted"):
		vehicle_node.player_dismounted.connect(func(_player):
			vehicle_hud.hide_vehicle_hud()
		)

# Spawns a vehicle near the player based on an item_id string.
# Useful for debug/testing. Call from the console or a debug button.
func spawn_vehicle_from_item(item_id: String) -> void:
	var player := get_tree().get_first_node_in_group("player")
	var spawn_pos := Vector2.ZERO
	if player:
		spawn_pos = player.global_position + Vector2(3 * Constants.TILE_SIZE, 0)

	var vs := VehicleState.new()
	vs.position = spawn_pos

	match item_id:
		"mining_cart":
			vs.vehicle_type = VehicleState.VehicleType.MINING_CART
		"drill_vehicle":
			vs.vehicle_type = VehicleState.VehicleType.DRILL_VEHICLE
		"hover_vehicle":
			vs.vehicle_type = VehicleState.VehicleType.HOVER_VEHICLE
		_:
			push_warning("Main.spawn_vehicle_from_item: unknown item_id '%s'" % item_id)
			return

	WorldManager.spawn_vehicle(vs)

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("inventory"):
		_toggle_inventory()
	elif event.is_action_pressed("crafting"):
		_toggle_crafting()
