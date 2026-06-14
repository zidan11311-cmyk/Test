shader_type canvas_item;

uniform vec4 top_color : source_color = vec4(0.1, 0.1, 0.15, 1.0);
uniform vec4 bottom_color : source_color = vec4(0.05, 0.05, 0.08, 1.0);
uniform float vignette_strength : hint_range(0.0, 2.0) = 0.6;
uniform float noise_scale : hint_range(0.0, 10.0) = 3.0;
uniform float noise_strength : hint_range(0.0, 0.2) = 0.05;

float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

void fragment() {
    vec4 base = mix(top_color, bottom_color, UV.y);

    // Rock texture noise
    float n = hash(UV * noise_scale) * noise_strength;
    base.rgb += n;

    // Vignette
    vec2 vUV = UV * 2.0 - 1.0;
    float vign = 1.0 - dot(vUV * 0.5, vUV * 0.5) * vignette_strength;
    base.rgb *= clamp(vign, 0.0, 1.0);

    COLOR = base;
}
