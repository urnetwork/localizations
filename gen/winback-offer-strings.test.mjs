import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, isTaggedFor, loadStore } from "./store.mjs";

// The win-back offer's plan-screen strings (mmm/reengagement/PLAN.md "THE
// STORES"): the monthly plan's first month at a discount for a returning
// subscriber, on Google Play (android, the play flavor) and Stripe (android's
// other flavors and ur.io). The App Store presents its own win-back offer, so
// apple looks none of them up. The android cards and ur.io share the card and
// terms lines; ur.io's upgrade sheet has its own line, as it has for the
// welcome offer.

const keys = new Map(loadStore().map((k) => [k.id, k]));
const signature = (k) => k.placeholders.map((p) => `${p.name}:${p.type}`).join(" ");

const SHARED = {
	offer_first_month_price: ["{price} for your first month", "price:string"],
	offer_then_regular_monthly_price: ["then {price}/month", "price:string"],
	offer_percent_off_first_month: ["{percent}% off your first month", "percent:int"],
	offer_terms_first_month: ["{offer_price} for your first month, then {regular_price}/month. Cancel anytime.", "offer_price:string regular_price:string"],
};
const SITE = {
	site_winback_sheet_line: ["Welcome back: {percent}% off your first month, until {when}", "percent:string when:string"],
};

test("the win-back lines read as the welcome offer's do, for a month", () => {
	for (const [id, [english, placeholders]] of Object.entries({ ...SHARED, ...SITE })) {
		const k = keys.get(id);
		assert.ok(k, id);
		assert.equal(k.localizations.en, english, id);
		assert.equal(k.source, english, `${id}: no apple literal, so the source is the English`);
		assert.equal(signature(k), placeholders, id);
		assert.ok(!k.plurals, id);
	}
});

test("the card and terms lines are tagged for android and the site, the sheet line for the site, none for apple", () => {
	for (const id of Object.keys(SHARED)) {
		const k = keys.get(id);
		assert.ok(isTaggedFor(k, "android"), `${id} is tagged android`);
		assert.ok(isTaggedFor(k, "site"), `${id} is tagged site`);
		for (const p of ["apple", "windows", "linux"]) assert.equal(isTaggedFor(k, p), false, `${id} is tagged ${p}`);
	}
	const sheet = keys.get("site_winback_sheet_line");
	assert.deepEqual(sheet.platforms, ["site"]);
});

test("every win-back line is translated into every store locale with its placeholders", () => {
	for (const id of [...Object.keys(SHARED), ...Object.keys(SITE)]) {
		const k = keys.get(id);
		assert.deepEqual(LOCALES.filter((l) => k.localizations[l] == null), [], `${id} locales`);
		const english = LOCALES.filter((l) => l !== "en" && k.localizations[l] === k.localizations.en);
		assert.deepEqual(english, [], `${id} is translated`);
		for (const l of LOCALES) {
			for (const p of k.placeholders) {
				const n = k.localizations[l].split(`{${p.name}}`).length - 1;
				assert.equal(n, 1, `${id}[${l}] carries {${p.name}} once`);
			}
		}
	}
});
