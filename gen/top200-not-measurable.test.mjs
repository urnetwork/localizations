import assert from "node:assert/strict";
import test from "node:test";

import { loadAllKeys } from "../index.js";

// What the ur.io Top 200 page tells a network the SN25 validator can't measure yet,
// in place of You qualify (owner decision 2026-11-17: qualifying follows
// measurability, as the claim guide says): not measurable yet, and register or pay
// nothing until the page and the Earnings tile show the Claim your spot button, named
// as that button reads in the reader's language.

const all = loadAllKeys({ platform: null });
const SITE_LOCALES = ["en", "de", "es", "ru", "zh", "ar"];

test("the not-measurable status and its rule are site keys in every site locale", () => {
	for (const id of ["site_app_top200_not_measurable", "site_app_top200_not_measurable_body"]) {
		assert.ok(all[id], `${id} is in the store`);
		assert.deepEqual(all[id].platforms, ["site"], id);
		for (const locale of SITE_LOCALES) {
			assert.ok(all[id].localizations[locale]?.trim(), `${id} ${locale}`);
		}
	}
	assert.equal(all.site_app_top200_not_measurable.source, "Not measurable yet");
	assert.equal(
		all.site_app_top200_not_measurable_body.source,
		"Don't register or pay anything until this page and your Earnings tile show Claim your spot.",
	);
});

test("every locale of the rule names the Claim your spot button as it reads there", () => {
	const button = all.claim_your_spot;
	assert.ok(button.platforms.includes("site"), "the button's label is on the site");
	for (const locale of SITE_LOCALES) {
		const label = button.localizations[locale];
		assert.ok(label, locale);
		assert.ok(all.site_app_top200_not_measurable_body.localizations[locale].includes(label), `${locale} names "${label}"`);
	}
});

test("the not-measurable headline is not the leaderboard's label alone", () => {
	// "yet": the page says it can change, unlike the Protocol tab's chip
	for (const locale of SITE_LOCALES) {
		assert.notEqual(
			all.site_app_top200_not_measurable.localizations[locale],
			all.leaderboard_protocol_label_not_measurable.localizations[locale],
			locale,
		);
	}
});
