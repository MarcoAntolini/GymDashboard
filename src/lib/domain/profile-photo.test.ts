import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	PROFILE_PHOTO_MAX_BYTES,
	assertProfilePhotoSize,
	extFromMime,
	isAllowedProfilePhotoMime,
	profilePhotoCandidateFilenames,
	profilePhotoPublicPath,
	profilePhotoRelativeFsPath,
} from "./profile-photo";

describe("profile photo mime/ext", () => {
	it("maps jpeg/png/webp", () => {
		assert.equal(extFromMime("image/jpeg"), "jpg");
		assert.equal(extFromMime("image/png"), "png");
		assert.equal(extFromMime("image/webp"), "webp");
		assert.equal(extFromMime("application/pdf"), null);
	});

	it("accepts only image mime types", () => {
		assert.equal(isAllowedProfilePhotoMime("image/png"), true);
		assert.equal(isAllowedProfilePhotoMime("text/plain"), false);
	});
});

describe("assertProfilePhotoSize", () => {
	it("rejects empty and oversized files", () => {
		assert.throws(() => assertProfilePhotoSize(0), /vuoto/);
		assert.throws(() => assertProfilePhotoSize(PROFILE_PHOTO_MAX_BYTES + 1), /troppo grande/);
	});

	it("allows files within limit", () => {
		assert.doesNotThrow(() => assertProfilePhotoSize(1024));
	});
});

describe("profile photo paths", () => {
	it("builds public and fs-relative paths by employee id", () => {
		assert.equal(profilePhotoPublicPath(7, "png"), "/uploads/profiles/7.png");
		assert.equal(profilePhotoRelativeFsPath(7, "png"), "uploads/profiles/7.png");
	});

	it("lists candidate filenames for all allowed extensions", () => {
		const names = profilePhotoCandidateFilenames(3);
		assert.deepEqual(names, ["3.jpg", "3.jpeg", "3.png", "3.webp"]);
	});
});
