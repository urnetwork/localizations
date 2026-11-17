// The third-party DNS presets (connect ADBLOCK3RD.md, section G): the DNS
// screen's provider picker, its status lines and notices, the personal ID
// field and the blocked lookups count, in the four apps.
//
// The sdk hands the apps some of these ids to look up (the personal ID errors,
// the free-tier notes and the presets' names), so they are pinned here.
// Provider names reach every string through a placeholder, never as text a
// translation could change (G2). Each preset has a name of its own, the
// adblock provider's short name and the preset's purpose (owner,
// 2026-11-09), which the lines that name the selected preset take as their
// {provider}.
import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, loadStore } from "./store.mjs";

const keys = new Map(loadStore().map((k) => [k.id, k]));
const APPS = ["android", "apple", "linux", "windows"];

// every string of the feature, with the platforms that show it
const FEATURE = {
	// the picks, in the screen's order, and their groups
	dns_provider_default: APPS,
	dns_provider_default_copy: APPS,
	dns_group_block_malware: APPS,
	dns_group_family: APPS,
	dns_group_my_account: APPS,
	dns_group_no_filtering: APPS,
	dns_provider_custom: APPS,
	dns_provider_custom_copy: APPS,
	dns_provider_regional: APPS,
	// each preset's name: the adblock provider's short name and its purpose
	// (owner, 2026-11-09)
	dns_preset_name_ad_blocking: APPS,
	dns_preset_name_malware_blocking: APPS,
	dns_preset_name_family: APPS,
	dns_preset_name_child: APPS,
	dns_preset_name_child_ads: APPS,
	dns_preset_name_no_filtering: APPS,
	dns_preset_name_personal: APPS,
	// what each pick blocks
	dns_preset_copy_ads_phishing: APPS,
	dns_preset_copy_ads_malware: APPS,
	dns_preset_copy_ads_malware_phishing: APPS,
	dns_preset_copy_malware: APPS,
	dns_preset_copy_malware_phishing: APPS,
	dns_preset_copy_ads_adult_safe_search: APPS,
	dns_preset_copy_malware_adult: APPS,
	dns_preset_copy_ads_malware_adult_drugs: APPS,
	dns_preset_copy_child: APPS,
	dns_preset_copy_child_ads: APPS,
	dns_preset_copy_nothing: APPS,
	dns_preset_copy_court_orders: APPS,
	dns_preset_copy_personal: APPS,
	// under the selected pick
	dns_preset_jurisdiction: APPS,
	dns_preset_privacy_link: APPS,
	dns_preset_help_link: APPS,
	dns_preset_disclosure: APPS,
	// status and verification
	dns_status_provider: APPS,
	dns_status_paused: APPS,
	dns_status_paused_detail: APPS,
	dns_status_fallback: APPS,
	dns_status_unreachable: APPS,
	dns_status_unreachable_detail: APPS,
	dns_status_use_default: APPS,
	dns_status_change_location: APPS,
	dns_verify_not_filtering: APPS,
	dns_verify_unconfirmed: APPS,
	dns_verify_rejected_controld: APPS,
	dns_verify_malformed_adguard: APPS,
	// the summary row; a selected preset's is dns_status_provider, with its name
	dns_summary_default: APPS,
	dns_summary_custom: APPS,
	dns_summary_custom_unencrypted: APPS,
	dns_summary_regional: APPS,
	// the blocked lookups count
	dns_blocked_count: APPS,
	dns_blocked_count_floor_note: APPS,
	// the personal ID field
	dns_personal_id_label: APPS,
	dns_personal_id_where_nextdns: APPS,
	dns_personal_id_where_controld: APPS,
	dns_personal_id_where_adguard: APPS,
	dns_personal_id_format_nextdns: APPS,
	dns_personal_id_format_controld: APPS,
	dns_personal_id_format_adguard: APPS,
	dns_personal_id_quota_nextdns: APPS,
	dns_personal_id_quota_adguard: APPS,
	dns_personal_id_linked_ip_note: APPS,
	dns_personal_id_block_response: APPS,
	dns_personal_id_dashboard_link: APPS,
	// the sdk's errors
	dns_preset_error_unknown: APPS,
	dns_preset_error_personal_id_required: APPS,
	dns_preset_error_personal_id_invalid: APPS,
	dns_preset_error_personal_id_other_provider: APPS,
	dns_preset_error_personal_id_not_accepted: APPS,
	// notes
	dns_preset_fast_dns_note: APPS,
	dns_preset_dropped: APPS,
	dns_preset_dropped_choose: APPS,
	dns_preset_dropped_custom: APPS,
	dns_custom_mix_note: APPS,
	dns_preset_apply_note: APPS,
	dns_builtin_blocker_label: APPS,
	dns_builtin_blocker_note: APPS,
	// one platform's own line
	dns_apple_profiles_note: ["apple"],
	dns_private_dns_overrides_preset: ["android"],
};

// the ids the sdk returns for the apps to look up:
// ValidateDnsPresetPersonalId's errors, DnsPreset.QuotaNoteKey and the
// presets' names (DnsPreset.NameKey)
const SDK_IDS = [
	"dns_preset_error_unknown",
	"dns_preset_error_personal_id_required",
	"dns_preset_error_personal_id_invalid",
	"dns_preset_error_personal_id_other_provider",
	"dns_preset_error_personal_id_not_accepted",
	"dns_personal_id_quota_nextdns",
	"dns_personal_id_quota_adguard",
	"dns_preset_name_ad_blocking",
	"dns_preset_name_malware_blocking",
	"dns_preset_name_family",
	"dns_preset_name_child",
	"dns_preset_name_child_ads",
	"dns_preset_name_no_filtering",
	"dns_preset_name_personal",
];

// the presets' names (DnsPreset.NameKey), each the adblock provider's short
// name ({provider}) and the preset's purpose (owner, 2026-11-09)
const NAME_KEYS = SDK_IDS.filter((id) => id.startsWith("dns_preset_name_"));

// the summary rows a preset had before it had a name: a preset's summary row
// is now "DNS: <name>" (dns_status_provider), and no app looks these up
const RETIRED = [
	"dns_summary_ad_blocking",
	"dns_summary_malware_blocking",
	"dns_summary_family",
	"dns_summary_no_filtering",
	"dns_summary_personal",
];

// the catalog's providers and operators, which only a placeholder inserts
const PROVIDER_NAMES = ["AdGuard", "Control D", "ControlD", "NextDNS", "Quad9", "Cloudflare", "DNS4EU", "Whalebone"];

const texts = (v) => (typeof v === "string" ? [v] : Object.values(v));
const english = (k) => (k.plurals ? k.localizations.en.other : k.localizations.en);

test("every DNS preset string is in the store, tagged for exactly the apps that show it", () => {
	for (const [id, platforms] of Object.entries(FEATURE)) {
		const k = keys.get(id);
		assert.ok(k, `${id} is not in the store`);
		assert.deepEqual([...k.platforms].sort(), [...platforms].sort(), id);
		assert.deepEqual(k.deprecated, [], id);
	}
});

test("the ids the sdk returns are DNS preset strings", () => {
	for (const id of SDK_IDS) assert.ok(FEATURE[id], `${id} is not among the DNS preset strings`);
});

test("an sdk error reads without arguments, so an app shows any of them the same way", () => {
	for (const id of SDK_IDS.filter((id) => id.startsWith("dns_preset_error_")))
		assert.deepEqual(keys.get(id).placeholders, [], id);
});

test("provider names reach the strings through a placeholder, never as text", () => {
	const wrong = [];
	for (const id of Object.keys(FEATURE))
		for (const [loc, v] of Object.entries(keys.get(id).localizations))
			for (const s of texts(v))
				for (const name of PROVIDER_NAMES) if (s.includes(name)) wrong.push(`${id}[${loc}]: ${name}`);
	assert.deepEqual(wrong, []);
});

test("RethinkDNS is not offered", () => {
	// dropped by the owner on 2026-11-09: it forwards to Cloudflare and then
	// Google, which support item 8236 asked to avoid. Custom still takes it.
	const wrong = [];
	for (const k of keys.values()) {
		if (!k.id.startsWith("dns_")) continue;
		for (const s of [k.description, k.source, ...Object.values(k.localizations).flatMap(texts)])
			if (/rethink/i.test(s)) wrong.push(k.id);
	}
	assert.deepEqual(wrong, []);
});

test("no text inserts a placeholder twice", () => {
	// windows and linux format a lone placeholder as {}, which takes one
	// argument per use, and apple's %@ does too
	const wrong = [];
	for (const id of Object.keys(FEATURE)) {
		const k = keys.get(id);
		for (const [loc, v] of Object.entries(k.localizations))
			for (const s of texts(v))
				for (const p of k.placeholders)
					if (s.split(`{${p.name}}`).length > 2) wrong.push(`${id}[${loc}]: {${p.name}}`);
	}
	assert.deepEqual(wrong, []);
});

test("an apple source is the literal Text() makes of the English", () => {
	// SwiftUI keys Text("…\(value)…") by its literal with %@ for a String and
	// %lld for an Int, in order. A source in the store's {name} form is a key
	// no call site looks up, and the screen stays in English.
	const conv = { string: "%@", int: "%lld" };
	for (const id of Object.keys(FEATURE)) {
		const k = keys.get(id);
		if (!k.platforms.includes("apple")) continue;
		const en = english(k);
		const order = k.placeholders.map((p) => en.indexOf(`{${p.name}}`));
		assert.deepEqual(order, [...order].sort((a, b) => a - b), `${id}: placeholders out of argument order`);
		let want = en;
		for (const p of k.placeholders) want = want.split(`{${p.name}}`).join(conv[p.type]);
		assert.equal(k.source, want, id);
	}
});

test("the lines that send the reader to Custom name the pick in its own words", () => {
	const custom = keys.get("dns_provider_custom").localizations;
	const wrong = [];
	for (const id of ["dns_preset_dropped_custom", "dns_summary_custom", "dns_summary_custom_unencrypted"])
		for (const loc of LOCALES) {
			const s = keys.get(id).localizations[loc];
			if (!s.includes(custom[loc])) wrong.push(`${id}[${loc}]: ${s}`);
		}
	assert.deepEqual(wrong, []);
});

test("the blocked lookups count is a plural on the count, with the provider", () => {
	const k = keys.get("dns_blocked_count");
	assert.deepEqual(k.placeholders, [{ name: "count", type: "int" }, { name: "provider", type: "string" }]);
	assert.equal(k.plurals.select, "count");
	assert.equal(k.source, "%lld lookups blocked by %@ this connection");
});

test("every preset's name is the adblock provider's short name, first, then its purpose, in every language", () => {
	// first, so the presets of a group read in alphabetical order by adblock
	// provider in every language (O9); once, as every other DNS string takes
	// its placeholder
	const wrong = [];
	for (const id of NAME_KEYS) {
		const k = keys.get(id);
		assert.deepEqual(k.placeholders, [{ name: "provider", type: "string" }], id);
		for (const loc of LOCALES) {
			const s = k.localizations[loc];
			if (typeof s !== "string" || !s.startsWith("{provider} ") || s.split("{provider}").length !== 2 || s.trim() === "{provider}")
				wrong.push(`${id}[${loc}]: ${s}`);
		}
	}
	assert.deepEqual(wrong, []);
});

test("no two presets' names read alike in any language", () => {
	// a preset's name is unique in the catalog by its adblock provider and its
	// purpose, so the purposes read apart in every language, DNS4EU's two
	// family names included
	const wrong = [];
	for (const loc of LOCALES) {
		const names = NAME_KEYS.map((id) => keys.get(id).localizations[loc]);
		if (new Set(names).size !== names.length) wrong.push(`${loc}: ${names.join(" | ")}`);
	}
	assert.deepEqual(wrong, []);
});

test("the English names are short and say what each preset does, DNS4EU's family names as decision 20 has them", () => {
	assert.deepEqual(Object.fromEntries(NAME_KEYS.map((id) => [id, keys.get(id).localizations.en])), {
		dns_preset_name_ad_blocking: "{provider} Ad Blocking",
		dns_preset_name_malware_blocking: "{provider} Malware Blocking",
		dns_preset_name_family: "{provider} Family",
		dns_preset_name_child: "{provider} Child",
		dns_preset_name_child_ads: "{provider} Child, no ads",
		dns_preset_name_no_filtering: "{provider} No Filtering",
		dns_preset_name_personal: "{provider} Personal",
	});
});

test("a selected preset's summary row is DNS: and its name, the status line's text", () => {
	// the sdk hands dns_status_provider as a preset's summary row: its name
	// says what it does, and apple keys a string by its text, so the two
	// lines share one key
	const k = keys.get("dns_status_provider");
	assert.equal(k.source, "DNS: %@");
	assert.deepEqual(k.placeholders, [{ name: "provider", type: "string" }]);
});

test("the summary rows a preset had before its name are retired on every app", () => {
	// android drops itself from platforms; apple keeps them stale
	for (const id of RETIRED) {
		const k = keys.get(id);
		assert.deepEqual([...k.deprecated].sort(), APPS, id);
		assert.ok(!k.platforms.includes("android"), id);
		assert.ok(!(id in FEATURE), id);
	}
});

test("technical values and provider labels stay as they are in every language", () => {
	const KEEP = {
		dns_personal_id_block_response: ["0.0.0.0", "NXDOMAIN", "REFUSED"],
		// the button and page names in the providers' English dashboards
		dns_personal_id_where_controld: ["Show Resolvers"],
		dns_personal_id_where_nextdns: ["Setup"],
	};
	const wrong = [];
	for (const [id, literals] of Object.entries(KEEP))
		for (const [loc, s] of Object.entries(keys.get(id).localizations))
			for (const literal of literals) if (!s.includes(literal)) wrong.push(`${id}[${loc}]: ${literal}`);
	assert.deepEqual(wrong, []);
});

// The DNS companies these screens list (AdGuard, Control D, Quad9, Cloudflare,
// DNS4EU, NextDNS) are adblock providers, never a bare provider: in URnetwork
// a provider is one of the bandwidth providers (owner, 2026-11-09). Each
// language names them with its own term for an adblock provider, which reads
// apart from the word its apps use for URnetwork's providers.
const ADBLOCK_PROVIDER = {
	en: /\badblock providers?\b/gi,
	ar: /موفّر حظر (ال)?إعلانات/g,
	cs: /služb\p{L}* blokování reklam/gu,
	de: /Adblock-Anbieter\p{L}*/gu,
	el: /πάροχ\p{L}* αποκλεισμού διαφημίσεων/gu,
	es: /proveedor(es)? de bloqueo de anuncios/g,
	"es-419": /proveedor(es)? de bloqueo de anuncios/g,
	"es-MX": /proveedor(es)? de bloqueo de anuncios/g,
	fr: /fournisseurs? de blocage des publicités/g,
	he: /ספק חסימת (ה)?פרסומות/g,
	hi: /विज्ञापन ब्लॉकिंग प्रदाता/g,
	id: /penyedia pemblokiran iklan/g,
	it: /provider di blocco della pubblicità/g,
	ja: /広告ブロックサービス/g,
	ko: /광고 차단 서비스/g,
	nl: /adblockaanbieder\p{L}*/gu,
	pl: /dostawc\p{L}* blokowania reklam/gu,
	pt: /fornecedor(es)? de bloqueio de anúncios/g,
	"pt-BR": /provedor(es)? de bloqueio de anúncios/g,
	"pt-PT": /fornecedor(es)? de bloqueio de anúncios/g,
	ru: /сервис\p{L}* блокировки рекламы/gu,
	sv: /annonsblockeringsleverantör\p{L}*/gu,
	sw: /mtoa huduma (\p{L}+ )?wa kuzuia matangazo/gu,
	th: /ผู้ให้บริการบล็อกโฆษณา/g,
	uk: /сервіс\p{L}* блокування реклами/gu,
	vi: /nhà cung cấp chặn quảng cáo/g,
	zh: /广告拦截服务商/g,
	"zh-HK": /廣告攔截服務商/g,
};

// the word each language's apps use for URnetwork's providers ("Best
// available provider"), and the docs glossary's (mmm ur.io/docs/i18n)
const URNETWORK_PROVIDER = {
	en: /\bproviders?\b/i,
	ar: /مزو/,
	cs: /poskytovatel/i,
	de: /anbieter|provider/i,
	el: /πάροχ|παρόχ/i,
	es: /proveedor/i,
	"es-419": /proveedor/i,
	"es-MX": /proveedor/i,
	fr: /fournisseur/i,
	he: /ספק/,
	hi: /प्रदाता/,
	id: /penyedia/i,
	it: /provider|fornitor/i,
	ja: /プロバイダ/,
	ko: /제공업체|제공자/,
	nl: /aanbieder|provider/i,
	pl: /dostawc/i,
	pt: /fornecedor|provedor/i,
	"pt-BR": /fornecedor|provedor/i,
	"pt-PT": /fornecedor|provedor/i,
	ru: /провайдер/i,
	sv: /leverantör/i,
	sw: /mtoa huduma|watoa huduma/i,
	th: /ผู้ให้บริการ/,
	uk: /провайдер/i,
	vi: /nhà cung cấp/i,
	zh: /提供者|提供商|供应商/,
	"zh-HK": /提供者|提供商|供應商/,
};

// the ADBLOCK3RD strings: the DNS screen's and the drawer's
const dnsKeys = () => [...keys.values()].filter((k) => k.id.startsWith("dns_") || k.id === "block_ads_and_trackers");
const withoutAdblockProvider = (s, loc) => s.split("{provider}").join("").replace(ADBLOCK_PROVIDER[loc], "");

test("every language has a term for an adblock provider and a word for URnetwork's", () => {
	assert.deepEqual(Object.keys(ADBLOCK_PROVIDER).sort(), [...LOCALES].sort());
	assert.deepEqual(Object.keys(URNETWORK_PROVIDER).sort(), [...LOCALES].sort());
});

test("no DNS string calls a DNS company by the word for URnetwork's providers", () => {
	const wrong = [];
	for (const k of dnsKeys()) {
		if (URNETWORK_PROVIDER.en.test(withoutAdblockProvider(k.source, "en"))) wrong.push(`${k.id}[source]: ${k.source}`);
		for (const [loc, v] of Object.entries(k.localizations))
			for (const s of texts(v)) if (URNETWORK_PROVIDER[loc].test(withoutAdblockProvider(s, loc))) wrong.push(`${k.id}[${loc}]: ${s}`);
	}
	assert.deepEqual(wrong, []);
});

test("the address of another adblock provider names it in full both times, as the English does", () => {
	const k = keys.get("dns_preset_error_personal_id_other_provider");
	assert.equal(k.source, "This address belongs to another adblock provider. Choose that adblock provider instead.");
	const wrong = [];
	for (const loc of LOCALES) {
		const s = k.localizations[loc];
		if ((s.match(ADBLOCK_PROVIDER[loc]) ?? []).length !== 2) wrong.push(`${loc}: ${s}`);
	}
	assert.deepEqual(wrong, []);
});

test("the DNS strings' descriptions say adblock provider, so their translations do", () => {
	const wrong = [];
	for (const k of dnsKeys()) {
		const rest = withoutAdblockProvider(k.description, "en").replace(/URnetwork's providers, which are the bandwidth providers/g, "");
		if (URNETWORK_PROVIDER.en.test(rest)) wrong.push(`${k.id}: ${k.description}`);
	}
	assert.deepEqual(wrong, []);
});
