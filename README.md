# TaskNotes Fork

Personal fork of the TaskNotes Obsidian plugin.

## Build and test

```bash
npm ci
npm run build:test
npm test
npm run lint
npm run typecheck
```

`build:test` builds the plugin and copies it into the repository's test vault.
To copy it to another vault, set `OBSIDIAN_PLUGIN_PATH` to that vault's
`.obsidian/plugins/tasknotes-fork` directory before running the command.

The plugin entry point is `src/main.ts`. Runtime styles are in `styles/`; the
root `main.js` and `styles.css` files are generated build outputs.
