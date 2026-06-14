shader_type canvas_item;

uniform float ripple_speed : hint_range(0.1, 5.0) = 1.5;
uniform float ripple_amplitude : hint_range(0.0, 0.1) = 0.02;
uniform vec4 water_color : source_color = vec4(0.2, 0.5, 0.9, 0.8);
uniform vec4 water_highlight : source_color = vec4(0.4, 0.7, 1.0, 0.6);

void fragment() {
    vec2 uv = UV;
    uv.y += sin(UV.x * 10.0 + TIME * ripple_speed) * ripple_amplitude;
    uv.x += cos(UV.y * 8.0 + TIME * ripple_speed * 0.7) * ripple_amplitude;

    float highlight = sin(uv.x * 5.0 + TIME * 0.5) * 0.5 + 0.5;
    vec4 col = mix(water_color, water_highlight, highlight * 0.4);
    col.a = 0.82 + sin(TIME * 2.0 + UV.x * 3.0) * 0.06;
    COLOR = col;
}
