// The bundled release note: release-notes/latest.yaml -> one JSON file per app.
//
// Every app reads the same shape:
//   { "version": "2026.11", "date": "2026-11-19",
//     "locales": { "en": { "title", "intro"?, "sections": [{ "heading"?, "items": [] }] }, ... } }
// and picks the viewer's locale with a fallback to "en".
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { REPO, LOCALES } from "./store.mjs";

export const RELEASE_NOTES_SOURCE = path.join(REPO, "release-notes", "latest.yaml");

// where each platform bundles the note (relative to ROOT)
export const RELEASE_NOTES_OUT = {
	android: "android/app/app/src/main/assets/release_notes.json",
	apple: "apple/app/network/Shared/Resources/ReleaseNotes.json",
	windows: "windows/app/src/App/Assets/ReleaseNotes.json",
	linux: "linux/app/assets/release-notes.json",
};

const str = (v, where) => {
	if (typeof v !== "string" || !v.trim()) throw new Error(`release-notes: ${where} must be a non-empty string`);
	return v;
};

export function loadReleaseNotes(file = RELEASE_NOTES_SOURCE) {
	const doc = yaml.load(fs.readFileSync(file, "utf8"));
	str(doc.version, "version");
	if (!/^\d{4}-\d{2}-\d{2}$/.test(String(doc.date))) throw new Error("release-notes: date must be YYYY-MM-DD");
	const src = doc.localizations || {};
	if (!src.en) throw new Error("release-notes: localizations.en is required");
	const locales = {};
	for (const loc of Object.keys(src)) {
		if (!LOCALES.includes(loc)) throw new Error(`release-notes: unknown locale ${loc}`);
		const n = src[loc];
		const out = { title: str(n.title, `${loc}.title`) };
		if (n.intro != null) out.intro = str(n.intro, `${loc}.intro`);
		out.sections = (n.sections || []).map((s, i) => {
			const sec = {};
			if (s.heading != null) sec.heading = str(s.heading, `${loc}.sections[${i}].heading`);
			sec.items = (s.items || []).map((it, j) => str(it, `${loc}.sections[${i}].items[${j}]`));
			if (!sec.items.length) throw new Error(`release-notes: ${loc}.sections[${i}] has no items`);
			return sec;
		});
		locales[loc] = out;
	}
	// en first, then the store's locale order, so the output is stable
	const ordered = {};
	for (const loc of LOCALES) if (locales[loc]) ordered[loc] = locales[loc];
	return { version: String(doc.version), date: String(doc.date), locales: ordered };
}

export function releaseNotesFile(platform) {
	return { [RELEASE_NOTES_OUT[platform]]: JSON.stringify(loadReleaseNotes(), null, 2) + "\n" };
}

// The note as plain text: the static changelog the release runner (build
// all/run.sh) puts above the generated changelog in every release note and
// store note. The intro, then each section's heading over its "- " bullets;
// a blank line before a heading, so the markdown release body does not read
// the heading as part of the bullet above it. The title is the in-app sheet's
// heading ("What's new") and is left out. "" when the note has neither an
// intro nor a section.
export function renderReleaseNotesText(notes = loadReleaseNotes(), locale = "en") {
	const note = notes.locales[locale] || notes.locales.en;
	const lines = [];
	if (note.intro) lines.push(note.intro);
	for (const section of note.sections) {
		if (section.heading) {
			if (lines.length) lines.push("");
			lines.push(section.heading);
		}
		for (const item of section.items) lines.push(`- ${item}`);
	}
	return lines.length ? lines.join("\n") + "\n" : "";
}

//   node gen/release-notes.mjs --text [locale]   the static changelog, on stdout
//   node gen/release-notes.mjs                   the bundled JSON, on stdout
const isMain = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname);
if (isMain) {
	const args = process.argv.slice(2);
	if (args[0] === "--text") process.stdout.write(renderReleaseNotesText(loadReleaseNotes(), args[1] || "en"));
	else process.stdout.write(JSON.stringify(loadReleaseNotes(), null, 2) + "\n");
}
