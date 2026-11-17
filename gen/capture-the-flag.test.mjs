import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, isTaggedFor, loadStore } from "./store.mjs";

// Capture the flag in the apps' claim flow (sn CAPTURETHEFLAG.md §10). From epoch 8 each network
// operator has a second settlement v2 pool, the capture the flag pool, and GET /sn/ledger/account
// lists a coldkey's account there beside its provider pool account, each with its kind (provider or
// ctf), and names a pool it cannot read in unavailable_pools. Every app and ur.io name the accounts
// by kind, give each pool's row its status, claim both with one action, and may say which slot this
// device won (GET /sn/ctf/client). A row's other statuses are the claim states the apps already
// show: Claimable, Pending and Claimed.

const keys = new Map(loadStore().map((k) => [k.id, k]));
const APPS = ["android", "apple", "windows", "linux", "site"];

// id -> the English, and the literal apple looks it up by
const DECIDED = {
	sn_ctf_pool: ["Capture the flag", "Capture the flag"],
	sn_ledger_provider_pool: ["Provider pool", "Provider pool"],
	sn_ledger_pool_under_floor: ["Below the claim minimum", "Below the claim minimum"],
	sn_ledger_pool_unavailable: ["Unavailable right now", "Unavailable right now"],
	sn_ledger_claim_both: ["Claim both", "Claim both"],
	sn_ctf_won_provider_slot: ["You won one of the {country} provider slots", "You won one of the %@ provider slots"],
	sn_ctf_won_extender_slot: ["You won one of the {country} extender slots", "You won one of the %@ extender slots"],
};
const WON = { sn_ctf_won_provider_slot: "provider", sn_ctf_won_extender_slot: "extender" };

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
		const want = WON[id] ? ["{country}"] : [];
		for (const locale of LOCALES) {
			const value = k.localizations[locale];
			assert.equal(typeof value, "string", `${id}[${locale}]`);
			assert.notEqual(value.trim(), "", `${id}[${locale}]`);
			if (locale !== "en") assert.notEqual(value, english, `${id}[${locale}] is translated`);
			assert.deepEqual(value.match(/\{\w+\}/g) ?? [], want, `${id}[${locale}]: ${value}`);
		}
	}
});

test("a won slot names its role in the key and the country by a placeholder", () => {
	// a translated role word cannot be dropped into one sentence in every language, so each role
	// has its line, and the app picks the line by the role GET /sn/ctf/client reports
	for (const [id, role] of Object.entries(WON)) {
		const k = keys.get(id);
		assert.equal(signature(k), "country:string", id);
		assert.ok(k.localizations.en.includes(` ${role} slots`), `${id} names ${role}`);
	}
});

test("a winner wins a slot; the flag is held only once all ten slots are won", () => {
	// the /ctf page calls a flag held when all ten of a country's slots are won, and a role not fully
	// captured while any of its five slots is open, so a device that won one slot holds no flag
	for (const id of Object.keys(WON))
		assert.doesNotMatch(keys.get(id).localizations.en, /captur|flag|\bheld\b|\bholds?\b/i, id);
});

test("a language that inflects a country's name or gives it an article leads with the name", () => {
	// the app inserts the name as it shows it, so "в {country}" or "en {country}" would read
	// "в Кения" or "en Reino Unido"; these languages lead with "{country}:" and keep the name bare
	const leading = ["cs", "de", "el", "es", "es-419", "es-MX", "fr", "he", "it", "nl", "pl", "pt", "pt-BR", "pt-PT", "ru", "uk"];
	for (const id of Object.keys(WON))
		for (const locale of leading) {
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
