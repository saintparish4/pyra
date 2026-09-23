import { usePointerGlow } from "../motion/usePointerGlow";
import { SectionHeader } from "./sectionHeader";

const ROLES = [
	{
		role: "Chief / assistant chief",
		context: "Non-technical, time-poor, budget-anxious",
		points: [
			"Submission status for every incident at a glance",
			"Grant, ISO, and compliance reporting without spreadsheets",
			"One-click full export for records requests",
		],
	},
	{
		role: "Incident officer",
		context: "Files reports after calls, usually on a phone",
		points: [
			"Routine report done in under five minutes",
			"NERIS-required fields validated inline as you type",
			"Start offline at the station, finish from home",
		],
	},
	{
		role: "Department admin",
		context: "The one member who does computers",
		points: [
			"Deploy with Docker Compose, back up on a schedule",
			"Add members, assign roles, deactivate departures",
			"Run imports with dry-run and error reports",
		],
	},
	{
		role: "Training officer",
		context: "Fast-follow module",
		points: [
			"Log drills and training hours against members",
			"Track certifications and expirations",
			"Prove compliance when the review comes",
		],
	},
] as const;

export function Roles() {
	const ref = usePointerGlow<HTMLDivElement>();

	return (
		<section className="section" id="workflows">
			<SectionHeader
				index="05"
				kicker="Role-based workflows"
				title="Built for the people who actually run a department"
			/>

			<div className="role-grid" ref={ref}>
				{ROLES.map((role) => (
					<article key={role.role} className="role" data-reveal data-glow>
						<h3>{role.role}</h3>
						<p className="role-context">{role.context}</p>
						<ul>
							{role.points.map((point) => (
								<li key={point}>{point}</li>
							))}
						</ul>
					</article>
				))}
			</div>
		</section>
	);
}
