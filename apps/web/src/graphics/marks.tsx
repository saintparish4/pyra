/**
 * One drawn family, not six borrowed icons: a 32-unit grid, a single stroke
 * weight, round caps. Each mark carries exactly one `data-mark-accent` element —
 * the part the capability card animates on hover — so the whole set reacts the
 * same way without a per-icon rule.
 */

import type { ReactNode } from "react";

type MarkProps = {
	readonly className?: string;
};

function Mark({
	children,
	className,
}: MarkProps & { readonly children: ReactNode }) {
	return (
		<svg
			className={className ? `mark ${className}` : "mark"}
			viewBox="0 0 32 32"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
		>
			{children}
		</svg>
	);
}

export function MarkValidated(props: MarkProps) {
	return (
		<Mark {...props}>
			<path d="M20 4H8a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h6" />
			<path d="M10 11h8M10 16h8M10 21h4" />
			<circle cx="22" cy="21" r="6.5" data-mark-accent />
			<path d="m19.2 21 2.1 2.2 4-4.4" data-mark-accent />
		</Mark>
	);
}

export function MarkDisclosure(props: MarkProps) {
	return (
		<Mark {...props}>
			<rect x="4.5" y="5" width="23" height="6" rx="2" />
			<rect x="4.5" y="13.5" width="23" height="6" rx="2" data-mark-accent />
			<rect x="4.5" y="22" width="13" height="6" rx="2" data-mark-accent />
			<path d="M22.5 25h5" />
		</Mark>
	);
}

export function MarkImport(props: MarkProps) {
	return (
		<Mark {...props}>
			<path d="M16 4v13.5" />
			<path d="M10.5 12 16 17.5 21.5 12" data-mark-accent />
			<path d="M4.5 20v4.5a3 3 0 0 0 3 3h17a3 3 0 0 0 3-3V20" />
		</Mark>
	);
}

export function MarkExport(props: MarkProps) {
	return (
		<Mark {...props}>
			<path d="M16 27.5V14" />
			<path d="M10.5 19.5 16 14l5.5 5.5" data-mark-accent />
			<path d="M4.5 12V7.5a3 3 0 0 1 3-3h17a3 3 0 0 1 3 3V12" />
			<path d="M4.5 16.5h3M24.5 16.5h3" strokeDasharray="1 3" />
		</Mark>
	);
}

export function MarkTenancy(props: MarkProps) {
	return (
		<Mark {...props}>
			<rect x="3.5" y="6" width="25" height="20" rx="3" />
			<path d="M16 6v20" strokeDasharray="2 3" data-mark-accent />
			<circle cx="9.75" cy="13.5" r="2.25" />
			<path d="M6.25 21.5c0-2.2 1.6-3.6 3.5-3.6s3.5 1.4 3.5 3.6" />
			<circle cx="22.25" cy="13.5" r="2.25" />
			<path d="M18.75 21.5c0-2.2 1.6-3.6 3.5-3.6s3.5 1.4 3.5 3.6" />
		</Mark>
	);
}

export function MarkAudit(props: MarkProps) {
	return (
		<Mark {...props}>
			<path d="M26 14V7a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v18a3 3 0 0 0 3 3h6" />
			<path d="M10 10h11M10 15h8M10 20h4" />
			<rect x="17.5" y="19.5" width="10" height="8" rx="2" data-mark-accent />
			<path d="M20 19.5v-2.25a2.5 2.5 0 0 1 5 0v2.25" data-mark-accent />
		</Mark>
	);
}

/**
 * The scroll cue: a rule that a GSAP tween runs a highlight down. Drawn rather
 * than typed so the dash pattern lines up with the hero's baseline grid.
 */
export function ScrollCue() {
	return (
		<svg
			className="scroll-cue-rule"
			viewBox="0 0 2 64"
			fill="none"
			preserveAspectRatio="none"
			aria-hidden="true"
			focusable="false"
		>
			<line
				x1="1"
				y1="0"
				x2="1"
				y2="64"
				stroke="currentColor"
				strokeWidth="2"
				opacity="0.18"
			/>
			<line
				x1="1"
				y1="0"
				x2="1"
				y2="64"
				stroke="currentColor"
				strokeWidth="2"
				data-scroll-cue-run
			/>
		</svg>
	);
}
