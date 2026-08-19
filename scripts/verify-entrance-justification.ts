/**
 * Verifica sequenziale del tie-break giustificazione Ingresso (ticket 06).
 * Nessun test runner nel progetto: eseguire con `npx tsx scripts/verify-entrance-justification.ts`
 */

import {
	NO_JUSTIFYING_SALE_ERROR,
	selectJustifyingSaleId,
	type JustifyingSaleCandidate,
} from "../src/lib/entrance-justification";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(`FAIL: ${message}`);
}

function day(iso: string): Date {
	return new Date(`${iso}T12:00:00.000Z`);
}

function run() {
	const at = day("2026-07-15");

	// 1) Membership preferred over package with residual
	{
		const id = selectJustifyingSaleId(
			[
				{
					id: 10,
					date: day("2026-07-01"),
					duration: null,
					entranceNumber: 5,
					entrancesLinked: 0,
				},
				{
					id: 20,
					date: day("2026-07-10"),
					duration: 30,
					entranceNumber: null,
					entrancesLinked: 0,
				},
			],
			at
		);
		assert(id === 20, `membership preferred, got ${id}`);
		console.log("ok: membership preferred over package");
	}

	// 2) Among valid memberships → max (date, id)
	{
		const id = selectJustifyingSaleId(
			[
				{
					id: 1,
					date: day("2026-07-01"),
					duration: 60,
					entranceNumber: null,
					entrancesLinked: 0,
				},
				{
					id: 2,
					date: day("2026-07-10"),
					duration: 30,
					entranceNumber: null,
					entrancesLinked: 0,
				},
				{
					id: 3,
					date: day("2026-07-10"),
					duration: 30,
					entranceNumber: null,
					entrancesLinked: 0,
				},
			],
			at
		);
		assert(id === 3, `max (date,id) membership, got ${id}`);
		console.log("ok: max (date, id) among memberships");
	}

	// 3) Package FIFO → min (date, id) with residual > 0
	{
		const id = selectJustifyingSaleId(
			[
				{
					id: 50,
					date: day("2026-06-01"),
					duration: null,
					entranceNumber: 3,
					entrancesLinked: 3, // residual 0 — skip
				},
				{
					id: 40,
					date: day("2026-06-15"),
					duration: null,
					entranceNumber: 2,
					entrancesLinked: 0,
				},
				{
					id: 41,
					date: day("2026-06-15"),
					duration: null,
					entranceNumber: 2,
					entrancesLinked: 0,
				},
				{
					id: 60,
					date: day("2026-07-01"),
					duration: null,
					entranceNumber: 5,
					entrancesLinked: 0,
				},
			],
			at
		);
		assert(id === 40, `FIFO package min (date,id), got ${id}`);
		console.log("ok: package FIFO min (date, id)");
	}

	// 4) Reject when residual 0 and no valid membership
	{
		let thrown = false;
		try {
			selectJustifyingSaleId(
				[
					{
						id: 7,
						date: day("2026-01-01"),
						duration: 10,
						entranceNumber: null,
						entrancesLinked: 0,
					},
					{
						id: 8,
						date: day("2026-07-01"),
						duration: null,
						entranceNumber: 1,
						entrancesLinked: 1,
					},
				],
				at
			);
		} catch (e) {
			thrown = e instanceof Error && e.message === NO_JUSTIFYING_SALE_ERROR;
		}
		assert(thrown, "expected NO_JUSTIFYING_SALE_ERROR");
		console.log("ok: reject residuo 0 / membership scaduto");
	}

	// 5) Half-open window: t = t0 + D is NOT covered
	{
		const sale: JustifyingSaleCandidate = {
			id: 9,
			date: day("2026-07-01"),
			duration: 14,
			entranceNumber: null,
			entrancesLinked: 0,
		};
		const endExclusive = day("2026-07-15"); // 01 + 14 days
		let thrown = false;
		try {
			selectJustifyingSaleId([sale], endExclusive);
		} catch (e) {
			thrown = e instanceof Error && e.message === NO_JUSTIFYING_SALE_ERROR;
		}
		assert(thrown, "half-open: end exclusive should reject");
		const inside = selectJustifyingSaleId([sale], day("2026-07-14"));
		assert(inside === 9, "half-open: last day inside window");
		console.log("ok: half-open membership window");
	}

	// 6) Same-date packages → min id
	{
		const id = selectJustifyingSaleId(
			[
				{
					id: 12,
					date: day("2026-06-01"),
					duration: null,
					entranceNumber: 1,
					entrancesLinked: 0,
				},
				{
					id: 11,
					date: day("2026-06-01"),
					duration: null,
					entranceNumber: 1,
					entrancesLinked: 0,
				},
			],
			at
		);
		assert(id === 11, `same-date min id, got ${id}`);
		console.log("ok: same-date package min id");
	}

	console.log("\nAll entrance-justification checks passed.");
}

run();
