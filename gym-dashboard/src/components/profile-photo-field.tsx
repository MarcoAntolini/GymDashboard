"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 512 * 1024;

function initials(name?: string, surname?: string) {
	const a = (name?.[0] ?? "").toUpperCase();
	const b = (surname?.[0] ?? "").toUpperCase();
	return `${a}${b}` || "?";
}

type ProfilePhotoFieldProps = {
	name?: string;
	label?: string;
	fallbackName?: string;
	fallbackSurname?: string;
};

/** Optional profile photo control bound to a string form field (data URL or public path). */
export function ProfilePhotoField({
	name = "profilePhotoUrl",
	label = "Foto profilo",
	fallbackName,
	fallbackSurname,
}: ProfilePhotoFieldProps) {
	const form = useFormContext();

	async function onFileChange(file: File | undefined) {
		if (!file) return;
		if (!ACCEPT.split(",").includes(file.type)) {
			form.setError(name, { message: "Formato non supportato (JPEG, PNG o WebP)." });
			return;
		}
		if (file.size > MAX_BYTES) {
			form.setError(name, { message: "La foto deve essere entro 512 KB." });
			return;
		}
		const dataUrl = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = () => reject(new Error("Lettura file non riuscita"));
			reader.readAsDataURL(file);
		});
		form.clearErrors(name);
		form.setValue(name, dataUrl, { shouldDirty: true, shouldValidate: true });
	}

	return (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<div className="flex items-center gap-4">
						<Avatar className="size-16">
							{field.value ? <AvatarImage src={field.value} alt="" /> : null}
							<AvatarFallback>{initials(fallbackName, fallbackSurname)}</AvatarFallback>
						</Avatar>
						<div className="flex flex-col gap-2">
							<FormControl>
								<Input
									type="file"
									accept={ACCEPT}
									className="cursor-pointer"
									onChange={(event) => {
										void onFileChange(event.target.files?.[0]);
										event.target.value = "";
									}}
								/>
							</FormControl>
							{field.value ? (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="w-fit px-0 text-muted-foreground"
									onClick={() =>
										form.setValue(name, "", { shouldDirty: true, shouldValidate: true })
									}
								>
									Rimuovi foto
								</Button>
							) : null}
						</div>
					</div>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
