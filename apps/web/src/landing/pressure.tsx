import { SectionHeader } from "./sectionHeader";

const ARGUMENTS = [
	{
		index: "01",
		title: "Consolidation doubled your bill",
		body: "Three private-equity-backed vendors control fire RMS. The playbook — acquire competitors, sunset products, raise prices — has doubled or tripled costs, and volunteer departments absorb it worst.",
	},
	{
		index: "02",
		title: "Your history is held hostage",
		body: "Decades of incident and training records sit in proprietary systems. Departments stay not because the software is good, but because leaving means losing their past.",
	},
	{
		index: "03",
		title: "NERIS reset the board",
		body: "The January 2026 NFIRS-to-NERIS transition forced every department to rebuild its reporting pipeline anyway. Switching costs have never been lower. This is the window.",
	},
] as const;

/**
 * The renewal curve, drawn to scale: each point is one renewal cycle, the last
 * two at roughly twice the first. It draws itself as the section scrolls, which
 * is the argument — the line keeps going up whether or not you are watching.
 */
function RenewalCurve() {
	return (
		<figure className="curve" data-reveal>
			<figcaption className="curve-caption">
				What a renewal cycle looks like
			</figcaption>
			<svg
				viewBox="0 0 320 180"
				fill="none"
				role="img"
				aria-label="A line chart of annual licence cost rising steeply across five renewal cycles."
				data-draw
			>
				<title>Licence cost across five renewal cycles</title>
				{[0, 1, 2, 3].map((row) => (
					<line
						key={row}
						x1="0"
						y1={30 + row * 40}
						x2="320"
						y2={30 + row * 40}
						stroke="currentColor"
						strokeWidth="1"
						opacity="0.12"
					/>
				))}
				<path
					d="M6 150 L82 140 L158 116 L234 70 L310 18"
					stroke="var(--ember)"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					data-draw-stroke
				/>
				{[
					[6, 150],
					[82, 140],
					[158, 116],
					[234, 70],
					[310, 18],
				].map(([x, y]) => (
					<circle key={`${x}`} cx={x} cy={y} r="3.5" fill="var(--ember)" />
				))}
			</svg>
			<p className="curve-note">
				Pyra&rsquo;s equivalent line is flat, because there is no licence — only
				the server you already pay for.
			</p>
		</figure>
	);
}

export function Pressure() {
	return (
		<section className="section section-pressure" id="pressure">
			<SectionHeader
				index="01"
				kicker="The operational problem"
				title="The problem isn't your department. It's the market."
				lead="Fire departments don't need another vendor. They need software they own."
			/>

			<div className="pressure-body">
				<ol className="argument-list">
					{ARGUMENTS.map((item) => (
						<li key={item.index} className="argument" data-reveal>
							<span className="argument-index">{item.index}</span>
							<div>
								<h3>{item.title}</h3>
								<p>{item.body}</p>
							</div>
						</li>
					))}
				</ol>
				<RenewalCurve />
			</div>
		</section>
	);
}
