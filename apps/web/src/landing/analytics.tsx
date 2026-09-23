import { EASE_ENTER, gsap } from "../motion/gsap";
import { useMotion } from "../motion/useMotion";
import { SectionHeader } from "./sectionHeader";

const POINTS = [
	{
		lead: "Incident trends",
		body: "by type, district, and time of day — the charts an ISO review or an AFG grant narrative actually asks for.",
	},
	{
		lead: "Submission health.",
		body: "Acceptance rate, rejection reasons, and time-to-submit, so compliance problems surface before the deadline does.",
	},
	{
		lead: "Your data, queryable.",
		body: "It is Postgres with a documented schema. Point any BI tool at it, or export CSV and be done.",
	},
] as const;

const MONTHS = [
	{ month: "Jan", value: 34 },
	{ month: "Feb", value: 28 },
	{ month: "Mar", value: 41 },
	{ month: "Apr", value: 37 },
	{ month: "May", value: 52 },
	{ month: "Jun", value: 46 },
] as const;

const CHART = { width: 320, height: 150, baseline: 126, bar: 30, gap: 22 };

function barX(index: number): number {
	return 10 + index * (CHART.bar + CHART.gap);
}

export function Analytics() {
	const peak = Math.max(...MONTHS.map((entry) => entry.value));

	const ref = useMotion<HTMLElement>((root) => {
		const bars = root.querySelectorAll<SVGRectElement>("[data-bar]");
		if (bars.length === 0) {
			return;
		}
		gsap.from(bars, {
			scaleY: 0,
			// Bars grow out of the axis, not out of their own centre.
			svgOrigin: `0 ${CHART.baseline}`,
			duration: 0.9,
			ease: EASE_ENTER,
			stagger: 0.07,
			scrollTrigger: { trigger: root, start: "top 78%", once: true },
		});
	});

	return (
		<section className="section section-split" id="analytics" ref={ref}>
			<div className="split-copy">
				<SectionHeader
					index="08"
					kicker="Analytics"
					title="Answers for the grant application, not just the state"
				/>
				<ul className="points">
					{POINTS.map((point) => (
						<li key={point.lead} data-reveal>
							<strong>{point.lead}</strong> {point.body}
						</li>
					))}
				</ul>
			</div>

			<figure className="chart" data-reveal>
				<figcaption>Incidents by month</figcaption>
				<svg
					viewBox={`0 0 ${CHART.width} ${CHART.height}`}
					fill="none"
					role="img"
					aria-label="Bar chart of monthly incident counts from January to June, peaking in May."
				>
					<title>Incidents by month</title>
					<line
						x1="0"
						y1={CHART.baseline}
						x2={CHART.width}
						y2={CHART.baseline}
						stroke="currentColor"
						strokeWidth="1"
						opacity="0.2"
					/>
					{MONTHS.map((entry, index) => {
						const height = (entry.value / peak) * 100;
						return (
							<g key={entry.month}>
								<rect
									x={barX(index)}
									y={CHART.baseline - height}
									width={CHART.bar}
									height={height}
									rx="3"
									className={entry.value === peak ? "bar is-peak" : "bar"}
									data-bar
								/>
								<text
									x={barX(index) + CHART.bar / 2}
									y={CHART.height - 6}
									textAnchor="middle"
									className="bar-label"
								>
									{entry.month}
								</text>
							</g>
						);
					})}
				</svg>
			</figure>
		</section>
	);
}
