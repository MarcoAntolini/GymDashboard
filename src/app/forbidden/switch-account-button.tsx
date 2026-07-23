"use client";

import { buttonVariants } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SwitchAccountButton() {
	const router = useRouter();
	const [pending, setPending] = useState(false);

	async function onSwitch() {
		setPending(true);
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			router.push("/auth");
			router.refresh();
		} finally {
			setPending(false);
		}
	}

	return (
		<button
			type="button"
			disabled={pending}
			onClick={onSwitch}
			className={buttonVariants({ variant: "outline" })}
		>
			{pending ? "Uscita…" : "Cambia Account"}
		</button>
	);
}
