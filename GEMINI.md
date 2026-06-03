# Project Conventions: BJP Keep (Home Assistant Add-on)

This project is a Next.js 16 application configured as a Home Assistant Add-on. 

## Architectural Rules

### 1. Home Assistant Ingress Compatibility (CRITICAL)
- **All navigation** MUST use `BaseLink` from `@/lib/ingress-utils` instead of `next/link`.
- **All client-side API requests** MUST use `prefixedFetch` from `@/lib/ingress-utils` instead of native `fetch`.
- **All server-side redirects** MUST use `getServerPrefixedPath` from `@/lib/ingress-utils-server` to prepend the Ingress prefix.
- **Middleware**: The `src/middleware.ts` is responsible for Ingress path detection and rewriting. Do not alter it unless you are certain of the impact on path prefixing.

### 2. Styling & Layout
- **DO NOT** modify inline `className` or CSS classes unless explicitly requested to change the UI. The current UI structure is fragile and tuned for the current responsive layout.

### 3. Storage
- **Data Location**: Database (`bjpkeep.db`) and uploads MUST reside in `/share/HAShare/bjpkeep/`.
- **Run Script**: `run.sh` handles the mounting, environment variables, and starting the app. Always ensure `run.sh` includes the mount verification check.

### 4. Build & Deployment
- **Dockerfile**: Optimized for Home Assistant with multi-stage builds. Always maintain the Docker cache optimization (Copy `package*.json` -> `npm install` -> Copy source).
- **Environment**: Always start in `production` mode unless `dev_mode` is enabled via the Add-on options.

## Workflow Conventions
- **Versioning**: Every architectural or infra change MUST bump the version in `package.json` AND `config.yaml` to trigger a Home Assistant update.
- **Log Visibility**: Any new startup scripts or crash-handling logic must ensure npm logs are printed to the Home Assistant console for debugging.
