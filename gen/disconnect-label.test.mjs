import assert from "node:assert/strict";
import test from "node:test";

import { loadStore } from "./store.mjs";

// The Disconnect button's label, whole in every locale (2026-11-11). Hindi read
// "डिस्कनेक्ट क" from the store import of 2026-07-12 (218fd62), which cut it
// down from "डिस्कनेक्ट करें": every app's and the extension's Disconnect
// button showed a word and a stray letter, while the lines that name the
// button quoted the whole form, a label no screen showed.
// control-names.test.mjs only asks those lines to contain the label, which a
// cut-down label always satisfies.

const keys = new Map(loadStore().map((k) => [k.id, k]));

// a label that repeats a word ("Disconnect Disconnect"), or a Hindi one that
// ends in a bare consonant, the tell of a word cut off mid-way
const DOUBLED = /(^|\s)(\S+)\s+\2(\s|$)/u;
const BARE_DEVANAGARI_END = /(^|\s)[क-हक़-य़]$/u;

// what a line quotes, in the quotation marks the store's languages use
const QUOTED = /„([^“”]+)[“”]|«([^»]+)»|"([^"]+)"|“([^”]+)”|”([^”]+)”|「([^」]+)」|『([^』]+)』|‘([^’]+)’|‹([^›]+)›|'([^']+)'/gu;
const quoted = (text) =>
	[...text.matchAll(QUOTED)].map((m) => m.slice(1).find((g) => g !== undefined).replace(/^[\s  ]+|[\s  ]+$/g, ""));

test("the Disconnect label is whole in every locale: no bare letter at its end, no word twice", () => {
	const wrong = [];
	for (const [loc, label] of Object.entries(keys.get("disconnect").localizations)) {
		if (DOUBLED.test(label)) wrong.push(`${loc}: repeats a word: ${label}`);
		if (BARE_DEVANAGARI_END.test(label.trim())) wrong.push(`${loc}: ends in a bare letter: ${label}`);
	}
	assert.deepEqual(wrong, []);
	assert.equal(keys.get("disconnect").localizations.hi, "डिस्कनेक्ट करें");
});

test("the lines that name Disconnect quote its label exactly, in every locale", () => {
	const label = keys.get("disconnect").localizations;
	const wrong = [];
	for (const id of [
		"insufficient_balance_disconnect_first",
		"insufficient_balance_disconnect_first_kill_switch",
		"extension_data_limit_disconnect_first",
	]) {
		for (const [loc, text] of Object.entries(keys.get(id).localizations)) {
			// English names the button without quotation marks
			if (loc === "en") continue;
			const quotes = quoted(text);
			if (!quotes.includes(label[loc])) wrong.push(`${id} [${loc}]: quotes ${JSON.stringify(quotes)}, the label is ${JSON.stringify(label[loc])}`);
		}
	}
	assert.deepEqual(wrong, []);
});

test("no short label repeats a word, and no Hindi label ends in a bare letter", () => {
	const wrong = [];
	for (const k of keys.values()) {
		for (const [loc, value] of Object.entries(k.localizations)) {
			for (const text of typeof value === "string" ? [value] : Object.values(value)) {
				if (/\{/.test(text) || text.trim().split(/\s+/).length > 3) continue;
				if (DOUBLED.test(text)) wrong.push(`${k.id} [${loc}]: ${text}`);
				if (loc === "hi" && BARE_DEVANAGARI_END.test(text.trim())) wrong.push(`${k.id} [${loc}]: ${text}`);
			}
		}
	}
	assert.deepEqual(wrong, []);
});
