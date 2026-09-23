import { useMagnetic } from "../motion/useMagnetic";
import { contactLink } from "./links";
import { Delim } from "./sectionHeader";

export function CallToAction() {
	const primaryRef = useMagnetic<HTMLAnchorElement>();

	return (
		<section className="section section-cta" id="demo">
			<div className="cta" data-reveal>
				<span className="cta-field" aria-hidden="true" data-parallax="6" />
				<p className="eyebrow">
					Pilot program <Delim /> onboarding now
				</p>
				<h2 data-reveal-lines>See Pyra on your department&rsquo;s own data</h2>
				<p className="cta-lede">
					We are onboarding pilot departments now: full historical import, NERIS
					submission, and a restore drill included. Bring an export, leave
					owning your records.
				</p>
				<div className="cta-actions">
					<a
						className="btn btn-ember btn-lg"
						href={contactLink("Pyra demo request")}
						ref={primaryRef}
					>
						Request a demo
					</a>
					<a
						className="btn btn-quiet btn-lg"
						href={contactLink("Pyra pilot program")}
					>
						Join the pilot program
					</a>
				</div>
			</div>
		</section>
	);
}
