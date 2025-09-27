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
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1>Sign in</h1>
      <button onClick={onGoogle} disabled={loading} style={{ padding: 12, width: "100%", marginBottom: 12 }}>
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
      <div style={{ textAlign: "center", margin: "12px 0" }}>or</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setMode("signin")} disabled={mode === "signin"}>Sign In</button>
        <button onClick={() => setMode("signup")} disabled={mode === "signup"}>Sign Up</button>
      </div>
      <form onSubmit={onSubmit}>
        {mode === "signup" && (
          <div style={{ marginBottom: 8 }}>
            <label>Display Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required style={{ width: "100%" }} />
          </div>
        )}
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%" }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: 12, width: "100%" }}>
          {loading ? (mode === "signup" ? "Creating…" : "Signing in…") : (mode === "signup" ? "Sign Up" : "Sign In")}
        </button>
      </form>
      {error && <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>}
    </main>
  );
}

