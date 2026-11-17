// Android ships Vietnamese (https://github.com/urnetwork/android/issues/447).
//
// The store carries vi for every live key, and the apple, windows and linux
// catalogs ship it, but ANDROID_LOCALE_DIR left vi out: the generator wrote no
// values-vi, so Android showed English to a Vietnamese reader. The catalog is
// the store's existing vi text and nothing more: a key without vi is left out,
// and Android falls back to the English in values/strings.xml for it.
import assert from "node:assert/strict";
import test from "node:test";

import { build } from "./generate.mjs";
import { CLDR_CATEGORIES, loadStore } from "./store.mjs";

const RES = "android/app/app/src/main/res";

// one generated catalog by resource name: a string's text, or each plural
// item's text by category. The generator writes one entry per line.
const catalog = (xml) => {
	const entries = new Map();
	for (const m of xml.matchAll(/<string name="([^"]+)"( translatable="false")?>(.*)<\/string>/g))
		entries.set(m[1], { kind: "string", translatable: !m[2], texts: { "": m[3] } });
	for (const m of xml.matchAll(/<plurals name="([^"]+)">\n([\s\S]*?)\n {4}<\/plurals>/g)) {
		const texts = {};
		for (const item of m[2].matchAll(/<item quantity="([a-z]+)">(.*)<\/item>/g)) texts[item[1]] = item[2];
		entries.set(m[1], { kind: "plurals", translatable: true, texts });
	}
	return entries;
};

// the printf conversions of a resource text, sorted; %% is a literal percent
const conversions = (s) => (s.match(/%%|%(?:\d+\$)?(?:\.\d+)?[a-z]/g) || []).filter((c) => c !== "%%").sort();

const files = build(["android"]);
const base = catalog(files[`${RES}/values/strings.xml`]);
const vietnamese = () => {
	const xml = files[`${RES}/values-vi/strings.xml`];
	assert.ok(xml, "android has no values-vi/strings.xml");
	return catalog(xml);
};

test("android emits a Vietnamese catalog from the store", () => {
	assert.ok(vietnamese().size > 0);
});

test("the Vietnamese catalog has exactly the android keys the store translates into vi", () => {
	const want = loadStore()
		.filter((k) => k.platforms.includes("android") && k.translatable && k.localizations.vi != null)
		.map((k) => k.id)
		.sort();
	assert.deepEqual([...vietnamese().keys()].sort(), want);
	const wrong = [];
	for (const [name, entry] of vietnamese()) {
		const english = base.get(name);
		if (!english) wrong.push(`${name}: not in values/strings.xml`);
		else if (!english.translatable) wrong.push(`${name}: translatable="false" in values/strings.xml`);
		else if (english.kind !== entry.kind) wrong.push(`${name}: ${entry.kind} here, ${english.kind} in values/strings.xml`);
	}
	assert.deepEqual(wrong, []);
});

test("every Vietnamese entry keeps the English conversions and vi's plural categories", () => {
	const wrong = [];
	for (const [name, entry] of vietnamese()) {
		const english = base.get(name);
		if (!english) continue;
		if (entry.kind === "plurals") {
			const categories = Object.keys(entry.texts);
			if (categories.join() !== CLDR_CATEGORIES.vi.join()) wrong.push(`${name}: categories ${categories}`);
		}
		const want = conversions(entry.kind === "plurals" ? english.texts.other : english.texts[""]);
		for (const [category, text] of Object.entries(entry.texts))
			if (conversions(text).join() !== want.join())
				wrong.push(`${name}${category && "." + category}: conversions ${conversions(text)} vs ${want}`);
	}
	assert.deepEqual(wrong, []);
});
