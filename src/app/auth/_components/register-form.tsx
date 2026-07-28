"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z
	.object({
		username: z
			.string()
			.min(4, "Lo username deve avere almeno 4 caratteri")
			.max(12, "Lo username deve avere al massimo 12 caratteri"),
		password: z
			.string()
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
				"La password deve avere almeno 8 caratteri, una maiuscola, una minuscola e un numero"
			),
		confirmPassword: z.string(),
		employeeId: z.string().length(4, "L'ID dipendente deve essere di 4 cifre"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Le password devono coincidere",
		path: ["confirmPassword"],
	});

export function RegisterForm() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: "",
			password: "",
			confirmPassword: "",
			employeeId: "",
		},
	});

	const [isLoading, setIsLoading] = useState(false);

	function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		return form.handleSubmit(onSubmit)(e);
	}

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		await fetch("/api/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(values),
		})
			.then((res) => res.json())
			.then((data) => {
				const { success, message } = data;
				if (success) {
					form.reset();
					toast.success(message);
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
							<FormLabel>Username</FormLabel>
							<FormControl>
								<Input placeholder="Username" {...field} />
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
				<FormField
					control={form.control}
					name="confirmPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Conferma password</FormLabel>
							<FormControl>
								<Input type="password" placeholder="Conferma password" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="employeeId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>ID Dipendente</FormLabel>
							<FormControl>
								<Input placeholder="ID Dipendente" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" className="mt-6" disabled={isLoading}>
					{isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Registrati"}
				</Button>
			</form>
		</Form>
	);
}
