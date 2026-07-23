"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export type ServerListFilterField = {
	id: string;
	label: string;
	placeholder?: string;
};

export type ServerListToolbarProps = {
	fields: readonly ServerListFilterField[];
	draftValues: Record<string, string>;
	onDraftChange: (id: string, value: string) => void;
	/** Conferma/Filtra — apply draft filters and re-query. */
	onApply: () => void;
	onReset: () => void;
	isDirty?: boolean;
	hasApplied?: boolean;
	/** Optional trailing slot (e.g. column visibility). */
	endSlot?: ReactNode;
};

/**
 * Filter bar for server-side lists (ticket 19).
 *
 * Inputs update local draft only; the backend is hit when the user clicks
 * **Filtra** (Conferma). Reset clears draft + applied and re-queries.
 */
export function ServerListToolbar({
	fields,
	draftValues,
	onDraftChange,
	onApply,
	onReset,
	isDirty = false,
	hasApplied = false,
	endSlot,
}: ServerListToolbarProps) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 pb-4">
			<form
				className="flex flex-wrap items-center gap-3"
				onSubmit={(event) => {
					event.preventDefault();
					onApply();
				}}
			>
				{fields.map((field) => (
					<Input
						key={field.id}
						name={field.id}
						aria-label={field.label}
						placeholder={field.placeholder ?? field.label}
						value={draftValues[field.id] ?? ""}
						onChange={(event) => onDraftChange(field.id, event.target.value)}
						className="max-w-sm w-auto"
					/>
				))}
				<Button type="submit" variant="default">
					Filtra
				</Button>
				{(isDirty || hasApplied) && (
					<Button
						type="button"
						variant="ghost"
						onClick={onReset}
						className="h-10 px-2 lg:px-3"
					>
						Reset
						<X className="ml-2 h-4 w-4" />
					</Button>
				)}
			</form>
			{endSlot}
		</div>
	);
}
