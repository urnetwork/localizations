import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, SITE_LOCALES, isTaggedFor, loadStore } from "./store.mjs";

// ur.io's Bittensor wallet errors (mmm ur.io/react/src/auth/bittensorWallet.js
// ERROR_KEYS): a wallet's own refusal reaches the page as a code with a store
// string, never in the wallet's English (support inbox 8142: Talisman's "Site
// https://ur.io/app/account/earnings has not been authorised for Talisman
// yet" showed as is to a Russian reader). The site looks these up by id with
// the wallet's name as {wallet}. The bridge page hands the desktop apps the same
// refusal as the code extension_not_authorized.

const keys = new Map(loadStore().map((k) => [k.id, k]));

// the generic wallet failure, ur.io's and every app's Solana sign-in's (sdk
// SolanaWalletFailureFor wallet_error): id -> English
const WALLET_FAILED = {
	bittensor_error_wallet_failed: "Your {wallet} wallet couldn't finish the request. Check the wallet, then try again.",
};

// every message the sdk's SolanaWalletFailureFor answers (SolanaWalletFailureMessage*):
// every app displays each, so each is tagged for every app and translated in
// every locale. A message that takes the wallet's name names it once.
const SOLANA_WALLET_FAILURE_MESSAGES = {
	bittensor_error_user_rejected: false,
	no_wallets_found_alert_content: false,
	couldnt_open_wallet: false,
	bittensor_error_extension_not_found: true,
	bittensor_error_no_account: true,
	solana_wallet_error_session_not_found: false,
	bittensor_error_wallet_failed: true,
};

// the words for an extension that hasn't allowed the site, on the site and, since
// the bridge page hands the apps the code extension_not_authorized, in the apps
const NOT_AUTHORIZED = "{wallet} hasn't allowed ur.io to use your Bittensor account yet. Approve the connection request in the wallet, or allow ur.io under Connected Sites in its settings, then try again.";

// the apps' bridge-code strings the site now shows for the same codes
const REUSED = ["bittensor_error_user_rejected", "bittensor_error_no_account", "bittensor_error_walletconnect_expired"];

test("the generic wallet failure carries its English, the wallet's name once, on the site and every app, in every locale", () => {
	for (const [id, en] of Object.entries(WALLET_FAILED)) {
		const k = keys.get(id);
		assert.ok(k, `${id} is in the store`);
		assert.equal(k.localizations.en, en, id);
		// apple's source is the Swift literal
		assert.equal(k.source, en.replace("{wallet}", "%@"), `${id}: source is the Swift literal`);
		for (const p of ["site", "android", "apple", "windows", "linux"]) assert.ok(isTaggedFor(k, p), `${id} is tagged ${p}`);
		assert.deepEqual(k.placeholders, [{ name: "wallet", type: "string" }], id);
		assert.deepEqual(Object.keys(k.localizations).sort(), [...LOCALES].sort(), id);
		// one {wallet}: the desktop catalogs lower a lone placeholder to a single "{}"
		for (const [l, v] of Object.entries(k.localizations))
			assert.equal(v.split("{wallet}").length - 1, 1, `${id}[${l}] names the wallet once: ${v}`);
	}
});

test("every Solana sign-in failure message is tagged for every app and translated in every locale", () => {
	for (const [id, takesName] of Object.entries(SOLANA_WALLET_FAILURE_MESSAGES)) {
		const k = keys.get(id);
		assert.ok(k, `${id} is in the store`);
		for (const p of ["site", "android", "apple", "windows", "linux"]) assert.ok(isTaggedFor(k, p), `${id} is tagged ${p}`);
		assert.deepEqual(Object.keys(k.localizations).sort(), [...LOCALES].sort(), id);
		assert.deepEqual(k.placeholders ?? [], takesName ? [{ name: "wallet", type: "string" }] : [], id);
		for (const [l, v] of Object.entries(k.localizations)) {
			assert.equal(v.split("{wallet}").length - 1, takesName ? 1 : 0, `${id}[${l}]: ${v}`);
			if (l !== "en") assert.notEqual(v, k.localizations.en, `${id}[${l}] is translated`);
		}
	}
});

// Talisman's own name for its settings page of connected sites, in the
// languages it ships (public/locales/<l>/common.json "Connected Sites"); it
// has no Arabic, so an Arabic reader sees the English one
const TALISMAN_CONNECTED_SITES = {
	ar: "Connected Sites",
	de: "Verbundene Seiten",
	en: "Connected Sites",
	es: "Sitios Conectados",
	ru: "Подключенные сайты",
	zh: "连接网站",
};

test("the not-authorised error names ur.io and the wallet in every language, in the site and the apps", () => {
	for (const id of Object.keys(WALLET_FAILED)) {
		const k = keys.get(id);
		for (const l of LOCALES.filter((l) => l !== "en"))
			assert.notEqual(k.localizations[l], k.localizations.en, `${id}[${l}] is translated`);
	}
	const k = keys.get("bittensor_error_extension_not_authorized");
	assert.equal(k.localizations.en, NOT_AUTHORIZED);
	// apple's source is the Swift literal
	assert.equal(k.source, NOT_AUTHORIZED.replace("{wallet}", "%@"));
	assert.deepEqual(k.placeholders, [{ name: "wallet", type: "string" }]);
	for (const p of ["site", "android", "apple", "windows", "linux"]) assert.ok(isTaggedFor(k, p), `tagged ${p}`);
	assert.deepEqual(Object.keys(k.localizations).sort(), [...LOCALES].sort());
	for (const [l, v] of Object.entries(k.localizations)) {
		assert.ok(v.includes("ur.io"), `[${l}] names ur.io`);
		assert.equal(v.split("{wallet}").length - 1, 1, `[${l}] names the wallet once`);
		if (l !== "en") assert.notEqual(v, k.localizations.en, `[${l}] is translated`);
	}
	for (const l of SITE_LOCALES) assert.ok(k.localizations[l].includes(TALISMAN_CONNECTED_SITES[l]), `[${l}] names ${TALISMAN_CONNECTED_SITES[l]}`);
	// where Talisman ships no translation, the English name a reader will see, with a gloss
	for (const l of ["fr", "it", "ja", "ko", "pl", "uk", "vi"]) assert.ok(k.localizations[l].includes("Connected Sites"), `[${l}] keeps the English name`);
});

test("the reused bridge-code strings are tagged for the site and keep their apps", () => {
	for (const id of REUSED) {
		const k = keys.get(id);
		for (const p of ["site", "android", "apple", "windows", "linux"]) assert.ok(isTaggedFor(k, p), `${id} is tagged ${p}`);
	}
});
