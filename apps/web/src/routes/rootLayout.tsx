import { Link, Outlet } from "@tanstack/react-router";

import pyraLogo from "../assets/pyra.svg";

export function RootLayout() {
	return (
		<>
			<header className="site-header">
				<nav className="site-nav">
					<Link to="/" className="brand">
						<img src={pyraLogo} className="brand-mark" alt="" />
						<span className="brand-name">pyra</span>
					</Link>
					<div className="nav-links">
						<a href="/#capabilities" className="nav-anchor">
							Capabilities
						</a>
						<a href="/#how-it-works" className="nav-anchor">
							How it works
						</a>
						<a href="/#faq" className="nav-anchor">
							FAQ
						</a>
					</div>
					<div className="nav-actions">
						<Link to="/login" className="btn btn-dark btn-nav">
							Log in
						</Link>
						<a href="/#demo" className="btn btn-primary btn-nav">
							Get started
						</a>
					</div>
				</nav>
			</header>
			<main className="site-main">
				<Outlet />
			</main>
			<footer className="site-footer">
				<p>PYRA · Bluesky Labs · AGPL-3.0</p>
			</footer>
		</>
	);
}
