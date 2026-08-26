"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setLaedt(true);
    setFehler(false);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwort, next: params.get("next") ?? "/" }),
    });
    if (res.ok) {
      const json = await res.json();
      router.push(json.next);
      router.refresh();
    } else {
      setFehler(true);
      setLaedt(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display font-black uppercase tracking-tight text-2xl mb-1">Mengenwerk</h1>
        <p className="font-mono text-xs text-fg-muted uppercase tracking-wide mb-8">Geschützter Zugang</p>
        <form onSubmit={absenden} className="rounded-lg border border-line bg-surface-2 p-6">
          <label className="block font-mono text-xs uppercase tracking-wide text-fg-muted mb-2">Passwort</label>
          <input
            type="password"
            autoFocus
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-line-strong outline-none"
          />
          {fehler && <p className="mt-2 text-sm text-alert">Falsches Passwort.</p>}
          <button
            type="submit"
            disabled={laedt || !passwort}
            className="mt-5 w-full rounded-md bg-line-strong text-surface font-display font-bold uppercase tracking-wide text-sm py-2.5 disabled:opacity-40"
          >
            {laedt ? "Prüfe" : "Anmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
