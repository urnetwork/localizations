// Mechanical checks on the translations in keys/*.yaml.
//
// validate() (gen/store.mjs) already fails the build when a declared
// placeholder is missing from a localization. These tests cover what it does
// not: a translation that invents a placeholder or a printf conversion English
// does not have, and the Russian house rules a reviewer would otherwise have to
// catch by eye (the apps' unit spelling, formal address, a fixed glossary for
// the product terms, and labels that were cut off mid-phrase).
import assert from "node:assert/strict";
import test from "node:test";

import { isDead, loadStore } from "./store.mjs";

const keys = loadStore();

// every text of a localization: a plain string, or each plural form
const texts = (v) => (v == null ? [] : typeof v === "string" ? [v] : Object.values(v));
const english = (k) => {
	const en = k.localizations.en;
	return typeof en === "string" ? en : en.other;
};

// {name} for the declared placeholders only -- {link}, {terms_start} and the
// like are markers, not placeholders, and pass through untouched
const placeholders = (k, s) =>
	[...new Set((s.match(/\{(\w+)\}/g) || []).map((m) => m.slice(1, -1)))]
		.filter((n) => k.placeholders.some((p) => p.name === n))
		.sort();
// literal printf conversions (a few keys are stored in their platform form)
const conversions = (s) => (s.match(/%(?:\d+\$)?(?:ll|l)?[@dsf]/g) || []).sort();

test("no translation invents a placeholder or a printf conversion", () => {
	const wrong = [];
	for (const k of keys) {
		const enText = english(k);
		for (const [loc, v] of Object.entries(k.localizations)) {
			if (loc === "en") continue;
			const forms = typeof v === "string" ? [["", v]] : Object.entries(v);
			for (const [form, s] of forms) {
				// a non-`other` plural form may spell the count out instead
				const exact = form === "" || form === "other";
				const want = placeholders(k, enText);
				const got = placeholders(k, s);
				if (exact ? got.join() !== want.join() : got.some((n) => !want.includes(n)))
					wrong.push(`${k.id}[${loc}${form && "." + form}]: placeholders ${want} vs ${got}`);
				if (conversions(s).join() !== conversions(enText).join())
					wrong.push(`${k.id}[${loc}${form && "." + form}]: conversions ${conversions(enText)} vs ${conversions(s)}`);
			}
		}
	}
	assert.deepEqual(wrong, []);
});

test("a translation keeps VPN wherever the English says VPN", () => {
	// every language the store carries writes the term as is, so anything else
	// is a typo (the Dutch disconnect title said "URnetwork VPM")
	const wrong = [];
	for (const k of keys) {
		if (!texts(k.localizations.en).some((s) => /\bVPN\b/.test(s))) continue;
		for (const [loc, v] of Object.entries(k.localizations))
			for (const s of texts(v)) if (!s.includes("VPN")) wrong.push(`${k.id}[${loc}]: ${s}`);
	}
	assert.deepEqual(wrong, []);
});

// ------------------------------------------------------------------ Russian

const russian = keys.filter((k) => k.localizations.ru != null);
const offenders = (pred) =>
	russian.filter((k) => texts(k.localizations.ru).some((s) => pred(s, k))).map((k) => k.id);

test("Russian writes data units as GiB/TiB, as the apps and ur.io do", () => {
	assert.deepEqual(offenders((s) => /[КМГТ]иБ/.test(s)), []);
});

test("Ukrainian writes data units as GiB/TiB, as the apps and ur.io do", () => {
	const ukrainian = keys.filter((k) => k.localizations.uk != null);
	assert.deepEqual(
		ukrainian.filter((k) => texts(k.localizations.uk).some((s) => /[КМГТ][іи]Б/.test(s))).map((k) => k.id),
		[],
	);
});

test("Russian addresses the reader as вы, never ты", () => {
	const ty = /(^|[^а-яё])(ты|тебя|тебе|тобой|твой|твоя|твоё|твое|твои|твоих|твоим|твоей|твоего)(?![а-яё])/i;
	assert.deepEqual(offenders((s) => ty.test(s)), []);
});

// one term per product concept

test("Russian says код аутентификации for auth code, as on every login screen", () => {
	assert.deepEqual(offenders((s) => /код\S* авторизации/i.test(s)), []);
});

// The out-of-data notice names the data balance: средств and коштів are
// money ("insufficient funds"), what a wallet without funds lacks
// (insufficient_funds, which keeps them). The apps call the balance баланс
// данных / баланс даних (daily_data_balance, the widgets).
const insufficientDataBalance = (k) => /^Insufficient balance/.test(english(k));

test("Russian says баланс данных for the data balance the out-of-data notice names, not средств", () => {
	assert.equal(keys.filter(insufficientDataBalance).length, 2);
	assert.deepEqual(
		offenders((s, k) => insufficientDataBalance(k) && (/средств/i.test(s) || !/баланс данных/i.test(s))),
		[],
	);
	assert.match(keys.find((k) => k.id === "daily_data_balance").localizations.ru, /баланс данных/);
	assert.equal(keys.find((k) => k.id === "insufficient_funds").localizations.ru, "Недостаточно средств");
});

test("Ukrainian says баланс даних for the data balance, not коштів", () => {
	const wrong = keys
		.filter(insufficientDataBalance)
		.filter((k) => texts(k.localizations.uk).some((s) => /коштів/i.test(s) || !/баланс даних/i.test(s)))
		.map((k) => k.id);
	assert.deepEqual(wrong, []);
	assert.match(keys.find((k) => k.id === "daily_data_balance").localizations.uk, /баланс даних/);
});

test("Russian says очки for points; балл is reserved for the Top 200 score", () => {
	assert.deepEqual(offenders((s, k) => /балл/i.test(s) && /\bpoints?\b/i.test(english(k))), []);
});

test("Russian says Условия обслуживания for Terms and Services, as the other consent strings do", () => {
	assert.deepEqual(
		offenders((s, k) => /Terms and Services/.test(english(k)) && !/Услови\S* обслуживания/.test(s)),
		[],
	);
});

test("a Russian label starts with a capital where the English one does", () => {
	// catches a translation cut down to a trailing fragment ("надёжности" for
	// "Reliability Weight"); strings that open with a placeholder are skipped.
	// The reverse is allowed: a lowercase English fragment may lead a Russian
	// sentence ("this region" is "Этот регион" in "{country}: …").
	const up = (c) => c !== c.toLowerCase();
	assert.deepEqual(
		offenders((s, k) => {
			const en = english(k);
			return /^\p{L}/u.test(en) && /^\p{L}/u.test(s) && up(en[0]) && !up(s[0]);
		}),
		[],
	);
});

test("Russian says пригласить for refer a friend, as the referral panel does", () => {
	assert.deepEqual(offenders((s, k) => /\brefer/i.test(english(k)) && /рекоменд/i.test(s)), []);
});

test("Russian says предоставление for providing, in the apps and the ur.io panel alike", () => {
	assert.deepEqual(offenders((s) => /разда(ч|в|ё|е|ю)/i.test(s)), []);
});

test("Russian says логи for logs, never журнал", () => {
	assert.deepEqual(offenders((s, k) => /\blog(s|\b)(?! in)/i.test(english(k)) && /журнал/i.test(s)), []);
});

test("Russian says отвязать/отвязка for unlink, never отключить", () => {
	assert.deepEqual(
		offenders((s, k) => /unlink/i.test(english(k)) && (!/отвяз/i.test(s) || /отключ/i.test(s))),
		[],
	);
});

test("Russian keeps an inserted country name in the nominative", () => {
	// the apps insert the country's display name (or "this region") as is, so
	// "для {country}" reads "для Россия"; the strings lead with "{country}: …"
	assert.deepEqual(
		offenders((s, k) => k.placeholders.some((p) => p.name === "country") && /(^|\s)(для|в|во|из|по)\s+\{country\}/i.test(s)),
		[],
	);
});

test("Russian abbreviates макс. with a period", () => {
	assert.deepEqual(offenders((s) => /(^|[^а-яё])макс(?![а-яё.])/i.test(s)), []);
});

// A count followed by a noun needs the noun's plural form for that count
// ("1 месяц", "3 месяца", "5 месяцев"), so the key must be a plural key. The
// onboarding mail (platform `email`) is rendered into Brevo templates, which
// have no plural selection, and is left out.
const COUNTED_NOUN =
	/^(?:[а-яё]+(?:ых|их|ыми|ими|ым|им)\s+)?(?:месяц|дн[еяи]|день|дней|слов|провайдер|устройств|друз|друг(?:[аи])?(?![а-яё])|минут|час|секунд|недел|год|лет|эпох|контракт)/i;
// fixed counts at their only call site
const FIXED_COUNT = {
	site_usdc_offer_term: "always 12 months plus 14 days (UpgradeSheet.jsx), both the many form",
};

test("a Russian count is followed by its noun only in a plural key", () => {
	const wrong = [];
	for (const k of russian) {
		if (k.plurals || isDead(k) || !k.platforms.length || FIXED_COUNT[k.id]) continue;
		if (k.platforms.every((p) => p === "email")) continue;
		const counted = k.placeholders
			.filter((p) => p.type === "int" || /^(count|days|months|minutes|hours|seconds)$/.test(p.name))
			.map((p) => p.name);
		for (const name of counted) {
			for (const m of k.localizations.ru.matchAll(new RegExp(`\\{${name}\\}\\s+(\\S.*)`, "g")))
				if (COUNTED_NOUN.test(m[1])) wrong.push(`${k.id}: ${k.localizations.ru}`);
		}
	}
	assert.deepEqual(wrong, []);
});

// ------------------------------------------------------------------ Chinese

const chinese = keys.filter((k) => k.localizations.zh != null);
const zhOffenders = (pred) =>
	chinese.filter((k) => texts(k.localizations.zh).some((s) => pred(s, k))).map((k) => k.id);

test("Chinese writes 账户 for account, never 帐户", () => {
	// 18 strings said 帐户 beside 50 that said 账户, the Account tab itself
	// among them
	assert.deepEqual(zhOffenders((s) => /帐户/.test(s)), []);
	assert.equal(keys.find((k) => k.id === "account").localizations.zh, "账户");
});

// Two codes, two words. An auth code signs a device in to an account it is
// already signed in to elsewhere (授权码); a verification code, sent by email
// or SMS, only verifies a new or unverified account (验证码). Chinese used
// 验证码 for both, so "paste the 验证码" read as the emailed code, the mix-up
// the docs had to correct (users believed the emailed code signs them in);
// zh-HK keeps them apart (認證碼, 驗證碼). The code sign-in strings name an
// auth code without saying so in English (their descriptions do).
const AUTH_CODE_SIGN_IN = new Set(["sign_in_with_code", "code_sign_in_failed"]);
const authCode = (k) => AUTH_CODE_SIGN_IN.has(k.id) || /\bauth(?:entication)?[ -]?codes?\b/i.test(english(k));
const verificationCode = (k) => /\bverification code\b|\bthe code we sent\b/i.test(english(k));

test("Chinese says 授权码 for the auth code and keeps 验证码 for the email or SMS verification code", () => {
	assert.ok(chinese.filter(authCode).length >= 24);
	assert.ok(chinese.filter(verificationCode).length >= 6);
	assert.deepEqual(chinese.filter((k) => authCode(k) && verificationCode(k)).map((k) => k.id), []);
	assert.deepEqual(zhOffenders((s, k) => authCode(k) && (!/授权码/.test(s) || /验证码|认证码|身份验证代码/.test(s))), []);
	assert.deepEqual(zhOffenders((s, k) => verificationCode(k) && (!/验证码/.test(s) || /授权码/.test(s))), []);
});

test("the auth code and the verification code have different Chinese words, side by side", () => {
	// the Sessions screen lists both kinds of sign-in, and the login screens
	// label both fields
	const zh = (id) => keys.find((k) => k.id === id).localizations.zh;
	assert.notEqual(zh("sessions_kind_auth_code"), zh("sessions_kind_verify"));
	assert.notEqual(zh("auth_code"), zh("verify_input_label"));
	assert.equal(zh("auth_code"), "授权码");
	assert.equal(zh("verify_input_label"), "验证码");
	// zh-HK already did
	const hk = (id) => keys.find((k) => k.id === id).localizations["zh-HK"];
	assert.notEqual(hk("auth_code"), hk("verify_input_label"));
});
