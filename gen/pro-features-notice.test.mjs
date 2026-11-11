import assert from "node:assert/strict";
import test from "node:test";

import { loadAllKeys } from "../index.js";
import { LOCALES } from "./store.mjs";

// The Pro features in use notice: a network without Pro whose hosted proxies
// hold SOCKS or WireGuard, the features pro.yml puts in Pro (sdk
// pro_features_status.go). Before the owner turns enforce_features on, the
// notice says the owner's words (2026-11-11); after, what stopped and how to get
// it back, as the platform does it: the proxy refuses SOCKS and drops the
// WireGuard peer of a network without Pro, HTTP and HTTPS keep working, and an
// upgrade turns SOCKS back on at once and WireGuard at the proxy's next
// reconcile, within 30 minutes. Every app and ur.io show it.

const all = loadAllKeys({ platform: null });

const KEYS = {
	pro_features_in_use: "Pro features in use",
	pro_features_upgrade_message: "SOCKS and WireGuard proxies are part of Pro. Upgrade to keep using them.",
	pro_features_stopped: "SOCKS and WireGuard stopped working",
	pro_features_stopped_message:
		"SOCKS and WireGuard are part of Pro, so they no longer work on your proxies. HTTP and HTTPS still work. Upgrade to turn them back on. WireGuard can take up to 30 minutes to reconnect.",
};

test("the notice says the owner's words before enforcement, and what stopped after", () => {
	for (const [id, english] of Object.entries(KEYS)) {
		const key = all[id];
		assert.ok(key, `${id} is in the store`);
		assert.equal(key.source, english, id);
		assert.equal(key.localizations.en, english, id);
	}
});

test("every app and ur.io look the notice up", () => {
	for (const id of Object.keys(KEYS)) {
		for (const platform of ["android", "apple", "windows", "linux", "site"]) {
			assert.ok((all[id].platforms || []).includes(platform), `${id} is tagged ${platform}`);
			assert.ok(!(all[id].deprecated || []).includes(platform), `${id} is live on ${platform}`);
		}
	}
});

test("each is translated into every locale, keeping the names and the numbers a reader acts on", () => {
	for (const [id, english] of Object.entries(KEYS)) {
		const kept = ["SOCKS", "WireGuard", "Pro", "HTTP", "HTTPS", "30"].filter((token) => english.includes(token));
		for (const locale of LOCALES) {
			const value = all[id].localizations[locale];
			assert.equal(typeof value, "string", `${id}[${locale}]`);
			assert.notEqual(value.trim(), "", `${id}[${locale}]`);
			if (locale !== "en") assert.notEqual(value, english, `${id}[${locale}] is translated`);
			for (const token of kept) assert.ok(value.includes(token), `${id}[${locale}] keeps ${token}: ${value}`);
		}
	}
});
