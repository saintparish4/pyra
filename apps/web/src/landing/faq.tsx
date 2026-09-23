import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";

import { SectionHeader } from "./sectionHeader";

const FAQS = [
	{
		question: "Is it really free?",
		answer:
			"Yes. Pyra is AGPL-3.0 licensed — self-host it for the cost of a small server and pay nothing to anyone. Departments that would rather not run infrastructure can join the hosted co-op tier, priced at server cost rather than what the market will bear.",
	},
	{
		question: "What happens to our decades of NFIRS history?",
		answer:
			"You import it. The importer reads NFIRS 5.0 flat-file and eNFIRS bulk exports plus Emergency Reporting CSVs, walks you through a field-mapping review, and gives a per-record success and error report. Legacy records that do not map one-to-one onto NERIS are preserved in full and stay searchable.",
	},
	{
		question: "Is Pyra NERIS-certified?",
		answer:
			"Pyra is built directly against the NERIS data dictionary — the schemas are generated from the official spec — and is enrolling in the integration program for a compatibility badge. Achieving it is a launch requirement, not an afterthought.",
	},
	{
		question: "We don't have anyone technical. Can we still use it?",
		answer:
			"Yes. That is what the hosted co-op tier is for. And if you do have the one member who does computers, the self-host target is a single docker compose up, deployable by a semi-technical volunteer in under an hour.",
	},
	{
		question: "What about EMS runs and ePCR?",
		answer:
			"Deliberately out of scope for the MVP. ePCR means HIPAA and state-by-state certification, and doing it badly would put departments at risk. Pyra carries no patient data by design; ePCR is a candidate for a later version.",
	},
	{
		question: "What stops Pyra being acquired and sunset like everything else?",
		answer:
			"Structure. The trademark is held by a nonprofit cooperative, the code is AGPL-3.0 from the first commit, and the export format is a public spec. In the worst case any department — or any group of them — can fork it and keep running.",
	},
] as const;

function Entry({
	question,
	answer,
	open,
	onToggle,
}: {
	readonly question: string;
	readonly answer: string;
	readonly open: boolean;
	readonly onToggle: () => void;
}) {
	const panelId = useId();
	const reduced = useReducedMotion();

	return (
		<div className={open ? "faq-entry is-open" : "faq-entry"} data-reveal>
			<h3>
				<button
					type="button"
					className="faq-question"
					aria-expanded={open}
					aria-controls={panelId}
					onClick={onToggle}
				>
					<span>{question}</span>
					<i className="faq-marker" aria-hidden="true">
						||
					</i>
				</button>
			</h3>
			<AnimatePresence initial={false}>
				{open ? (
					<motion.div
						id={panelId}
						className="faq-answer"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={
							reduced
								? { duration: 0 }
								: { duration: 0.42, ease: [0.16, 1, 0.3, 1] }
						}
					>
						<p>{answer}</p>
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	);
}

export function Faq() {
	const [open, setOpen] = useState<string | null>(null);

	return (
		<section className="section section-faq" id="faq">
			<SectionHeader
				index="10"
				kicker="FAQ"
				title="The questions chiefs actually ask"
			/>

			<div className="faq-list">
				{FAQS.map((entry) => (
					<Entry
						key={entry.question}
						question={entry.question}
						answer={entry.answer}
						open={open === entry.question}
						onToggle={() =>
							setOpen(open === entry.question ? null : entry.question)
						}
					/>
				))}
			</div>
		</section>
	);
}
