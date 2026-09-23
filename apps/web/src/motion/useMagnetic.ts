import { type RefObject, useLayoutEffect, useRef } from "react";

import { gsap, MOTION_OK } from "./gsap";

/** How much of the cursor's offset from centre the element follows. */
const PULL = 0.28;

/**
 * A control that leans toward the cursor and springs back when it leaves.
 *
 * Gated on `(hover: hover)` as well as reduced motion: on a touch screen there
 * is no cursor to lean toward, and the listener would only cost battery.
 */
export function useMagnetic<T extends HTMLElement>(): RefObject<T | null> {
	const ref = useRef<T>(null);

	useLayoutEffect(() => {
		const node = ref.current;
		// biome-ignore lint/suspicious/noUnnecessaryConditions: useRef<T>(null) gives RefObject<T | null>; tsc rejects the access without this guard.
		if (!node) {
			return;
		}
		// Re-bound as a plain element: narrowing a generic `T | null` does not
		// survive into the nested listener declarations below.
		const element: HTMLElement = node;

		const media = gsap.matchMedia();
		media.add(`${MOTION_OK} and (hover: hover)`, () => {
			const moveX = gsap.quickTo(element, "x", {
				duration: 0.6,
				ease: "power3.out",
			});
			const moveY = gsap.quickTo(element, "y", {
				duration: 0.6,
				ease: "power3.out",
			});
			// Measured once per hover rather than per move: the element is being
			// translated, so reading its rect mid-gesture would chase itself.
			let bounds = element.getBoundingClientRect();

			function onEnter() {
				bounds = element.getBoundingClientRect();
			}

			function onMove(event: PointerEvent) {
				moveX((event.clientX - (bounds.left + bounds.width / 2)) * PULL);
				moveY((event.clientY - (bounds.top + bounds.height / 2)) * PULL);
			}

			function onLeave() {
				moveX(0);
				moveY(0);
			}

			element.addEventListener("pointerenter", onEnter);
			element.addEventListener("pointermove", onMove);
			element.addEventListener("pointerleave", onLeave);
			return () => {
				element.removeEventListener("pointerenter", onEnter);
				element.removeEventListener("pointermove", onMove);
				element.removeEventListener("pointerleave", onLeave);
			};
		});

		return () => {
			media.revert();
		};
	}, []);

	return ref;
}
