import {
	type DependencyList,
	type RefObject,
	useLayoutEffect,
	useRef,
} from "react";

import { gsap, MOTION_OK } from "./gsap";

type MotionOptions = {
	readonly deps?: DependencyList;
	/** Added to the reduced-motion gate — e.g. effects that only make sense wide. */
	readonly query?: string;
};

/**
 * Scopes a set of GSAP animations to one element's subtree.
 *
 * `matchMedia` does two jobs at once: it gates everything on
 * `prefers-reduced-motion`, and its `revert()` undoes every tween and inline
 * style the callback created. That second job is what makes StrictMode's
 * double-invoked effects idempotent — without it, the second pass would stack a
 * duplicate set of ScrollTriggers on the same elements.
 */
export function useMotion<T extends HTMLElement>(
	setup: (root: T) => void,
	options: MotionOptions = {},
): RefObject<T | null> {
	const ref = useRef<T>(null);
	const { deps = [], query } = options;

	useLayoutEffect(() => {
		const root = ref.current;
		// biome-ignore lint/suspicious/noUnnecessaryConditions: useRef<T>(null) gives RefObject<T | null>; tsc rejects the access without this guard.
		if (!root) {
			return;
		}
		const media = gsap.matchMedia();
		media.add(query ? `${MOTION_OK} and ${query}` : MOTION_OK, () => {
			setup(root);
		});
		return () => {
			media.revert();
		};
	}, deps);

	return ref;
}
