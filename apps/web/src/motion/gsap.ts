import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(
	CustomEase,
	DrawSVGPlugin,
	ScrambleTextPlugin,
	ScrollTrigger,
	SplitText,
);

/**
 * Animations only exist when motion is welcome. Every effect is registered
 * inside a `gsap.matchMedia()` scoped to this query, so a visitor who asks for
 * reduced motion never has an initial hidden state applied — the page renders
 * as static HTML rather than as an animation that was cancelled.
 */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * One entrance curve for the whole page: a fast start that spends most of its
 * time settling. Sharing it is what makes independently triggered type, panels,
 * and SVG strokes read as one system instead of a pile of effects.
 *
 * Equivalent to cubic-bezier(0.16, 1, 0.3, 1) — CustomEase takes the SVG path
 * form, where the control points are the middle two coordinate pairs.
 */
export const EASE_ENTER = CustomEase.create(
	"pyraEnter",
	"M0,0 C0.16,1 0.3,1 1,1",
);

/** The counterpart for things leaving or collapsing, where lingering reads as lag. */
export const EASE_EXIT = CustomEase.create(
	"pyraExit",
	"M0,0 C0.7,0 0.84,0 1,1",
);

export { DrawSVGPlugin, gsap, ScrambleTextPlugin, ScrollTrigger, SplitText };
