import { useState, type SyntheticEvent } from "react";

import pyraLogo from "../assets/pyra.svg";
import { trpc } from "../lib/trpc";
import "./home.css";

const CONTACT = "mailto:saintparish6@gmail.com";

function SectionHeader({
	kicker,
	title,
	lead,
}: {
	kicker: string;
	title: string;
	lead?: string;
}) {
	return (
		<header className="section-header">
			<span className="kicker">{kicker}</span>
			<h2>{title}</h2>
			{lead ? <p className="lead">{lead}</p> : null}
		</header>
	);
}

const DASH_ROWS = [
	{
		id: "2026-0347",
		type: "Structure fire — 114 Maple St",
		status: "accepted",
		label: "Accepted",
	},
	{
		id: "2026-0346",
		type: "Motor vehicle crash — Rt 9, MM 12",
		status: "submitted",
		label: "Submitted",
	},
	{
		id: "2026-0345",
		type: "Alarm activation — Ridgeline Elementary",
		status: "validated",
		label: "Validated",
	},
	{
		id: "2026-0344",
		type: "Brush fire — Carver Rd easement",
		status: "draft",
		label: "Draft",
	},
	{
		id: "2026-0343",
		type: "Public assist — 41 Depot St",
		status: "rejected",
		label: "Rejected",
	},
];

function Hero() {
	const health = trpc.health.check.useQuery();
	const status = health.isPending ? "pending" : health.isError ? "error" : "ok";
	const [email, setEmail] = useState("");

	function handleDemoRequest(event: SyntheticEvent<HTMLFormElement>) {
		event.preventDefault();
		const body = encodeURIComponent(`Department contact: ${email}`);
		window.location.href = `${CONTACT}?subject=PYRA%20demo%20request&body=${body}`;
	}

	return (
		<section className="lp-hero" id="top">
			<div className="lp-hero-copy">
				<span className="kicker">Open-source fire department RMS</span>
				<h1>
					Own your records <mark>forever</mark>.
				</h1>
				<p className="lp-hero-sub">
					PYRA is a <strong>free, open-source (AGPL-3.0), self-hostable</strong>{" "}
					records management system for US fire departments. NERIS-compliant
					incident reporting, one-click export of everything, and a nonprofit
					co-op behind it — so it can never be acquired, sunset, or marked up.
				</p>
				<form className="demo-form" onSubmit={handleDemoRequest}>
					<input
						type="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						placeholder="chief@yourdepartment.gov"
						aria-label="Work email"
						required
					/>
					<button type="submit" className="btn btn-dark">
						Request a demo
					</button>
				</form>
				<p className="lp-hero-note">
					Pay nothing and self-host, or pay server costs on the hosted co-op
					tier — never a private-equity markup.
				</p>
			</div>
			<div className="hero-scene">
				<div className="blob blob-red" aria-hidden="true" />
				<div className="blob blob-gold" aria-hidden="true" />
				<div className="blob blob-black" aria-hidden="true" />
				<div className="blob blob-white" aria-hidden="true" />
				<div className="hero-card">
					<div className="hero-card-chrome">
						<span className="hero-card-title">
							Cedar Hollow VFD — Incident board
						</span>
						<span className={`status-pill is-${status}`}>
							<span className="status-dot" aria-hidden="true" />
							{health.isPending
								? "connecting…"
								: health.isError
									? "API offline"
									: "API live"}
						</span>
					</div>
					<ul className="dash-rows">
						{DASH_ROWS.map((r) => (
							<li key={r.id}>
								<span className="dash-id">{r.id}</span>
								<span className="dash-type">{r.type}</span>
								<span className={`chip chip-${r.status}`}>{r.label}</span>
							</li>
						))}
					</ul>
					<div className="hero-card-stats">
						<div className="hero-stat">
							<strong>97%</strong>
							<span>accepted first try</span>
						</div>
						<div className="hero-stat">
							<strong>4m 32s</strong>
							<span>median report time</span>
						</div>
						<div className="hero-stat">
							<strong>0</strong>
							<span>records lost, ever</span>
						</div>
					</div>
				</div>
				<p className="hero-caption ">
					<strong>
						Preview with sample data. Pilot targets: ≥95% first-attempt NERIS
						acceptance, routine reports in under 5 minutes.
					</strong>
				</p>
			</div>
		</section>
	);
}

const TRUST_STATS = [
	{
		value: "30,000",
		label: "US fire departments locked into 3 PE-backed vendors",
	},
	{
		value: "2 / 3",
		label: "of departments are volunteer — and hit hardest by price hikes",
	},
	{
		value: "AGPL-3.0",
		label: "licensed from the first commit; the code is forkable forever",
	},
	{
		value: "Co-op",
		label: "governed by a nonprofit/cooperative that cannot be acquired",
	},
];

function Trust() {
	return (
		<section className="lp-trust" aria-label="Why departments can trust PYRA">
			<p className="lp-trust-line">
				Built in the open with volunteer departments. No logos to rent, no
				lock-in to sell — just numbers we answer to.
			</p>
			<dl className="lp-trust-grid">
				{TRUST_STATS.map((s) => (
					<div key={s.value} className="lp-trust-item">
						<dt>{s.value}</dt>
						<dd>{s.label}</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

const PROBLEMS = [
	{
		title: "Consolidation doubled your bill",
		body: "Three private-equity-backed vendors control fire RMS. Their playbook — acquire competitors, sunset products, raise prices — has doubled or tripled costs, with volunteer departments hit hardest.",
	},
	{
		title: "Your history is held hostage",
		body: "Decades of incident and training records sit in proprietary systems. Departments stay not because the software is good, but because leaving means losing their past.",
	},
	{
		title: "NERIS reset the board",
		body: "The January 2026 NFIRS→NERIS federal transition forced every department to rebuild its reporting pipeline anyway. Switching costs have never been lower. This is the window.",
	},
];

function Problem() {
	return (
		<section className="lp-section" id="problem">
			<SectionHeader
				kicker="The operational problem"
				title="The problem isn't your department. It's the market."
				lead="Fire departments don't need another vendor. They need software they own."
			/>
			<div className="card-grid cols-3">
				{PROBLEMS.map((p) => (
					<article key={p.title} className="card">
						<h3>{p.title}</h3>
						<p>{p.body}</p>
					</article>
				))}
			</div>
		</section>
	);
}

const CAPABILITIES = [
	{
		title: "NERIS-compliant reporting",
		body: "The incident model conforms to the NERIS data dictionary, with inline validation before submission — no rejected-report surprises.",
	},
	{
		title: "Progressive disclosure forms",
		body: "A routine call is a short form; a structure fire expands only the sections that matter. The UX bar is simpler than the incumbents, not just cheaper.",
	},
	{
		title: "The data importer",
		body: "Bring your history back: NFIRS 5.0 flat-file and eNFIRS bulk exports, plus Emergency Reporting CSVs — dry-run mode, mapping review, per-record error reports.",
	},
	{
		title: "Export everything, always",
		body: "One click exports your full database — JSON, CSV, and attachments — in an open, documented format. Leaving PYRA is easy. That's the point.",
	},
	{
		title: "Roles & real tenancy",
		body: "Admin, officer, member, and read-only roles. On shared instances, Postgres row-level security keeps each department's data isolated.",
	},
	{
		title: "Immutable audit trail",
		body: "Every record mutation is logged — who, what, when — with a full amendment and correction workflow for submitted incidents.",
	},
];

function Capabilities() {
	return (
		<section className="lp-section" id="capabilities">
			<SectionHeader
				kicker="Core capabilities"
				title="Everything an RMS must do, nothing to hold you hostage"
			/>
			<div className="card-grid cols-3">
				{CAPABILITIES.map((c) => (
					<article key={c.title} className="card">
						<img src={pyraLogo} className="card-mark" alt="" />
						<h3>{c.title}</h3>
						<p>{c.body}</p>
					</article>
				))}
			</div>
		</section>
	);
}

const STEPS = [
	{
		title: "Deploy in under an hour",
		body: "One docker compose up brings up the app, Postgres, and object storage — on a cheap VPS or a mini PC in the station. Or skip servers entirely with the hosted co-op tier.",
	},
	{
		title: "Import your history",
		body: "Run the importer against your NFIRS or vendor exports. Review the field mapping, dry-run it, commit when the per-record report is clean. Legacy records stay searchable even where they don't map 1:1.",
	},
	{
		title: "Write reports anywhere",
		body: "Members file incident reports from a phone at the station or at home — offline included. Drafts autosave and sync when connectivity returns.",
	},
	{
		title: "Submit and track",
		body: "PYRA validates against NERIS rules, submits through the API with a retry queue, polls status, and surfaces rejection reasons so fixes take minutes.",
	},
];

function HowItWorks() {
	return (
		<section className="lp-section" id="how-it-works">
			<SectionHeader
				kicker="How it works"
				title="From bare server to accepted NERIS submissions"
			/>
			<ol className="steps">
				{STEPS.map((s, i) => (
					<li key={s.title} className="step">
						<span className="step-num">{i + 1}</span>
						<div>
							<h3>{s.title}</h3>
							<p>{s.body}</p>
						</div>
					</li>
				))}
			</ol>
		</section>
	);
}

const PERSONAS = [
	{
		role: "Chief / Assistant Chief",
		context: "Non-technical, time-poor, budget-anxious",
		points: [
			"Submission status for every incident at a glance",
			"Grant, ISO, and compliance reporting without spreadsheets",
			"One-click full export for records requests",
		],
	},
	{
		role: "Incident officer / report writer",
		context: "Files reports after calls, often on a phone",
		points: [
			"Routine report done in under 5 minutes",
			"NERIS-required fields validated inline as you type",
			"Start offline at the station, sync from home",
		],
	},
	{
		role: "Department admin",
		context: "The one member who “does computers”",
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
];

function Personas() {
	return (
		<section className="lp-section" id="workflows">
			<SectionHeader
				kicker="Role-based workflows"
				title="Built for the people who actually run a department"
			/>
			<div className="card-grid cols-2">
				{PERSONAS.map((p) => (
					<article key={p.role} className="card persona">
						<h3>{p.role}</h3>
						<p className="persona-context">{p.context}</p>
						<ul>
							{p.points.map((pt) => (
								<li key={pt}>{pt}</li>
							))}
						</ul>
					</article>
				))}
			</div>
		</section>
	);
}

function Mobile() {
	return (
		<section className="lp-section lp-split" id="mobile">
			<div className="lp-split-copy">
				<SectionHeader
					kicker="Mobile experience"
					title="Reports get written where the trucks park"
				/>
				<ul className="checklist">
					<li>
						<strong>Offline-first PWA.</strong> Drafts live in an on-device
						queue (IndexedDB) and sync in the background when signal returns —
						zero connectivity required to start a report.
					</li>
					<li>
						<strong>Runs on the phones you have.</strong> The report form is
						usable on a five-year-old Android, with pages loading in under two
						seconds on rural LTE.
					</li>
					<li>
						<strong>Accessible by design.</strong> The report form targets WCAG
						2.1 AA — gloves-off usable for every member, not just the young
						ones.
					</li>
					<li>
						<strong>No app store.</strong> Install from the browser. No native
						app to approve, update, or pay for.
					</li>
				</ul>
			</div>
			<div className="phone" aria-hidden="true">
				<div className="phone-screen">
					<div className="phone-bar">
						<span>Incident 2026-0348</span>
						<span className="chip chip-draft">Offline draft</span>
					</div>
					<div className="phone-field">
						<label>Incident type</label>
						<div className="phone-input">111 — Building fire</div>
					</div>
					<div className="phone-field">
						<label>Location</label>
						<div className="phone-input">114 Maple St</div>
					</div>
					<div className="phone-field">
						<label>Units on scene</label>
						<div className="phone-input">E-1, T-2</div>
					</div>
					<div className="phone-sync">
						Will sync &amp; validate on reconnect
					</div>
				</div>
			</div>
		</section>
	);
}

const ROADMAP = [
	{
		name: "NERIS incident reporting",
		phase: "MVP",
		note: "Create, validate, submit, track",
	},
	{
		name: "Historical data import",
		phase: "MVP",
		note: "NFIRS 5.0 / eNFIRS, Emergency Reporting CSV",
	},
	{
		name: "Training & certifications",
		phase: "Fast-follow",
		note: "Drills, hours, expirations",
	},
	{
		name: "Apparatus & SCBA checks",
		phase: "Fast-follow",
		note: "Daily and weekly checklists",
	},
	{
		name: "Pre-plans & occupancy intel",
		phase: "Roadmap",
		note: "Hydrants, access, hazards at dispatch",
	},
	{
		name: "Inspections",
		phase: "Roadmap",
		note: "Scheduling, findings, follow-ups",
	},
];

function PreIncident() {
	return (
		<section className="lp-section" id="pre-incident">
			<SectionHeader
				kicker="Pre-incident intelligence"
				title="The record system today, the knowledge system next"
				lead="PYRA ships the RMS core first — and grows into pre-plans, hydrants, and inspections as open modules on the same data you already own. The roadmap is public; here's where each piece stands."
			/>
			<ul className="roadmap">
				{ROADMAP.map((r) => (
					<li key={r.name}>
						<span
							className={`chip chip-phase-${r.phase.toLowerCase().replace("-", "")}`}
						>
							{r.phase}
						</span>
						<strong>{r.name}</strong>
						<span className="roadmap-note">{r.note}</span>
					</li>
				))}
			</ul>
		</section>
	);
}

function Reliability() {
	return (
		<section className="lp-section" id="integrations">
			<SectionHeader
				kicker="Integrations & reliability"
				title="Plays well with the systems you answer to"
			/>
			<div className="card-grid cols-2">
				<article className="card">
					<h3>Integrations</h3>
					<ul className="plain-list">
						<li>
							NERIS submission adapter — retry queue, status polling, rejection
							reasons surfaced
						</li>
						<li>NFIRS 5.0 flat-file and eNFIRS bulk import</li>
						<li>Emergency Reporting CSV import for displaced departments</li>
						<li>
							Documented, versioned schema — the export format is a public spec
						</li>
					</ul>
				</article>
				<article className="card">
					<h3>Reliability & security</h3>
					<ul className="plain-list">
						<li>
							Scheduled automated backups with a documented, drilled restore
							procedure
						</li>
						<li>Encrypted in transit and at rest; OWASP ASVS Level 2 target</li>
						<li>
							Row-level security enforces department isolation on shared
							instances
						</li>
						<li>
							Email + password with TOTP 2FA, magic links for low-tech members
						</li>
						<li>
							No PHI in scope — ePCR is deliberately excluded from the MVP
						</li>
					</ul>
				</article>
			</div>
		</section>
	);
}

const CHART = [
	{ month: "Jan", v: 34 },
	{ month: "Feb", v: 28 },
	{ month: "Mar", v: 41 },
	{ month: "Apr", v: 37 },
	{ month: "May", v: 52 },
	{ month: "Jun", v: 46 },
];

function Analytics() {
	const max = Math.max(...CHART.map((c) => c.v));
	return (
		<section className="lp-section lp-split" id="analytics">
			<div className="lp-split-copy">
				<SectionHeader
					kicker="Analytics"
					title="Answers for the grant application, not just the state"
				/>
				<ul className="checklist">
					<li>
						<strong>Incident trends</strong> by type, district, and time of day
						— the charts an ISO review or AFG grant narrative actually asks for.
					</li>
					<li>
						<strong>Submission health.</strong> Acceptance rate, rejection
						reasons, and time-to-submit, so compliance problems surface before
						the deadline does.
					</li>
					<li>
						<strong>Your data, queryable.</strong> It's Postgres with a
						documented schema — point any BI tool at it, or just export CSV.
					</li>
				</ul>
			</div>
			<div className="chart-card" aria-hidden="true">
				<p className="chart-title">Incidents by month</p>
				<div className="chart">
					{CHART.map((c) => (
						<div
							key={c.month}
							className={`chart-col${c.v === max ? " is-max" : ""}`}
						>
							<div
								className="chart-bar"
								style={{ height: `${(c.v / max) * 100}%` }}
							/>
							<span>{c.month}</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function CaseStudy() {
	return (
		<section className="lp-section" id="case-study">
			<SectionHeader
				kicker="Case study"
				title="What switching looks like"
				lead="An illustrative pilot, built from PYRA's MVP targets. Your department could be the real one."
			/>
			<div className="case">
				<div className="case-head">
					<h3>Cedar Hollow Volunteer Fire Department</h3>
					<p>32 members · rural district · 400 calls a year · illustrative</p>
				</div>
				<ol className="case-timeline">
					<li>
						<strong>Week 1 — Deploy.</strong> The department admin stands up
						PYRA with Docker Compose on a $12/month VPS in an afternoon.
					</li>
					<li>
						<strong>Week 2 — Import.</strong> Four decades of NFIRS history come
						in through the importer: dry run, fix eleven flagged records,
						commit. Everything searchable.
					</li>
					<li>
						<strong>Week 3 — First submissions.</strong> Officers file routine
						reports from their phones in under five minutes; NERIS accepts on
						the first attempt.
					</li>
					<li>
						<strong>Renewal season — nothing.</strong> No invoice triples. The
						old vendor quote goes in the drawer; the records stay with the
						department, forever.
					</li>
				</ol>
			</div>
		</section>
	);
}

const FAQS = [
	{
		q: "Is it really free?",
		a: "Yes. PYRA is AGPL-3.0 licensed — self-host it for the cost of a small server and pay nothing to anyone. Departments that don't want to run infrastructure can join the hosted co-op tier, priced at server cost, not what the market will bear.",
	},
	{
		q: "What happens to our decades of NFIRS history?",
		a: "You import it. The importer reads NFIRS 5.0 flat-file / eNFIRS bulk exports and Emergency Reporting CSVs, walks you through a field-mapping review, and gives a per-record success/error report. Legacy records that don't map 1:1 to NERIS are preserved in full and stay searchable.",
	},
	{
		q: "Is PYRA NERIS-certified?",
		a: "PYRA is built directly against the NERIS data dictionary and is enrolling in the official integration program (testing with FSRI/UL for a compatibility badge). Achieving the NERIS V1 badge is a launch requirement, not an afterthought.",
	},
	{
		q: "We don't have anyone technical. Can we still use it?",
		a: "Yes — that's what the hosted co-op tier is for. And if you do have that one member who “does computers,” the self-host target is a single docker compose up, deployable by a semi-technical volunteer in under an hour.",
	},
	{
		q: "What about EMS runs and ePCR?",
		a: "Deliberately out of scope for the MVP. ePCR means HIPAA and state-by-state certification, and doing it badly would put departments at risk. PYRA carries no patient data by design; ePCR is a candidate for a future version.",
	},
	{
		q: "What stops PYRA from being acquired and sunset like everything else?",
		a: "Structure. The trademark is held by a nonprofit/cooperative, the code is AGPL-3.0 from the first commit, and the export format is a public spec. Even in the worst case, any department — or any group of them — can fork and keep running.",
	},
];

function Faq() {
	return (
		<section className="lp-section lp-faq" id="faq">
			<SectionHeader kicker="FAQ" title="The questions chiefs actually ask" />
			<div className="faq-list">
				{FAQS.map((f) => (
					<details key={f.q} className="faq-item">
						<summary>{f.q}</summary>
						<p>{f.a}</p>
					</details>
				))}
			</div>
		</section>
	);
}

function DemoCta() {
	return (
		<section className="lp-section" id="demo">
			<div className="cta-panel">
				<span className="kicker">Pilot program</span>
				<h2>See PYRA on your department's data</h2>
				<p>
					We're onboarding pilot departments now — full historical import, NERIS
					submission, and a restore drill included. Bring an export; leave
					owning your records.
				</p>
				<div className="cta-actions">
					<a
						className="btn btn-primary"
						href={`${CONTACT}?subject=PYRA%20demo%20request`}
					>
						Request a demo
					</a>
					<a
						className="btn btn-ghost-light"
						href={`${CONTACT}?subject=PYRA%20pilot%20program`}
					>
						Join the pilot program
					</a>
				</div>
			</div>
		</section>
	);
}

function LandingFooter() {
	return (
		<footer className="lp-footer">
			<div className="lp-footer-brand">
				<img src={pyraLogo} alt="" width="24" height="24" />
				<div>
					<p className="lp-footer-name">pyra</p>
					<p className="lp-footer-tag">
						Open-source records management for US fire departments. Own your
						records forever.
					</p>
				</div>
			</div>
			<nav className="lp-footer-cols" aria-label="Footer">
				<div>
					<p className="lp-footer-heading">Product</p>
					<a href="#capabilities">Capabilities</a>
					<a href="#how-it-works">How it works</a>
					<a href="#analytics">Analytics</a>
					<a href="#pre-incident">Roadmap</a>
				</div>
				<div>
					<p className="lp-footer-heading">Project</p>
					<a href="#faq">FAQ</a>
					<a href="#demo">Pilot program</a>
					<a href={CONTACT}>Contact</a>
				</div>
				<div>
					<p className="lp-footer-heading">Principles</p>
					<span>AGPL-3.0 licensed</span>
					<span>Nonprofit / co-op governed</span>
					<span>Export-everything guarantee</span>
				</div>
			</nav>
		</footer>
	);
}

export function Home() {
	return (
		<div className="landing">
			<Hero />
			<Trust />
			<Problem />
			<Capabilities />
			<HowItWorks />
			<Personas />
			<Mobile />
			<PreIncident />
			<Reliability />
			<Analytics />
			<CaseStudy />
			<Faq />
			<DemoCta />
			<LandingFooter />
		</div>
	);
}
