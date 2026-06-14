extends Node

signal crafting_completed(recipe_id: String, count: int)
signal crafting_failed(recipe_id: String, reason: String)

var _recipes: Dictionary = {}           # recipe_id -> Recipe
var _recipes_by_machine: Dictionary = {} # machine_type -> Array[Recipe]
var _items: Dictionary = {}             # item_id -> ItemDefinition

func _ready() -> void:
	_load_items()
	_load_recipes()

func _load_items() -> void:
	var path := "res://data/items.json"
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("CraftingManager: cannot open " + path)
		return
	var text := file.read_as_text()
	file.close()
	var parsed := JSON.parse_string(text)
	if parsed == null:
		push_error("CraftingManager: invalid JSON in items.json")
		return
	for item_data in parsed:
		var def := ItemDefinition.new()
		def.id = item_data["id"]
		def.display_name = item_data.get("display_name", def.id)
		def.category = item_data.get("category", "resource")
		def.tier = item_data.get("tier", 0)
		def.stack_max = item_data.get("stack_max", 500)
		def.fuel_value = item_data.get("fuel_value", 0.0)
		def.description = item_data.get("description", "")
		var c: Array = item_data.get("color", [1.0, 1.0, 1.0, 1.0])
		def.color = Color(c[0], c[1], c[2], c[3] if c.size() > 3 else 1.0)
		_items[def.id] = def

func _load_recipes() -> void:
	var path := "res://data/recipes.json"
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("CraftingManager: cannot open " + path)
		return
	var text := file.read_as_text()
	file.close()
	var parsed := JSON.parse_string(text)
	if parsed == null:
		push_error("CraftingManager: invalid JSON in recipes.json")
		return
	for r_data in parsed:
		var recipe := Recipe.new()
		recipe.id = r_data["id"]
		recipe.display_name = r_data.get("display_name", recipe.id)
		recipe.output_item = r_data["output_item"]
		recipe.output_count = r_data.get("output_count", 1)
		recipe.inputs = r_data.get("inputs", [])
		recipe.machine_type = r_data.get("machine_type", "hand")
		recipe.craft_time = r_data.get("craft_time", 1.0)
		recipe.tech_required = r_data.get("tech_required", "")
		_recipes[recipe.id] = recipe
		if not _recipes_by_machine.has(recipe.machine_type):
			_recipes_by_machine[recipe.machine_type] = []
		_recipes_by_machine[recipe.machine_type].append(recipe)

func get_craftable_hand_recipes() -> Array:
	var result := []
	var counts := InventoryManager.get_all_counts()
	for recipe in _recipes_by_machine.get("hand", []):
		if _is_tech_unlocked(recipe.tech_required):
			result.append({ "recipe": recipe, "can_craft": recipe.can_craft_with(counts) })
	return result

func can_craft(recipe_id: String) -> bool:
	var recipe: Recipe = _recipes.get(recipe_id)
	if recipe == null:
		return false
	if not _is_tech_unlocked(recipe.tech_required):
		return false
	return recipe.can_craft_with(InventoryManager.get_all_counts())

func craft(recipe_id: String, count: int = 1) -> bool:
	var recipe: Recipe = _recipes.get(recipe_id)
	if recipe == null:
		emit_signal("crafting_failed", recipe_id, "Recipe not found")
		AudioManager.play_sfx("craft_fail")
		return false
	if not _is_tech_unlocked(recipe.tech_required):
		emit_signal("crafting_failed", recipe_id, "Tech not unlocked")
		AudioManager.play_sfx("craft_fail")
		return false

	# Check if all ingredients are available x count
	var counts := InventoryManager.get_all_counts()
	for input in recipe.inputs:
		var needed: int = input["count"] * count
		if counts.get(input["item"], 0) < needed:
			emit_signal("crafting_failed", recipe_id, "Insufficient materials")
			AudioManager.play_sfx("craft_fail")
			return false

	# Deduct ingredients
	for input in recipe.inputs:
		InventoryManager.remove_item(input["item"], input["count"] * count)

	# Add output
	InventoryManager.add_item(recipe.output_item, recipe.output_count * count)
	emit_signal("crafting_completed", recipe_id, count)
	AudioManager.play_sfx("craft_done")
	SettingsManager.trigger_haptic(10)
	# Show tutorial hint after first craft
	var tutorial := Engine.get_main_loop().get_first_node_in_group("tutorial") if Engine.get_main_loop() is SceneTree else null
	if tutorial:
		tutorial.show_hint("build")
	return true

func get_recipe(id: String) -> Recipe:
	return _recipes.get(id)

func get_item_definition(item_id: String) -> ItemDefinition:
	return _items.get(item_id)

func get_all_items() -> Dictionary:
	return _items

func _is_tech_unlocked(tech_id: String) -> bool:
	if tech_id.is_empty():
		return true
	return tech_id in InventoryManager.player_state.tech_unlocked
