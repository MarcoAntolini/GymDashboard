"use client";

import { Button } from "@/components/ui/button";
import { getLandingPath } from "@/lib/rbac";
import { Role } from "@prisma/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ForbiddenContent() {
	const searchParams = useSearchParams();
	const from = searchParams.get("from");
	const [landingHref, setLandingHref] = useState("/");

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch("/api/auth/me");
				const me = res.ok ? await res.json() : null;
				if (cancelled || !me?.role) return;
				setLandingHref(getLandingPath(me.role as Role));
			} catch {
				/* keep default */
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="flex h-full min-h-[320px] flex-col items-start justify-center gap-4 p-8 max-w-prose">
			<p className="text-sm font-medium text-muted-foreground">Accesso negato</p>
			<h1 className="text-2xl font-semibold tracking-tight text-balance">
				Questa area è riservata all&apos;Amministratore
			</h1>
			<p className="text-muted-foreground text-pretty">
				Il tuo Account non ha i privilegi per aprire
				{from ? (
					<>
						{" "}
						<code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">{from}</code>
					</>
				) : (
					" questa pagina"
				)}
				. Torna alle operazioni consentite per il tuo ruolo, oppure chiedi a un Amministratore se ti serve
				l&apos;accesso.
			</p>
			<div className="flex flex-wrap gap-2 pt-2">
				<Button asChild>
					<Link href={landingHref}>Vai alla tua area</Link>
				</Button>
			</div>
		</div>
	);
}

export default function ForbiddenPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-full min-h-[320px] items-center p-8 text-muted-foreground">Caricamento…</div>
			}
		>
			<ForbiddenContent />
		</Suspense>
	);
}
