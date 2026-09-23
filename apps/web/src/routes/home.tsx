import { Analytics } from "../landing/analytics";
import { Assurance } from "../landing/assurance";
import { CallToAction } from "../landing/callToAction";
import { Capabilities } from "../landing/capabilities";
import { Faq } from "../landing/faq";
import { Field } from "../landing/field";
import { Hero } from "../landing/hero";
import { LandingFooter } from "../landing/landingFooter";
import { Pipeline } from "../landing/pipeline";
import { Pressure } from "../landing/pressure";
import { Roadmap } from "../landing/roadmap";
import { Roles } from "../landing/roles";
import { Switching } from "../landing/switching";
import { Ticker } from "../landing/ticker";
import { initLandingMotion } from "../motion/landingMotion";
import { useMotion } from "../motion/useMotion";
import "../landing/landing.css";

/**
 * Sections own their bespoke timelines; the page owns the shared vocabulary —
 * `data-reveal`, `data-reveal-lines`, `data-count`, `data-draw`, `data-parallax`.
 * Child effects run before this one, so a section's own animation is always
 * registered first and the page-level batch never claims an element twice.
 */
export function Home() {
	const ref = useMotion<HTMLDivElement>(initLandingMotion);

	return (
		<div className="landing" ref={ref}>
			<Hero />
			<Ticker />
			<Pressure />
			<Capabilities />
			<Pipeline />
			<Field />
			<Roles />
			<Roadmap />
			<Assurance />
			<Analytics />
			<Switching />
			<Faq />
			<CallToAction />
			<LandingFooter />
		</div>
	);
}
