import { useEffect, useRef } from "react";

import { mountColorField } from "./shader";

const MOBILE_QUERY = "(max-width: 767px)";

export function ColorField() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const node = canvasRef.current;
		if (!(node instanceof HTMLCanvasElement)) return;
		const canvas: HTMLCanvasElement = node;

		const section = canvas.parentElement;
		const mobile = window.matchMedia(MOBILE_QUERY);
		let field: ReturnType<typeof mountColorField> | undefined;

		function sync() {
			field?.dispose();
			field = undefined;
			if (mobile.matches) {
				section?.classList.add("is-static");
				return;
			}
			field = mountColorField(canvas) ?? undefined;
			section?.classList.toggle("is-static", field === undefined);
		}

		sync();
		mobile.addEventListener("change", sync);
		return () => {
			mobile.removeEventListener("change", sync);
			field?.dispose();
			section?.classList.remove("is-static");
		};
	}, []);

	return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
