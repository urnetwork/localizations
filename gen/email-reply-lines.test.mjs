import assert from "node:assert/strict";
import test from "node:test";

import { LOCALES, loadStore } from "./store.mjs";

// The campaign emails' reply lines said "I read every reply" and "tell me",
// which was not how replies are handled: they reach the support inbox. Since
// the 2026-11-13 review they say where replies go and ask the reader to tell
// us, in every locale.

const keys = new Map(loadStore().map((k) => [k.id, k]));

const REPLY_LINES = ["email_e1_reply", "email_re_reply_line", "email_re_w1_reason"];
const TELL_US = [...REPLY_LINES, "email_e2_inactive_providers"];

test("the reply lines say where replies go", () => {
	for (const id of REPLY_LINES) {
		const k = keys.get(id);
		assert.ok(k, id);
		assert.ok(k.source.endsWith("Every reply reaches our support inbox."), `${id}: ${k.source}`);
		assert.equal(k.localizations.en, k.source, id);
	}
});

test("no reply line promises a personal reader, in any locale", () => {
	for (const id of TELL_US) {
		const k = keys.get(id);
		assert.ok(k, id);
		assert.deepEqual(Object.keys(k.localizations).sort(), [...LOCALES].sort(), id);
		assert.ok(!/\bI read every reply\b|\btell me\b/.test(k.source), `${id}: ${k.source}`);
		assert.match(k.localizations.en, /\btell us\b/, id);
	}
});
