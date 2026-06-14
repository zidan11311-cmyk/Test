class_name MachineProcessor

const MachineState = preload("res://scripts/core/MachineState.gd")

# Smelting recipe lookup: input_item_id -> { output_item, time }
const SMELT_RECIPES := {
	"iron_ore":     { "output": "iron_plate",     "time": 2.0 },
	"copper_ore":   { "output": "copper_plate",   "time": 2.0 },
	"tin_ore":      { "output": "tin_plate",       "time": 2.0 },
	"silver_ore":   { "output": "silver_plate",    "time": 3.0 },
	"gold_ore":     { "output": "gold_plate",      "time": 4.0 },
	"aluminum_ore": { "output": "aluminum_plate",  "time": 3.0 },
	"sand":         { "output": "glass",           "time": 2.0 },
	"clay":         { "output": "brick",           "time": 2.0 },
	"wood":         { "output": "charcoal",        "time": 1.5 },
}

const FUEL_VALUES := {
	"coal":     0.5,
	"charcoal": 0.3,
	"wood":     0.1,
}

const COAL_GENERATOR_KW := 5.0
const COAL_GENERATOR_FUEL_PER_KW := 0.1  # kWh of coal consumed per kWh generated

static func process_machine(ms: MachineState, world_tile: Vector2i, dt: float) -> void:
	match ms.machine_type:
		"mining_drill_mk1", "mining_drill_mk2":
			_tick_drill(ms, world_tile, dt)
		"stone_furnace":
			_tick_stone_furnace(ms, dt)
		"electric_furnace":
			_tick_electric_furnace(ms, dt)
		"assembler_mk1":
			_tick_assembler(ms, dt)
		"coal_generator":
			_tick_coal_generator(ms, world_tile, dt)
		"wooden_chest", "iron_chest":
			pass  # Storage only, no tick behavior
		"conveyor_belt", "fast_belt":
			pass  # Handled by BeltProcessor

static func _tick_drill(ms: MachineState, world_tile: Vector2i, dt: float) -> void:
	# Drill mines the block directly below it
	var ratio := ms.power_ratio
	if ratio <= 0.0:
		ms.is_active = false
		return

	# Check output buffer — if full, pause
	var out := ms.get_output(0)
	if not out.is_empty() and out["count"] >= 20:
		ms.is_active = false
		return

	var drill_power := 30.0 if ms.machine_type == "mining_drill_mk1" else 60.0
	var target_tile := world_tile + Vector2i(0, 1)  # block directly below
	var block := WorldManager.get_block(target_tile)

	if block == null or block.is_air():
		# Nothing to mine
		ms.is_active = false
		return

	ms.is_active = true
	ms.progress += drill_power * ratio * dt

	if ms.progress >= block.max_hp:
		ms.progress = 0.0
		var drop := block.get_drop()
		if not drop.is_empty():
			var count := randi_range(drop["min"], drop["max"])
			var item_id: String = drop["item"]
			# Push to output buffer
			var cur_out := ms.get_output(0)
			if cur_out.is_empty():
				ms.set_output(0, item_id, count)
			elif cur_out["item"] == item_id:
				ms.set_output(0, item_id, cur_out["count"] + count)
		# Remove the mined block
		WorldManager.set_block(target_tile, "air")
		# Track drill depth
		ms.custom["drill_depth"] = ms.custom.get("drill_depth", 0) + 1

static func _tick_stone_furnace(ms: MachineState, dt: float) -> void:
	# Input slot 0: ore, Input slot 1: fuel
	# Output slot 0: plate

	# Load fuel if fuel tank low
	if ms.fuel_kwh < 0.1:
		var fuel_slot := ms.get_input(1)
		if not fuel_slot.is_empty():
			var fuel_val: float = FUEL_VALUES.get(fuel_slot["item"], 0.0)
			if fuel_val > 0.0:
				ms.fuel_kwh += fuel_val
				var new_count: int = (fuel_slot["count"] as int) - 1
				if new_count <= 0:
					ms.set_input(1, "", 0)
				else:
					ms.set_input(1, fuel_slot["item"], new_count)

	if ms.fuel_kwh <= 0.0:
		ms.is_active = false
		return

	var ore_slot := ms.get_input(0)
	if ore_slot.is_empty():
		ms.is_active = false
		return

	var recipe: Dictionary = SMELT_RECIPES.get(ore_slot["item"], {})
	if recipe.is_empty():
		ms.is_active = false
		return

	# Check output not full
	var out := ms.get_output(0)
	if not out.is_empty() and (out["item"] != recipe["output"] or out["count"] >= 50):
		ms.is_active = false
		return

	ms.is_active = true
	var smelt_time: float = recipe["time"]
	ms.fuel_kwh -= dt * 0.25  # consume ~0.25 kWh/s while running
	ms.progress += dt / smelt_time

	if ms.progress >= 1.0:
		ms.progress = 0.0
		# Consume one ore
		var new_count: int = (ore_slot["count"] as int) - 1
		if new_count <= 0:
			ms.set_input(0, "", 0)
		else:
			ms.set_input(0, ore_slot["item"], new_count)
		# Add one plate to output
		var cur_out := ms.get_output(0)
		if cur_out.is_empty():
			ms.set_output(0, recipe["output"], 1)
		else:
			ms.set_output(0, recipe["output"], (cur_out["count"] as int) + 1)

static func _tick_electric_furnace(ms: MachineState, dt: float) -> void:
	var ratio := ms.power_ratio
	if ratio <= 0.0:
		ms.is_active = false
		return

	var ore_slot := ms.get_input(0)
	if ore_slot.is_empty():
		ms.is_active = false
		return

	var recipe: Dictionary = SMELT_RECIPES.get(ore_slot["item"], {})
	if recipe.is_empty():
		ms.is_active = false
		return

	var out := ms.get_output(0)
	if not out.is_empty() and (out["item"] != recipe["output"] or out["count"] >= 50):
		ms.is_active = false
		return

	ms.is_active = true
	var smelt_time: float = recipe["time"] * 0.5  # Electric is 2x faster
	ms.progress += ratio * dt / smelt_time

	if ms.progress >= 1.0:
		ms.progress = 0.0
		var new_count: int = (ore_slot["count"] as int) - 1
		if new_count <= 0:
			ms.set_input(0, "", 0)
		else:
			ms.set_input(0, ore_slot["item"], new_count)
		var cur_out := ms.get_output(0)
		if cur_out.is_empty():
			ms.set_output(0, recipe["output"], 1)
		else:
			ms.set_output(0, recipe["output"], (cur_out["count"] as int) + 1)

static func _tick_assembler(ms: MachineState, dt: float) -> void:
	var ratio := ms.power_ratio
	if ratio <= 0.0:
		ms.is_active = false
		return

	# Assembler needs a recipe set in custom["recipe_id"]
	var recipe_id: String = ms.custom.get("recipe_id", "")
	if recipe_id.is_empty():
		ms.is_active = false
		return

	var recipe := CraftingManager.get_recipe(recipe_id)
	if recipe == null or recipe.machine_type != "assembler":
		ms.is_active = false
		return

	# Check all inputs available
	for i in recipe.inputs.size():
		var needed = recipe.inputs[i]
		var slot := ms.get_input(i)
		if slot.is_empty() or slot["item"] != needed["item"] or slot["count"] < needed["count"]:
			ms.is_active = false
			return

	# Check output
	var out := ms.get_output(0)
	if not out.is_empty() and (out["item"] != recipe.output_item or out["count"] >= 50):
		ms.is_active = false
		return

	ms.is_active = true
	ms.progress += ratio * dt / recipe.craft_time

	if ms.progress >= 1.0:
		ms.progress = 0.0
		# Consume inputs
		for i in recipe.inputs.size():
			var needed = recipe.inputs[i]
			var slot := ms.get_input(i)
			var new_count: int = (slot["count"] as int) - (needed["count"] as int)
			if new_count <= 0:
				ms.set_input(i, "", 0)
			else:
				ms.set_input(i, slot["item"], new_count)
		# Add output
		var cur_out := ms.get_output(0)
		if cur_out.is_empty():
			ms.set_output(0, recipe.output_item, recipe.output_count)
		else:
			ms.set_output(0, recipe.output_item, cur_out["count"] + recipe.output_count)

static func _tick_coal_generator(ms: MachineState, world_tile: Vector2i, dt: float) -> void:
	# Load coal into fuel tank
	if ms.fuel_kwh < 1.0:
		var coal_slot := ms.get_input(0)
		if not coal_slot.is_empty() and coal_slot["item"] == "coal":
			ms.fuel_kwh += FUEL_VALUES["coal"]
			var new_count: int = (coal_slot["count"] as int) - 1
			if new_count <= 0:
				ms.set_input(0, "", 0)
			else:
				ms.set_input(0, "coal", new_count)

	ms.is_active = ms.fuel_kwh > 0.0
	if ms.is_active:
		ms.fuel_kwh -= COAL_GENERATOR_KW * COAL_GENERATOR_FUEL_PER_KW * dt
		ms.fuel_kwh = max(ms.fuel_kwh, 0.0)
