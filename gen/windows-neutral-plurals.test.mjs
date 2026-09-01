import assert from "node:assert/strict";
import test from "node:test";

import { build } from "./generate.mjs";
import { CAT_ORDER, isDead, loadStore } from "./store.mjs";

test("Windows neutral resources cover every plural category name", () => {
	const files = build(["windows"]);
	const neutral = files["windows/app/src/App/Strings/en/Resources.resw"];
	assert.ok(neutral, "English neutral Resources.resw was not generated");

	const names = new Set(
		[...neutral.matchAll(/<data name="([^"]+)"/g)].map((match) => match[1]),
	);
	const plurals = loadStore().filter((key) => key.plurals && !isDead(key));
	assert.ok(plurals.length > 0, "fixture has no Windows plural resources");
	for (const key of plurals) {
		for (const category of CAT_ORDER) {
			assert.ok(
				names.has(`${key.id}.${category}`),
				`neutral resources omit ${key.id}.${category}`,
			);
		}
	}
});
