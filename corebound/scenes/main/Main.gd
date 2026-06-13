extends Node

@onready var hud: CanvasLayer = $HUD
@onready var inventory_screen: Control = $InventoryScreen
@onready var crafting_screen: Control = $CraftingScreen
@onready var background: ColorRect = $Background

var _world_scene: Node = null

func _ready() -> void:
	GameManager.state_changed.connect(_on_state_changed)
	_connect_hud_buttons()

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

func _connect_hud_buttons() -> void:
	# Connect after HUD is ready
	await hud.ready
	if hud.has_node("JumpButton"):
		hud.get_node("JumpButton").pressed.connect(_on_jump_button)
	if hud.has_node("InventoryButton"):
		hud.get_node("InventoryButton").pressed.connect(_toggle_inventory)
	if hud.has_node("CraftingButton"):
		hud.get_node("CraftingButton").pressed.connect(_toggle_crafting)

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

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("inventory"):
		_toggle_inventory()
	elif event.is_action_pressed("crafting"):
		_toggle_crafting()
