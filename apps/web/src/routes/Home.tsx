import heroImg from "../assets/hero.png";
import pyraLogo from "../assets/pyra.svg";
import pyra2Logo from "../assets/pyra2.svg";
import { trpc } from "../lib/trpc";
import "./Home.css";

export function Home() {
  const health = trpc.health.check.useQuery();

  const status = health.isPending ? "pending" : health.isError ? "error" : "ok";

  return (
    <section className="home">
      <div className="hero">
        <img src={heroImg} className="base" width="170" height="179" alt="" />
        <img src={pyraLogo} className="mark-a" alt="" />
        <img src={pyra2Logo} className="mark-b" alt="" />
      </div>
      <h1 className="home-title">PYRA</h1>
      <p className="home-tagline">
        We're building a <strong>free, open-source (AGPL-3.0), self-hostable</strong>{" "}
        records management system for US fire departments — with a planned
        low-cost hosted co-op tier for departments that don't want to run
        infrastructure, governed by a <strong>nonprofit/cooperative</strong> so
        it cannot be acquired.
      </p>
      <p className={`status-pill is-${status}`}>
        <span className="status-dot" aria-hidden="true" />
        API status:{" "}
        {health.isPending ? "checking..." : health.isError ? "unreachable" : "ok"}
      </p>
    </section>
  );
}
