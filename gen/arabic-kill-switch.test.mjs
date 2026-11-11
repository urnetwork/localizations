import assert from "node:assert/strict";
import test from "node:test";

import { loadStore } from "./store.mjs";

// The Arabic apps called the kill switch «مفتاح القتل», a word-for-word "kill
// key", while ur.io's own strings and its docs say «مفتاح الإيقاف», as Proton
// VPN's Arabic app does (2026-11-11). A reader met two names for one switch,
// the docs naming the apps' toggle by the other. Every Arabic string now says
// «مفتاح الإيقاف».
const keys = loadStore();

test("the Arabic strings name the kill switch مفتاح الإيقاف, never مفتاح القتل", () => {
	const literal = [];
	for (const k of keys) {
		const ar = k.localizations.ar;
		for (const text of ar == null ? [] : typeof ar === "string" ? [ar] : Object.values(ar)) {
			if (/مفتاح القتل/.test(text)) literal.push(`${k.id}: ${text}`);
		}
	}
	assert.deepEqual(literal, []);
	assert.equal(keys.find((k) => k.id === "kill_switch").localizations.ar, "مفتاح الإيقاف");
});

test("every Arabic string about the kill switch that names it uses the label", () => {
	const missing = keys
		.filter((k) => /kill[ -]?switch/i.test(k.localizations.en ?? "") && typeof k.localizations.ar === "string")
		.filter((k) => /\bkill[ -]?switch\b/i.test(k.localizations.en) && !/مفتاح الإيقاف|kill switch/i.test(k.localizations.ar))
		.map((k) => `${k.id}: ${k.localizations.ar}`);
	assert.deepEqual(missing, []);
});
