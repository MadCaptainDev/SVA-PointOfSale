# CLAUDE.md

## Deployment

Every push to `main` auto-deploys to the live POS server via `.github/workflows/deploy.yml`
(it can also be run manually from Actions → "Deploy to Live Server" → Run workflow).
Treat a push to `main` as a production release.

The workflow first builds the UI (`npx mix --production`) and commits the compiled
`public/js` / `public/mix-manifest.json` to `main`, then the server fast-forward pulls.
Don't hand-commit compiled assets; edit sources under `resources/` and let CI build.

## Scope rules (must follow)

- Only change files that the current task asks for. Do not delete, rename, reformat or
  "clean up" anything outside that scope, even if it looks unused.
- Never edit `.env`, uploaded files (`public/uploads/`, `storage/`), or existing
  migrations that have already run. Schema changes go in a **new** migration.
- Never add destructive commands to the deploy script: no `git reset`, `git clean`,
  `git checkout --`, `git stash`, `rm`, `migrate:fresh`, `migrate:rollback`, `migrate:reset`
  or `db:seed`. The deploy must stay a fast-forward pull plus cache clears and forward migrations.
- Do not run commands against the live server or database except through the deploy workflow.
- If a task seems to need anything above, stop and ask the user first.
