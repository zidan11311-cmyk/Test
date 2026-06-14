extends CanvasLayer

@onready var fuel_bar: ProgressBar = $FuelBar
@onready var fuel_label: Label = $FuelLabel
@onready var hp_bar: ProgressBar = $HPBar
@onready var vehicle_label: Label = $VehicleLabel
@onready var dismount_btn: Button = $DismountButton

var _tracked_vehicle: Node = null

func _ready() -> void:
	visible = false
	dismount_btn.pressed.connect(_on_dismount)

func _process(_delta: float) -> void:
	if not visible:
		return
	if _tracked_vehicle == null or not is_instance_valid(_tracked_vehicle):
		hide_vehicle_hud()
		return
	var vs: VehicleState = _tracked_vehicle.vehicle_state
	if vs == null:
		return
	fuel_bar.max_value = vs.max_fuel
	fuel_bar.value = vs.fuel
	fuel_label.text = "%.1f / %.1f kWh" % [vs.fuel, vs.max_fuel]
	hp_bar.max_value = vs.max_hp
	hp_bar.value = vs.hp

func show_vehicle_hud(vehicle_node: Node) -> void:
	_tracked_vehicle = vehicle_node
	var vs: VehicleState = vehicle_node.vehicle_state
	var names := ["Mining Cart", "Drill Vehicle", "Hover Vehicle"]
	vehicle_label.text = names[vs.vehicle_type] + " Mk" + str(vs.upgrade_level)
	visible = true

func hide_vehicle_hud() -> void:
	_tracked_vehicle = null
	visible = false

func _on_dismount() -> void:
	if _tracked_vehicle == null:
		return
	var player := get_tree().get_first_node_in_group("player")
	if player and _tracked_vehicle.has_method("dismount"):
		_tracked_vehicle.dismount(player)
	hide_vehicle_hud()
