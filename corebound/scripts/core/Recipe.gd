class_name Recipe extends Resource

@export var id: String = ""
@export var display_name: String = ""
@export var output_item: String = ""
@export var output_count: int = 1
@export var inputs: Array = []              # Array of { "item": String, "count": int }
@export var machine_type: String = "hand"   # hand | furnace | electric_furnace | assembler | ...
@export var craft_time: float = 1.0
@export var tech_required: String = ""

func can_craft_with(inventory_counts: Dictionary) -> bool:
	for input in inputs:
		var have: int = inventory_counts.get(input["item"], 0)
		if have < input["count"]:
			return false
	return true

func get_input_count(item_id: String) -> int:
	for input in inputs:
		if input["item"] == item_id:
			return input["count"]
	return 0
