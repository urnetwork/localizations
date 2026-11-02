import assert from "node:assert/strict";
import test from "node:test";

import { loadAllKeys } from "../index.js";

// What the ur.io Top 200 page tells a customer once binding opens: nothing about
// publishing opening later, and the limits they meet, with their numbers, in every
// language the page ships.

const all = loadAllKeys({ platform: null });
const SITE_LOCALES = ["en", "de", "es", "ru", "zh", "ar"];

const PUBLISHING_OPENS_LATER = {
	en: "Publishing on mainnet opens once",
	de: "Das Veröffentlichen im Mainnet ist möglich, sobald",
	es: "La publicación en mainnet se abrirá",
	ru: "Публикация в mainnet откроется",
	zh: "主网的发布将在",
	ar: "يُفتح النشر على الشبكة الرئيسية",
};

test("no locale of the manifest hint says publishing opens later", () => {
	const key = all.site_app_top200_manifest_hint;
	for (const locale of SITE_LOCALES) {
		assert.ok(!key.localizations[locale].includes(PUBLISHING_OPENS_LATER[locale]), `${locale}: ${key.localizations[locale]}`);
	}
	assert.ok(!key.source.includes(PUBLISHING_OPENS_LATER.en), key.source);
});

test("every locale of the customer limits carries their numbers", () => {
	const limits = {
		site_app_top200_limit_devices: [/\b7\b/],
		site_app_top200_limit_timing: [/\b3\b/, /\b7\b/],
		site_app_top200_limit_republish: [/\b14\b/],
		site_app_top200_limit_commitment_age: [/\b14\b/],
		site_app_top200_limit_pay: [/\b3\s?%/, /\b4[.,]4 α/],
	};
	for (const [id, patterns] of Object.entries(limits)) {
		assert.ok(all[id], `${id} is in the store`);
		assert.deepEqual(all[id].platforms, ["site"], id);
		for (const locale of SITE_LOCALES) {
			for (const pattern of patterns) assert.match(all[id].localizations[locale], pattern, `${id} ${locale}`);
		}
	}
});

test("every locale of the authority line names both flags verbatim", () => {
	for (const locale of SITE_LOCALES) {
		const text = all.site_app_top200_authority.localizations[locale];
		assert.match(text, /--mainnet-runtime-authority\b/, locale);
		assert.match(text, /--mainnet-runtime-authority-sha256\b/, locale);
	}
});
