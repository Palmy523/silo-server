# Palmiterville fork

Public AGPL source offer for https://silo.palmiterville.app.

- **Upstream:** https://github.com/Silo-Server/silo-server
- **This fork:** https://github.com/Palmy523/silo-server

## Delta

Native `@sigil/ui` ingest (no index.html overlay):

- `web/src/lib/sigil/` — vendored client
- `web/src/main.tsx` — `bootSigil()` + unhandled crash net
- `web/src/components/ErrorBoundary.tsx` — `componentDidCatch`
- `web/src/api/v2/request.ts` — `v2()` faults (skips 401/403 and aborts)
- `Dockerfile` — `VITE_SIGIL_*` build-args (empty = disabled)

Secrets stay on the VM (`/etc/silo/env`), not in git.

## Sync upstream

From this repo:

```powershell
git fetch upstream
git merge upstream/main
git push origin main
```

Or from silo-borrow-aws: `.\sb.ps1 silo sync-upstream`
