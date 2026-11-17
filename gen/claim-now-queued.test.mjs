import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, isTaggedFor, loadStore } from "./store.mjs";

// Claim now's queued state, as the owner decided it on 2026-11-11: keep the relay's behaviour and say
// it plainly (apple/BTEASY.md, "Claim now and the daily cap"). The relay (server
// controller/sn_claim_relay.go) starts a coldkey's 30 days only when it pays the tapped claim, not at
// the tap; it sends taps ahead of its automatic claims, the oldest first; and it spends at most a day's
// budget, which renews at 00:00 UTC, so a queued tap can wait more than one day. The words before this
// said "within today's budget" beside a line saying the claim waits for the next day, promised the next
// day, and never said when the 30 days start.

const keys = new Map(loadStore().map((k) => [k.id, k]));

// a localization's text, or each of its plural forms
const forms = (value) => (typeof value === "string" ? [value] : Object.values(value ?? {}));

const DECIDED = {
	sn_claim_relay_requested: "Claim now is queued. It goes out ahead of automatic claims, in the order requests came in, as each day's budget allows.",
	sn_claim_relay_requested_period: {
		one: "Your next Claim now opens a day after this claim goes through.",
		other: "Your next Claim now opens {days} days after this claim goes through.",
	},
	sn_claim_relay_cap: "Today's claim budget is used up, so this waits. The budget renews each day at 00:00 UTC. Nothing is lost: this credit never expires.",
	sn_claim_relay_again_on: "Your next Claim now opens on {date}.",
};

test("the queued state reads as the owner decided it", () => {
	for (const [id, en] of Object.entries(DECIDED)) {
		const k = keys.get(id);
		assert.ok(k, `${id} is in the store`);
		assert.deepEqual(k.localizations.en, en, id);
		for (const platform of ["apple", "android", "windows", "linux", "site"]) assert.ok(isTaggedFor(k, platform), `${id} is not ${platform}'s`);
		assert.deepEqual(Object.keys(k.localizations).sort(), [...LOCALES].sort(), id);
	}
	// the call sites' literals: Apple's catalog key, a Swift interpolation of the relay's period and date
	assert.equal(keys.get("sn_claim_relay_requested_period").source, "Your next Claim now opens %lld days after this claim goes through.");
	assert.equal(keys.get("sn_claim_relay_again_on").source, "Your next Claim now opens on %@.");
	assert.equal(keys.get("sn_claim_relay_requested").source, DECIDED.sn_claim_relay_requested);
	assert.equal(keys.get("sn_claim_relay_cap").source, DECIDED.sn_claim_relay_cap);
});

test("no line of the queued state promises a day the relay does not guarantee", () => {
	for (const id of ["sn_claim_relay_requested", "sn_claim_relay_cap", "sn_claim_relay_requested_period"]) {
		for (const en of forms(keys.get(id).localizations.en)) {
			assert.doesNotMatch(en, /today's budget|within today|next day|tomorrow/i, `${id} promises a day: ${en}`);
		}
	}
});

test("the 30 days count from when the claim goes through, in the period's plural form", () => {
	const k = keys.get("sn_claim_relay_requested_period");
	assert.deepEqual(k.plurals, { select: "days" });
	assert.deepEqual(k.placeholders.map((p) => [p.name, p.type]), [["days", "int"]]);
	for (const en of forms(k.localizations.en)) assert.match(en, /after this claim goes through\.$/, en);
	// the limit's date is the same limit, in the same words
	assert.ok(keys.get("sn_claim_relay_again_on").localizations.en.startsWith("Your next Claim now opens "));
});

test("the spent budget says when it renews, 00:00 UTC, in every locale", () => {
	const cap = keys.get("sn_claim_relay_cap");
	for (const locale of LOCALES) {
		const text = cap.localizations[locale];
		assert.ok(text.includes("00:00") && text.includes("UTC"), `sn_claim_relay_cap[${locale}] lost 00:00 UTC: ${text}`);
	}
});
