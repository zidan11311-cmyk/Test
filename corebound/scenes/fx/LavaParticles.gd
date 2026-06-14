class_name LavaParticles
extends CPUParticles2D

const Constants = preload("res://scripts/core/Constants.gd")

func _ready() -> void:
    emitting = true
    one_shot = false
    explosiveness = 0.0
    amount = 12
    lifetime = 0.8
    emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
    emission_rect_extents = Vector2(Constants.TILE_SIZE * 0.5, 2.0)

    direction = Vector2(0, -1)
    spread = 30.0
    initial_velocity_min = 30.0
    initial_velocity_max = 70.0
    gravity = Vector2(0, 200)

    scale_amount_min = 2.0
    scale_amount_max = 6.0

    # Orange/red gradient
    color_ramp = _make_lava_gradient()

func _make_lava_gradient() -> Gradient:
    var g := Gradient.new()
    g.set_color(0, Color(1.0, 0.6, 0.1, 1.0))
    g.add_point(0.6, Color(0.9, 0.2, 0.0, 0.8))
    g.add_point(1.0, Color(0.4, 0.0, 0.0, 0.0))
    return g
