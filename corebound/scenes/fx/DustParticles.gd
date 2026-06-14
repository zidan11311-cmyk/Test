class_name DustParticles
extends CPUParticles2D

func _ready() -> void:
    emitting = false
    one_shot = true
    explosiveness = 0.9
    amount = 6
    lifetime = 0.3

    emission_shape = CPUParticles2D.EMISSION_SHAPE_SPHERE
    emission_sphere_radius = 8.0

    direction = Vector2(0, -1)
    spread = 100.0
    initial_velocity_min = 20.0
    initial_velocity_max = 50.0
    gravity = Vector2(0, 120)

    scale_amount_min = 2.0
    scale_amount_max = 4.0

    color = Color(0.75, 0.72, 0.65, 0.7)

    finished.connect(queue_free)

func puff(world_pos: Vector2) -> void:
    global_position = world_pos
    emitting = true

static func spawn(parent: Node, world_pos: Vector2) -> void:
    var p := DustParticles.new()
    parent.add_child(p)
    p.puff(world_pos)
