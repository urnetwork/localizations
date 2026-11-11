import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, isTaggedFor, loadStore } from "./store.mjs";

// Capture the flag in the apps' claim flow (sn CAPTURETHEFLAG.md §10). From epoch 8 each network
// operator has a second settlement v2 pool, the capture the flag pool, and GET /sn/ledger/account
// lists a coldkey's account there beside its provider pool account, each with its kind (provider or
// ctf), and names a pool it cannot read in unavailable_pools. Every app and ur.io name the accounts
// by kind, give each pool's row its status, claim both with one action, and may say which flag this
// device captured (GET /sn/ctf/client). A row's other statuses are the claim states the apps already
// show: Claimable, Pending and Claimed.

const keys = new Map(loadStore().map((k) => [k.id, k]));
const APPS = ["android", "apple", "windows", "linux", "site"];

// id -> the English, and the literal apple looks it up by
const DECIDED = {
	sn_ctf_pool: ["Capture the flag", "Capture the flag"],
	sn_ctf_provider_pool: ["Provider pool", "Provider pool"],
	sn_ctf_under_floor: ["Below the claim minimum", "Below the claim minimum"],
	sn_ctf_pool_unavailable: ["Unavailable right now", "Unavailable right now"],
	sn_ctf_claim_both: ["Claim both", "Claim both"],
	sn_ctf_captured_provider: ["You captured the {country} provider flag", "You captured the %@ provider flag"],
	sn_ctf_captured_extender: ["You captured the {country} extender flag", "You captured the %@ extender flag"],
};
const CAPTURED = { sn_ctf_captured_provider: "provider", sn_ctf_captured_extender: "extender" };

const signature = (k) => k.placeholders.map((p) => `${p.name}:${p.type}`).join(" ");

test("each string reads as decided, under the literal apple looks it up by", () => {
	for (const [id, [english, source]] of Object.entries(DECIDED)) {
		const k = keys.get(id);
		assert.ok(k, `${id} is in the store`);
		assert.equal(k.localizations.en, english, id);
		assert.equal(k.source, source, id);
		assert.ok(!k.plurals, `${id} counts nothing`);
	}
});

test("every app and ur.io look them up", () => {
	for (const id of Object.keys(DECIDED))
		for (const platform of APPS) assert.ok(isTaggedFor(keys.get(id), platform), `${id} is tagged ${platform}`);
});

test("each is translated into every store locale, with exactly its placeholders", () => {
	for (const [id, [english]] of Object.entries(DECIDED)) {
		const k = keys.get(id);
		const want = CAPTURED[id] ? ["{country}"] : [];
		for (const locale of LOCALES) {
			const value = k.localizations[locale];
			assert.equal(typeof value, "string", `${id}[${locale}]`);
			assert.notEqual(value.trim(), "", `${id}[${locale}]`);
			if (locale !== "en") assert.notEqual(value, english, `${id}[${locale}] is translated`);
			assert.deepEqual(value.match(/\{\w+\}/g) ?? [], want, `${id}[${locale}]: ${value}`);
		}
	}
});

test("a captured flag names its role in the key and the country by a placeholder", () => {
	// a translated role word cannot be dropped into one sentence in every language, so each role
	// has its line, and the app picks the line by the role GET /sn/ctf/client reports
	for (const [id, role] of Object.entries(CAPTURED)) {
		const k = keys.get(id);
		assert.equal(signature(k), "country:string", id);
		assert.ok(k.localizations.en.includes(` ${role} flag`), `${id} names ${role}`);
	}
});

test("a language that inflects a country's name or gives it an article leads with the name", () => {
	// the app inserts the name as it shows it, so "в {country}" or "de {country}" would read "в Кения"
	// or "de États-Unis"; these languages lead with "{country}:" and keep the name bare
	for (const id of Object.keys(CAPTURED))
		for (const locale of ["cs", "de", "el", "fr", "he", "it", "nl", "pl", "pt", "pt-BR", "pt-PT", "ru", "uk"]) {
			const value = keys.get(id).localizations[locale];
			assert.match(value, /^\{country\} ?: /, `${id}[${locale}]: ${value}`);
		}
});

test("no string promises an amount, a payout or a time", () => {
	for (const id of Object.keys(DECIDED)) {
		const english = keys.get(id).localizations.en;
		assert.doesNotMatch(english, /\d|earn|reward|pay|will|guarantee|soon|today|tomorrow|epoch/i, `${id}: ${english}`);
	}
});

test("a row's other statuses are the claim states every app already shows", () => {
	// apple keys its catalog by the English, so a second Claimable, Pending or Claimed cannot exist
	for (const [id, english, platforms] of [
		["sn_ledger_claimable", "Claimable", ["android", "apple", "windows", "linux"]],
		["pending_data_key", "Pending", APPS],
		["claim_confirmed", "Claimed", APPS],
		["sn_ledger_unavailable", "Unavailable", ["android", "apple", "windows", "linux"]],
	]) {
		const k = keys.get(id);
		assert.equal(k.localizations.en, english, id);
		for (const platform of platforms) assert.ok(isTaggedFor(k, platform), `${id} is tagged ${platform}`);
	}
});
