import assert from "node:assert/strict";
import test from "node:test";

import { isDead } from "./store.mjs";

const key = (platforms, deprecated) => ({ id: "k", platforms, deprecated });

test("a key every platform has deprecated is dead", () => {
	assert.equal(isDead(key(["apple"], ["apple"])), true);
	assert.equal(isDead(key(["apple", "android"], ["apple", "android"])), true);
});

test("a key some platform still references is alive", () => {
	assert.equal(isDead(key(["apple", "android"], ["apple"])), false);
	assert.equal(isDead(key(["windows"], [])), false);
});

test("a key whose last platform retired itself is dead", () => {
	assert.equal(isDead(key([], ["android"])), true);
});

test("an untagged key is alive", () => {
	assert.equal(isDead(key([], [])), false);
});
