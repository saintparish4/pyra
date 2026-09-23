import { EASE_ENTER, gsap, ScrollTrigger, SplitText } from "./gsap";

/**
 * Everything enters at the same point in the viewport. A shared trigger line is
 * most of what separates a page that feels composed from one where each section
 * animates on its own schedule.
 */
const ENTER = "top 86%";

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

function select<T extends Element>(selector: string, root: HTMLElement): T[] {
	return gsap.utils.toArray<T>(root.querySelectorAll(selector));
}

/** Panels, cards, and list rows: a short rise, staggered across whatever enters together. */
function revealBlocks(root: HTMLElement) {
	const blocks = select<HTMLElement>("[data-reveal]", root);
	if (blocks.length === 0) {
		return;
	}
	gsap.set(blocks, { autoAlpha: 0, y: 28 });
	ScrollTrigger.batch(blocks, {
		start: ENTER,
		once: true,
		onEnter: (batch) => {
			gsap.to(batch, {
				autoAlpha: 1,
				y: 0,
				duration: 1,
				ease: EASE_ENTER,
				stagger: 0.07,
			});
		},
	});
}

/**
 * Headlines rise out of a mask one line at a time. `autoSplit` re-runs the split
 * when the webfont lands or the box reflows, which is the difference between a
 * clean reveal and lines that tear on a narrow viewport.
 */
function revealLines(root: HTMLElement) {
	for (const heading of select<HTMLElement>("[data-reveal-lines]", root)) {
		SplitText.create(heading, {
			type: "lines",
			mask: "lines",
			autoSplit: true,
			onSplit(self) {
				return gsap.from(self.lines, {
					yPercent: 110,
					duration: 1.15,
					ease: EASE_ENTER,
					stagger: 0.08,
					scrollTrigger: { trigger: heading, start: ENTER, once: true },
				});
			},
		});
	}
}

/**
 * Counts up to the number already in the markup, so the static page and the
 * animated one end on the same pixel.
 */
function countUp(root: HTMLElement) {
	for (const cell of select<HTMLElement>("[data-count]", root)) {
		const total = Number(cell.dataset.count);
		if (!Number.isFinite(total)) {
			continue;
		}
		const prefix = cell.dataset.countPrefix ?? "";
		const suffix = cell.dataset.countSuffix ?? "";
		const tally = { value: 0 };
		gsap.to(tally, {
			value: total,
			duration: 1.8,
			ease: "power2.out",
			scrollTrigger: { trigger: cell, start: ENTER, once: true },
			onUpdate() {
				const shown = NUMBER_FORMAT.format(Math.round(tally.value));
				cell.textContent = `${prefix}${shown}${suffix}`;
			},
		});
	}
}

/** Strokes that draw themselves as the section scrolls past. */
function drawStrokes(root: HTMLElement) {
	for (const svg of select<SVGElement>("[data-draw]", root)) {
		const strokes =
			svg.querySelectorAll<SVGGeometryElement>("[data-draw-stroke]");
		if (strokes.length === 0) {
			continue;
		}
		const section = svg.closest("section") ?? svg;
		gsap.fromTo(
			strokes,
			{ drawSVG: "0% 0%" },
			{
				drawSVG: "0% 100%",
				ease: "none",
				stagger: 0.1,
				scrollTrigger: {
					trigger: section,
					start: "top 70%",
					end: "bottom 80%",
					scrub: 0.6,
				},
			},
		);
	}
}

/**
 * Decorative layers drift against the scroll. Kept to small distances: the point
 * is depth, not the motion itself.
 */
function parallaxLayers(root: HTMLElement) {
	for (const layer of select<HTMLElement>("[data-parallax]", root)) {
		const distance = Number(layer.dataset.parallax) || 12;
		gsap.fromTo(
			layer,
			{ yPercent: -distance },
			{
				yPercent: distance,
				ease: "none",
				scrollTrigger: {
					trigger: layer.parentElement ?? layer,
					start: "top bottom",
					end: "bottom top",
					scrub: true,
				},
			},
		);
	}
}

/** Wires the whole declarative vocabulary for one page subtree. */
export function initLandingMotion(root: HTMLElement) {
	revealLines(root);
	revealBlocks(root);
	countUp(root);
	drawStrokes(root);
	parallaxLayers(root);
}
