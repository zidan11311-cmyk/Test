class_name VirtualJoystick
extends Control

@export var deadzone: float = 10.0
@export var max_radius: float = 60.0
@export var base_color: Color = Color(1, 1, 1, 0.25)
@export var knob_color: Color = Color(1, 1, 1, 0.55)

var _active_touch: int = -1
var _origin: Vector2 = Vector2.ZERO
var _knob_pos: Vector2 = Vector2.ZERO

var _base_draw: ColorRect
var _knob_draw: ColorRect

func _ready() -> void:
    # Build two ColorRects as visual elements
    _base_draw = ColorRect.new()
    _base_draw.size = Vector2(max_radius * 2, max_radius * 2)
    _base_draw.color = base_color
    _base_draw.pivot_offset = Vector2(max_radius, max_radius)
    add_child(_base_draw)

    _knob_draw = ColorRect.new()
    var knob_size := max_radius * 0.55
    _knob_draw.size = Vector2(knob_size * 2, knob_size * 2)
    _knob_draw.color = knob_color
    _knob_draw.pivot_offset = Vector2(knob_size, knob_size)
    add_child(_knob_draw)

    _origin = size * 0.5
    _update_knob_visual(Vector2.ZERO)

func _input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        var e := event as InputEventScreenTouch
        var local_pos := get_local_mouse_position() if e.index == 0 else (e.position - global_position)
        # Use screen position converted to local
        var screen_local := e.position - global_position
        if e.pressed and _active_touch == -1:
            if Rect2(Vector2.ZERO, size).has_point(screen_local):
                _active_touch = e.index
                _origin = screen_local
                _update_knob_visual(Vector2.ZERO)
        elif not e.pressed and e.index == _active_touch:
            _active_touch = -1
            _origin = size * 0.5
            _update_knob_visual(Vector2.ZERO)
            InputManager.joystick_axis = Vector2.ZERO

    elif event is InputEventScreenDrag:
        var e := event as InputEventScreenDrag
        if e.index != _active_touch:
            return
        var drag_local := e.position - global_position
        var offset := drag_local - _origin
        if offset.length() < deadzone:
            InputManager.joystick_axis = Vector2.ZERO
            _update_knob_visual(Vector2.ZERO)
            return
        var clamped := offset.limit_length(max_radius)
        _update_knob_visual(clamped)
        InputManager.joystick_axis = clamped / max_radius

func _update_knob_visual(offset: Vector2) -> void:
    var knob_size := _knob_draw.size * 0.5
    _base_draw.position = _origin - Vector2(max_radius, max_radius)
    _knob_draw.position = _origin + offset - knob_size
