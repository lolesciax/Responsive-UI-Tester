# Static deployment

```powershell
npm ci
npm run build
npm run preview -- --host 127.0.0.1
```

Cloudflare Pages: connect the repository, use build command `npm run build`, output `dist`, Node 22.12+. `public/_redirects` is copied to `dist` and rewrites deep links to `index.html`. No functions, credentials or database setup are needed.

Use HTTPS. Other static hosts need equivalent SPA fallback rules. A custom CSP must allow module workers from self and Blob image URLs; live previews need the intended sites in frame-src. Subpath hosting requires matching Vite base and React Router basename configuration.

Changing origin changes the browser storage namespace. Export backups on the old origin, then import on the new origin before removing the previous deployment.

No deployment was published during implementation.
