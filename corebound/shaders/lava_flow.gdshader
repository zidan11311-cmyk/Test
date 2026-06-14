shader_type canvas_item;

uniform float scroll_speed : hint_range(0.0, 2.0) = 0.3;
uniform float glow_strength : hint_range(0.0, 3.0) = 1.5;
uniform vec4 lava_hot : source_color = vec4(1.0, 0.6, 0.05, 1.0);
uniform vec4 lava_cool : source_color = vec4(0.6, 0.08, 0.0, 1.0);

// Simple hash-based noise
float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1,0)), f.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
        f.y
    );
}

void fragment() {
    vec2 uv = UV;
    uv.x += TIME * scroll_speed;
    uv.y += TIME * scroll_speed * 0.4;

    float n = noise(uv * 3.0) * 0.5 + noise(uv * 6.0) * 0.3 + noise(uv * 12.0) * 0.2;
    float pulse = sin(TIME * 2.0 + UV.y * 5.0) * 0.1 + 0.9;
    n *= pulse;

    vec4 col = mix(lava_cool, lava_hot, n);
    col.rgb *= (1.0 + glow_strength * n * 0.5);
    COLOR = col;
}
