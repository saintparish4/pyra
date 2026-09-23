import { SectionHeader } from "./sectionHeader";

const STEPS = [
	{
		index: "01",
		title: "Deploy in under an hour",
		body: "One docker compose up brings up the app, Postgres, and object storage — on a cheap VPS or a mini PC in the station. Or skip servers entirely with the hosted co-op tier.",
		meta: "docker compose up",
	},
	{
		index: "02",
		title: "Import your history",
		body: "Run the importer against your NFIRS or vendor exports. Review the field mapping, dry-run it, commit when the per-record report is clean. Legacy records stay searchable even where they do not map one-to-one.",
		meta: "dry run → review → commit",
	},
	{
		index: "03",
		title: "Write reports anywhere",
		body: "Members file from a phone at the station or at home, offline included. Drafts autosave to the device and sync when connectivity returns.",
		meta: "offline draft → sync",
	},
	{
		index: "04",
		title: "Submit and track",
		body: "Pyra validates against NERIS rules, submits through the API with a retry queue, polls status, and surfaces rejection reasons so a fix takes minutes.",
		meta: "validate → submit → poll",
	},
] as const;

/**
 * The spine draws itself down the list as the section scrolls — handled by the
 * page-level `[data-draw]` vocabulary, so the stroke is tied to the same scroll
 * position as the steps beside it.
 */
export function Pipeline() {
	return (
		<section className="section section-pipeline" id="how-it-works">
			<SectionHeader
				index="03"
				kicker="How it works"
				title="From a bare server to accepted submissions"
			/>

			<div className="pipeline">
				<svg
					className="pipeline-spine"
					viewBox="0 0 2 100"
					preserveAspectRatio="none"
					aria-hidden="true"
					focusable="false"
					data-draw
				>
					<line
						x1="1"
						y1="0"
						x2="1"
						y2="100"
						stroke="currentColor"
						strokeWidth="2"
						opacity="0.14"
					/>
					<line
						x1="1"
						y1="0"
						x2="1"
						y2="100"
						stroke="var(--ember)"
						strokeWidth="2"
						data-draw-stroke
					/>
				</svg>

				<ol className="pipeline-steps">
					{STEPS.map((step) => (
						<li key={step.index} className="pipeline-step" data-reveal>
							<span className="pipeline-node" aria-hidden="true" />
							<span className="pipeline-index">{step.index}</span>
							<div className="pipeline-copy">
								<h3>{step.title}</h3>
								<p>{step.body}</p>
								<p className="pipeline-meta">{step.meta}</p>
							</div>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
