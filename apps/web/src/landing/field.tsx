import { EASE_ENTER, gsap } from "../motion/gsap";
import { useMotion } from "../motion/useMotion";
import { SectionHeader } from "./sectionHeader";

const POINTS = [
	{
		lead: "Offline-first PWA.",
		body: "Drafts live in an on-device queue and sync in the background when signal returns. Zero connectivity required to start a report.",
	},
	{
		lead: "Runs on the phones you have.",
		body: "The report form is usable on a five-year-old Android, with pages loading in under two seconds on rural LTE.",
	},
	{
		lead: "Accessible by design.",
		body: "The report form targets WCAG 2.1 AA — gloves-off usable for every member, not just the young ones.",
	},
	{
		lead: "No app store.",
		body: "Install from the browser. No native app to approve, update, or pay for.",
	},
] as const;

const FIELDS = [
	{ label: "Incident type", value: "FIRE||STRUCTURE_FIRE" },
	{ label: "Location", value: "114 Maple St" },
	{ label: "Units on scene", value: "E-1, T-2" },
] as const;

/**
 * The device plays the one moment that sells offline-first: a draft written with
 * no signal, then the reconnect. Looping deliberately — a visitor arrives
 * mid-section and should still catch it.
 */
export function Field() {
	const ref = useMotion<HTMLElement>((root) => {
		const device = root.querySelector<HTMLElement>("[data-device]");
		if (!device) {
			return;
		}

		gsap
			.timeline({
				repeat: -1,
				repeatDelay: 2.4,
				scrollTrigger: { trigger: device, start: "top 80%" },
			})
			.to("[data-device-state]", {
				yPercent: -50,
				duration: 0.5,
				ease: "power4.inOut",
				delay: 2,
			})
			.fromTo(
				"[data-device-bar]",
				{ scaleX: 0 },
				{ scaleX: 1, duration: 1.1, ease: EASE_ENTER },
				"<",
			)
			.fromTo(
				"[data-device-check]",
				{ drawSVG: "0% 0%" },
				{ drawSVG: "0% 100%", duration: 0.4, ease: "power2.out" },
				"-=0.25",
			)
			.to("[data-device-state]", {
				yPercent: 0,
				duration: 0.5,
				ease: "power4.inOut",
				delay: 2.2,
			})
			.set("[data-device-bar]", { scaleX: 0 })
			.set("[data-device-check]", { drawSVG: "0% 0%" });
	});

	return (
		<section className="section section-split" id="mobile" ref={ref}>
			<div className="split-copy">
				<SectionHeader
					index="04"
					kicker="In the field"
					title="Reports get written where the trucks park"
				/>
				<ul className="points">
					{POINTS.map((point) => (
						<li key={point.lead} data-reveal>
							<strong>{point.lead}</strong> {point.body}
						</li>
					))}
				</ul>
			</div>

			<div className="device" data-device data-reveal aria-hidden="true">
				<div className="device-screen">
					<div className="device-bar">
						<span className="device-run">Incident 2026-0348</span>
						<span className="device-state">
							<span className="device-state-track" data-device-state>
								<span className="device-chip is-offline">Offline draft</span>
								<span className="device-chip is-synced">
									<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
										<path
											d="M3.5 8.5 6.5 11.5 12.5 5"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											data-device-check
										/>
									</svg>
									Synced
								</span>
							</span>
						</span>
					</div>

					{FIELDS.map((field) => (
						<div key={field.label} className="device-field">
							<span className="device-label">{field.label}</span>
							<span className="device-value">{field.value}</span>
						</div>
					))}

					<div className="device-sync">
						<span className="device-progress">
							<span data-device-bar />
						</span>
						<span className="device-sync-label">
							Validates and submits on reconnect
						</span>
					</div>
				</div>
			</div>
		</section>
	);
}
