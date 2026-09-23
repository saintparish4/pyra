import { SectionHeader } from "./sectionHeader";

const WEEKS = [
	{
		when: "Week 1",
		title: "Deploy",
		body: "The department admin stands Pyra up with Docker Compose on a $12-a-month VPS, in an afternoon.",
	},
	{
		when: "Week 2",
		title: "Import",
		body: "Four decades of NFIRS history come in through the importer: dry run, fix eleven flagged records, commit. Everything searchable.",
	},
	{
		when: "Week 3",
		title: "First submissions",
		body: "Officers file routine reports from their phones in under five minutes. NERIS accepts on the first attempt.",
	},
	{
		when: "Renewal",
		title: "Nothing happens",
		body: "No invoice triples. The old vendor quote goes in a drawer, and the records stay with the department.",
	},
] as const;

export function Switching() {
	return (
		<section className="section" id="switching">
			<SectionHeader
				index="09"
				kicker="What switching looks like"
				title="Four weeks, then a renewal season that costs nothing"
				lead="An illustrative pilot built from Pyra's MVP targets. Your department could be the real one."
			/>

			<div className="case" data-reveal>
				<header className="case-head">
					<h3>Cedar Hollow Volunteer Fire Department</h3>
					<p>
						32 members <i className="delim">||</i> rural district{" "}
						<i className="delim">||</i> 400 calls a year{" "}
						<i className="delim">||</i> illustrative
					</p>
				</header>

				<ol className="case-weeks">
					{WEEKS.map((week) => (
						<li key={week.when} data-reveal>
							<span className="case-when">{week.when}</span>
							<h4>{week.title}</h4>
							<p>{week.body}</p>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
