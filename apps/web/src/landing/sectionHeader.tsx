/**
 * `||` is the delimiter NERIS uses inside every incident type code. Borrowing it
 * as the page's separator means the visual system comes out of the domain rather
 * than out of a moodboard.
 */
export function Delim() {
	return (
		<i className="delim" aria-hidden="true">
			||
		</i>
	);
}

type SectionHeaderProps = {
	readonly index: string;
	readonly kicker: string;
	readonly title: string;
	readonly lead?: string;
};

export function SectionHeader({
	index,
	kicker,
	title,
	lead,
}: SectionHeaderProps) {
	return (
		<header className="section-head">
			<p className="eyebrow" data-reveal>
				<span className="section-index">{index}</span>
				<Delim />
				{kicker}
			</p>
			<h2 data-reveal-lines>{title}</h2>
			{lead ? (
				<p className="section-lead" data-reveal>
					{lead}
				</p>
			) : null}
		</header>
	);
}
