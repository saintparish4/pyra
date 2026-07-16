import { Link, Outlet } from "@tanstack/react-router";

import pyraLogo from "../assets/pyra.svg";

export function RootLayout() {
  return (
    <>
      <header className="site-header">
        <nav className="site-nav">
          <Link to="/" className="brand">
            <img src={pyraLogo} className="brand-mark" alt="" />
            <span className="brand-name">PYRA</span>
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
            <Link to="/login">Login</Link>
            <a href="/#demo" className="nav-cta">
              Request a demo
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
