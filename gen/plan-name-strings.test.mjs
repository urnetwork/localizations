import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, SITE_LOCALES, loadStore } from "./store.mjs";

// The account's plan as the apps and ur.io show it: the label `plan` ("Plan")
// over the plan's name, `free` ("Free") or `supporter` ("Pro"). Both are one
// English word that a translator sees without its screen, and both were read
// in the wrong sense (onboarding/retention evaluation 2026-11-10): zh named the
// free plan 自由, "freedom", where zh-HK said 免費; de labelled the plan Planen,
// the verb "to plan", and vi Kế hoạch, a plan of action, where ur.io's own plan
// label (site_app_plan) says Plan and Gói.

const keys = new Map(loadStore().map((k) => [k.id, k]));
const texts = (v) => (v == null ? [] : typeof v === "string" ? [v] : Object.values(v));

test("the free plan's name means no cost in Chinese, as it does in every other language", () => {
	const free = keys.get("free");
	assert.equal(free.localizations.en, "Free");
	assert.equal(free.localizations.zh, "免费");
	assert.equal(free.localizations["zh-HK"], "免費");
});

// Chinese, Japanese and Korean write the two senses of "free" with different
// words, freedom 自由 / 자유 and no cost 免费 / 免費 / 無料 / 무료, so the
// freedom word in a translation of "free" is a mistranslation the store can
// catch. A key whose English "free" does mean liberty goes here, with why.
const FREEDOM_SENSE = {};

test("no Chinese, Japanese or Korean translation reads free as freedom", () => {
	const freedom = { zh: /自由/, "zh-HK": /自由/, ja: /自由/, ko: /자유/ };
	const wrong = [];
	for (const k of keys.values()) {
		if (FREEDOM_SENSE[k.id] || !texts(k.localizations.en).some((s) => /\bfree\b/i.test(s))) continue;
		for (const [loc, re] of Object.entries(freedom))
			for (const s of texts(k.localizations[loc])) if (re.test(s)) wrong.push(`${k.id}[${loc}]: ${s}`);
	}
	assert.deepEqual(wrong, []);
});

test("the free plan's description describes the free plan, not the paid one", () => {
	const description = keys.get("free").description;
	assert.match(description, /free plan/i);
	assert.doesNotMatch(description, /paid plan|supporter/i);
});

test("the plan label is the noun, the word ur.io's plan label uses, in every language", () => {
	// `plan` labels the plan card in the apps and on ur.io's Account screen,
	// site_app_plan the plan section of ur.io's Connect drawer: the same word
	// for the same thing, a subscription plan
	const plan = keys.get("plan");
	const site = keys.get("site_app_plan");
	assert.equal(plan.source, "Plan");
	assert.equal(site.source, "Plan");
	assert.notEqual(plan.localizations.de, "Planen");
	const differ = LOCALES
		.filter((l) => plan.localizations[l] !== site.localizations[l])
		.map((l) => `${l}: ${plan.localizations[l]} vs ${site.localizations[l]}`);
	assert.deepEqual(differ, []);
});

test("ur.io's subscription page names the free plan with the apps' word for it, in every site language", () => {
	// site_sub_free_title and site_sub_free_body kept the English "Free" (es
	// "Plan Free", ru «Тариф Free») where the apps, and the rest of ur.io, say
	// the plan's name in the reader's language (free: Gratis, Бесплатно). The
	// word's stem carries the case and grammar each sentence needs.
	const free = keys.get("free");
	const wrong = [];
	for (const l of SITE_LOCALES.filter((l) => l !== "en")) {
		const stem = free.localizations[l].slice(0, 6).toLowerCase();
		for (const id of ["site_sub_free_title", "site_sub_free_body"]) {
			const s = keys.get(id).localizations[l];
			if (/\bFree\b/.test(s) || !s.toLowerCase().includes(stem)) wrong.push(`${id}[${l}]: ${s}`);
		}
	}
	assert.deepEqual(wrong, []);
});
