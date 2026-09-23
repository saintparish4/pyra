import { Link, Outlet } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import pyraLogo from "../assets/pyra.svg";
import { gsap, ScrollTrigger } from "../motion/gsap";
import { useMotion } from "../motion/useMotion";

const LINKS = [
	{ label: "Capabilities", href: "/#capabilities" },
	{ label: "How it works", href: "/#how-it-works" },
	{ label: "Roadmap", href: "/#roadmap" },
	{ label: "FAQ", href: "/#faq" },
] as const;

export function RootLayout() {
	const [menuOpen, setMenuOpen] = useState(false);
	const reduced = useReducedMotion();

	useEffect(() => {
		if (!menuOpen) {
			return;
		}
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setMenuOpen(false);
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [menuOpen]);

	const headerRef = useMotion<HTMLElement>((header) => {
		// The hairline only appears once the page has moved, so the header sits on
		// the hero without a line across it.
		ScrollTrigger.create({
			start: 24,
			onUpdate(self) {
				header.dataset.scrolled = String(self.scroll() > 24);
			},
		});

		gsap.to(header.querySelector("[data-nav-progress]"), {
			scaleX: 1,
			ease: "none",
			scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
		});
	});

	return (
		<>
			<header className="site-header" ref={headerRef}>
				<nav className="site-nav">
					<Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
						<img src={pyraLogo} className="brand-mark" alt="" />
						<span className="brand-name">pyra</span>
					</Link>

					<div className="nav-links">
						{LINKS.map((link) => (
							<a key={link.label} href={link.href}>
								{link.label}
							</a>
						))}
					</div>

					<div className="nav-actions">
						<Link to="/login" className="btn btn-quiet btn-nav">
							Log in
						</Link>
						<a href="/#demo" className="btn btn-ink btn-nav">
							Request a demo
						</a>
						<button
							type="button"
							className="nav-toggle"
							aria-expanded={menuOpen}
							aria-controls="site-menu"
							onClick={() => setMenuOpen((open) => !open)}
						>
							<span className="sr-only">
								{menuOpen ? "Close menu" : "Open menu"}
							</span>
							<span className="nav-toggle-bars" aria-hidden="true" />
						</button>
					</div>
				</nav>

				<AnimatePresence initial={false}>
					{menuOpen ? (
						<motion.div
							id="site-menu"
							className="nav-menu"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={
								reduced
									? { duration: 0 }
									: { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
							}
						>
							<div className="nav-menu-inner">
								{LINKS.map((link) => (
									<a
										key={link.label}
										href={link.href}
										onClick={() => setMenuOpen(false)}
									>
										{link.label}
									</a>
								))}
							</div>
						</motion.div>
					) : null}
				</AnimatePresence>

				<span className="nav-progress" data-nav-progress aria-hidden="true" />
			</header>

			<main className="site-main">
				<Outlet />
			</main>
		</>
	);
}
