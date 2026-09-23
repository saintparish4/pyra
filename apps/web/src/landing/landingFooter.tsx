import { CONTACT } from "./links";
import { Delim } from "./sectionHeader";

const COLUMNS = [
	{
		heading: "Product",
		links: [
			{ label: "Capabilities", href: "#capabilities" },
			{ label: "How it works", href: "#how-it-works" },
			{ label: "Analytics", href: "#analytics" },
			{ label: "Roadmap", href: "#roadmap" },
		],
	},
	{
		heading: "Project",
		links: [
			{ label: "FAQ", href: "#faq" },
			{ label: "Pilot program", href: "#demo" },
			{ label: "Contact", href: CONTACT },
		],
	},
] as const;

const PRINCIPLES = [
	"AGPL-3.0 licensed",
	"Nonprofit co-op governed",
	"Export-everything guarantee",
] as const;

export function LandingFooter() {
	return (
		<footer className="landing-footer">
			<div className="footer-top">
				<p className="footer-line">
					Open-source records management for US fire departments.
					<br />
					Own your records forever.
				</p>

				<nav className="footer-cols" aria-label="Footer">
					{COLUMNS.map((column) => (
						<div key={column.heading}>
							<p className="footer-heading">{column.heading}</p>
							{column.links.map((link) => (
								<a key={link.label} href={link.href}>
									{link.label}
								</a>
							))}
						</div>
					))}
					<div>
						<p className="footer-heading">Principles</p>
						{PRINCIPLES.map((principle) => (
							<span key={principle}>{principle}</span>
						))}
					</div>
				</nav>
			</div>

			{/* Set in the display face at viewport scale — the wordmark is the rule. */}
			<p className="footer-wordmark" aria-hidden="true">
				pyra
			</p>

			<p className="footer-fine">
				Bluesky Labs <Delim /> AGPL-3.0 <Delim /> built in the open with
				volunteer departments
			</p>
		</footer>
	);
}
