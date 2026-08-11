import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import { HomepageSections } from "@site/src/components/homepage_features";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

function HomepageHeader() {
	const { siteConfig } = useDocusaurusContext();
	return (
		<header className={clsx("hero hero--primary", styles.heroBanner)}>
			<div className="container">
				<Heading as="h1" className="hero__title">
					{siteConfig.title}
				</Heading>
				<p className="hero__subtitle">{siteConfig.tagline}</p>
				<p className={styles.heroNote}>
					Free, open-source, self-hostable records management for US fire
					departments.
				</p>
				<div className={styles.buttons}>
					<Link
						className="button button--secondary button--lg"
						to="/docs/intro"
					>
						Read the docs
					</Link>
					<Link
						className="button button--outline button--secondary button--lg"
						href="https://github.com/saintparish4/pyra"
					>
						GitHub
					</Link>
				</div>
			</div>
		</header>
	);
}

export default function Home(): ReactNode {
	return (
		<Layout
			title="Docs"
			description="Documentation for Pyra — free, open-source, self-hostable records management for US fire departments."
		>
			<HomepageHeader />
			<main>
				<HomepageSections />
			</main>
		</Layout>
	);
}
