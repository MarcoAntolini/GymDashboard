"use client";

import { Button } from "@/components/ui/button";
import { landingPathForRole, type AppRole } from "@/data/nav-routes";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function ForbiddenContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const from = searchParams.get("from");
	const [landing, setLanding] = useState("/entrances");
	const [roleLabel, setRoleLabel] = useState("Dipendente");

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch("/api/auth/me");
				const me = res.ok ? await res.json() : null;
				if (cancelled) return;
				if (!me?.role) {
					router.replace("/auth");
					return;
				}
				const role = me.role as AppRole;
				setLanding(landingPathForRole(role));
				setRoleLabel(role === "Admin" ? "Amministratore" : "Dipendente");
			} catch {
				if (!cancelled) router.replace("/auth");
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [router]);

	const fromDisplay = useMemo(() => {
		if (!from) return null;
		try {
			return decodeURIComponent(from);
		} catch {
			return from;
		}
	}, [from]);

	return (
		<main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-6 px-6 py-16">
			<div className="space-y-2">
				<p className="text-sm font-medium text-muted-foreground">Accesso negato</p>
				<h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
					Non hai i privilegi per questa area
				</h1>
				<p className="text-pretty text-muted-foreground leading-relaxed">
					Il tuo Account ({roleLabel}) non può aprire sezioni riservate all&apos;Amministratore
					{fromDisplay ? (
						<>
							{" "}
							(<span className="font-mono text-sm text-foreground">{fromDisplay}</span>).
						</>
					) : (
						"."
					)}{" "}
					Torna a una destinazione consentita per il tuo ruolo.
				</p>
			</div>
			<div>
				<Button asChild>
					<Link href={landing}>Vai alla tua area</Link>
				</Button>
			</div>
		</main>
	);
}

export default function ForbiddenPage() {
	return (
		<Suspense
			fallback={
				<main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-6 py-16">
					<p className="text-muted-foreground">Caricamento…</p>
				</main>
			}
		>
			<ForbiddenContent />
		</Suspense>
	);
}
