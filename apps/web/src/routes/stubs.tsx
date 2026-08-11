import { Link } from "@tanstack/react-router";

import type { ReactNode } from "react";

const ADR_DIR_URL = "https://github.com/saintparish4/pyra/tree/master/adr";

function StubPanel({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section className="page">
			<div className="panel">
				<span className="panel-kicker">Coming soon</span>
				<h1>{title}</h1>
				{children}
				<p>
					<Link to="/app">Back to workspace</Link>
				</p>
			</div>
		</section>
	);
}

export function DeployPage() {
	return (
		<StubPanel title="Deploy">
			<p>
				Deployment status and health checks will live here — the one-command
				Docker Compose stack (app, Postgres, MinIO) that gets a department
				running in under an hour.
			</p>
		</StubPanel>
	);
}

export function AdminPage() {
	return (
		<StubPanel title="Admin">
			<p>
				Department administration will live here — members, roles (admin /
				officer / member / read-only), and department settings.
			</p>
		</StubPanel>
	);
}

export function ImportPage() {
	return (
		<StubPanel title="Import">
			<p>
				The data importer will live here — NFIRS flat-file and vendor CSV
				parsers, mapping review, dry runs, and per-record error reports.
			</p>
		</StubPanel>
	);
}

export function SchemaPage() {
	return (
		<StubPanel title="Schema">
			<p>
				A browsable view of the NERIS data dictionary and how Pyra&apos;s
				database maps to it will live here.
			</p>
		</StubPanel>
	);
}

export function AdrsPage() {
	return (
		<StubPanel title="ADRs">
			<p>
				Architecture decision records are kept in the repository under{" "}
				<a href={ADR_DIR_URL} target="_blank" rel="noreferrer">
					/adr
				</a>
				, starting with ADR-0001 (stack choice).
			</p>
		</StubPanel>
	);
}
