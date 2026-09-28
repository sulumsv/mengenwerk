"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";

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
    <main className="min-h-screen flex items-center justify-center bg-[#f3ede3] px-6 text-[#231f1a]">
      <div className="w-full max-w-sm rounded-2xl border border-[#e8e0d2] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <Link href="/">
          <Logo />
        </Link>
        <p className="mt-2 text-sm text-[#6e665b]">Einreichplan → Massenauszug nach LB-HB 023</p>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-[#f5f0e8] p-1 text-sm">
          <span className="rounded-md bg-white py-1.5 text-center font-medium shadow-sm">Anmelden</span>
          <Link href="/demo" className="rounded-md py-1.5 text-center text-[#6e665b] hover:text-[#231f1a]">
            Zugang anfragen
          </Link>
        </div>

        <form onSubmit={absenden} className="mt-5 space-y-3">
          <input
            type="password"
            autoFocus
            placeholder="Passwort"
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            className="w-full rounded-lg border border-[#d5c9b5] px-3.5 py-2.5 text-sm placeholder:text-[#bdb3a4] outline-none focus:border-[#231f1a] transition"
          />
          {fehler && <p className="text-sm text-[#c2412d]">Falsches Passwort.</p>}
          <button
            type="submit"
            disabled={laedt || !passwort}
            className="w-full rounded-lg bg-[#c2562f] text-white font-medium text-sm py-2.5 hover:bg-[#a8461f] disabled:opacity-40 transition"
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
