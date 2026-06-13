class_name ItemDefinition extends Resource

@export var id: String = ""
@export var display_name: String = ""
@export var category: String = "resource"   # resource | component | machine | vehicle_part | gear | tool | fuel
@export var tier: int = 0
@export var stack_max: int = 500
@export var is_placeable: bool = false
@export var fuel_value: float = 0.0         # kWh when used as fuel
@export var description: String = ""
@export var color: Color = Color.WHITE      # placeholder art color
