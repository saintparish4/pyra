import { type RefObject, useLayoutEffect, useRef } from "react";

/**
 * Publishes the cursor's position within a container as `--glow-x` / `--glow-y`
 * so CSS can light whichever card it is over.
 *
 * Deliberately not gated on `prefers-reduced-motion`: this is a hover
 * affordance, not motion — nothing travels, and the highlight only exists while
 * a pointer is resting on the element. It is gated on `(hover: hover)`, since a
 * touch screen has no cursor to follow.
 */
export function usePointerGlow<T extends HTMLElement>(): RefObject<T | null> {
	const ref = useRef<T>(null);

	useLayoutEffect(() => {
		const container = ref.current;
		// biome-ignore lint/suspicious/noUnnecessaryConditions: useRef<T>(null) gives RefObject<T | null>; tsc rejects the access without this guard.
		if (!container || !window.matchMedia("(hover: hover)").matches) {
			return;
		}

		function onMove(event: PointerEvent) {
			const card = (event.target as Element | null)?.closest<HTMLElement>(
				"[data-glow]",
			);
			if (!card) {
				return;
			}
			const bounds = card.getBoundingClientRect();
			card.style.setProperty("--glow-x", `${event.clientX - bounds.left}px`);
			card.style.setProperty("--glow-y", `${event.clientY - bounds.top}px`);
		}

		container.addEventListener("pointermove", onMove);
		return () => {
			container.removeEventListener("pointermove", onMove);
		};
	}, []);

	return ref;
}
