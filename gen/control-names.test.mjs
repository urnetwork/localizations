// A line that tells the reader to choose a control names it in the control's
// own words, in every language: the reader looks for the label the screen
// shows, so a paraphrase or a stale translation sends them looking for a
// control that is not there.
//
// The Solana payout wallet's no-wallet messages, which pointed at its connect
// sheet's manual entry, are retired with the wallet: USDC payouts ended on
// 2026-11-12 and every app removed the USDC payout wallet.
import assert from "node:assert/strict";
import test from "node:test";

import { isDead, isTaggedFor, loadStore } from "./store.mjs";

const keys = new Map(loadStore().map((k) => [k.id, k]));

// key -> the key of the control it names
const NAMES_CONTROL = {
	// the extender row when the internet can't reach the device: it can turn the role off
	extender_activation_unreachable: "extender",
};

test("a line that names a control names it in every locale", () => {
	const wrong = [];
	for (const [id, controlId] of Object.entries(NAMES_CONTROL)) {
		const k = keys.get(id);
		const control = keys.get(controlId);
		if (!k || !control) {
			wrong.push(`${id}: ${!k ? id : controlId} is not in the store`);
			continue;
		}
		for (const [loc, label] of Object.entries(control.localizations)) {
			const text = k.localizations[loc];
			if (text == null) wrong.push(`${id}[${loc}]: missing`);
			else if (!text.includes(label)) wrong.push(`${id}[${loc}]: does not name ${JSON.stringify(label)}: ${text}`);
		}
	}
	assert.deepEqual(wrong, []);
});

test("sign-in keeps its own no-wallet words, since it has no manual entry", () => {
	// signing in needs a wallet's signature, so these must not point at an address field
	for (const id of ["no_wallets_found_alert_content", "bittensor_error_extension_not_found"]) {
		const k = keys.get(id);
		assert.ok(k, `${id} is not in the store`);
		assert.ok(!k.deprecated.length, `${id} is retired`);
		for (const [loc, text] of Object.entries(k.localizations))
			assert.ok(!text.includes(keys.get("enter_address_manually").localizations[loc]), `${id}[${loc}] names manual entry: ${text}`);
	}
});

test("the payout wallet's no-wallet messages are retired on every app, with the wallet", () => {
	for (const id of ["no_wallets_found_enter_address_manually", "solana_wallet_error_extension_not_found"]) {
		const k = keys.get(id);
		assert.ok(k, `${id} is not in the store`);
		assert.ok(isDead(k), `${id} is still tagged for ${k.platforms.filter((p) => !k.deprecated.includes(p))}`);
	}
});

// The out-of-balance alert on a build whose checkout goes through the tunnel: the
// reader is told to press the Disconnect beside the line, by that button's label.
test("the out-of-balance alert's disconnect-first line names Disconnect in every locale", () => {
	const k = keys.get("insufficient_balance_disconnect_first");
	assert.ok(k, "insufficient_balance_disconnect_first is not in the store");
	const wrong = [];
	for (const [loc, label] of Object.entries(keys.get("disconnect").localizations)) {
		const text = k.localizations[loc];
		if (text == null) wrong.push(`[${loc}]: missing`);
		else if (!text.includes(label)) wrong.push(`[${loc}]: does not name ${JSON.stringify(label)}: ${text}`);
	}
	assert.deepEqual(wrong, []);
});

test("the disconnect-first line is tagged for the apps whose alert can show it", () => {
	// Windows and Linux: their Disconnect lifts the kill switch too, so Disconnect
	// is all a payment needs there
	const k = keys.get("insufficient_balance_disconnect_first");
	assert.ok(k, "insufficient_balance_disconnect_first is not in the store");
	assert.deepEqual(
		["android", "apple", "linux", "windows"].filter((p) => isTaggedFor(k, p)),
		["linux", "windows"],
	);
	// iOS and the other android flavors never show it, but they share these
	// catalogs with the builds that do
	assert.deepEqual(keys.get("insufficient_balance_disconnect_first_kill_switch")?.platforms, ["android", "apple"]);
});

// On apple and android the kill switch outlasts a Disconnect: with it on, the
// tunnel keeps running with no connection (shouldRun / vpnServiceRequired: a
// kill switch is route local off) and the sdk drops what it captures, so a
// checkout that goes through the tunnel still can't get out after the
// Disconnect the line asks for. Their line says to turn the kill switch off too,
// naming both controls by their labels (the kill switch's case folded, since a
// label is capitalized and the middle of a sentence is not).
test("on apple and android the disconnect-first line also names the kill switch in every locale", () => {
	const k = keys.get("insufficient_balance_disconnect_first_kill_switch");
	assert.ok(k, "insufficient_balance_disconnect_first_kill_switch is not in the store");
	const wrong = [];
	for (const [controlId, folded] of [["disconnect", false], ["kill_switch", true]]) {
		for (const [loc, label] of Object.entries(keys.get(controlId).localizations)) {
			const text = k.localizations[loc];
			if (text == null) {
				wrong.push(`[${loc}]: missing`);
				continue;
			}
			const names = folded ? text.toLowerCase().includes(label.toLowerCase()) : text.includes(label);
			if (!names) wrong.push(`${controlId}[${loc}]: does not name ${JSON.stringify(label)}: ${text}`);
		}
	}
	assert.deepEqual(wrong, []);
});

// The Mac App Store build disconnects for a purchase, since its store client goes
// through the tunnel. A kill switch that is on keeps the tunnel up after that
// disconnect and the sdk drops what it captures with no connection, so the store
// still can't be reached, and the disconnect notice's "won't go through the VPN"
// is wrong: the traffic is blocked. With the kill switch on, the purchase shows
// this alert instead, which tells the reader to turn the kill switch off, naming
// it by its setting's label (its case folded, as above), and buys nothing.
const PURCHASE_KILL_SWITCH = ["purchase_kill_switch_notice_title", "purchase_kill_switch_notice_message"];

test("the Mac App Store's purchase alert names the kill switch in every locale", () => {
	const wrong = [];
	for (const id of PURCHASE_KILL_SWITCH) {
		const k = keys.get(id);
		if (!k) {
			wrong.push(`${id} is not in the store`);
			continue;
		}
		for (const [loc, label] of Object.entries(keys.get("kill_switch").localizations)) {
			const text = k.localizations[loc];
			if (text == null) wrong.push(`${id}[${loc}]: missing`);
			else if (!text.toLowerCase().includes(label.toLowerCase()))
				wrong.push(`${id}[${loc}]: does not name ${JSON.stringify(label)}: ${text}`);
		}
	}
	assert.deepEqual(wrong, []);
});

// what the alert explains: the App Store purchase needs the VPN disconnected, by
// their own names in every language
test("the purchase alert's kill switch message names the App Store and the VPN in every locale", () => {
	const k = keys.get("purchase_kill_switch_notice_message");
	assert.ok(k, "purchase_kill_switch_notice_message is not in the store");
	const wrong = [];
	for (const [loc, text] of Object.entries(k.localizations))
		for (const name of ["App Store", "VPN"]) if (!text.includes(name)) wrong.push(`[${loc}]: does not name ${name}: ${text}`);
	assert.deepEqual(wrong, []);
});

test("the purchase alerts are the Mac App Store's alone", () => {
	for (const id of [...PURCHASE_KILL_SWITCH, "purchase_disconnect_notice_title", "purchase_disconnect_notice_message"])
		assert.deepEqual(keys.get(id)?.platforms, ["apple"], id);
});
