class_name BlockData

var tile_id: String
var hp: int
var max_hp: int
var metadata: Dictionary

func _init(p_tile_id: String) -> void:
	tile_id = p_tile_id
	max_hp = Constants.BLOCK_HP.get(tile_id, 100)
	hp = max_hp
	metadata = {}

func is_air() -> bool:
	return tile_id == "air" or hp <= 0

func get_drop() -> Dictionary:
	return Constants.BLOCK_DROPS.get(tile_id, {})

func serialize() -> Dictionary:
	return { "t": tile_id, "h": hp, "m": metadata }

static func deserialize(d: Dictionary) -> BlockData:
	var b := BlockData.new(d["t"])
	b.hp = d.get("h", b.max_hp)
	b.metadata = d.get("m", {})
	return b
