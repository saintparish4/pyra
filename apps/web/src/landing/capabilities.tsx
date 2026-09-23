import {
	MarkAudit,
	MarkDisclosure,
	MarkExport,
	MarkImport,
	MarkTenancy,
	MarkValidated,
} from "../graphics/marks";
import { gsap } from "../motion/gsap";
import { useMotion } from "../motion/useMotion";
import { SectionHeader } from "./sectionHeader";

const CAPABILITIES = [
	{
		index: "01",
		title: "NERIS-compliant reporting",
		body: "The incident model conforms to the NERIS data dictionary, generated from the official spec rather than transcribed by hand. Validation runs inline, before submission — no rejected-report surprises.",
		Mark: MarkValidated,
	},
	{
		index: "02",
		title: "Progressive disclosure forms",
		body: "A routine call is a short form. A structure fire expands only the sections that matter. The UX bar is simpler than the incumbents, not merely cheaper.",
		Mark: MarkDisclosure,
	},
	{
		index: "03",
		title: "The data importer",
		body: "Bring your history back: NFIRS 5.0 flat-file and eNFIRS bulk exports, plus Emergency Reporting CSVs. Dry-run mode, mapping review, per-record error reports.",
		Mark: MarkImport,
	},
	{
		index: "04",
		title: "Export everything, always",
		body: "One click exports the full database — JSON, CSV, and attachments — in an open, documented format. Leaving Pyra is easy. That is the point.",
		Mark: MarkExport,
	},
	{
		index: "05",
		title: "Roles and real tenancy",
		body: "Admin, officer, member, and read-only. On shared instances Postgres row-level security isolates each department in the database itself, not in a forgotten where clause.",
		Mark: MarkTenancy,
	},
	{
		index: "06",
		title: "Immutable audit trail",
		body: "Every record mutation is logged — who, what, when — with update and delete revoked on the log itself, plus an amendment workflow for submitted incidents.",
		Mark: MarkAudit,
	},
] as const;

/**
 * Pinned horizontal rail. The section holds still while the cards travel, which
 * turns six list items into one deliberate pass through the product.
 *
 * Desktop only, by `query`: on a narrow screen the same markup is a native
 * snap-scrolling rail, which beats hijacking a touch device's scroll.
 */
export function Capabilities() {
	const ref = useMotion<HTMLElement>(
		(root) => {
			const stage = root.querySelector<HTMLElement>("[data-rail-stage]");
			const rail = root.querySelector<HTMLElement>("[data-rail]");
			const track = root.querySelector<HTMLElement>("[data-rail-track]");
			const progress = root.querySelector<HTMLElement>("[data-rail-progress]");
			if (!stage || !rail || !track) {
				return;
			}

			// Recomputed on every refresh rather than captured: the webfont landing
			// or a resize changes the track width, and a stale distance either cuts
			// the last card off or leaves dead scroll at the end.
			const overflow = () => Math.max(0, track.scrollWidth - rail.clientWidth);
			if (overflow() === 0) {
				return;
			}

			gsap.to(track, {
				x: () => -overflow(),
				ease: "none",
				scrollTrigger: {
					trigger: stage,
					start: "top top",
					end: () => `+=${overflow() + window.innerHeight * 0.5}`,
					pin: true,
					scrub: 0.7,
					anticipatePin: 1,
					invalidateOnRefresh: true,
					onUpdate(self) {
						if (progress) {
							gsap.set(progress, { scaleX: self.progress });
						}
					},
				},
			});
		},
		{ query: "(min-width: 960px)" },
	);

	return (
		<section className="section section-rail" id="capabilities" ref={ref}>
			<div className="rail-stage" data-rail-stage>
				<SectionHeader
					index="02"
					kicker="Core capabilities"
					title="Everything an RMS must do. Nothing that holds you hostage."
				/>

				<div className="rail" data-rail>
					<ul className="rail-track" data-rail-track>
						{CAPABILITIES.map(({ index, title, body, Mark }) => (
							<li key={index} className="capability">
								<span className="capability-index">{index}</span>
								<Mark className="capability-mark" />
								<h3>{title}</h3>
								<p>{body}</p>
							</li>
						))}
					</ul>
				</div>

				<div className="rail-progress" aria-hidden="true">
					<span data-rail-progress />
				</div>
			</div>
		</section>
	);
}
