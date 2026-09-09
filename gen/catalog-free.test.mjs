import assert from "node:assert/strict";
import test from "node:test";

import { isCatalogFreeOnly } from "./store.mjs";

const key = (platforms) => ({ id: "k", platforms, deprecated: [] });

test("a key only the email templates reference stays out of the desktop catalogs", () => {
	assert.equal(isCatalogFreeOnly(key(["email"])), true);
});

test("a key an app also references is emitted as before", () => {
	assert.equal(isCatalogFreeOnly(key(["email", "android"])), false);
	assert.equal(isCatalogFreeOnly(key(["site"])), false);
	assert.equal(isCatalogFreeOnly(key([])), false);
});
