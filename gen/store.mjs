// Canonical store: load + validate keys/*.yaml, and lower the canonical ICU
// placeholders down to each platform's format-specifier dialect.
//
// The store is the single source of truth for every app string. See ../README.md
// for the schema.
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.join(__dirname, "..");
export const KEYS_DIR = path.join(REPO, "keys");

// Sibling repos. Override with URNETWORK_ROOT when the checkouts live elsewhere.
export const ROOT = process.env.URNETWORK_ROOT
	? path.resolve(process.env.URNETWORK_ROOT)
	: path.resolve(REPO, "..");

// ---------------------------------------------------------------- locales
// The store's locale codes are BCP-47, except that Simplified Chinese is `zh`
// (what android's values-zh and the published web package already use).
export const LOCALES = [
	"en", "ar", "cs", "de", "el", "es", "es-419", "es-MX", "fr", "he", "hi",
	"id", "it", "ja", "ko", "nl", "pl", "pt", "pt-BR", "pt-PT", "ru", "sv",
	"sw", "th", "uk", "vi", "zh", "zh-HK",
];

// android: derived from the res/values-* directories that exist today. Adding a
// locale to android == adding it to this list (and the translations follow).
export const ANDROID_LOCALE_DIR = {
	en: "values", ar: "values-ar", cs: "values-cs", de: "values-de",
	el: "values-el", es: "values-es", "es-MX": "values-es-rMX",
	fr: "values-fr", hi: "values-hi", ja: "values-ja", ko: "values-ko",
	nl: "values-nl", pl: "values-pl", pt: "values-pt", "pt-BR": "values-pt-rBR",
	ru: "values-ru", sw: "values-sw", th: "values-th", zh: "values-zh",
};

// apple: the locale set the string catalog already carries. `sw` is absent here
// and from the xcode project's knownRegions, so it is not emitted (adding it
// means adding "sw" here and to knownRegions).
export const APPLE_LOCALE = {
	en: "en", ar: "ar", cs: "cs", de: "de", el: "el", es: "es",
	"es-419": "es-419", "es-MX": "es-MX", fr: "fr", he: "he", hi: "hi",
	id: "id", it: "it", ja: "ja", ko: "ko", nl: "nl", pl: "pl", pt: "pt",
	"pt-BR": "pt-BR", "pt-PT": "pt-PT", ru: "ru", sv: "sv", th: "th",
	uk: "uk", vi: "vi", zh: "zh-Hans", "zh-HK": "zh-HK",
};

// windows MRT resource folders (BCP-47)
export const WINDOWS_LOCALE = Object.fromEntries(
	LOCALES.map((l) => [l, l === "zh" ? "zh-Hans" : l]),
);

// gettext locale names
export const LINUX_LOCALE = Object.fromEntries(
	LOCALES.map((l) => [
		l,
		{ "es-419": "es_419", "es-MX": "es_MX", "pt-BR": "pt_BR", "pt-PT": "pt_PT",
		  zh: "zh_CN", "zh-HK": "zh_HK" }[l] || l,
	]),
);

// CLDR cardinal categories that an integer count can select, per locale.
export const CLDR_CATEGORIES = {
	en: ["one", "other"], ar: ["zero", "one", "two", "few", "many", "other"],
	cs: ["one", "few", "many", "other"], de: ["one", "other"],
	el: ["one", "other"], es: ["one", "other"], "es-419": ["one", "other"],
	"es-MX": ["one", "other"], fr: ["one", "other"],
	he: ["one", "two", "many", "other"], hi: ["one", "other"], id: ["other"],
	it: ["one", "other"], ja: ["other"], ko: ["other"], nl: ["one", "other"],
	pl: ["one", "few", "many", "other"], pt: ["one", "other"],
	"pt-BR": ["one", "other"], "pt-PT": ["one", "other"],
	ru: ["one", "few", "many", "other"], sv: ["one", "other"],
	sw: ["one", "other"], th: ["other"],
	uk: ["one", "few", "many", "other"], vi: ["other"], zh: ["other"],
	"zh-HK": ["other"],
};
export const CAT_ORDER = ["zero", "one", "two", "few", "many", "other"];

// gettext Plural-Forms, and the CLDR category each msgstr[i] slot maps to.
export const GETTEXT_PLURALS = {
	en: ["nplurals=2; plural=(n != 1);", ["one", "other"]],
	de: ["nplurals=2; plural=(n != 1);", ["one", "other"]],
	el: ["nplurals=2; plural=(n != 1);", ["one", "other"]],
	es: ["nplurals=2; plural=(n != 1);", ["one", "other"]],
	"es-419": ["nplurals=2; plural=(n != 1);", ["one", "other"]],
	"es-MX": ["nplurals=2; plural=(n != 1);", ["one", "other"]],
	it: ["nplurals=2; plural=(n != 1);", ["one", "other"]],
	nl: ["nplurals=2; plural=(n != 1);", ["one", "other"]],
	sv: ["nplurals=2; plural=(n != 1);", ["one", "other"]],
	sw: ["nplurals=2; plural=(n != 1);", ["one", "other"]],
	hi: ["nplurals=2; plural=(n != 1);", ["one", "other"]],
	fr: ["nplurals=2; plural=(n > 1);", ["one", "other"]],
	pt: ["nplurals=2; plural=(n > 1);", ["one", "other"]],
	"pt-BR": ["nplurals=2; plural=(n > 1);", ["one", "other"]],
	"pt-PT": ["nplurals=2; plural=(n > 1);", ["one", "other"]],
	ja: ["nplurals=1; plural=0;", ["other"]],
	ko: ["nplurals=1; plural=0;", ["other"]],
	th: ["nplurals=1; plural=0;", ["other"]],
	vi: ["nplurals=1; plural=0;", ["other"]],
	id: ["nplurals=1; plural=0;", ["other"]],
	zh: ["nplurals=1; plural=0;", ["other"]],
	"zh-HK": ["nplurals=1; plural=0;", ["other"]],
	ru: ["nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2);", ["one", "few", "many"]],
	uk: ["nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2);", ["one", "few", "many"]],
	pl: ["nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2);", ["one", "few", "many"]],
	cs: ["nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2;", ["one", "few", "other"]],
	ar: ["nplurals=6; plural=(n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 ? 4 : 5);", ["zero", "one", "two", "few", "many", "other"]],
	he: ["nplurals=4; plural=(n==1 ? 0 : n==2 ? 1 : (n%10==0 && n!=0) ? 2 : 3);", ["one", "two", "many", "other"]],
};

// ------------------------------------------------------------------- loading
export function loadStore() {
	const keys = [];
	for (const f of fs.readdirSync(KEYS_DIR).filter((f) => f.endsWith(".yaml")).sort()) {
		const id = f.slice(0, -5);
		const k = yaml.load(fs.readFileSync(path.join(KEYS_DIR, f), "utf8"));
		k.id = id;
		k.platforms = k.platforms || [];
		k.aliases = k.aliases || [];
		k.deprecated = k.deprecated || [];
		k.placeholders = k.placeholders || [];
		k.translatable = k.translatable !== false;
		keys.push(k);
	}
	validate(keys);
	return keys;
}

export function validate(keys) {
	const errs = [];
	const bySource = new Map();
	const ids = new Set(keys.map((k) => k.id));
	for (const k of keys) {
		if (!/^[a-z][a-z0-9_]*$/.test(k.id)) errs.push(`${k.id}: id is not snake_case`);
		if (typeof k.source !== "string") errs.push(`${k.id}: missing source`);
		if (!k.description) errs.push(`${k.id}: missing description`);
		if (!k.localizations || k.localizations.en === undefined) errs.push(`${k.id}: missing en`);
		for (const a of k.aliases) if (ids.has(a)) errs.push(`${k.id}: alias ${a} collides with a key`);
		for (const l of Object.keys(k.localizations || {}))
			if (!LOCALES.includes(l)) errs.push(`${k.id}: unknown locale ${l}`);
		// one xcstrings key per source text
		if (k.platforms.includes("apple")) {
			if (bySource.has(k.source))
				errs.push(`${k.id}: source collides with ${bySource.get(k.source)} on apple: ${JSON.stringify(k.source)}`);
			bySource.set(k.source, k.id);
		}
		// every declared placeholder must appear in every localization. plural
		// categories other than `other` may omit it -- several languages spell the
		// count out ("مضيف واحد" = "one host") rather than printing the digit.
		const names = k.placeholders.map((p) => p.name);
		for (const [loc, v] of Object.entries(k.localizations || {})) {
			const texts = k.plurals ? [v.other] : [v];
			for (const t of texts)
				for (const n of names)
					if (t == null || !t.includes(`{${n}}`))
						errs.push(`${k.id}[${loc}]: missing placeholder {${n}} in ${JSON.stringify(t)}`);
		}
		if (k.plurals) {
			if (!names.includes(k.plurals.select)) errs.push(`${k.id}: plurals.select is not a placeholder`);
			for (const [loc, v] of Object.entries(k.localizations || {})) {
				const want = CLDR_CATEGORIES[loc];
				const got = Object.keys(v);
				if (!want) { errs.push(`${k.id}: no CLDR categories for ${loc}`); continue; }
				for (const c of want) if (!got.includes(c)) errs.push(`${k.id}[${loc}]: missing plural category ${c}`);
				for (const c of got) if (!want.includes(c)) errs.push(`${k.id}[${loc}]: category ${c} is not a CLDR category for ${loc}`);
			}
		}
		// product names are never translated
		for (const p of PRODUCT_NAMES) {
			if (!k.localizations || !k.localizations.en) continue;
			const en = k.plurals ? Object.values(k.localizations.en).join(" ") : k.localizations.en;
			if (!en.includes(p)) continue;
			for (const [loc, v] of Object.entries(k.localizations)) {
				const t = k.plurals ? Object.values(v).join(" ") : v;
				if (!t.includes(p)) errs.push(`${k.id}[${loc}]: product name "${p}" is missing (never translate product names)`);
			}
		}
	}
	if (errs.length) {
		console.error("store validation failed:");
		for (const e of errs.slice(0, 40)) console.error("  " + e);
		if (errs.length > 40) console.error(`  ... and ${errs.length - 40} more`);
		process.exit(1);
	}
}

export const PRODUCT_NAMES = ["URnetwork", "Bittensor", "Solana", "USDC", "TAO", "Polygon", "Stripe"];

// placeholder description for keys we have no context for; not worth emitting as
// a developer comment
export const GENERIC_DESCRIPTION = "General UI string.";
export const comment = (k) => (k.description === GENERIC_DESCRIPTION ? null : k.description);

// A key is dead when every platform that carries it has stopped referencing it,
// or when its last platform retired it outright (an empty `platforms` list with
// a non-empty `deprecated` list: android drops itself from `platforms` because
// its emitter has no stale state). Apple still emits its own dead keys (as
// `extractionState: stale`, so nothing is lost); the greenfield platforms and
// the translators should never see them. A key with no tags at all is alive.
export const isDead = (k) =>
	k.platforms.length > 0
		? k.platforms.every((p) => k.deprecated.includes(p))
		: k.deprecated.length > 0;

// -------------------------------------------------------------- ICU lowering
// The canonical text carries named ICU placeholders: "{count} hosts".
// Each platform gets its own specifier dialect.

const SPEC = /%(?:(\d+)\$)?(?:\.(\d+))?(@|lld|ld|lf|[sdf])/g;

/** the raw conversion each placeholder uses in `source` (the apple key), in
 *  placeholder order -- this is what keeps the apple key byte-exact. */
export function appleConversions(k) {
	const out = [];
	let auto = 0;
	for (const m of k.source.matchAll(SPEC)) {
		const idx = m[1] ? parseInt(m[1], 10) - 1 : auto++;
		out[idx] = m[3];
	}
	return out;
}

function substitute(text, names, render) {
	let out = text;
	names.forEach((n, i) => {
		out = out.split(`{${n}}`).join(render(i));
	});
	return out;
}

export function lowerAndroid(text, k) {
	const names = k.placeholders.map((p) => p.name);
	return substitute(text, names, (i) => {
		const p = k.placeholders[i];
		const prec = p.precision != null ? `.${p.precision}` : "";
		const conv = { string: "s", int: "d", float: "f" }[p.type];
		return `%${i + 1}$${prec}${conv}`;
	});
}

export function lowerApple(text, k) {
	const names = k.placeholders.map((p) => p.name);
	const convs = appleConversions(k);
	const positional = names.length > 1;   // xcode positionalises multi-arg values
	return substitute(text, names, (i) => {
		const conv = convs[i] || { string: "@", int: "lld", float: "lf" }[k.placeholders[i].type];
		const prec = /^\d+$/.test(String(k.placeholders[i].precision ?? "")) && !convs[i]
			? `.${k.placeholders[i].precision}` : "";
		return positional ? `%${i + 1}$${prec}${conv}` : `%${prec}${conv}`;
	});
}

/** C++ std::format: a single argument is `{}`, several are indexed so that a
 *  translation may reorder them. */
export function lowerCpp(text, k) {
	const names = k.placeholders.map((p) => p.name);
	return substitute(text, names, (i) => (names.length > 1 ? `{${i}}` : "{}"));
}

// ------------------------------------------------------------------ escaping
export function androidEscape(v) {
	let s = v
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/'/g, "\\'")
		.replace(/\n/g, "\\n")
		.replace(/\t/g, "\\t");
	s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	// aapt2 trims and collapses whitespace outside quotes; quote to keep it
	if (v !== v.trim() || /\s\s/.test(v)) s = `"${s}"`;
	return s;
}

export function xmlText(v) {
	return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function poEscape(v) {
	return v
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.replace(/\t/g, "\\t");
}

// ------------------------------------------------------------------- sorting
// xcode sorts the catalog with a locale-aware collation; reproduce it, with a
// code-unit tiebreak so the output is byte-stable run to run.
const COLLATOR = new Intl.Collator("en");
export function collate(a, b) {
	const c = COLLATOR.compare(a, b);
	return c !== 0 ? c : a < b ? -1 : a > b ? 1 : 0;
}

export function localesFor(k, map) {
	return Object.keys(k.localizations)
		.filter((l) => map[l])
		.sort((a, b) => collate(map[a], map[b]));
}
