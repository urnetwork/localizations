import assert from "node:assert/strict";
import test from "node:test";

import { SITE_LOCALES, isTaggedFor, loadStore } from "./store.mjs";

// Claims through the relay on ur.io (BTEASY flow 4, the mocks' 4a to 4e): the site's Earnings tile and
// claim screen look up the apps' claim relay strings, the claimed state's sentence and Transaction, and
// the funds-only disclaimer (mmm ur.io/react/src/app/sn/ClaimRelaySection.jsx and claimRelay.js), so the
// keys carry the site's tag and stay alive for it. The whole disclaimer never does: its first two
// sentences say the key is stored in the app's secure storage, and the site stores no key.

const keys = new Map(loadStore().map((k) => [k.id, k]));

// a localization's text, or each of its plural forms (Claim now's period is a count)
const forms = (value) => (typeof value === "string" ? [value] : Object.values(value ?? {}));

const SITE = [
	"sn_claim_relay_for_you", "pending_data_key", "sn_claim_relay_under_threshold", "sn_claim_relay_under_threshold_body",
	"sn_claim_relay_under_threshold_no_price", "sn_claim_relay_queued", "sn_claim_relay_cap", "sn_claim_relay_refused",
	"sn_claim_relay_not_running", "sn_claim_relay_paused", "sn_claim_relay_waits", "sn_claim_relay_claim_now",
	"sn_claim_relay_claim_now_paid", "sn_claim_relay_claim_now_paid_each", "sn_claim_relay_under_floor",
	"sn_claim_relay_requested", "sn_claim_relay_requested_period", "sn_claim_relay_again_on", "sn_claim_relay_waits_for_relay", "sn_claim_relay_self_claim",
	"sn_claim_relay_lands_on", "sn_claim_relay_queued_button", "sn_claim_relay_claimed", "transaction",
	"claim_confirmed", "done", "bittensor_funds_disclaimer_funds_only",
];

test("the claim relay's strings the site looks up are the site's too, translated into its locales", () => {
	for (const id of SITE) {
		const k = keys.get(id);
		assert.ok(k, `${id} is in the store`);
		assert.ok(isTaggedFor(k, "site"), `${id} is tagged site`);
		for (const app of ["apple", "android"]) assert.ok(isTaggedFor(k, app), `${id} is still ${app}'s`);
		const english = forms(k.localizations.en);
		for (const locale of SITE_LOCALES) {
			const value = k.localizations[locale];
			assert.ok(typeof value === "string" || (k.plurals && value && typeof value === "object"), `${id}[${locale}]`);
			const texts = forms(value);
			assert.ok(texts.length && texts.every((text) => typeof text === "string" && text !== ""), `${id}[${locale}]`);
			if (locale !== "en") for (const text of texts) assert.ok(!english.includes(text), `${id}[${locale}] is English: ${text}`);
		}
	}
});

test("the whole disclaimer is never the site's", () => {
	const full = keys.get("bittensor_funds_disclaimer");
	assert.equal(full.platforms.includes("site"), false);
});
