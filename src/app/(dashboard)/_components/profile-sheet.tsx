"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	getOwnProfile,
	updateOwnCredentials,
	updateOwnEmployeeProfile,
} from "@/data-access/profile";
import { Loader2, UserRound } from "lucide-react";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";

type OwnProfile = Awaited<ReturnType<typeof getOwnProfile>>;

function toDateInputValue(value: Date | string) {
	const d = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	return d.toISOString().slice(0, 10);
}

export function ProfileSheet({
	open,
	onOpenChange,
	onUsernameChanged,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUsernameChanged?: (username: string) => void;
}) {
	const [profile, setProfile] = useState<OwnProfile | null>(null);
	const [loading, setLoading] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [photoBusy, setPhotoBusy] = useState(false);
	const [selectedFileName, setSelectedFileName] = useState<string | null>(
		null
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [taxCode, setTaxCode] = useState("");
	const [name, setName] = useState("");
	const [surname, setSurname] = useState("");
	const [birthDate, setBirthDate] = useState("");
	const [street, setStreet] = useState("");
	const [houseNumber, setHouseNumber] = useState("");
	const [city, setCity] = useState("");
	const [province, setProvince] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [email, setEmail] = useState("");
	const [photoUrl, setPhotoUrl] = useState<string | null>(null);

	const [username, setUsername] = useState("");
	const [newUsername, setNewUsername] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getOwnProfile();
			setProfile(data);
			setTaxCode(data.employee.taxCode);
			setName(data.employee.name);
			setSurname(data.employee.surname);
			setBirthDate(toDateInputValue(data.employee.birthDate));
			setStreet(data.employee.street);
			setHouseNumber(data.employee.houseNumber);
			setCity(data.employee.city);
			setProvince(data.employee.province);
			setPhoneNumber(data.employee.phoneNumber);
			setEmail(data.employee.email);
			setPhotoUrl(data.photoUrl);
			setUsername(data.username);
			setNewUsername(data.username);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setSelectedFileName(null);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: "Impossibile caricare il profilo.";
			toast.error(message);
			onOpenChange(false);
		} finally {
			setLoading(false);
		}
	}, [onOpenChange]);

	useEffect(() => {
		if (!open) return;
		void load();
	}, [open, load]);

	const saveAnagrafica = () => {
		startTransition(async () => {
			try {
				if (profile?.canEditIdentity) {
					await updateOwnEmployeeProfile({
						taxCode,
						name,
						surname,
						birthDate: new Date(birthDate),
						street,
						houseNumber,
						city,
						province,
						phoneNumber,
						email,
					});
				} else {
					await updateOwnEmployeeProfile({
						street,
						houseNumber,
						city,
						province,
						phoneNumber,
						email,
					});
				}
				toast.success(
					profile?.canEditIdentity
						? "Anagrafica aggiornata"
						: "Recapiti aggiornati"
				);
				await load();
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: "Impossibile aggiornare l'anagrafica.";
				toast.error(message);
			}
		});
	};

	const saveCredentials = () => {
		startTransition(async () => {
			try {
				const usernameChanged = newUsername.trim() !== username;
				const passwordChanged = newPassword.length > 0;
				if (!usernameChanged && !passwordChanged) {
					toast.error("Nessuna modifica alle credenziali");
					return;
				}
				if (passwordChanged) {
					if (newPassword !== confirmPassword) {
						toast.error("Le password non coincidono");
						return;
					}
					if (!currentPassword) {
						toast.error("Inserisci la password attuale");
						return;
					}
				}
				const result = await updateOwnCredentials({
					username,
					currentPassword: passwordChanged ? currentPassword : undefined,
					newUsername: usernameChanged ? newUsername.trim() : undefined,
					newPassword: passwordChanged ? newPassword : undefined,
				});
				setUsername(result.username);
				setNewUsername(result.username);
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
				onUsernameChanged?.(result.username);
				toast.success("Credenziali aggiornate");
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: "Impossibile aggiornare le credenziali.";
				toast.error(message);
			}
		});
	};

	const onPhotoSelected = async (file: File | undefined) => {
		if (!file) return;
		setSelectedFileName(file.name);
		setPhotoBusy(true);
		try {
			const body = new FormData();
			body.append("photo", file);
			const res = await fetch("/api/profile/photo", {
				method: "POST",
				body,
			});
			const data = (await res.json()) as {
				success?: boolean;
				message?: string;
				photoUrl?: string | null;
			};
			if (!res.ok || !data.success) {
				toast.error(data.message ?? "Caricamento non riuscito");
				return;
			}
			setPhotoUrl(
				data.photoUrl ? `${data.photoUrl}?t=${Date.now()}` : null
			);
			toast.success("Foto aggiornata");
		} catch {
			toast.error("Caricamento non riuscito");
		} finally {
			setPhotoBusy(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Profilo</SheetTitle>
					<SheetDescription>
						Gestisci anagrafica, foto e credenziali del tuo Account.
					</SheetDescription>
				</SheetHeader>

				{loading || !profile ? (
					<div className="flex items-center justify-center py-16">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<div className="mt-6 flex flex-col gap-8">
						<section className="flex flex-col gap-3">
							<h3 className="text-sm font-medium">Foto profilo</h3>
							<div className="flex items-center gap-4">
								<div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
									{photoUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={photoUrl}
											alt="Foto profilo"
											className="h-full w-full object-cover"
										/>
									) : (
										<UserRound className="h-7 w-7 text-muted-foreground" />
									)}
								</div>
								<div className="flex flex-col gap-2">
									<input
										ref={fileInputRef}
										type="file"
										accept="image/jpeg,image/png,image/webp"
										disabled={photoBusy || isPending}
										className="hidden"
										onChange={(e) =>
											void onPhotoSelected(e.target.files?.[0])
										}
									/>
									<div className="flex min-w-0 items-center gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={photoBusy || isPending}
											onClick={() => fileInputRef.current?.click()}
										>
											Scegli file
										</Button>
										<span className="truncate text-sm text-muted-foreground">
											{selectedFileName ?? "Nessun file selezionato"}
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										JPG, PNG o WebP — max 2 MB.
									</p>
								</div>
							</div>
						</section>

						<section className="flex flex-col gap-3">
							<h3 className="text-sm font-medium">Anagrafica</h3>
							{!profile.canEditIdentity ? (
								<p className="text-xs text-muted-foreground">
									Nome, cognome, codice fiscale e data di nascita sono
									modificabili solo da Amministratore o Proprietario (anche
									tramite modifica Dipendenti). Qui puoi aggiornare i recapiti.
								</p>
							) : null}
							<div className="grid grid-cols-2 gap-3">
								<div className="col-span-2 space-y-1.5 sm:col-span-1">
									<Label htmlFor="profile-name">Nome</Label>
									<Input
										id="profile-name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										disabled={!profile.canEditIdentity}
										readOnly={!profile.canEditIdentity}
									/>
								</div>
								<div className="col-span-2 space-y-1.5 sm:col-span-1">
									<Label htmlFor="profile-surname">Cognome</Label>
									<Input
										id="profile-surname"
										value={surname}
										onChange={(e) => setSurname(e.target.value)}
										disabled={!profile.canEditIdentity}
										readOnly={!profile.canEditIdentity}
									/>
								</div>
								<div className="col-span-2 space-y-1.5">
									<Label htmlFor="profile-tax">Codice fiscale</Label>
									<Input
										id="profile-tax"
										value={taxCode}
										onChange={(e) => setTaxCode(e.target.value)}
										maxLength={16}
										disabled={!profile.canEditIdentity}
										readOnly={!profile.canEditIdentity}
									/>
								</div>
								<div className="col-span-2 space-y-1.5 sm:col-span-1">
									<Label htmlFor="profile-birth">Data di nascita</Label>
									<Input
										id="profile-birth"
										type="date"
										value={birthDate}
										onChange={(e) => setBirthDate(e.target.value)}
										disabled={!profile.canEditIdentity}
										readOnly={!profile.canEditIdentity}
									/>
								</div>
								<div className="col-span-2 space-y-1.5 sm:col-span-1">
									<Label htmlFor="profile-phone">Telefono</Label>
									<Input
										id="profile-phone"
										value={phoneNumber}
										onChange={(e) => setPhoneNumber(e.target.value)}
									/>
								</div>
								<div className="col-span-2 space-y-1.5">
									<Label htmlFor="profile-email">Email</Label>
									<Input
										id="profile-email"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</div>
								<div className="col-span-2 space-y-1.5 sm:col-span-1">
									<Label htmlFor="profile-street">Via</Label>
									<Input
										id="profile-street"
										value={street}
										onChange={(e) => setStreet(e.target.value)}
									/>
								</div>
								<div className="col-span-2 space-y-1.5 sm:col-span-1">
									<Label htmlFor="profile-house">Civico</Label>
									<Input
										id="profile-house"
										value={houseNumber}
										onChange={(e) => setHouseNumber(e.target.value)}
									/>
								</div>
								<div className="col-span-2 space-y-1.5 sm:col-span-1">
									<Label htmlFor="profile-city">Città</Label>
									<Input
										id="profile-city"
										value={city}
										onChange={(e) => setCity(e.target.value)}
									/>
								</div>
								<div className="col-span-2 space-y-1.5 sm:col-span-1">
									<Label htmlFor="profile-province">Provincia</Label>
									<Input
										id="profile-province"
										value={province}
										onChange={(e) => setProvince(e.target.value)}
									/>
								</div>
							</div>
							<Button
								type="button"
								onClick={saveAnagrafica}
								disabled={isPending || photoBusy}
							>
								{isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								{profile.canEditIdentity
									? "Salva anagrafica"
									: "Salva recapiti"}
							</Button>
						</section>

						<section className="flex flex-col gap-3">
							<h3 className="text-sm font-medium">Credenziali</h3>
							<div className="space-y-1.5">
								<Label htmlFor="profile-username">Nome utente</Label>
								<Input
									id="profile-username"
									value={newUsername}
									onChange={(e) => setNewUsername(e.target.value)}
									autoComplete="username"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="profile-current-password">
									Password attuale
								</Label>
								<Input
									id="profile-current-password"
									type="password"
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									autoComplete="current-password"
								/>
								<p className="text-xs text-muted-foreground">
									Obbligatoria solo per cambiare la password.
								</p>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="profile-new-password">Nuova password</Label>
								<Input
									id="profile-new-password"
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									autoComplete="new-password"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="profile-confirm-password">
									Conferma nuova password
								</Label>
								<Input
									id="profile-confirm-password"
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									autoComplete="new-password"
								/>
							</div>
							<Button
								type="button"
								variant="secondary"
								onClick={saveCredentials}
								disabled={isPending || photoBusy}
							>
								{isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Salva credenziali
							</Button>
						</section>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
