import { type CSSProperties, Fragment } from "react";

import { trpc } from "../lib/trpc";
import { EASE_ENTER, gsap } from "../motion/gsap";
import { useMotion } from "../motion/useMotion";

/** The submission lifecycle, in the order a record moves through it. */
const STATUSES = ["Draft", "Validated", "Submitted", "Accepted"] as const;

/**
 * Type codes are copied verbatim out of the NERIS dictionary — the same strings
 * `packages/neris` generates. Inventing plausible-looking ones would be the kind
 * of detail a chief notices and a competitor does not.
 */
const RUNS = [
	{
		number: "2026-0347",
		segments: ["FIRE", "STRUCTURE_FIRE", "ROOM_AND_CONTENTS_FIRE"],
		place: "114 Maple St",
		status: 0,
	},
	{
		number: "2026-0346",
		segments: ["HAZSIT", "HAZARD_NONCHEM", "MOTOR_VEHICLE_COLLISION"],
		place: "Rt 9, MM 12",
		status: 3,
	},
	{
		number: "2026-0345",
		segments: ["MEDICAL", "ILLNESS", "CHEST_PAIN_NON_TRAUMA"],
		place: "41 Depot St",
		status: 3,
	},
	{
		number: "2026-0344",
		segments: ["FIRE", "OUTSIDE_FIRE", "VEGETATION_GRASS_FIRE"],
		place: "Carver Rd easement",
		status: 3,
	},
	{
		number: "2026-0343",
		segments: ["RESCUE", "OUTSIDE", "BACKCOUNTRY_RESCUE"],
		place: "Ridgeline trailhead",
		status: 3,
	},
] as const;

function TypePath({ segments }: { readonly segments: readonly string[] }) {
	return (
		<span className="run-type">
			{segments.map((segment, index) => (
				<Fragment key={segment}>
					{index > 0 ? (
						<>
							<i className="run-delim" aria-hidden="true">
								||
							</i>
							<wbr />
						</>
					) : null}
					<span>{segment}</span>
				</Fragment>
			))}
		</span>
	);
}

/**
 * A status cell that reads like a split-flap board. The four labels are stacked
 * and the column is translated, so nothing re-renders and React never fights the
 * animation for the text node. The CSS offset holds the true status when motion
 * is off; GSAP re-declares the same position before it starts moving.
 */
function StatusFlap({ status }: { readonly status: number }) {
	return (
		<span
			className="flap"
			data-flap={status}
			style={{ "--flap-step": status } as CSSProperties}
		>
			<span className="flap-track">
				{STATUSES.map((label) => (
					<span key={label} className={`flap-item is-${label.toLowerCase()}`}>
						{label}
					</span>
				))}
			</span>
		</span>
	);
}

export function DispatchBoard() {
	const health = trpc.health.check.useQuery();
	const state = health.isPending ? "pending" : health.isError ? "down" : "live";
	const label = health.isPending
		? "connecting"
		: health.isError
			? "api offline"
			: "api live";

	const ref = useMotion<HTMLDivElement>((root) => {
		const rows = root.querySelectorAll<HTMLElement>("[data-run]");
		const numbers = root.querySelectorAll<HTMLElement>("[data-run-number]");

		gsap
			.timeline({ delay: 0.35 })
			.from(rows, {
				autoAlpha: 0,
				y: 18,
				duration: 0.8,
				ease: EASE_ENTER,
				stagger: 0.09,
			})
			// The numbers resolve out of noise like a station printer landing on a
			// call number. Text only — the row itself has already settled.
			.to(
				numbers,
				{
					duration: 0.7,
					ease: "none",
					stagger: 0.09,
					scrambleText: { text: "{original}", chars: "0123456789", speed: 0.6 },
				},
				"<",
			);

		// Only the newest run advances. A board where every row cycles reads as a
		// screensaver; one moving row reads as a system doing work.
		const live = root.querySelector<HTMLElement>("[data-flap='0'] .flap-track");
		if (!live) {
			return;
		}
		const step = live.clientHeight / STATUSES.length;
		gsap.set(live, { y: 0 });
		const advance = gsap.timeline({ repeat: -1, delay: 2.2 });
		for (let index = 1; index < STATUSES.length; index += 1) {
			advance.to(live, {
				y: -step * index,
				duration: 0.55,
				ease: "power4.inOut",
				delay: index === 1 ? 0 : 1.9,
			});
		}
		advance.to(live, {
			y: 0,
			duration: 0.55,
			ease: "power4.inOut",
			delay: 3.4,
		});
	});

	return (
		<div className="board" ref={ref}>
			<div className="board-chrome">
				<span className="board-name">Cedar Hollow VFD — incident board</span>
				<span className={`board-state is-${state}`}>
					<span className="board-dot" aria-hidden="true" />
					{label}
				</span>
			</div>

			<ul className="board-runs">
				{RUNS.map((run) => (
					<li key={run.number} className="run" data-run>
						<span className="run-number" data-run-number>
							{run.number}
						</span>
						<span className="run-detail">
							<TypePath segments={run.segments} />
							<span className="run-place">{run.place}</span>
						</span>
						<StatusFlap status={run.status} />
					</li>
				))}
			</ul>

			<dl className="board-metrics">
				<div>
					<dt>first-attempt acceptance</dt>
					<dd data-count="97" data-count-suffix="%">
						97%
					</dd>
				</div>
				<div>
					<dt>median report time</dt>
					<dd>4m 32s</dd>
				</div>
				<div>
					<dt>records lost, ever</dt>
					<dd data-count="0">0</dd>
				</div>
			</dl>

			<p className="board-note">
				Sample data. Pilot targets: ≥95% first-attempt NERIS acceptance, routine
				reports under five minutes.
			</p>
		</div>
	);
}
