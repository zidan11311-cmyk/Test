class_name BeltSegment

# A contiguous run of conveyor belt tiles in one direction.
# Items are represented as { "item": String, "pos": float } where pos is 0.0 (input end) to length (output end).

const ITEM_SPACING := 0.35      # minimum distance between items (in tiles)

var length: int = 1             # number of belt tiles
var direction: Vector2i         # +x, -x, +y, -y
var speed: float = 1.0          # tiles per second
var items: Array = []           # sorted by pos ascending

# Called each tick by MachineProcessor
func tick(dt: float) -> void:
	if items.is_empty():
		return
	# Move from back to front to handle back-pressure correctly
	for i in range(items.size() - 1, -1, -1):
		var item: Dictionary = items[i]
		var target_pos: float = item["pos"] + speed * dt
		# Clamp to not pass next item (back-pressure)
		if i + 1 < items.size():
			var next_item: Dictionary = items[i + 1]
			target_pos = min(target_pos, next_item["pos"] - ITEM_SPACING)
		# Clamp to belt length (item at end waits for output)
		target_pos = min(target_pos, float(length))
		item["pos"] = target_pos

func try_push_item(item_id: String) -> bool:
	# Push item onto the input end (pos=0)
	if not items.is_empty():
		var first_item: Dictionary = items[0]
		if first_item["pos"] < ITEM_SPACING:
			return false  # No space at input
	items.insert(0, { "item": item_id, "pos": 0.0 })
	return true

func try_pop_output() -> Dictionary:
	# Pop item from output end if it has reached the end
	if items.is_empty():
		return {}
	var last_item: Dictionary = items[items.size() - 1]
	if last_item["pos"] >= float(length):
		items.pop_back()
		return last_item
	return {}

func peek_output() -> Dictionary:
	if items.is_empty():
		return {}
	return items[items.size() - 1]

func is_empty() -> bool:
	return items.is_empty()

func item_count() -> int:
	return items.size()

func serialize() -> Array:
	return items.duplicate(true)

static func deserialize(data: Array, seg_length: int, seg_dir: Vector2i, seg_speed: float) -> BeltSegment:
	var seg := BeltSegment.new()
	seg.length = seg_length
	seg.direction = seg_dir
	seg.speed = seg_speed
	seg.items = data.duplicate(true)
	return seg
