import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load localization keys from the canonical store (keys/*.yaml).
 *
 * The store now backs every platform (android, apple, windows, linux, web), so
 * by default this returns only the keys a web consumer has opted into --
 * `platforms:` in the yaml. That keeps the set this package hands the extension
 * exactly what it was before the store absorbed the app corpora. Pass
 * `{ platform: null }` for the whole store.
 *
 * Values are always strings. A key with plural rules collapses to its `other`
 * form here (chrome.i18n has no plural support); the full per-category map is
 * still available on `key.plurals`.
 *
 * Legacy ids listed under `aliases:` resolve to the same key object, so callers
 * that ask for e.g. "continue" keep working now that android's "continue_txt"
 * owns the file name.
 *
 * @param {{platform?: string|null}} [options]
 * @returns {Object} Map of key names to their data { description, localizations, ... }
 */
export function loadAllKeys({ platform = "web" } = {}) {
	const keysDir = path.join(__dirname, "keys");
	const files = fs.readdirSync(keysDir).filter((f) => f.endsWith(".yaml"));

	const keys = {};
	files.forEach((file) => {
		const keyName = file.replace(".yaml", "");
		const content = yaml.load(fs.readFileSync(path.join(keysDir, file), "utf8"));

		if (platform && !(content.platforms || []).includes(platform)) return;

		if (content.plurals) {
			const localizations = {};
			Object.entries(content.localizations || {}).forEach(([lang, forms]) => {
				localizations[lang] = forms.other;
			});
			content.plurals = { ...content.plurals, forms: content.localizations };
			content.localizations = localizations;
		}

		keys[keyName] = content;
		(content.aliases || []).forEach((alias) => {
			keys[alias] = content;
		});
	});

	return keys;
}

/**
 * Get all supported language codes
 * @returns {string[]} Array of language codes (e.g., ['en', 'fr', 'de'])
 */
export function getSupportedLanguages(options) {
	const keys = loadAllKeys(options);
	const langs = new Set();
	Object.values(keys).forEach((key) => {
		Object.keys(key.localizations || {}).forEach((lang) => langs.add(lang));
	});
	return Array.from(langs);
}
