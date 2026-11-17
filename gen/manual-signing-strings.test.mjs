import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, SITE_LOCALES, loadStore } from "./store.mjs";

// ur.io's manual Bittensor signing form and its checks on a paste (mmm
// ur.io/react/src/components/BittensorWalletPanel.jsx, src/auth/manualSignature.js).
// Support inbox 8167: on this path no wallet window opens, and the page showed
// "Waiting for your wallet's signature…" under a message nothing told the reader
// what to do with. The site looks these up by id.

const keys = new Map(loadStore().map((k) => [k.id, k]));

const FORM = {
	bittensor_wallet_extension_hint: "Browser extension. Connects directly and asks you to approve.",
	bittensor_manual_choice: "Sign manually",
	bittensor_manual_choice_hint: "btcli, or any wallet that can sign a pasted message",
	bittensor_manual_no_popup: "No wallet window opens for this. You sign the message yourself, then paste the signature below.",
	bittensor_manual_btcli_label: "With btcli",
	bittensor_manual_btcli_steps:
		"On the computer that holds your coldkey (macOS, Linux or WSL), copy this command, paste it into a terminal and press Enter. btcli asks for the wallet name and its password. If it asks about the hotkey, answer n: the coldkey has to sign.",
	bittensor_manual_copy_command: "Copy btcli command",
	bittensor_manual_other_label: "With another wallet",
	bittensor_manual_other_steps: "Use its sign message tool with the address below. Copy the message exactly, with its line break.",
	bittensor_manual_copy_message: "Copy message",
	bittensor_manual_signature_help: "Paste the long hex value, all of it, even if it wraps onto a second line. btcli prints it after signed_message or Signature:.",
	bittensor_manual_signature_placeholder: "Paste the signature",
	bittensor_manual_deadline: "This message is valid until {time}. After that, start again for a new one.",
	bittensor_manual_no_phrase: "You never need your recovery phrase here. Don't paste it on this page or anywhere else.",
	bittensor_error_signature_format: "That isn't a signature. Paste the long hex value from btcli or your wallet.",
	bittensor_error_signature_length: "That signature is the wrong length: a signature has 128 hex characters, and this paste has {count}. Copy all of it, including any second line.",
	bittensor_error_signature_recovery_phrase: "That looks like a recovery phrase, not a signature. We cleared it and sent nothing. Never paste your recovery phrase into a website.",
	bittensor_error_signature_other_key: "This signature doesn't match the address you entered. Sign with that address's coldkey, not a hotkey or another wallet, then paste the new signature.",
	bittensor_error_signature_changed_message:
		"This signature is from the right address, but over a changed copy of the message: a line break or space differs, or only part of it was signed. Sign it again. With btcli, use Copy btcli command.",
	bittensor_error_signature_not_sr25519: "This signature isn't sr25519, the key type the payout consent needs. Ledger accounts use ed25519 and can't sign it. Choose another wallet.",
};

// the words the phone apps' manual sheet shares with the site, and its own, in
// every locale: on a phone neither Talisman nor TAO.com has a way to sign directly.
// No desktop tags: on Windows and Linux every chooser wallet opens the bridge page,
// so neither app looks these up, and its catalog test fails on a tag nothing looks up
const SHARED_WITH_APPS = ["bittensor_manual_choice", "bittensor_manual_no_popup"];
const PHONE_ROUTE = "If your wallet can't sign a pasted message, go back and choose WalletConnect (Nova and others), or sign at ur.io/app/account/earnings in a computer's browser.";
const SHARED_TAGS = ["android", "apple", "site"];
const PHONE_ROUTE_TAGS = ["android", "apple"];

test("the form's strings carry their English, are tagged for the site, and have the site's locales", () => {
	for (const [id, en] of Object.entries(FORM)) {
		const k = keys.get(id);
		assert.ok(k, `${id} is in the store`);
		assert.equal(k.localizations.en, en, id);
		assert.equal(k.source, en, `${id}: source is the English`);
		const shared = SHARED_WITH_APPS.includes(id);
		assert.deepEqual(k.platforms, shared ? SHARED_TAGS : ["site"], id);
		assert.deepEqual(Object.keys(k.localizations).sort(), [...(shared ? LOCALES : SITE_LOCALES)].sort(), id);
	}
});

test("the phone sheet's way out is in every locale, with what a reader must find as printed", () => {
	const k = keys.get("bittensor_manual_phone_route");
	assert.equal(k.localizations.en, PHONE_ROUTE);
	assert.equal(k.source, PHONE_ROUTE);
	assert.deepEqual(k.platforms, PHONE_ROUTE_TAGS);
	assert.deepEqual(Object.keys(k.localizations).sort(), [...LOCALES].sort());
	for (const [l, v] of Object.entries(k.localizations)) {
		for (const word of ["WalletConnect", "Nova", "ur.io/app/account/earnings"]) assert.ok(v.includes(word), `[${l}] keeps ${word}: ${v}`);
		if (l !== "en") assert.notEqual(v, PHONE_ROUTE, `[${l}] is translated`);
	}
	for (const id of SHARED_WITH_APPS) {
		for (const [l, v] of Object.entries(keys.get(id).localizations)) {
			if (l !== "en" && !(id === "bittensor_manual_choice" && ["es", "es-419", "es-MX"].includes(l))) assert.notEqual(v, FORM[id], `${id}[${l}] is translated`);
		}
	}
});

// The strings of the apps' own manual sheet. The desktop apps no longer have one:
// every chooser wallet opens the bridge page there, and its form is the manual path.
// The phones still show the sheet, and ur.io looks these up too, so the keys stay live.
const DESKTOP_RETIRED = [
	"bittensor_manual_sign_instructions",
	"bittensor_message_to_sign",
	"bittensor_signature_label",
	"bittensor_signature_placeholder",
	"bittensor_error_signature_mismatch",
];

test("the apps' manual sheet is the phones' and ur.io's: Windows and Linux have retired its strings", () => {
	for (const id of DESKTOP_RETIRED) {
		const k = keys.get(id);
		assert.deepEqual(k.platforms, ["android", "apple", "site"], id);
		assert.deepEqual(k.deprecated, ["windows", "linux"], id);
		assert.deepEqual(Object.keys(k.localizations).sort(), [...LOCALES].sort(), id);
	}
});

test("each is translated, keeping what a reader must type or find", () => {
	// btcli's own labels and the letter to answer stay as btcli prints them
	const keep = {
		bittensor_manual_btcli_steps: ["btcli", "WSL", " n"],
		bittensor_manual_signature_help: ["btcli", "signed_message", "Signature:"],
		bittensor_manual_choice_hint: ["btcli"],
		bittensor_error_signature_not_sr25519: ["sr25519", "ed25519", "Ledger"],
	};
	for (const id of Object.keys(FORM)) {
		const k = keys.get(id);
		for (const l of SITE_LOCALES.filter((l) => l !== "en")) {
			if (id !== "bittensor_manual_btcli_label") assert.notEqual(k.localizations[l], k.localizations.en, `${id}[${l}] is translated`);
			for (const word of keep[id] ?? []) assert.ok(k.localizations[l].includes(word), `${id}[${l}] keeps ${JSON.stringify(word)}: ${k.localizations[l]}`);
		}
	}
});

test("the changed-message error names the copy button in the button's own words", () => {
	const button = keys.get("bittensor_manual_copy_command").localizations;
	const error = keys.get("bittensor_error_signature_changed_message").localizations;
	for (const l of SITE_LOCALES) assert.ok(error[l].includes(button[l]), `[${l}] ${error[l]} names ${button[l]}`);
});

test("the placeholders are declared and used once", () => {
	for (const [id, name] of [["bittensor_manual_deadline", "time"], ["bittensor_error_signature_length", "count"]]) {
		const k = keys.get(id);
		assert.deepEqual(k.placeholders.map((p) => p.name), [name], id);
		for (const [l, v] of Object.entries(k.localizations)) assert.equal(v.split(`{${name}}`).length - 1, 1, `${id}[${l}]`);
	}
});

test("no string asks for a recovery phrase or a key: the two that name one say never to paste it", () => {
	const naming = Object.keys(FORM).filter((id) => /recovery phrase|seed phrase|private key/i.test(keys.get(id).localizations.en));
	assert.deepEqual(naming.sort(), ["bittensor_error_signature_recovery_phrase", "bittensor_manual_no_phrase"]);
	for (const id of naming) assert.match(keys.get(id).localizations.en, /never/i, id);
});
