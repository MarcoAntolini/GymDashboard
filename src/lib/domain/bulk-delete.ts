/**
 * Sequential bulk delete: continue after per-row failures (e.g. Restrict FK).
 */
export async function runBulkDeletes<T>(
	rows: T[],
	deleteRow: (row: T) => Promise<void>
): Promise<{ ok: number; errors: string[] }> {
	let ok = 0;
	const errors: string[] = [];
	for (const row of rows) {
		try {
			await deleteRow(row);
			ok += 1;
		} catch (err) {
			errors.push(
				err instanceof Error ? err.message : "Eliminazione non riuscita."
			);
		}
	}
	return { ok, errors };
}
