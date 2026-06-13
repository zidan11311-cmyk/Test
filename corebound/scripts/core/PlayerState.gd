class_name PlayerState

var hp: int = 100
var max_hp: int = 100
var heat_resistance: float = 0.0
var position: Vector2 = Vector2(256 * 32, 5 * 32)   # start near surface center
var inventory: Array = []    # 40 slots: { "item": String, "count": int } or {}
var hotbar_selection: int = 0
var tech_unlocked: Array = []
var research_points: int = 0
var equipped_gear: Dictionary = {
	"head": "", "chest": "", "legs": "", "boots": "",
	"accessory_1": "", "accessory_2": ""
}
var depth_reached_tiles: float = 0.0
var playtime_seconds: float = 0.0

func _init() -> void:
	inventory.resize(Constants.INVENTORY_SIZE)
	for i in Constants.INVENTORY_SIZE:
		inventory[i] = {}

func serialize() -> Dictionary:
	return {
		"hp": hp,
		"max_hp": max_hp,
		"heat_resistance": heat_resistance,
		"position": { "x": position.x, "y": position.y },
		"inventory": inventory,
		"hotbar_selection": hotbar_selection,
		"tech_unlocked": tech_unlocked,
		"research_points": research_points,
		"equipped_gear": equipped_gear,
		"depth_reached": depth_reached_tiles,
		"playtime": playtime_seconds,
	}

static func deserialize(d: Dictionary) -> PlayerState:
	var ps := PlayerState.new()
	ps.hp = d.get("hp", 100)
	ps.max_hp = d.get("max_hp", 100)
	ps.heat_resistance = d.get("heat_resistance", 0.0)
	var pos: Dictionary = d.get("position", { "x": 256 * 32, "y": 5 * 32 })
	ps.position = Vector2(pos["x"], pos["y"])
	ps.inventory = d.get("inventory", ps.inventory)
	ps.hotbar_selection = d.get("hotbar_selection", 0)
	ps.tech_unlocked = d.get("tech_unlocked", [])
	ps.research_points = d.get("research_points", 0)
	ps.equipped_gear = d.get("equipped_gear", ps.equipped_gear)
	ps.depth_reached_tiles = d.get("depth_reached", 0.0)
	ps.playtime_seconds = d.get("playtime", 0.0)
	return ps
