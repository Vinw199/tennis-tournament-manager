"use client";

import { useState } from "react";
import Button from "../../../components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const emailValid = /.+@.+\..+/.test(email);
  const pwValid = password.length >= 8;
  const canSubmit = emailValid && pwValid;

  function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    console.log("Login attempt", { email });
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Log in</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-black/10 bg-white p-5">
        <label className="block text-sm">
          <span className="mb-1 block text-foreground/70">Email</span>
          <input
            type="email"
            className="w-full rounded-md border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-foreground/70">Password</span>
          <div className="flex items-center gap-2">
            <input
              type={showPw ? "text" : "password"}
              className="w-full rounded-md border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button type="button" className="rounded-md border px-2 py-2 text-xs" onClick={() => setShowPw((s) => !s)}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          <div className="mt-1 text-xs text-foreground/60">At least 8 characters.</div>
        </label>
        <div className="pt-2">
          <Button type="submit" disabled={!canSubmit} className="w-full">
            Continue
          </Button>
        </div>
        <div className="text-center text-sm text-foreground/70">
          Don&apos;t have an account? <a className="text-brand underline" href="/signup">Sign up</a>
        </div>
      </form>
    </div>
  );
}



