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
            <Link to="/" activeOptions={{ exact: true }}>
              Home
            </Link>
            <Link to="/login">Login</Link>
            <Link to="/app">App</Link>
          </div>
        </nav>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>PYRA · Bluesky Labs</p>
      </footer>
    </>
  );
}
