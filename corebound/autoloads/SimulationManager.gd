extends Node

signal tick_completed

var _accumulator: float = 0.0
var _tick_count: int = 0

func _process(delta: float) -> void:
	if GameManager.state != GameManager.State.PLAYING:
		return
	_accumulator += delta
	while _accumulator >= Constants.TICK_INTERVAL:
		_accumulator -= Constants.TICK_INTERVAL
		_run_tick()

func _run_tick() -> void:
	_tick_count += 1
	# Phase 3 MVP: no machines yet — tick is a heartbeat for future systems
	# Phase 4 will add: PowerManager.tick(), _tick_machines(), _tick_belts()
	emit_signal("tick_completed")

func get_tick_count() -> int:
	return _tick_count
