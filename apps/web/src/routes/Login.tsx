import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { authClient } from "../lib/auth";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await authClient.signIn.email({ email, password });
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? "Sign-in failed");
      return;
    }
    void navigate({ to: "/app" });
  }

  return (
    <section className="page">
      <div className="panel">
        <span className="panel-kicker">Welcome back</span>
        <h1>Login</h1>
        <form
          className="auth-form"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </section>
  );
}
