# URnetwork Interface Localizations

The single source of truth for **every** string in every URnetwork interface:
android, apple, windows, linux and the web extension.

`keys/*.yaml` is the store. Everything else is generated from it — the app
resource files are build artifacts and must never be hand-edited:

| platform | generated file(s) |
| --- | --- |
| android | `android/app/app/src/main/res/values*/strings.xml` |
| apple   | `apple/app/network/Shared/Resources/Localizable.xcstrings` |
| windows | `windows/app/src/App/Strings/<locale>/Resources.resw` |
| linux   | `linux/app/po/*.po`, `linux/app/po/urnetwork.pot` |
| web     | consumed directly from `keys/` by `index.js` (no codegen) |

```sh
npm ci
npm run gen        # regenerate every platform
npm run check      # CI drift gate: fail if the committed output != the store
```

`npm run gen` writes into the sibling repo checkouts (`../android`, `../apple`,
…). Set `URNETWORK_ROOT` if they live somewhere else. The release build runs it
on every build (see `build/all/run.sh`).

## Schema

One file per key. The **file name is the key id** (snake_case, and also the
android resource name, the `.resw` name and the gettext `msgctxt`).

```yaml
description: "A label that shows the number of hosts for a split rule."
description_auto: true          # optional: xcode generated this comment, it may replace it
source: "%lld hosts"            # REQUIRED
translatable: false             # optional, default true
deprecated:                     # optional: platforms that no longer reference the key
  - apple
platforms:                      # which platforms reference the key today
  - android
  - apple
aliases:                        # optional: legacy ids that must keep resolving
  - host_count_old
placeholders:                   # optional, ordered
  - name: count
    type: int                   # string | int | float
    precision: 3                # optional, float only
plurals:                        # optional
  select: count                 # the int placeholder that selects the CLDR category
localizations:
  en:
    one: "{count} host"
    other: "{count} hosts"
  ar:
    zero: "{count} مضيف"
    one: "مضيف واحد"
    # ...
```

### `source`

The English source text **exactly as it appears in the apple string catalog**,
i.e. the literal a SwiftUI `Text("…")` / `String(localized: "…")` produces. It is
the xcstrings key, so **changing it breaks the swift call sites**: change the
call site and `source` together.

It is normally identical to `localizations.en`, but not always — xcode stores the
raw literal as the key and a normalised form as the value (`"Don't see it? "` →
`"Don't see it?"`, `"Claim multiplier"` → `"Claim Multiplier"`). Both are kept.

For keys that are not on apple, `source` is simply the English text.

### `placeholders`

Canonical, **named**, ICU-style placeholders (`{count}`, `{code}`). Ordered: the
order here is the argument order. Codegen lowers them per platform:

| type | android | apple | windows / linux (C++) |
| --- | --- | --- | --- |
| `string` | `%1$s` | `%@` | `{}` |
| `int` | `%1$d` | `%lld` or `%d` | `{}` |
| `float` + `precision: 3` | `%1$.3f` | `%.3lf` | `{}` |

Apple uses whichever conversion `source` already contains (`%d` for a Swift
`Int32`, `%lld` for an `Int`), so the key stays byte-exact. Values with two or
more placeholders are emitted positionally (`%1$@ … %2$@`, `{0} … {1}`) so that a
translation may reorder them.

Markers that are **not** placeholders (`{link}`, `{terms_start}`) pass through
untouched — only names declared in `placeholders:` are substituted.

### `plurals`

`plurals.select` names the `int` placeholder that selects the category, and each
locale's value becomes a map of **CLDR cardinal categories** instead of a string.
Only the categories a language actually has may be used — `ar` has
zero/one/two/few/many/other, `ja`/`ko`/`zh`/`th` have only `other`. The generator
emits android `<plurals>`, apple `"variations": { "plural": … }`,
`<id>.<category>` entries in `.resw`, and gettext `msgid_plural` / `msgstr[n]`.

A non-`other` category may omit the placeholder — several languages spell the
count out (`"مضيف واحد"` = "one host") rather than printing the digit.

**Never** inflect a count in the interpolation
(`"\(n) host\(n == 1 ? "" : "s")"`): it bakes English morphology into the string
and is untranslatable in every other language. Use a plural key.

### `translatable: false`

Product names and non-UI literals: **URnetwork, UR, Bittensor, Solana, USDC,
TAO, Polygon, Stripe** and the like. They are emitted only into the base
(English) file — android gets `translatable="false"`, apple gets
`"shouldTranslate": false` — and never reach a translator.

`npm run check` also enforces the weaker rule for prose: if the English contains
a product name, every translation must contain it too, unchanged. (`values-fr`
used to ship `URréseau`, `values-de` `URnetzwerk`, `values-el` `URδίκτυο`…)

### `aliases`

Published web ids that lost their file name to an android id — android's id wins
(`continue` is not even a legal android resource name, hence `continue_txt`).
`index.js` resolves an alias to the same key object, so
`chrome.i18n.getMessage("continue")` keeps working.

### `deprecated`

Platforms that no longer reference the key. Apple's catalog keeps such entries
and marks them `extractionState: stale` — xcode's own behaviour. The key is not
deleted, so no translation is ever lost.

## Locales

28: `en ar cs de el es es-419 es-MX fr he hi id it ja ko nl pl pt pt-BR pt-PT ru
sv sw th uk vi zh zh-HK`

BCP-47, except that Simplified Chinese is `zh` (what android's `values-zh` and
the published web package already use). `zh-HK` is Traditional.

Each platform emits the locales it actually supports; the maps live in
`gen/store.mjs`:

* **android** — the 19 `res/values*` dirs (`es-MX`→`values-es-rMX`,
  `pt-BR`→`values-pt-rBR`, `zh`→`values-zh`, …).
* **apple** — the 27 in the catalog (`zh`→`zh-Hans`). `sw` is absent from the
  xcode project's `knownRegions`, so it is not emitted; adding it means adding it
  to `APPLE_LOCALE` *and* `knownRegions`.
* **windows / linux** — all 28.

Adding a locale to a platform = adding it to that map. The translations are
already in the store.

## Web

`index.js` reads `keys/` directly. `loadAllKeys()` returns the keys that opt into
`platforms: [web]` (plus their aliases), which is exactly the set the extension
had before the store absorbed the app corpora; `loadAllKeys({ platform: null })`
returns everything. Values are always strings — a plural key collapses to its
`other` form, with the full category map still on `key.plurals.forms`.

## Development

You can run `npm pack` to bundle it locally and then `npm install ./path-to-localizations-archive.tgz` to install it into your URnetwork interface project for testing.

## Deployment

- Make sure everything is committed and pushed to the main branch.
- Make sure you're logged into npm with `npm login`.
- Run `npm pack --dry-run` to see what will be included in the package.
- If everything looks good, run `npm run release:patch` to publish the package. There are also `release:minor` and `release:major` scripts available for versioning.
