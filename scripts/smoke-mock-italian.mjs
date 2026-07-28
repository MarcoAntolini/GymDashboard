/**
 * Smoke: mock IT helpers + Owner seed credentials (ticket 48).
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
assert.ok(fakerIT.person.firstName(), "Italian person names available");
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
assert.match(accounts, /Role\.Owner/);
assert.match(accounts, /OWNER_USERNAME\s*=\s*"owner"/);
assert.match(accounts, /OWNER_PASSWORD\s*=\s*"Password1"/);

const italian = readFileSync(join(mocksDir, "italian.ts"), "utf8");
assert.match(italian, /ITALIAN_PROVINCES/);
assert.match(italian, /\+39/);

console.log("smoke-mock-italian: ok");
