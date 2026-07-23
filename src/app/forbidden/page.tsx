import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { getOptionalSession } from "@/lib/auth";
import { landingPathForRole } from "@/data/nav-routes";
import { redirect } from "next/navigation";
import { SwitchAccountButton } from "./switch-account-button";

export default async function ForbiddenPage({
	searchParams,
}: {
	searchParams: Promise<{ from?: string }>;
}) {
	const session = await getOptionalSession();
	if (!session) {
		redirect("/auth");
	}

	const { from } = await searchParams;
	const landing = landingPathForRole(session.r);
	const fromPath = typeof from === "string" && from.startsWith("/") ? from : null;

	return (
		<main className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center gap-6 px-6 py-16">
			<div className="space-y-2">
				<p className="text-sm font-medium text-muted-foreground">Accesso negato</p>
				<h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
					Non hai i privilegi per questa area
				</h1>
				<p className="text-pretty text-muted-foreground">
					Il tuo Account non include i privilegi richiesti
					{fromPath ? (
						<>
							{" "}
							per <span className="font-medium text-foreground">{fromPath}</span>
						</>
					) : null}
					. Torna a un&apos;area consentita per il tuo ruolo.
				</p>
			</div>
			<div className="flex flex-wrap gap-3">
				<Link href={landing} className={buttonVariants({ variant: "default" })}>
					Vai alla tua area
				</Link>
				<SwitchAccountButton />
			</div>
		</main>
	);
}
