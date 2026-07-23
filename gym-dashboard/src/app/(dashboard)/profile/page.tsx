"use client";

import { ProfilePhotoField } from "@/components/profile-photo-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { editOwnEmployeeProfile, getOwnEmployee } from "@/data-access/employees";
import { zodResolver } from "@hookform/resolvers/zod";
import { Employee } from "@prisma/client";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const ownProfileSchema = z.object({
	street: z.string().min(1, "La via è obbligatoria"),
	houseNumber: z.string().min(1, "Il numero civico è obbligatorio"),
	city: z.string().min(1, "La città è obbligatoria"),
	province: z.string().min(1, "La provincia è obbligatoria"),
	phoneNumber: z.string(),
	email: z.string(),
	profilePhotoUrl: z.string().nullable().optional(),
});

type OwnProfileValues = z.infer<typeof ownProfileSchema>;

function employeeInitials(employee: Pick<Employee, "name" | "surname">) {
	return `${employee.name[0] ?? ""}${employee.surname[0] ?? ""}`.toUpperCase() || "?";
}

export default function ProfilePage() {
	const [employee, setEmployee] = useState<Employee | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const form = useForm<OwnProfileValues>({
		resolver: zodResolver(ownProfileSchema),
		defaultValues: {
			street: "",
			houseNumber: "",
			city: "",
			province: "",
			phoneNumber: "",
			email: "",
			profilePhotoUrl: "",
		},
	});

	const load = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const own = await getOwnEmployee();
			setEmployee(own);
			form.reset({
				street: own.street,
				houseNumber: own.houseNumber,
				city: own.city,
				province: own.province,
				phoneNumber: own.phoneNumber,
				email: own.email,
				profilePhotoUrl: own.profilePhotoUrl ?? "",
			});
		} catch (err) {
			setError(
				err instanceof Error && err.message.trim()
					? err
					: new Error("Impossibile caricare il profilo. Riprova.")
			);
		} finally {
			setIsLoading(false);
		}
	}, [form]);

	useEffect(() => {
		void load();
	}, [load]);

	async function onSubmit(values: OwnProfileValues) {
		if (isSaving) return;
		setIsSaving(true);
		try {
			const updated = await editOwnEmployeeProfile({
				...values,
				profilePhotoUrl: values.profilePhotoUrl ?? "",
			});
			setEmployee(updated);
			form.reset({
				street: updated.street,
				houseNumber: updated.houseNumber,
				city: updated.city,
				province: updated.province,
				phoneNumber: updated.phoneNumber,
				email: updated.email,
				profilePhotoUrl: updated.profilePhotoUrl ?? "",
			});
			toast.success("Profilo aggiornato");
		} catch (err) {
			toast.error(
				err instanceof Error && err.message.trim()
					? err.message
					: "Salvataggio non riuscito"
			);
		} finally {
			setIsSaving(false);
		}
	}

	if (isLoading) {
		return <DashboardPlaceholder />;
	}

	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 p-6">
				<p className="text-sm text-muted-foreground">{error.message}</p>
				<Button type="button" variant="outline" onClick={() => void load()}>
					Riprova
				</Button>
			</div>
		);
	}

	if (!employee) return null;

	return (
		<div className="flex h-full flex-col gap-6 overflow-auto p-6">
			<div className="flex items-start gap-4">
				<Avatar className="size-16">
					{employee.profilePhotoUrl ? (
						<AvatarImage
							src={employee.profilePhotoUrl}
							alt={`${employee.name} ${employee.surname}`}
						/>
					) : null}
					<AvatarFallback>{employeeInitials(employee)}</AvatarFallback>
				</Avatar>
				<div className="min-w-0 space-y-1">
					<h1 className="truncate text-xl font-semibold tracking-tight">
						{employee.name} {employee.surname}
					</h1>
					<p className="text-sm text-muted-foreground">
						CF {employee.taxCode} · nato/a il {format(employee.birthDate, "PPP")} · assunto/a il{" "}
						{format(employee.hiringDate, "PPP")}
					</p>
					<p className="text-sm text-muted-foreground">
						Puoi aggiornare recapito, indirizzo e foto. Nome, cognome, codice fiscale e date restano
						gestiti dall&apos;Amministratore.
					</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
					<ProfilePhotoField fallbackName={employee.name} fallbackSurname={employee.surname} />
					<div className="grid grid-cols-4 gap-4">
						<FormField
							control={form.control}
							name="street"
							render={({ field }) => (
								<FormItem className="col-span-3">
									<FormLabel>Via</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="houseNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Civico</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="city"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Città</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="province"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Provincia</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid grid-cols-8 gap-4">
						<FormField
							control={form.control}
							name="phoneNumber"
							render={({ field }) => (
								<FormItem className="col-span-3">
									<FormLabel>Telefono</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem className="col-span-5">
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<Button type="submit" disabled={isSaving}>
						{isSaving ? (
							<>
								<Loader2 className="size-4 animate-spin" aria-hidden />
								Salvataggio…
							</>
						) : (
							"Salva profilo"
						)}
					</Button>
				</form>
			</Form>
		</div>
	);
}
