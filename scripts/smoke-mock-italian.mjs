/**
 * Smoke: mock IT helpers + Owner seed credentials (ticket 48) + liste nomi curate.
 * Run: node scripts/smoke-mock-italian.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { fakerIT } = require("@faker-js/faker");

assert.ok(fakerIT, "fakerIT locale must be available");
assert.ok(fakerIT.location.city(), "Italian cities available");

const OWNER_USERNAME = "owner";
const OWNER_PASSWORD = "Password1";
assert.equal(OWNER_USERNAME, "owner");
assert.equal(OWNER_PASSWORD, "Password1");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mocksDir = join(root, "src", "lib", "mocks");
const files = readdirSync(mocksDir).filter((f) => f.endsWith(".ts"));

for (const file of files) {
	const src = readFileSync(join(mocksDir, file), "utf8");
	if (file === "faker.ts") {
		assert.match(src, /fakerIT/, "faker.ts must export Italian locale");
		continue;
	}
	assert.doesNotMatch(
		src,
		/from ["']@faker-js\/faker["']/,
		`${file} must not import default @faker-js/faker (use ./faker)`
	);
}

const accounts = readFileSync(join(mocksDir, "mockAccounts.ts"), "utf8");
assert.match(accounts, /MOCK_ROLE\.Owner/);
assert.match(accounts, /OWNER_USERNAME\s*=\s*"owner"/);
assert.match(accounts, /OWNER_PASSWORD\s*=\s*"Password1"/);

const prismaEnums = readFileSync(join(mocksDir, "prisma-enums.ts"), "utf8");
assert.match(prismaEnums, /OpenEnded:\s*"OpenEnded"/);
assert.match(prismaEnums, /Salary:\s*"Salary"/);
assert.match(prismaEnums, /Owner:\s*"Owner"/);

const italian = readFileSync(join(mocksDir, "italian.ts"), "utf8");
assert.match(italian, /ITALIAN_PROVINCES/);
assert.match(italian, /ITALIAN_FIRST_NAMES/);
assert.match(italian, /ITALIAN_LAST_NAMES/);
assert.match(italian, /sanitizeItalianText/);
assert.match(italian, /\+39/);
assert.doesNotMatch(
	italian,
	/\uFFFD/,
	"italian.ts name lists must not contain U+FFFD"
);

function sanitizeRef(value) {
	return value.replaceAll("\uFFFD", "").normalize("NFC").trim();
}

assert.equal(sanitizeRef("Mos\uFFFD"), "Mos");
assert.equal(sanitizeRef("Nicolò"), "Nicolò");

const clients = readFileSync(join(mocksDir, "mockClients.ts"), "utf8");
assert.match(clients, /italianFirstName/);
assert.match(clients, /italianLastName/);
assert.doesNotMatch(clients, /faker\.person\.(firstName|lastName)/);

const employees = readFileSync(join(mocksDir, "mockEmployees.ts"), "utf8");
assert.match(employees, /italianFirstName/);
assert.match(employees, /italianLastName/);
assert.doesNotMatch(employees, /faker\.person\.(firstName|lastName)/);

const scenario = readFileSync(join(mocksDir, "scenario.ts"), "utf8");
assert.match(scenario, /MOCK_SEED\s*=/, "mock generation must be reproducible");
assert.match(scenario, /subYears\(now,\s*5\)/, "mock history must follow the current date");
assert.match(scenario, /ABB-ANNUALE/, "realistic membership catalog is required");
assert.match(scenario, /PAC-010/, "realistic entrance package catalog is required");

console.log("smoke-mock-italian: ok");
