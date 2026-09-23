import { gsap } from "../motion/gsap";
import { useMotion } from "../motion/useMotion";

const FACTS = [
	"30,000 US fire departments",
	"3 private-equity owners",
	"2 of every 3 departments run on volunteers",
	"AGPL-3.0 from the first commit",
	"Governed by a co-op that cannot be acquired",
	"Export everything, always",
] as const;

function Run({ hidden }: { readonly hidden?: boolean }) {
	return (
		<span className="ticker-run" aria-hidden={hidden || undefined}>
			{FACTS.map((fact) => (
				<span key={fact} className="ticker-item">
					{fact}
					<i className="delim">||</i>
				</span>
			))}
		</span>
	);
}

/**
 * The band that carries the argument in one pass. Two identical runs and a
 * -50% translation: the seam lands exactly where the first run ends, so the loop
 * has no jump to hide.
 */
export function Ticker() {
	const ref = useMotion<HTMLDivElement>((root) => {
		gsap.to(root.querySelector("[data-ticker-track]"), {
			xPercent: -50,
			ease: "none",
			duration: 42,
			repeat: -1,
		});
	});

	return (
		<div className="ticker" ref={ref}>
			<div className="ticker-track" data-ticker-track>
				<Run />
				<Run hidden />
			</div>
		</div>
	);
}
