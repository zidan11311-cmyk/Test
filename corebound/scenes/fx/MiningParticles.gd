class_name MiningParticles
extends CPUParticles2D

func _ready() -> void:
    # One-shot burst
    emitting = false
    one_shot = true
    explosiveness = 0.95
    amount = 10
    lifetime = 0.45
    speed_scale = 1.0

    # Emission shape: small sphere at block center
    emission_shape = CPUParticles2D.EMISSION_SHAPE_SPHERE
    emission_sphere_radius = 4.0

    # Direction: burst upward-outward
    direction = Vector2(0, -1)
    spread = 180.0
    initial_velocity_min = 60.0
    initial_velocity_max = 140.0
    gravity = Vector2(0, 300)

    # Scale: small square chips
    scale_amount_min = 2.0
    scale_amount_max = 5.0

    # Color set by caller
    color = Color(0.5, 0.5, 0.5)

    # Auto-free when done
    finished.connect(queue_free)

func burst(world_pos: Vector2, block_color: Color) -> void:
    global_position = world_pos
    color = block_color
    emitting = true

# Static factory: spawn a burst at world_pos with the block's color
static func spawn(parent: Node, world_pos: Vector2, tile_id: String) -> void:
    var block_color: Color = Constants.TILE_COLORS.get(tile_id, Color(0.5, 0.5, 0.5))
    var particles := MiningParticles.new()
    parent.add_child(particles)
    particles.burst(world_pos, block_color)
