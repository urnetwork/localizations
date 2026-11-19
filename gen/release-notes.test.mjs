import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { loadReleaseNotes, renderReleaseNotesText, RELEASE_NOTES_SOURCE } from "./release-notes.mjs";

const write = (text) => {
	const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "release-notes-")), "latest.yaml");
	fs.writeFileSync(file, text);
	return file;
};

const NOTE = `version: "2026.11"
date: "2026-11-19"
localizations:
  en:
    title: "What's new"
    intro: "An intro."
    sections:
      - items: ["First", "Second"]
      - heading: "Fixes"
        items: ["A fix"]
  de:
    title: "Neuigkeiten"
    sections:
      - items: ["Erstens"]
`;

test("the bundled note is valid and renders as a static changelog", () => {
	const notes = loadReleaseNotes(RELEASE_NOTES_SOURCE);
	assert.ok(notes.locales.en.title);
	const text = renderReleaseNotesText(notes);
	assert.ok(text.endsWith("\n") && !text.endsWith("\n\n"));
});

test("the static changelog is the intro, then headings over - bullets, without the title", () => {
	const notes = loadReleaseNotes(write(NOTE));
	assert.equal(renderReleaseNotesText(notes), "An intro.\n- First\n- Second\n\nFixes\n- A fix\n");
	assert.equal(renderReleaseNotesText(notes, "de"), "- Erstens\n");
	assert.equal(renderReleaseNotesText(notes, "fr"), renderReleaseNotesText(notes, "en"));
});

test("an empty note renders as nothing", () => {
	const notes = loadReleaseNotes(write(`version: "1"\ndate: "2026-11-19"\nlocalizations:\n  en:\n    title: "t"\n    sections: []\n`));
	assert.equal(renderReleaseNotesText(notes), "");
});

test("invalid notes are refused", () => {
	assert.throws(() => loadReleaseNotes(write(`version: "1"\ndate: "19.11.2026"\nlocalizations:\n  en: {title: t}\n`)), /date/);
	assert.throws(() => loadReleaseNotes(write(`version: "1"\ndate: "2026-11-19"\nlocalizations:\n  de: {title: t}\n`)), /en is required/);
	assert.throws(() => loadReleaseNotes(write(`version: "1"\ndate: "2026-11-19"\nlocalizations:\n  en: {title: t, sections: [{items: []}]}\n`)), /no items/);
});

test("the CLI prints the static changelog", () => {
	const out = execFileSync("node", [new URL("./release-notes.mjs", import.meta.url).pathname, "--text"], { encoding: "utf8" });
	assert.equal(out, renderReleaseNotesText(loadReleaseNotes()));
});
