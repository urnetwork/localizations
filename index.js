import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load all localization keys from YAML files
 * @returns {Object} Map of key names to their data { description, localizations }
 */
export function loadAllKeys() {
	const keysDir = path.join(__dirname, "keys");
	const files = fs.readdirSync(keysDir).filter((f) => f.endsWith(".yaml"));

	const keys = {};
	files.forEach((file) => {
		const keyName = file.replace(".yaml", "");
		const content = yaml.load(
			fs.readFileSync(path.join(keysDir, file), "utf8"),
		);
		keys[keyName] = content;
	});

	return keys;
}

/**
 * Get all supported language codes
 * @returns {string[]} Array of language codes (e.g., ['en', 'fr', 'de'])
 */
export function getSupportedLanguages() {
	const keys = loadAllKeys();
	const langs = new Set();
	Object.values(keys).forEach((key) => {
		Object.keys(key.localizations || {}).forEach((lang) => langs.add(lang));
	});
	return Array.from(langs);
}
