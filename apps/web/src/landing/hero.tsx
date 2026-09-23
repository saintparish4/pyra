import { type SyntheticEvent, useState } from "react";

import { ScrollCue } from "../graphics/marks";
import { ColorField } from "../hero/colorField";
import { EASE_ENTER, gsap, SplitText } from "../motion/gsap";
import { useMagnetic } from "../motion/useMagnetic";
import { useMotion } from "../motion/useMotion";
import { DispatchBoard } from "./dispatchBoard";
import { contactLink } from "./links";

export function Hero() {
	const [email, setEmail] = useState("");
	const submitRef = useMagnetic<HTMLButtonElement>();

	function requestDemo(event: SyntheticEvent<HTMLFormElement>) {
		event.preventDefault();
		window.location.href = contactLink(
			"Pyra demo request",
			`Department contact: ${email}`,
		);
	}

	const ref = useMotion<HTMLElement>((root) => {
		const heading = root.querySelector<HTMLElement>("[data-hero-heading]");
		if (!heading) {
			return;
		}

		// One timeline for the whole entrance, so the rule under "forever" lands
		// against the line it belongs to rather than on its own timer.
		const intro = gsap.timeline({ defaults: { ease: EASE_ENTER } });

		SplitText.create(heading, {
			type: "lines",
			mask: "lines",
			autoSplit: true,
			onSplit(self) {
				return intro.from(
					self.lines,
					{ yPercent: 112, duration: 1.2, stagger: 0.09 },
					0.1,
				);
			},
		});

		intro
			.from("[data-hero-eyebrow]", { autoAlpha: 0, y: 14, duration: 0.7 }, 0)
			.from(
				"[data-hero-rule]",
				{ drawSVG: "0% 0%", duration: 0.8, ease: "power2.inOut" },
				0.75,
			)
			.from(
				"[data-hero-step]",
				{ autoAlpha: 0, y: 18, duration: 0.9, stagger: 0.1 },
				0.55,
			)
			.from("[data-scroll-cue-run]", { drawSVG: "0% 0%", duration: 0.6 }, 1.2)
			.to(
				"[data-scroll-cue-run]",
				{
					drawSVG: "100% 100%",
					duration: 1.1,
					ease: "power2.in",
					repeat: -1,
					repeatDelay: 0.9,
				},
				2,
			);
	});

	return (
		<section className="hero" id="top" ref={ref}>
			<div className="hero-field" aria-hidden="true">
				<ColorField />
			</div>

			<div className="hero-copy">
				<p className="eyebrow" data-hero-eyebrow>
					AGPL-3.0 <i className="delim">||</i> self-hosted{" "}
					<i className="delim">||</i> NERIS-native
				</p>

				<h1 className="hero-heading" data-hero-heading>
					Own your records{" "}
					<span className="accent">
						forever
						<svg
							className="accent-rule"
							viewBox="0 0 220 10"
							preserveAspectRatio="none"
							aria-hidden="true"
							focusable="false"
						>
							<path
								d="M3 7C46 2.5 168 2 217 6"
								stroke="currentColor"
								strokeWidth="4"
								strokeLinecap="round"
								fill="none"
								data-hero-rule
							/>
						</svg>
					</span>
					.
				</h1>

				<p className="hero-lede" data-hero-step>
					Pyra is a free, open-source, self-hostable records management system
					for US fire departments. NERIS-compliant incident reporting, one-click
					export of everything, and a nonprofit co-op behind it — so it can
					never be acquired, sunset, or marked up.
				</p>

				<form className="capture" onSubmit={requestDemo} data-hero-step>
					<label className="capture-field">
						<span className="sr-only">Work email</span>
						<input
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="chief@yourdepartment.gov"
							autoComplete="email"
							required
						/>
					</label>
					<button type="submit" className="btn btn-ember" ref={submitRef}>
						Request a demo
					</button>
				</form>

				<p className="hero-note" data-hero-step>
					Pay nothing and self-host, or pay server cost on the hosted co-op
					tier. Never a private-equity markup.
				</p>
			</div>

			<div className="hero-board" data-hero-step>
				<DispatchBoard />
			</div>

			<a className="scroll-cue" href="#pressure">
				<ScrollCue />
				<span>The case</span>
			</a>
		</section>
	);
}
