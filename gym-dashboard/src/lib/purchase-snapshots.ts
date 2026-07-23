/**
 * Snapshot di durata / N ingressi copiati dal Prodotto sull'Acquisto alla vendita.
 * La giustificazione Ingressi e il residuo pacchetto devono usare questi valori,
 * non i campi live su Abbonamento / Pacchetto ingressi.
 */

export type ProductSpecializationForSnapshot = {
	membership: { duration: number } | null;
	entranceSet: { entranceNumber: number } | null;
};

export type PurchaseCapabilitySnapshots = {
	/** Giorni di validità fissati alla vendita (Abbonamento); null per Pacchetto. */
	membershipDuration: number | null;
	/** N ingressi fissato alla vendita (Pacchetto); null per Abbonamento. */
	entranceNumber: number | null;
};

/** Deriva gli snapshot da copiare sull'Acquisto al momento della vendita. */
export function purchaseSnapshotsFromProduct(
	product: ProductSpecializationForSnapshot
): PurchaseCapabilitySnapshots {
	const membershipDuration = product.membership?.duration ?? null;
	const entranceNumber = product.entranceSet?.entranceNumber ?? null;

	if (membershipDuration != null && entranceNumber != null) {
		throw new Error(
			"Prodotto non valido: non può essere contemporaneamente Abbonamento e Pacchetto ingressi."
		);
	}

	if (membershipDuration == null && entranceNumber == null) {
		throw new Error(
			"Prodotto non specializzato: manca Abbonamento (durata) o Pacchetto (N ingressi)."
		);
	}

	return { membershipDuration, entranceNumber };
}
