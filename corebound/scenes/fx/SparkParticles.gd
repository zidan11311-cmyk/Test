class_name SparkParticles
extends CPUParticles2D

func _ready() -> void:
    emitting = false
    one_shot = true
    explosiveness = 0.98
    amount = 8
    lifetime = 0.2

    emission_shape = CPUParticles2D.EMISSION_SHAPE_SPHERE
    emission_sphere_radius = 2.0

    direction = Vector2(0, -1)
    spread = 180.0
    initial_velocity_min = 80.0
    initial_velocity_max = 200.0
    gravity = Vector2(0, 500)

    scale_amount_min = 1.0
    scale_amount_max = 3.0

    color = Color(1.0, 0.9, 0.3)

    finished.connect(queue_free)

static func spawn(parent: Node, world_pos: Vector2) -> void:
    var p := SparkParticles.new()
    parent.add_child(p)
    p.global_position = world_pos
    p.emitting = true
