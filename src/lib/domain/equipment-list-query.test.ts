import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	EQUIPMENT_LIST_DEFAULT_SORT,
	EQUIPMENT_LIST_FILTER_IDS,
	EQUIPMENT_LIST_SORT_COLUMNS,
	buildEquipmentListWhere,
	equipmentListHasActiveFilters,
} from "./equipment-list-query";

describe("buildEquipmentListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildEquipmentListWhere({}), {});
		assert.deepEqual(
			buildEquipmentListWhere({
				paymentId: "",
				provider: "",
			}),
			{}
		);
		assert.deepEqual(
			buildEquipmentListWhere({
				paymentId: "   ",
				provider: "   ",
			}),
			{}
		);
	});

	it("builds exact paymentId and provider contains when set", () => {
		assert.deepEqual(
			buildEquipmentListWhere({
				paymentId: "3",
			}),
			{
				AND: [{ paymentId: 3 }],
			}
		);
		assert.deepEqual(
			buildEquipmentListWhere({
				provider: "Technogym",
			}),
			{
				AND: [{ provider: { contains: "Technogym" } }],
			}
		);
		assert.deepEqual(
			buildEquipmentListWhere({
				paymentId: "3",
				provider: "  Technogym  ",
			}),
			{
				AND: [{ paymentId: 3 }, { provider: { contains: "Technogym" } }],
			}
		);
	});

	it("ignores unknown filter keys and unparseable paymentId", () => {
		assert.deepEqual(
			buildEquipmentListWhere({
				paymentId: "abc",
				unknown: "x",
			}),
			{}
		);
		assert.deepEqual(
			buildEquipmentListWhere({
				paymentId: "-1",
				provider: "7.5",
			}),
			{
				AND: [{ provider: { contains: "7.5" } }],
			}
		);
	});

	it("reports whether any Attrezzatura list filters are active", () => {
		assert.equal(equipmentListHasActiveFilters({}), false);
		assert.equal(equipmentListHasActiveFilters({ paymentId: "   " }), false);
		assert.equal(equipmentListHasActiveFilters({ paymentId: "1" }), true);
		assert.equal(
			equipmentListHasActiveFilters({ provider: "Technogym" }),
			true
		);
	});
});

describe("equipment list sort contract", () => {
	it("allows sortable Attrezzatura columns and defaults to paymentId asc", () => {
		assert.deepEqual(
			[...EQUIPMENT_LIST_SORT_COLUMNS],
			["paymentId", "description", "provider"]
		);
		assert.deepEqual(EQUIPMENT_LIST_DEFAULT_SORT, {
			column: "paymentId",
			direction: "asc",
		});
		assert.deepEqual(
			[...EQUIPMENT_LIST_FILTER_IDS],
			["paymentId", "provider"]
		);
	});
});
