"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ladeEinheitspreise } from "@/lib/einheitspreise-speicher";
import { EIGENE_PREISE_PFLICHT } from "@/lib/preise";

function LoginForm() {
  const [benutzer, setBenutzer] = useState("");
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
      body: JSON.stringify({ benutzer, passwort, next: params.get("next") ?? "/app" }),
    });
    if (res.ok) {
      const json = await res.json();
      // Beim ersten Anmelden auf diesem Gerät zuerst die Preise des Betriebs.
      const ersteAnmeldung = EIGENE_PREISE_PFLICHT && Object.keys(ladeEinheitspreise()).length === 0;
      router.push(ersteAnmeldung && json.next === "/app" ? "/einheitspreise?start=1" : json.next);
      router.refresh();
    } else {
      setFehler(true);
      setLaedt(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f8fa] px-6 text-[#111827]">
      <div className="w-full max-w-sm rounded-2xl border border-[#e6e8ec] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <Link href="/">
          <Logo />
        </Link>
        <p className="mt-2 text-sm text-[#5b6472]">Einreichplan → Massenauszug nach LB-HB 023</p>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-[#f7f9fb] p-1 text-sm">
          <span className="rounded-md bg-white py-1.5 text-center font-medium shadow-sm">Anmelden</span>
          <Link href="/demo" className="rounded-md py-1.5 text-center text-[#5b6472] hover:text-[#111827]">
            Zugang anfragen
          </Link>
        </div>

        <form onSubmit={absenden} className="mt-5 space-y-3">
          <input
            type="text"
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            placeholder="Benutzername"
            value={benutzer}
            onChange={(e) => setBenutzer(e.target.value)}
            className="w-full rounded-lg border border-[#c8d4da] px-3.5 py-2.5 text-sm placeholder:text-[#b3bec8] outline-none focus:border-[#111827] transition"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Passwort"
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            className="w-full rounded-lg border border-[#c8d4da] px-3.5 py-2.5 text-sm placeholder:text-[#b3bec8] outline-none focus:border-[#111827] transition"
          />
          {fehler && <p className="text-sm text-[#c2412d]">Benutzername oder Passwort falsch.</p>}
          <button
            type="submit"
            disabled={laedt || !passwort || !benutzer}
            className="w-full rounded-lg bg-[#1f2a44] text-white font-medium text-sm py-2.5 hover:bg-[#141c30] disabled:opacity-40 transition"
          >
            {laedt ? "Prüfe …" : "Anmelden"}
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
