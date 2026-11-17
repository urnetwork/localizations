import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, loadStore } from "./store.mjs";

// The owner's disclaimer for the one-tap Bittensor key flows (2026-11-03), word for word. The sdk names
// which of the two keys a screen shows (BittensorFundsDisclaimerFull and BittensorFundsDisclaimerFundsOnly
// hold these ids), so the ids are part of that contract too. Where the key is not stored in the app, only
// the last sentence shows, and it has to read the same as it does at the end of the whole text.

const keys = new Map(loadStore().map((k) => [k.id, k]));

const FULL = "This key is stored locally in the app secure storage. It is never shared with URnetwork. URnetwork does not touch and is not responsible for any user funds.";
const FUNDS_ONLY = "URnetwork does not touch and is not responsible for any user funds.";

test("the owner's words, as the owner wrote them", () => {
	const full = keys.get("bittensor_funds_disclaimer");
	const fundsOnly = keys.get("bittensor_funds_disclaimer_funds_only");
	assert.ok(full && fundsOnly);
	assert.equal(full.source, FULL);
	assert.equal(full.localizations.en, FULL);
	assert.equal(fundsOnly.source, FUNDS_ONLY);
	assert.equal(fundsOnly.localizations.en, FUNDS_ONLY);
});

test("both ship to the apps that show the easy flows, in every locale", () => {
	for (const id of ["bittensor_funds_disclaimer", "bittensor_funds_disclaimer_funds_only"]) {
		const k = keys.get(id);
		// Windows and Linux carry every live key already, and tag a key only once they look it up. The
		// site (ur.io) shows the funds-only text on its claim screens, and never the whole text: it
		// stores no key, so the first two sentences would be false there.
		const apps = id === "bittensor_funds_disclaimer_funds_only" ? ["apple", "android", "windows", "linux", "site"] : ["apple", "android", "windows", "linux"];
		for (const app of ["apple", "android"]) assert.ok(k.platforms.includes(app), `${id} is not ${app}'s`);
		assert.ok(k.platforms.every((p) => apps.includes(p)), `${id}: ${k.platforms}`);
		assert.deepEqual(Object.keys(k.localizations).sort(), [...LOCALES].sort(), id);
		for (const [locale, value] of Object.entries(k.localizations)) {
			assert.ok(value.includes("URnetwork"), `${id}[${locale}]`);
		}
	}
});

test("in every locale the whole text ends with the funds-only text, word for word", () => {
	const full = keys.get("bittensor_funds_disclaimer").localizations;
	const fundsOnly = keys.get("bittensor_funds_disclaimer_funds_only").localizations;
	for (const locale of LOCALES) {
		assert.ok(full[locale].endsWith(fundsOnly[locale]), `${locale}: ${full[locale]}`);
		assert.ok(full[locale].length > fundsOnly[locale].length + 10, `${locale} lost its first two sentences`);
		if (locale !== "en") assert.notEqual(full[locale], FULL, `${locale} is still English`);
	}
});
