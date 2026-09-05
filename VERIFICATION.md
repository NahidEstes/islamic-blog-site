# Verification — 4 September 2026

The existing Next.js project was updated in place. No existing database was reset or reseeded.

## Automated checks

- `npm run lint`: passed, no warnings.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run test`: 15 unit tests passed.
- `npm run test:integration`: 134 production HTTP/MongoDB workflow checks passed against an isolated temporary MongoDB instance.
- Seed compilation with `tsc -p tsconfig.seed.json`: passed.

The integration run covers registration, login/logout, fresh profile data, admin authorization, article create/edit/publish/archive/delete, private drafts, preserving language/tags during status changes, Bangla article URLs, bookmarks and likes with duplicate protection, comments and moderation, quote verification and CRUD, category CRUD, bilingual search, newsletter deduplication, contact storage, GridFS image upload/read, settings, all public/admin pages, removed public routes, and suspended-account enforcement.

The article-detail checks also cover database-backed author details, related and popular articles, category counts, manually entered reference blocks, and the absence of an article-page newsletter.

Theme checks cover the server-rendered dark default, the header toggle, and the persisted `noor-theme` preference hook. The shared color tokens cover both the requested dark palette and the preserved light palette.

HTML responses are checked for server-rendering errors, not just HTTP status. Next.js may stream a not-found response with HTTP 200; draft/archive tests additionally check the not-found content, noindex metadata, and absence of the private article title.

## Browser checks

- Reference-inspired desktop homepage with bilingual test articles.
- Mobile checks at 320, 360, and 390 CSS pixels; no document-level horizontal overflow in the checked homepage, article, category, and dashboard views.
- Readable self-hosted Bangla font on article headings and body text.
- Two-column desktop article layout and single-column mobile layout with the sidebar moved below the article.
- Mobile menu opens and closes after navigation.
- Reader login, profile, saving/removing a bookmark, like state/count, and comment submission awaiting approval.
- Saved article appears in the profile.
- Simplified admin dashboard and navigation.

Test servers and MongoDB instances were separate from the user's existing database. The production integration processes were stopped after the final passing run. The development preview uses the existing project configuration.

## Scope and handoff

- Old feature-heavy public routes are removed; legacy database models and existing records are preserved.
- No authentic-looking religious quotations were fabricated. The seed's quote placeholder is unpublished and cannot be published.
- Newsletter and contact forms store records. Email campaigns and outbound contact notifications are not configured.
- No public deployment was performed. See README.md for local use, first-admin creation, editing, and production setup.
