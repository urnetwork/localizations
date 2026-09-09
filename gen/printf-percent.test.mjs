import test from "node:test";
import assert from "node:assert/strict";
import { lowerAndroid, lowerApple } from "./store.mjs";

const percentKey = { id: "plan_save_percent", source: "Save %lld%%", placeholders: [{ name: "percent", type: "int" }] };
const plainKey = { id: "save_33_percent", source: "Save 33%", placeholders: [] };
const twoKey = { id: "x", source: "%@ · %lld%%", placeholders: [{ name: "a", type: "string" }, { name: "b", type: "int" }] };

test("a literal percent next to a placeholder is escaped for Android and Apple", () => {
	assert.equal(lowerAndroid("Save {percent}%", percentKey), "Save %1$d%%");
	assert.equal(lowerApple("Save {percent}%", percentKey), "Save %lld%%");
	assert.equal(lowerApple("{a} · {b}%", twoKey), "%1$@ · %2$lld%%");
});

test("a string without placeholders keeps its bare percent", () => {
	assert.equal(lowerAndroid("Save 33%", plainKey), "Save 33%");
	assert.equal(lowerApple("Save 33%", plainKey), "Save 33%");
});
