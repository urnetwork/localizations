import assert from "node:assert/strict";
import test from "node:test";

import { loadAllKeys } from "../index.js";

// The device list (Manage devices) marks the device the app runs on "This
// device". Apple keys strings by their source text, and the Top 200 sign
// screen's key has that text and is tagged for every app, so on apple the
// device list reads top200_sign_this_device's translations. The device list's
// own key, which android and the desktop apps read, must say the same, or the
// device list reads differently on apple (delta review D-L1: the zh values
// differed).

const all = loadAllKeys({ platform: null });

test("the device list's This device reads the same as the key apple serves it from", () => {
	const deviceList = all.manage_devices_this_device;
	const sign = all.top200_sign_this_device;
	assert.ok(deviceList && sign, "both keys are in the store");
	assert.equal(deviceList.source, sign.source);
	assert.ok(sign.platforms.includes("apple"), "apple reads the sign screen's key");
	assert.ok(!deviceList.platforms.includes("apple"), "apple has one entry for the text");
	assert.deepEqual(deviceList.localizations, sign.localizations);
});
