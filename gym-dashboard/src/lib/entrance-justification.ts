import { addDays } from "date-fns";

export type PurchaseForJustification = {
	id: number;
	date: Date;
	membershipDuration: number | null;
	entranceNumber: number | null;
	usedEntrances: number;
};

export function isMembershipValidAt(purchaseDate: Date, durationDays: number, at: Date): boolean {
	const endExclusive = addDays(purchaseDate, durationDays);
	return at >= purchaseDate && at < endExclusive;
}

export function packageResidual(entranceNumber: number, usedEntrances: number): number {
	return entranceNumber - usedEntrances;
}

export function selectJustifyingPurchaseId(
	purchases: PurchaseForJustification[],
	at: Date
): number | null {
	const memberships = purchases.filter(
		(p) =>
			p.membershipDuration != null &&
			isMembershipValidAt(p.date, p.membershipDuration, at)
	);

	if (memberships.length > 0) {
		let best = memberships[0];
		for (let i = 1; i < memberships.length; i++) {
			const cand = memberships[i];
			if (
				cand.date.getTime() > best.date.getTime() ||
				(cand.date.getTime() === best.date.getTime() && cand.id > best.id)
			) {
				best = cand;
			}
		}
		return best.id;
	}

	const packages = purchases.filter(
		(p) =>
			p.entranceNumber != null && packageResidual(p.entranceNumber, p.usedEntrances) > 0
	);

	if (packages.length > 0) {
		let best = packages[0];
		for (let i = 1; i < packages.length; i++) {
			const cand = packages[i];
			if (
				cand.date.getTime() < best.date.getTime() ||
				(cand.date.getTime() === best.date.getTime() && cand.id < best.id)
			) {
				best = cand;
			}
		}
		return best.id;
	}

	return null;
}
