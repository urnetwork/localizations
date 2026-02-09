# URnetwork Interface Localizations
Localizations for the URnetwork interfaces.

## Development

You can run `npm pack` to bundle it locally and then `npm install ./path-to-localizations-archive.tgz` to install it into your URnetwork interface project for testing.

## Deployment

- Make sure everything is committed and pushed to the main branch.
- Make sure you're logged into npm with `npm login`.
- Run `npm pack --dry-run` to see what will be included in the package.
- If everything looks good, run `npm run release:patch` to publish the package. There are also `release:minor` and `release:major` scripts available for versioning.
