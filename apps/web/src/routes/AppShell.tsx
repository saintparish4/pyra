import { Link, Navigate, useNavigate } from "@tanstack/react-router";

import { authClient } from "../lib/auth";
import { trpc } from "../lib/trpc";

export function AppShell() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  // Fetched over tRPC (not from the session cookie directly) so this page
  // also proves the cookie -> createContext -> protectedProcedure path.
  const me = trpc.auth.me.useQuery(undefined, { enabled: !!session });

  if (isPending) {
    return (
      <section className="page">
        <div className="panel">
          <p>Loading…</p>
        </div>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  async function handleSignOut() {
    await authClient.signOut();
    await navigate({ to: "/login" });
  }

  return (
    <section className="page">
      <div className="panel">
        <span className="panel-kicker">Workspace</span>
        <h1>App</h1>
        {me.data ? (
          <p>
            Signed in as <strong>{me.data.name}</strong> ({me.data.email}, {me.data.role})
          </p>
        ) : (
          <p>{me.error ? me.error.message : "Loading session…"}</p>
        )}
        <nav className="panel-links">
          <Link to="/deploy">Deploy</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/import">Import</Link>
          <Link to="/schema">Schema</Link>
          <Link to="/adrs">ADRs</Link>
        </nav>
        <button
          className="auth-signout"
          type="button"
          onClick={() => {
            void handleSignOut();
          }}
        >
          Sign out
        </button>
      </div>
    </section>
  );
}
