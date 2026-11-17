import assert from "node:assert/strict";
import test from "node:test";

import { build } from "./generate.mjs";
import { LOCALES, isTaggedFor, loadStore } from "./store.mjs";

// The crypto payment widget's new coins (mmm/BTCPAY.md §17.6 and §17.7, the owner's decisions of
// 2026-11-10): the USDC tab reads "USDC on Solana", a More coins tab shows the TAO, Bitcoin, ETH and SOL
// icons and opens them in that order, a coin that can't be quoted stays visible but greyed, and a TAO
// invoice has no payment link (the address and the exact amount with copy buttons, and a QR code of the
// address only). The apps that take crypto and ur.io code against these ids and English texts, and apple
// looks a string up by its English, so a changed text or placeholder breaks a lookup there.

const keys = new Map(loadStore().map((k) => [k.id, k]));

// id -> [English, placeholders as name:type in argument order]
const CONTRACT = {
	pay_method_usdc_solana: ["USDC on Solana", ""],
	pay_method_more_coins: ["More coins", ""],
	pay_method_more_coins_a11y: ["More coins: {coins}", "coins:string"],
	pay_method_tao: ["TAO", ""],
	pay_method_bitcoin: ["Bitcoin", ""],
	pay_method_eth: ["ETH", ""],
	pay_method_sol: ["SOL", ""],
	crypto_network_tao: ["Bittensor network", ""],
	crypto_network_bitcoin: ["Bitcoin network", ""],
	crypto_network_eth: ["Ethereum mainnet", ""],
	crypto_network_sol: ["Solana (native SOL)", ""],
	crypto_invoice_tao_network_only: [
		"Send only TAO on the Bittensor network to this address. TAO sent on any other network won't be credited.",
		"",
	],
	crypto_invoice_bitcoin_network_only: [
		"Send only Bitcoin on the Bitcoin network to this address. Bitcoin sent on any other network won't be credited.",
		"",
	],
	crypto_invoice_eth_network_only: [
		"Send only ETH on Ethereum mainnet to this address. Tokens and ETH on other networks, such as Base or Arbitrum, won't be credited.",
		"",
	],
	crypto_invoice_sol_network_only: [
		"Send only SOL on the Solana network to this address. Tokens, including USDC, won't be credited.",
		"",
	],
	crypto_invoice_send_exactly_to_address: ["Send exactly this amount to this address.", ""],
	crypto_invoice_copy_address: ["Copy address", ""],
	crypto_invoice_copy_amount: ["Copy amount", ""],
	crypto_invoice_tao_no_payment_link: [
		"TAO has no payment link, so this QR code holds only the address. Enter the exact amount in your wallet.",
		"",
	],
};

// The More coins list, in its order (§17.6): each coin's name, the line naming its network (also the
// invoice's first line), and the warning shown with its address.
const MORE_COINS = [
	["pay_method_tao", "crypto_network_tao", "crypto_invoice_tao_network_only"],
	["pay_method_bitcoin", "crypto_network_bitcoin", "crypto_invoice_bitcoin_network_only"],
	["pay_method_eth", "crypto_network_eth", "crypto_invoice_eth_network_only"],
	["pay_method_sol", "crypto_network_sol", "crypto_invoice_sol_network_only"],
];

// Apple has one catalog entry per English text: the USDC tab reads the invoice line's entry.
const APPLE_READS = { pay_method_usdc_solana: "crypto_network_usdc" };

// The existing keys the widget reuses for the new coins: the greyed coin's note, the row's label, the
// invoice's labels, Copied after a copy, the buy button and the unavailable line (which name the coin with
// {method}), the wallets line, and the shortfall line a top-up answers.
const REUSED = [
	"pay_method_unavailable", "pay_method_label", "crypto_invoice_send_exactly", "crypto_invoice_to_address",
	"crypto_invoice_copied", "crypto_pay_button", "crypto_invoice_unavailable", "crypto_invoice_wallets",
	"crypto_invoice_remaining",
];

// Names a reader must recognize as printed: coins, tickers, networks.
const NAMES = ["TAO", "Bitcoin", "ETH", "SOL", "USDC", "Bittensor", "Ethereum", "Solana", "Base", "Arbitrum"];

const signature = (k) => k.placeholders.map((p) => `${p.name}:${p.type}`).join(" ");
// apple's literal: the English with each placeholder as its Swift conversion
const appleLiteral = (k) =>
	k.placeholders.reduce((s, p) => s.split(`{${p.name}}`).join(p.type === "int" ? "%lld" : "%@"), k.localizations.en);

test("every new coin key carries the contract's English and placeholders", () => {
	for (const [id, [en, placeholders]] of Object.entries(CONTRACT)) {
		const k = keys.get(id);
		assert.ok(k, `${id} is in the store`);
		assert.equal(k.localizations.en, en, id);
		assert.equal(signature(k), placeholders, id);
		assert.equal(k.source, appleLiteral(k), `${id}: source is the literal apple looks up`);
		assert.ok(!k.plurals, `${id} is a plain string, not a plural key`);
	}
});

test("the coins' names are product names, never translated, and every other key is in every locale", () => {
	const names = MORE_COINS.map(([name]) => name);
	for (const id of Object.keys(CONTRACT)) {
		const k = keys.get(id);
		if (names.includes(id)) {
			assert.equal(k.translatable, false, `${id} is never translated`);
			assert.deepEqual(Object.keys(k.localizations), ["en"], id);
		} else {
			assert.equal(k.translatable, true, id);
			assert.deepEqual(LOCALES.filter((l) => k.localizations[l] == null), [], id);
		}
	}
});

test("every translation keeps the names the English prints", () => {
	const wrong = [];
	for (const id of Object.keys(CONTRACT)) {
		const k = keys.get(id);
		const printed = NAMES.filter((n) => new RegExp(`\\b${n}\\b`).test(k.localizations.en));
		for (const [l, text] of Object.entries(k.localizations))
			for (const n of printed) if (!new RegExp(`(^|[^A-Za-z])${n}([^A-Za-z]|$)`).test(text)) wrong.push(`${id}[${l}] drops ${n}: ${text}`);
	}
	assert.deepEqual(wrong, []);
});

test("the new keys are tagged for the site, apple, android, windows and linux", () => {
	// windows and linux tagged them with the change that looks them up (each desktop catalog test fails
	// on a key tagged for its app that nothing looks up): the coin names and the tab labels by the key
	// the sdk hands out with each tab and coin, the rest from the apps' own tables.
	for (const id of Object.keys(CONTRACT)) {
		const k = keys.get(id);
		for (const p of ["site", "android", "windows", "linux"]) assert.ok(isTaggedFor(k, p), `${id} is tagged ${p}`);
		assert.equal(isTaggedFor(k, "apple"), !APPLE_READS[id], `${id}: apple tag`);
	}
});

test("the desktop apps read the USDC tab as USDC on Solana, so the bare USDC label is retired there", () => {
	// windows and linux label the tab by the sdk's key (pay_method_usdc_solana), as the site does
	const usdc = keys.get("pay_method_usdc");
	for (const p of ["windows", "linux"]) {
		assert.ok(!isTaggedFor(usdc, p), `pay_method_usdc is not tagged ${p}`);
		assert.ok(usdc.deprecated.includes(p), `pay_method_usdc is deprecated for ${p}`);
	}
	for (const p of ["android", "apple", "site"]) assert.ok(isTaggedFor(usdc, p), `pay_method_usdc keeps ${p}`);
});

test("apple reads the USDC tab from the invoice line, so the two read the same in every locale", () => {
	for (const [id, owner] of Object.entries(APPLE_READS)) {
		const k = keys.get(id);
		const o = keys.get(owner);
		assert.ok(isTaggedFor(o, "apple"), `${owner} is on apple`);
		assert.equal(o.source, k.source, `${id} reads ${owner}`);
		assert.equal(signature(o), signature(k), `${id} and ${owner} take the same arguments`);
		for (const l of LOCALES) assert.equal(k.localizations[l], o.localizations[l], `${id}[${l}]`);
	}
});

test("the More coins label for screen readers opens with the tab's own words", () => {
	const tab = keys.get("pay_method_more_coins").localizations;
	const a11y = keys.get("pay_method_more_coins_a11y").localizations;
	for (const l of LOCALES) assert.ok(a11y[l].startsWith(tab[l]), `${l}: ${a11y[l]} / ${tab[l]}`);
});

test("each coin in the More coins list has its name, its network line and its warning", () => {
	for (const [name, network, warning] of MORE_COINS) {
		const coin = keys.get(name).localizations.en;
		assert.ok(keys.get(warning).localizations.en.startsWith(`Send only ${coin} on `), warning);
		// the warning names the network the line names (Ethereum mainnet is the network itself)
		const net = keys.get(network).localizations.en.replace(/ network$| \(native SOL\)$/, "");
		assert.ok(keys.get(warning).localizations.en.includes(net), `${warning} names ${net}`);
	}
});

test("the reused keys are tagged for the site, apple and android", () => {
	for (const id of REUSED)
		for (const p of ["site", "apple", "android"]) assert.ok(isTaggedFor(keys.get(id), p), `${id} is tagged ${p}`);
	assert.equal(keys.get("pay_method_unavailable").localizations.en, "Temporarily unavailable");
	assert.equal(keys.get("crypto_invoice_copied").localizations.en, "Copied");
});

test("the buy button's Korean particle fits a name ending in a consonant, such as Bitcoin", () => {
	// 로 follows a vowel or ㄹ (TAO, ETH, SOL, USDC), 으로 any other consonant (Bitcoin, 비트코인)
	assert.equal(keys.get("crypto_pay_button").localizations.ko, "{method}(으)로 결제");
});

test("the desktop catalogs carry every new key, and each app's list names it", () => {
	const files = build(["windows", "linux"]);
	const resw = files["windows/app/src/App/Strings/en/Resources.resw"];
	const pot = files["linux/app/po/urnetwork.pot"];
	const listed = (rel) => new Set(files[rel].split("\n").filter((line) => line && !line.startsWith("#")));
	const windowsKeys = listed("windows/app/src/App/Strings/windows-keys.txt");
	const linuxKeys = listed("linux/app/po/linux-keys.txt");
	for (const id of Object.keys(CONTRACT)) {
		assert.ok(resw.includes(`<data name="${id}" xml:space="preserve">`), `${id} is in the windows catalog`);
		assert.ok(pot.includes(`msgctxt "${id}"\n`), `${id} is in the linux catalog`);
		assert.ok(windowsKeys.has(id), `${id} is on windows-keys.txt`);
		assert.ok(linuxKeys.has(id), `${id} is on linux-keys.txt`);
	}
	// still in both catalogs (android, apple and the site use it), off both lists
	assert.ok(resw.includes(`<data name="pay_method_usdc" xml:space="preserve">`));
	assert.ok(!windowsKeys.has("pay_method_usdc") && !linuxKeys.has("pay_method_usdc"));
});
