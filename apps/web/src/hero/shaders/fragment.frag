#version 300 es
precision highp float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_dpr;
uniform vec3 u_col1;
uniform vec3 u_col2;
uniform vec3 u_col3;

layout(location = 0) out vec4 fragColor;

float rand(vec2 co) {
	return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453) / u_dpr;
}

vec4 circle(vec2 st, vec2 center, float radius, float blur, vec3 col) {
	float dist = distance(st, center) * 2.0;
	vec4 f_col = vec4(1.0 - smoothstep(radius, radius + blur, dist));
	f_col.r *= col.r;
	f_col.g *= col.g;
	f_col.b *= col.b;
	return f_col;
}

void main() {
	vec2 fst = gl_FragCoord.xy / u_resolution.xy;
	float aspect = u_resolution.x / u_resolution.y;
	vec2 mst = fst;
	vec2 m = u_mouse.xy / u_resolution.xy;
	vec3 col1 = u_col1 / 255.;
	vec3 col2 = u_col2 / 255.;
	vec3 col3 = u_col3 / 255.;
	vec4 color = vec4(0.);
	vec2 purpleC = vec2(m.x, 1. - m.y);
	float purpleR = .75;
	float purpleB = .75;
	vec3 purpleCol = col1;
	vec2 mintC = vec2(
		.5 + sin(u_time * .4) * .5 * cos(u_time * .2) * .5,
		.5 + sin(u_time * .3) * .5 * cos(u_time * .5) * .5
	);
	float mintR = 1.;
	float mintB = 1.;
	vec3 mintCol = col2;
	vec2 greenC = vec2(
		(.5 + cos(u_time * .5) * .5 * sin(u_time * .2) * .5) * aspect,
		.5 + cos(u_time * .4) * (.5) * sin(u_time * .3) * .5
	);
	float greenR = 1.;
	float greenB = 1.;
	vec3 greenCol = col3;
	mst.x += cos(u_time * .37 + mst.x * 15.) * .21 *
		sin(u_time * .14 + mst.y * 7.) * .29 * (m.x - .5) * 12.;
	mst.y += sin(u_time * .15 + mst.x * 13.) * .37 *
		cos(u_time * .36 + mst.y * 5.) * .12 * (m.y - .5) * 12.;
	vec4 color1 = vec4(0.);
	vec4 color2 = vec4(0.);
	vec4 color3 = vec4(0.);
	vec4 color4 = vec4(0.);
	vec4 color5 = vec4(0.);
	color1 += vec4(
		(circle(mst, mintC, mintR, mintB, vec3(1.)) -
			circle(mst, mintC, mintR, mintB, vec3(1.)) *
				circle(mst, greenC, greenR, greenB, vec3(1.)))
	);
	color2 += vec4(
		(circle(mst, mintC, mintR, mintB, vec3(1.)) -
			circle(mst, mintC, mintR, mintB, vec3(1.)) *
				circle(mst, purpleC, purpleR, purpleB, vec3(1.)))
	);
	color1 -= color1 * color2;
	color2 -= color1 * color2;
	color3 = color1;
	color4 = color2;
	color3.rgb *= purpleCol;
	color4.rgb *= greenCol;
	color += color3;
	color += color4;
	color5 += vec4(
		(circle(mst, greenC, greenR, greenB, vec3(1.)) -
			circle(mst, greenC, greenR, greenB, vec3(1.)) *
				circle(mst, mintC, mintR, mintB, vec3(1.)))
	);
	color5 -= color1 * color2;
	color5.rgb *= mintCol;
	color += color5;
	color += circle(mst, mintC, mintR, mintB, mintCol) *
		(color1 - circle(mst, mintC, mintR, mintB, vec3(1.))) *
		(color2 - circle(mst, mintC, mintR, mintB, vec3(1.)));
	float noise = rand(fst * 10.) * .2;
	color.rgb *= 1. - vec3(noise);
	fragColor = color;
}
