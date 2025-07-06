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
			.min(4, "Username must be at least 4 characters long")
			.max(12, "Username must be at most 12 characters long"),
		password: z
			.string()
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
				"Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
			),
		confirmPassword: z.string(),
		employeeId: z.string().length(4, "Employee ID must be 4 digits long")
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords must match",
		path: ["confirmPassword"]
	});

export function RegisterForm() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: "",
			password: "",
			confirmPassword: "",
			employeeId: ""
		}
	});

	const [isLoading, setIsLoading] = useState(false);

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		await fetch("/api/auth/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(values)
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
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
							<FormLabel>Confirm Password</FormLabel>
							<FormControl>
								<Input type="password" placeholder="Confirm Password" {...field} />
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
							<FormLabel>Employee ID</FormLabel>
							<FormControl>
								<Input placeholder="Employee ID" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" className="mt-6" disabled={isLoading}>
					{isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Register"}
				</Button>
			</form>
		</Form>
	);
}
