import { SectionHeader } from "./sectionHeader";

const INTEGRATIONS = [
	"NERIS submission adapter — retry queue, status polling, rejection reasons surfaced",
	"NFIRS 5.0 flat-file and eNFIRS bulk import",
	"Emergency Reporting CSV import for displaced departments",
	"Documented, versioned schema — the export format is a public spec",
] as const;

const RELIABILITY = [
	"Scheduled automated backups with a documented, drilled restore procedure",
	"Encrypted in transit and at rest; OWASP ASVS Level 2 target",
	"Row-level security enforces department isolation on shared instances",
	"Email and password with TOTP two-factor, magic links for low-tech members",
	"No PHI in scope — ePCR is deliberately excluded from the MVP",
] as const;

export function Assurance() {
	return (
		<section className="section" id="assurance">
			<SectionHeader
				index="07"
				kicker="Integrations and reliability"
				title="Plays well with the systems you answer to"
			/>

			<div className="assurance-grid">
				<article className="assurance-panel" data-reveal>
					<h3>Integrations</h3>
					<ul className="ticks">
						{INTEGRATIONS.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</article>
				<article className="assurance-panel" data-reveal>
					<h3>Reliability and security</h3>
					<ul className="ticks">
						{RELIABILITY.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</article>
			</div>
		</section>
	);
}
