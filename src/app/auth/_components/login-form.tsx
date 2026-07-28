"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isAppRole, landingPathForRole } from "@/data/nav-routes";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
	username: z
		.string()
		.min(4, "Il nome utente deve avere almeno 4 caratteri")
		.max(12, "Il nome utente deve avere al massimo 12 caratteri"),
	password: z
		.string()
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
			"La password deve avere almeno 8 caratteri, una maiuscola, una minuscola e un numero"
		),
});

export function LoginForm() {
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	const [isLoading, setIsLoading] = useState(false);

	function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		return form.handleSubmit(onSubmit)(e);
	}

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		await fetch("/api/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(values),
		})
			.then((res) => res.json())
			.then(async (data) => {
				const { success, message, role } = data;
				if (success) {
					const landing = isAppRole(role) ? landingPathForRole(role) : "/entrances";
					router.push(landing);
				} else {
					toast.error(message);
				}
			})
			.finally(() => {
				setIsLoading(false);
			});
	}

	return (
		<Form {...form}>
			<form method="post" onSubmit={onFormSubmit} className="flex flex-col gap-6">
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nome utente</FormLabel>
							<FormControl>
								<Input placeholder="Nome utente" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<Input type="password" placeholder="Password" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" className="mt-6" disabled={isLoading}>
					{isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Accedi"}
				</Button>
			</form>
		</Form>
	);
}
