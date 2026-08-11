import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
	title: "Pyra",
	tagline: "Own your records forever. Report to NERIS.",
	favicon: "img/favicon.svg",

	// Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
	future: {
		v4: true, // Improve compatibility with the upcoming Docusaurus v4
	},

	// GitHub Pages for now; update url/baseUrl when the docs get a real domain.
	url: "https://saintparish4.github.io",
	baseUrl: "/pyra/",

	// GitHub pages deployment config.
	organizationName: "saintparish4",
	projectName: "pyra",

	onBrokenLinks: "throw",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
					editUrl: "https://github.com/saintparish4/pyra/tree/master/docs/",
				},
				// No blog. There is nothing to announce until Phase 1 ships, and an
				// empty feed reads worse than no feed. Restore the blog options plus
				// the navbar/footer entries when release notes start.
				blog: false,
				theme: {
					customCss: "./src/css/custom.css",
				},
			} satisfies Preset.Options,
		],
	],

	themeConfig: {
		colorMode: {
			respectPrefersColorScheme: true,
		},
		// The docs are structure-first while the project is blocked upstream; say
		// so before a visitor reads a stub as a promise. Remove at Phase 1.
		announcementBar: {
			id: "pre-alpha-2026-08",
			content:
				"Pyra is in early planning and blocked on the official NERIS data dictionary. Most pages here are stubs — structure now, content as each phase lands.",
			backgroundColor: "#ffe228",
			textColor: "#130e30",
			isCloseable: true,
		},
		navbar: {
			title: "Pyra",
			logo: {
				alt: "Pyra logo",
				src: "img/logo.svg",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "docsSidebar",
					position: "left",
					label: "Docs",
				},
				{
					to: "/docs/adr",
					label: "ADRs",
					position: "left",
				},
				{
					href: "https://github.com/saintparish4/pyra",
					label: "GitHub",
					position: "right",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Run it",
					items: [
						{
							label: "Introduction",
							to: "/docs/intro",
						},
						{
							label: "Deploy",
							to: "/docs/deploy",
						},
						{
							label: "Admin",
							to: "/docs/admin",
						},
					],
				},
				{
					title: "Reference",
					items: [
						{
							label: "Import",
							to: "/docs/import",
						},
						{
							label: "Schema",
							to: "/docs/schema",
						},
						{
							label: "ADRs",
							to: "/docs/adr",
						},
					],
				},
				{
					title: "Project",
					items: [
						{
							label: "GitHub",
							href: "https://github.com/saintparish4/pyra",
						},
						{
							label: "Issues",
							href: "https://github.com/saintparish4/pyra/issues",
						},
						{
							label: "License (AGPL-3.0)",
							href: "https://github.com/saintparish4/pyra/blob/master/LICENSE",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} Bluesky Labs · AGPL-3.0. Built with Docusaurus.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
