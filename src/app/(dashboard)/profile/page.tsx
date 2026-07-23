"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
	changeOwnPassword,
	changeOwnUsername,
	getOwnProfile,
	updateOwnEmployee,
	uploadOwnPhoto,
	type OwnProfile,
} from "@/data-access/profile";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const anagraficaSchema = z.object({
	id: z.number().int().positive(),
	name: z.string().min(1, "Nome obbligatorio"),
	surname: z.string().min(1, "Cognome obbligatorio"),
	taxCode: z.string().length(16, "Codice fiscale: 16 caratteri"),
	birthDate: z.date({ message: "Data di nascita obbligatoria" }),
	street: z.string().min(1, "Via obbligatoria"),
	houseNumber: z.string().min(1, "Civico obbligatorio"),
	city: z.string().min(1, "Città obbligatoria"),
	province: z.string().min(1, "Provincia obbligatoria"),
	phoneNumber: z.string(),
	email: z.string(),
	hiringDate: z.date(),
});

const credentialsSchema = z
	.object({
		username: z
			.string()
			.min(4, "Username: almeno 4 caratteri")
			.max(12, "Username: al massimo 12 caratteri"),
		currentPassword: z.string().optional(),
		newPassword: z.string().optional(),
		confirmPassword: z.string().optional(),
	})
	.superRefine((values, ctx) => {
		const changingPassword = Boolean(values.newPassword || values.confirmPassword);
		if (changingPassword) {
			if (!values.currentPassword) {
				ctx.addIssue({
					code: "custom",
					path: ["currentPassword"],
					message: "Password attuale obbligatoria per il cambio",
				});
			}
			if (
				!values.newPassword ||
				!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(values.newPassword)
			) {
				ctx.addIssue({
					code: "custom",
					path: ["newPassword"],
					message: "Min 8 caratteri, una maiuscola, una minuscola e un numero",
				});
			}
			if (values.newPassword !== values.confirmPassword) {
				ctx.addIssue({
					code: "custom",
					path: ["confirmPassword"],
					message: "Le password non coincidono",
				});
			}
		}
	});

export default function ProfilePage() {
	const [profile, setProfile] = useState<OwnProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [savingAnagrafica, setSavingAnagrafica] = useState(false);
	const [savingCredentials, setSavingCredentials] = useState(false);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);

	const anagraficaForm = useForm<z.infer<typeof anagraficaSchema>>({
		resolver: zodResolver(anagraficaSchema),
	});

	const credentialsForm = useForm<z.infer<typeof credentialsSchema>>({
		resolver: zodResolver(credentialsSchema),
		defaultValues: {
			username: "",
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	const loadProfile = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getOwnProfile();
			setProfile(data);
			setPhotoPreview(data.photoUrl);
			anagraficaForm.reset({
				id: data.employee.id,
				name: data.employee.name,
				surname: data.employee.surname,
				taxCode: data.employee.taxCode,
				birthDate: new Date(data.employee.birthDate),
				street: data.employee.street,
				houseNumber: data.employee.houseNumber,
				city: data.employee.city,
				province: data.employee.province,
				phoneNumber: data.employee.phoneNumber,
				email: data.employee.email,
				hiringDate: new Date(data.employee.hiringDate),
			});
			credentialsForm.reset({
				username: data.username,
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Impossibile caricare il profilo");
		} finally {
			setLoading(false);
		}
	}, [anagraficaForm, credentialsForm]);

	useEffect(() => {
		void loadProfile();
	}, [loadProfile]);

	async function onSaveAnagrafica(values: z.infer<typeof anagraficaSchema>) {
		setSavingAnagrafica(true);
		try {
			await updateOwnEmployee(values);
			toast.success("Anagrafica aggiornata");
			await loadProfile();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Salvataggio anagrafica fallito");
		} finally {
			setSavingAnagrafica(false);
		}
	}

	async function onSaveCredentials(values: z.infer<typeof credentialsSchema>) {
		if (!profile) return;
		setSavingCredentials(true);
		try {
			// Password first (still keyed to current session username), then username rename.
			if (values.newPassword) {
				await changeOwnPassword({
					targetUsername: profile.username,
					currentPassword: values.currentPassword ?? "",
					newPassword: values.newPassword,
				});
				toast.success("Password aggiornata");
			}
			if (values.username !== profile.username) {
				await changeOwnUsername({
					targetUsername: profile.username,
					newUsername: values.username,
				});
				toast.success("Username aggiornato");
			}
			if (values.username === profile.username && !values.newPassword) {
				toast.message("Nessuna modifica alle credenziali");
			}
			await loadProfile();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Aggiornamento credenziali fallito");
			await loadProfile();
		} finally {
			setSavingCredentials(false);
		}
	}

	async function onPhotoSelected(fileList: FileList | null) {
		const file = fileList?.[0];
		if (!file) return;
		setUploadingPhoto(true);
		try {
			const fd = new FormData();
			fd.set("photo", file);
			const result = await uploadOwnPhoto(fd);
			setPhotoPreview(`${result.photoUrl}?t=${Date.now()}`);
			toast.success("Foto profilo aggiornata");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload foto fallito");
		} finally {
			setUploadingPhoto(false);
		}
	}

	if (loading && !profile) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-muted-foreground">
				<Loader2 className="mr-2 h-5 w-5 animate-spin" />
				Caricamento profilo…
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto p-6">
			<div className="mx-auto flex max-w-3xl flex-col gap-6">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Profilo</h1>
					<p className="text-sm text-muted-foreground">
						Gestisci anagrafica, foto e credenziali del tuo Account.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Foto profilo</CardTitle>
						<CardDescription>Storage locale sul progetto (jpg, png, webp — max 2 MB).</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
						<div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-muted">
							{photoPreview ? (
								// eslint-disable-next-line @next/next/no-img-element -- local upload under public/uploads
								<img
									src={photoPreview}
									alt="Foto profilo"
									width={96}
									height={96}
									className="h-full w-full object-cover"
								/>
							) : (
								<UserRound className="h-10 w-10 text-muted-foreground" />
							)}
						</div>
						<div className="flex flex-col gap-2">
							<Input
								type="file"
								accept="image/jpeg,image/png,image/webp"
								disabled={uploadingPhoto}
								onChange={(e) => void onPhotoSelected(e.target.files)}
							/>
							{uploadingPhoto ? (
								<p className="flex items-center text-sm text-muted-foreground">
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Caricamento…
								</p>
							) : null}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Anagrafica</CardTitle>
						<CardDescription>Dati del Dipendente collegato al tuo Account.</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...anagraficaForm}>
							<form
								className="space-y-4"
								onSubmit={anagraficaForm.handleSubmit(onSaveAnagrafica)}
							>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<FormField
										control={anagraficaForm.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nome</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={anagraficaForm.control}
										name="surname"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Cognome</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={anagraficaForm.control}
										name="taxCode"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Codice fiscale</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={anagraficaForm.control}
										name="birthDate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Data di nascita</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant="outline"
																className={cn(
																	"w-full pl-3 text-left font-normal",
																	!field.value && "text-muted-foreground"
																)}
															>
																{field.value ? format(field.value, "dd/MM/yyyy") : "Seleziona"}
																<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<Calendar
															mode="single"
															selected={field.value}
															onSelect={field.onChange}
															disabled={(date) => date > new Date()}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={anagraficaForm.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input type="email" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={anagraficaForm.control}
										name="phoneNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Telefono</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={anagraficaForm.control}
										name="street"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Via</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={anagraficaForm.control}
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
									<FormField
										control={anagraficaForm.control}
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
										control={anagraficaForm.control}
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
								<Separator />
								<div className="flex justify-end">
									<Button type="submit" disabled={savingAnagrafica}>
										{savingAnagrafica ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
										Salva anagrafica
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Credenziali</CardTitle>
						<CardDescription>
							Solo il tuo Account. Il cambio password richiede la password attuale.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...credentialsForm}>
							<form
								className="space-y-4"
								onSubmit={credentialsForm.handleSubmit(onSaveCredentials)}
							>
								<FormField
									control={credentialsForm.control}
									name="username"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Username</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={credentialsForm.control}
									name="currentPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Password attuale</FormLabel>
											<FormControl>
												<Input type="password" autoComplete="current-password" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<FormField
										control={credentialsForm.control}
										name="newPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Nuova password</FormLabel>
												<FormControl>
													<Input type="password" autoComplete="new-password" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={credentialsForm.control}
										name="confirmPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Conferma password</FormLabel>
												<FormControl>
													<Input type="password" autoComplete="new-password" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<Separator />
								<div className="flex justify-end">
									<Button type="submit" disabled={savingCredentials}>
										{savingCredentials ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
										Aggiorna credenziali
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
