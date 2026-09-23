import fragmentSource from "./shaders/fragment.frag?raw";
import vertexSource from "./shaders/vertex.vert?raw";

const COL1 = [232, 64, 13] as const;
const COL2 = [255, 238, 216] as const;
const COL3 = [208, 178, 255] as const;

const MOUSE_LERP = 0.025;
const TIME_SCALE = 0.0025;
const MAX_DPR = 2;

const GL_OPTIONS: WebGLContextAttributes = {
	antialias: false,
	alpha: true,
	powerPreference: "low-power",
};

const QUAD = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);

export type ColorField = {
	dispose: () => void;
};

export function mountColorField(canvas: HTMLCanvasElement): ColorField | null {
	const gl = canvas.getContext("webgl2", GL_OPTIONS);
	if (gl === null) {
		return null;
	}
	return runColorField(canvas, gl);
}

function runColorField(
	canvas: HTMLCanvasElement,
	gl: WebGL2RenderingContext,
): ColorField | null {
	const vertexShader = compile(gl, gl.VERTEX_SHADER, vertexSource);
	const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
	if (!vertexShader || !fragmentShader) {
		if (vertexShader) gl.deleteShader(vertexShader);
		if (fragmentShader) gl.deleteShader(fragmentShader);
		return null;
	}

	const program = link(gl, vertexShader, fragmentShader);
	if (!program) {
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return null;
	}

	const aPosition = gl.getAttribLocation(program, "aPosition");
	const buffer = gl.createBuffer();
	if (aPosition < 0 || !buffer) {
		gl.deleteProgram(program);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		if (buffer) gl.deleteBuffer(buffer);
		return null;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);

	const uResolution = gl.getUniformLocation(program, "u_resolution");
	const uTime = gl.getUniformLocation(program, "u_time");
	const uMouse = gl.getUniformLocation(program, "u_mouse");
	const uDpr = gl.getUniformLocation(program, "u_dpr");
	const uCol1 = gl.getUniformLocation(program, "u_col1");
	const uCol2 = gl.getUniformLocation(program, "u_col2");
	const uCol3 = gl.getUniformLocation(program, "u_col3");

	gl.useProgram(program);
	gl.enableVertexAttribArray(aPosition);
	gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
	gl.uniform3f(uCol1, COL1[0], COL1[1], COL1[2]);
	gl.uniform3f(uCol2, COL2[0], COL2[1], COL2[2]);
	gl.uniform3f(uCol3, COL3[0], COL3[1], COL3[2]);

	const reduceMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;

	let dpr = 1;
	let disposed = false;
	let onScreen = true;
	let faded = false;
	let raf = 0;
	let resizeRaf = 0;
	const start = performance.now();
	const mouseTarget = { x: 0, y: 0 };
	const mouse = { x: 0, y: 0 };

	function applySize() {
		const rect = canvas.getBoundingClientRect();
		dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
		const width = Math.max(1, Math.floor(rect.width * dpr));
		const height = Math.max(1, Math.floor(rect.height * dpr));
		if (canvas.width !== width) canvas.width = width;
		if (canvas.height !== height) canvas.height = height;
		gl.viewport(0, 0, width, height);
		gl.uniform2f(uResolution, width, height);
		gl.uniform1f(uDpr, dpr);
		if (reduceMotion) {
			mouseTarget.x = width / 2;
			mouseTarget.y = height / 2;
			mouse.x = mouseTarget.x;
			mouse.y = mouseTarget.y;
		}
	}

	function draw(now: number) {
		mouse.x += (mouseTarget.x - mouse.x) * MOUSE_LERP;
		mouse.y += (mouseTarget.y - mouse.y) * MOUSE_LERP;
		gl.uniform1f(uTime, TIME_SCALE * (now - start));
		gl.uniform2f(uMouse, mouse.x, mouse.y);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		if (!faded) {
			faded = true;
			canvas.classList.add("is-ready");
		}
	}

	function loop(now: number) {
		raf = 0;
		if (disposed) return;
		draw(now);
		if (!reduceMotion && onScreen && !document.hidden) {
			raf = requestAnimationFrame(loop);
		}
	}

	function play() {
		if (disposed || reduceMotion || raf !== 0) return;
		if (!onScreen || document.hidden) return;
		raf = requestAnimationFrame(loop);
	}

	function pause() {
		if (raf === 0) return;
		cancelAnimationFrame(raf);
		raf = 0;
	}

	function onMouse(event: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		mouseTarget.x = (event.clientX - rect.left) * dpr;
		mouseTarget.y = (event.clientY - rect.top) * dpr;
	}

	function onResize() {
		if (resizeRaf !== 0) return;
		resizeRaf = requestAnimationFrame(() => {
			resizeRaf = 0;
			if (disposed) return;
			applySize();
			if (reduceMotion) draw(performance.now());
		});
	}

	function onVisibility() {
		if (document.hidden) pause();
		else play();
	}

	applySize();
	mouseTarget.x = canvas.width / 2;
	mouseTarget.y = canvas.height / 2;
	mouse.x = mouseTarget.x;
	mouse.y = mouseTarget.y;

	window.addEventListener("mousemove", onMouse, { passive: true });
	window.addEventListener("resize", onResize, { passive: true });
	document.addEventListener("visibilitychange", onVisibility);

	const io = new IntersectionObserver(
		(entries) => {
			const entry = entries[0];
			if (!entry) return;
			onScreen = entry.isIntersecting;
			if (onScreen) play();
			else pause();
		},
		{ rootMargin: "100px" },
	);
	io.observe(canvas);

	if (reduceMotion) {
		draw(performance.now());
	} else {
		play();
	}

	function dispose() {
		if (disposed) return;
		disposed = true;
		pause();
		if (resizeRaf !== 0) {
			cancelAnimationFrame(resizeRaf);
			resizeRaf = 0;
		}
		window.removeEventListener("mousemove", onMouse);
		window.removeEventListener("resize", onResize);
		document.removeEventListener("visibilitychange", onVisibility);
		io.disconnect();
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.useProgram(null);
		gl.deleteBuffer(buffer);
		gl.deleteProgram(program);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		canvas.classList.remove("is-ready");
	}

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			dispose();
		});
	}

	return { dispose };
}

function compile(
	gl: WebGL2RenderingContext,
	type: number,
	source: string,
): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function link(
	gl: WebGL2RenderingContext,
	vertexShader: WebGLShader,
	fragmentShader: WebGLShader,
): WebGLProgram | null {
	const program = gl.createProgram();
	if (!program) return null;
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		gl.deleteProgram(program);
		return null;
	}
	return program;
}
