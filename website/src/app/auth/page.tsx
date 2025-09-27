"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  async function onGoogle() {
    setLoading(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
    // On success, user gets redirected; keep loading state
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (mode === "signup") {
      const { error } = await signUp(email, password, displayName);
      if (error) setError(error.message);
      else alert("Signup initiated. Check your email to verify.");
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
      else window.location.href = "/";
    }
    setLoading(false);
  }

  return (
    <main className="container">
      <div className="toolbar">
        <div className="controls">
          <a className="link" href="/">← Back</a>
        </div>
        <div className="status">Authentication</div>
      </div>

      <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <div className="card-title">Sign in to continue</div>
        <div className="actions" style={{ display: 'grid', gap: 10 }}>
          <button
            className="primary"
            onClick={onGoogle}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>
          <div className="status" style={{ textAlign: 'center' }}>or</div>
          <div className="controls" style={{ gap: 8, justifyContent: 'center' }}>
            <button
              onClick={() => setMode("signin")}
              className={mode === "signin" ? "primary" : undefined}
              style={mode === "signin" ? undefined : { background: '#0d1226', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={mode === "signup" ? "primary" : undefined}
              style={mode === "signup" ? undefined : { background: '#0d1226', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Sign Up
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="actions" style={{ marginTop: 16, display: 'grid', gap: 10 }}>
          {mode === "signup" && (
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>Display Name</label>
              <input className="search" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required style={{ width: '100%' }} />
            </div>
          )}
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Email</label>
            <input className="search" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Password</label>
            <input className="search" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <button type="submit" className="primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? (mode === "signup" ? "Creating…" : "Signing in…") : (mode === "signup" ? "Sign Up" : "Sign In")}
          </button>
        </form>

        {error && <div className="status" style={{ color: '#ff6b6b', marginTop: 10 }}>{error}</div>}
      </div>
    </main>
  );
}
