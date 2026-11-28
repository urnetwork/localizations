// Turkish and Persian ship in every app (owner decision 2026-11-27, support
// inbox 182, 270, 463, 7485 and 8621).
//
// The store had 28 locales and neither tr nor fa, so every app showed English
// to a Turkish or Persian reader. Both are store locales now: every live key
// carries them (locale-coverage.test.mjs), each platform's map emits them, and
// android lists its languages in res/xml/locales_config.xml, which the
// system's per-app language settings and the app's own language picker read
// (Android 13 and later). These tests fail before that change.
import assert from "node:assert/strict";
import test from "node:test";

import { build } from "./generate.mjs";
import { loadReleaseNotes } from "./release-notes.mjs";
import {
	ANDROID_LOCALE_DIR, APPLE_LOCALE, CLDR_CATEGORIES, GETTEXT_PLURALS, LINUX_LOCALE, LOCALES,
	SIRI_LOCALES, WINDOWS_LOCALE, androidLocaleTag, isTaggedFor, loadStore, requiredLocales,
} from "./store.mjs";

const NEW = ["tr", "fa"];
const keys = loadStore();
const files = build();
const texts = (v) => (v == null ? [] : typeof v === "string" ? [v] : Object.values(v));

test("Turkish and Persian are store locales every platform emits", () => {
	for (const l of NEW) {
		assert.ok(LOCALES.includes(l), l);
		assert.ok(ANDROID_LOCALE_DIR[l], `android ${l}`);
		assert.ok(APPLE_LOCALE[l], `apple ${l}`);
		assert.ok(files[`android/app/app/src/main/res/${ANDROID_LOCALE_DIR[l]}/strings.xml`], `values-${l}`);
		assert.ok(files[`windows/app/src/App/Strings/${WINDOWS_LOCALE[l]}/Resources.resw`], `windows ${l}`);
		assert.ok(files[`linux/app/po/${LINUX_LOCALE[l]}.po`], `linux ${l}`);
		assert.ok(files["linux/app/po/LINGUAS"].split("\n").includes(LINUX_LOCALE[l]), `LINGUAS ${l}`);
	}
	// Siri speaks Turkish, not Persian
	assert.ok(SIRI_LOCALES.includes("tr"));
	assert.ok(!SIRI_LOCALES.includes("fa"));
	assert.ok(files["apple/app/network/Shared/Resources/tr.lproj/AppShortcuts.strings"]);
});

test("every app's catalog carries the Turkish and Persian text of each key it ships", () => {
	const catalog = JSON.parse(files["apple/app/network/Shared/Resources/Localizable.xcstrings"]).strings;
	const missing = [];
	for (const k of keys) {
		if (!k.translatable) continue;
		// Siri speaks Turkish and not Persian, so an App Shortcuts phrase needs tr only
		for (const l of NEW.filter((l) => requiredLocales(k).includes(l))) {
			if (k.localizations[l] == null) missing.push(`${k.id}: no ${l}`);
			if (isTaggedFor(k, "apple") && (k.table ?? "Localizable") === "Localizable" && !catalog[k.source]?.localizations?.[APPLE_LOCALE[l]])
				missing.push(`${k.id}: apple has no ${l}`);
			if (isTaggedFor(k, "android")) {
				const name = k.plurals ? `<plurals name="${k.id}">` : `<string name="${k.id}">`;
				if (!files[`android/app/app/src/main/res/${ANDROID_LOCALE_DIR[l]}/strings.xml`].includes(name))
					missing.push(`${k.id}: android has no ${l}`);
			}
		}
	}
	assert.deepEqual(missing, []);
});

test("android's locale config lists exactly the languages it has catalogs for", () => {
	const xml = files["android/app/app/src/main/res/xml/locales_config.xml"];
	assert.ok(xml, "android has no res/xml/locales_config.xml");
	const listed = [...xml.matchAll(/<locale android:name="([^"]+)" \/>/g)].map((m) => m[1]);
	assert.deepEqual(listed, Object.values(ANDROID_LOCALE_DIR).map(androidLocaleTag));
	for (const tag of ["en", "es-MX", "pt-BR", "zh", "tr", "fa"]) assert.ok(listed.includes(tag), tag);
	assert.equal(new Set(listed).size, listed.length);
});

test("Turkish and Persian count with the categories the platforms select", () => {
	// the apps select a category with CLDR (Android, Apple, the web) or with
	// gettext's Plural-Forms (Linux): both must agree for every count. Persian's
	// one is 0 and 1, as in French; Turkish's is 1.
	for (const l of NEW) {
		const rules = new Intl.PluralRules(l);
		assert.deepEqual([...CLDR_CATEGORIES[l]].sort(), [...rules.resolvedOptions().pluralCategories].sort(), l);
		const [forms, order] = GETTEXT_PLURALS[l];
		const expression = forms.match(/plural=(.*);$/)[1];
		const slot = new Function("n", `return Number(${expression});`);
		for (let n = 0; n <= 1000; n++) assert.equal(order[slot(n)], rules.select(n), `${l} ${n}`);
	}
	assert.equal(new Intl.PluralRules("fa").select(0), "one");
});

test("a Persian count in the one form is still printed, since one is also zero", () => {
	// "یک دستگاه" (one device) would read for 0 devices too
	const wrong = [];
	for (const k of keys) {
		if (!k.plurals || k.localizations.fa == null) continue;
		const select = `{${k.plurals.select}}`;
		if (!k.localizations.fa.one.includes(select)) wrong.push(`${k.id}: ${k.localizations.fa.one}`);
	}
	assert.deepEqual(wrong, []);
});

test("Persian is written with Persian letters and no direction marks", () => {
	// ي ى ك are the Arabic letters; Persian keyboards and fonts write ی and ک.
	// Direction is the platforms' job: a stray mark in a string reorders it.
	const wrong = [];
	for (const k of keys)
		for (const s of texts(k.localizations.fa))
			if (/[يىك‎‏‪-‮⁦-⁩؜]/.test(s)) wrong.push(`${k.id}: ${s}`);
	assert.deepEqual(wrong, []);
});

test("the release note reads in Turkish and Persian", () => {
	const notes = loadReleaseNotes();
	for (const l of NEW) {
		assert.ok(notes.locales[l]?.title, l);
		assert.equal(
			notes.locales[l].sections.map((s) => s.items.length).join(),
			notes.locales.en.sections.map((s) => s.items.length).join(),
			`${l}: one bullet for each English bullet`,
		);
	}
});

// ---------------------------------------------------------------- terminology
// The review pass's glossary, held for every string (gen/locale-consistency
// does the same for Russian and Chinese): one word per product concept, so a
// screen never names one thing two ways.

const english = (k) => texts(k.localizations.en).join(" ");
const offenders = (lang, uses, wanted, unwanted = null) =>
	keys
		.filter((k) => k.localizations[lang] != null && k.translatable && uses(english(k)))
		.filter((k) => texts(k.localizations[lang]).some((s) => !wanted.test(s) || (unwanted && unwanted.test(s))))
		.map((k) => `${k.id}: ${texts(k.localizations[lang]).join(" | ")}`);

// an auth code signs a device in (yetkilendirme kodu, کد احراز هویت); a
// verification code, sent by email or SMS, verifies an account (doğrulama
// kodu, کد تأیید). Two codes, two words, as zh and ru keep them.
const authCode = (s) => /\bauth(entication)?[ -]?codes?\b/i.test(s) && !/\bverification code/i.test(s);
const verificationCode = (s) => /\bverification codes?\b|\bthe code we sent\b/i.test(s) && !/\bauth(entication)?[ -]?code/i.test(s);

test("Turkish and Persian keep the auth code and the verification code apart", () => {
	assert.deepEqual(offenders("tr", authCode, /yetkilendirme kod/i, /doğrulama kod/i), []);
	assert.deepEqual(offenders("tr", verificationCode, /doğrulama kod/i, /yetkilendirme/i), []);
	assert.deepEqual(offenders("fa", authCode, /کد(های)? احراز هویت/, /کد(های)? تأیید/), []);
	assert.deepEqual(offenders("fa", verificationCode, /کد(های)? تأیید/, /احراز هویت/), []);
});

test("the seedphrase is the recovery phrase in Turkish and Persian", () => {
	const seed = (s) => /\bseed ?phrases?\b|\brecovery phrases?\b/i.test(s);
	assert.deepEqual(offenders("tr", seed, /kurtarma ifade/i), []);
	assert.deepEqual(offenders("fa", seed, /عبارت(‌های)? بازیابی/), []);
});

test("an extender and a kill switch read the same in every Turkish and Persian string", () => {
	assert.deepEqual(offenders("tr", (s) => /\bextenders?\b/i.test(s), /genişletici/i), []);
	assert.deepEqual(offenders("fa", (s) => /\bextenders?\b/i.test(s), /گسترش‌دهنده/), []);
	assert.deepEqual(offenders("tr", (s) => /\bkill switch\b/i.test(s), /kill switch/i), []);
	assert.deepEqual(offenders("fa", (s) => /\bkill switch\b/i.test(s), /کلید قطع اضطراری/), []);
});

test("Persian says پایداری for reliability, as the provider status screens do", () => {
	assert.deepEqual(offenders("fa", (s) => /\breliab/i.test(s), /پایدار/, /قابلیت اطمینان/), []);
});

test("Turkish and Persian keep the data units as the apps print them", () => {
	// GiB, TiB and MiB, never a translated or decimal unit
	const units = (s) => /\b[GTM]iB\b/.test(s);
	assert.deepEqual(offenders("tr", units, /[GTM]iB/), []);
	assert.deepEqual(offenders("fa", units, /[GTM]iB/, /گیگابایت|ترابایت|مگابایت/), []);
});
