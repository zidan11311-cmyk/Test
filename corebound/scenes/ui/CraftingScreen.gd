extends Control

const Recipe = preload("res://scripts/core/Recipe.gd")

@onready var recipe_list: VBoxContainer = $ScrollContainer/RecipeList
@onready var close_btn: Button = $CloseButton
@onready var status_label: Label = $StatusLabel

func _ready() -> void:
    close_btn.pressed.connect(func(): visible = false)
    CraftingManager.crafting_completed.connect(_on_craft_done)
    CraftingManager.crafting_failed.connect(_on_craft_failed)
    visible = false

func show_crafting() -> void:
    visible = true
    _refresh_recipes()

func _refresh_recipes() -> void:
    for child in recipe_list.get_children():
        child.queue_free()

    var recipes := CraftingManager.get_craftable_hand_recipes()
    if recipes.is_empty():
        var lbl := Label.new()
        lbl.text = "No hand recipes available yet.\nMine resources to unlock crafting."
        recipe_list.add_child(lbl)
        return

    for entry in recipes:
        var recipe: Recipe = entry["recipe"]
        var can_craft: bool = entry["can_craft"]

        var row := HBoxContainer.new()
        recipe_list.add_child(row)

        var info := VBoxContainer.new()
        info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
        row.add_child(info)

        var name_label := Label.new()
        name_label.text = recipe.display_name
        name_label.add_theme_font_size_override("font_size", 14)
        info.add_child(name_label)

        var inputs_str := ""
        for inp in recipe.inputs:
            var def := CraftingManager.get_item_definition(inp["item"])
            var n: String = inp["item"] if def == null else def.display_name
            var have := InventoryManager.count_item(inp["item"])
            inputs_str += "%s: %d/%d  " % [n, have, inp["count"]]
        var inputs_label := Label.new()
        inputs_label.text = inputs_str
        inputs_label.add_theme_font_size_override("font_size", 11)
        info.add_child(inputs_label)

        var craft_btn := Button.new()
        craft_btn.text = "Craft x1"
        craft_btn.disabled = not can_craft
        craft_btn.pressed.connect(_on_craft_pressed.bind(recipe.id, 1))
        row.add_child(craft_btn)

        var craft10_btn := Button.new()
        craft10_btn.text = "x10"
        craft10_btn.disabled = not can_craft
        craft10_btn.pressed.connect(_on_craft_pressed.bind(recipe.id, 10))
        row.add_child(craft10_btn)

        # Separator
        var sep := HSeparator.new()
        recipe_list.add_child(sep)

func _on_craft_pressed(recipe_id: String, count: int) -> void:
    CraftingManager.craft(recipe_id, count)
    _refresh_recipes()

func _on_craft_done(recipe_id: String, count: int) -> void:
    var recipe := CraftingManager.get_recipe(recipe_id)
    var name: String = recipe_id if recipe == null else recipe.display_name
    status_label.text = "Crafted: %s x%d" % [name, count]
    status_label.visible = true
    await get_tree().create_timer(2.0).timeout
    if is_instance_valid(status_label):
        status_label.visible = false

func _on_craft_failed(recipe_id: String, reason: String) -> void:
    status_label.text = "Cannot craft: " + reason
    status_label.visible = true
    await get_tree().create_timer(2.0).timeout
    if is_instance_valid(status_label):
        status_label.visible = false
