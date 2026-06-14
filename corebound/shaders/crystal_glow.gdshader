shader_type canvas_item;

uniform float pulse_speed : hint_range(0.5, 5.0) = 2.0;
uniform float glow_amount : hint_range(0.0, 2.0) = 0.8;
uniform vec4 glow_color : source_color = vec4(0.3, 0.9, 1.0, 1.0);
uniform vec4 base_color : source_color = vec4(0.2, 0.6, 0.8, 1.0);

void fragment() {
    float pulse = sin(TIME * pulse_speed + UV.x * 3.0 + UV.y * 2.0) * 0.5 + 0.5;
    vec4 col = mix(base_color, glow_color, pulse * glow_amount);
    col.rgb += glow_color.rgb * pulse * 0.3;
    COLOR = col * COLOR;
}
