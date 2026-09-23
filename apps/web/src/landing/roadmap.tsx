import { SectionHeader } from "./sectionHeader";

const MODULES = [
	{
		name: "NERIS incident reporting",
		phase: "MVP",
		note: "Create, validate, submit, track",
	},
	{
		name: "Historical data import",
		phase: "MVP",
		note: "NFIRS 5.0 / eNFIRS, Emergency Reporting CSV",
	},
	{
		name: "Training and certifications",
		phase: "Fast-follow",
		note: "Drills, hours, expirations",
	},
	{
		name: "Apparatus and SCBA checks",
		phase: "Fast-follow",
		note: "Daily and weekly checklists",
	},
	{
		name: "Pre-plans and occupancy intel",
		phase: "Roadmap",
		note: "Hydrants, access, hazards at dispatch",
	},
	{
		name: "Inspections",
		phase: "Roadmap",
		note: "Scheduling, findings, follow-ups",
	},
] as const;

function phaseClass(phase: string): string {
	return `phase is-${phase.toLowerCase().replace("-", "")}`;
}

export function Roadmap() {
	return (
		<section className="section" id="roadmap">
			<SectionHeader
				index="06"
				kicker="Pre-incident intelligence"
				title="The record system today, the knowledge system next"
				lead="Pyra ships the RMS core first, then grows into pre-plans, hydrants, and inspections as open modules on data you already own. The roadmap is public; here is where each piece stands."
			/>

			<ul className="module-list">
				{MODULES.map((module) => (
					<li key={module.name} className="module" data-reveal>
						<span className={phaseClass(module.phase)}>{module.phase}</span>
						<span className="module-name">{module.name}</span>
						<span className="module-note">{module.note}</span>
					</li>
				))}
			</ul>
		</section>
	);
}
