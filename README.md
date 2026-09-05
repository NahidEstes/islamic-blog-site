# Noor Al-Hidayah — Islamic blog

The existing Next.js / React / MongoDB project, simplified into an article-first blog. No new application framework, authentication provider, or duplicate category/tag model.

## Start locally

1. Install dependencies: `npm install`.
2. Use your existing `.env` or copy `.env.example` to `.env.local`. Next.js gives `.env.local` precedence.
3. Set `MONGODB_URI` to a MongoDB connection string with a database name, and `AUTH_SECRET` to at least 32 random characters.
4. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
   If a built server is run under a different origin, set the server-only `SITE_URL` to that exact origin as well. Public metadata uses the build-time `NEXT_PUBLIC_SITE_URL`.
5. Run `npm run dev`. Open the localhost address printed by Next.js.

Without a MongoDB URI, public pages show clearly identified demonstration content. Writes and authentication require MongoDB. A configured but unavailable database reports an error instead of silently replacing real content with demos.

## Administrator access

For a new installation, set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` (12+ characters; at most 72 UTF-8 bytes), then run:

```sh
npm run admin:create
```

This creates one administrator. It does not reset an existing password or promote an existing account. Remove the bootstrap password from deployment settings afterwards. Log in at `/login`; open `/admin`.

For a **development database only**, `npm run seed` adds bilingual sample articles, two demo users, categories, tags, comments, a bookmark, a like, subscribers, and one **unpublished, non-publishable quote placeholder**. Both demo accounts initially use the supplied seed password. The normal reader is `reader@example.com`. Rerunning the seed does not overwrite existing records, credentials, or edited settings. Bulk seed reset is disabled. Do not seed a production database.

## Editing the blog

- **Articles:** Create or edit, choose English/Bangla, category, comma-separated tags, featured image, featured status, and SEO fields. Status is Draft, Published, or Archived. Changing to Draft unpublishes immediately. Delete permanently removes an article and its bookmarks, likes, and comments.
- **Content format:** Plain text with blank lines between paragraphs. Start a heading with `## `. For a manually verified quotation or reference, start every line in that block with `>` and finish with `> Source: your reference`. HTML is displayed as text; full Markdown is intentionally not supported. The site never fills in religious quotations automatically.

## Theme

Dark mode is the first-visit default. The sun/moon button in the header switches between dark and light mode, and the browser stores the choice under `noor-theme`. The light theme keeps the original site palette.

- **Images:** Upload PNG/JPEG/WebP (up to 5 MB), choose a project `/images/` path, or use an HTTPS Cloudinary image URL. Uploads are stored in MongoDB GridFS, not a temporary server filesystem. Uploaded images are publicly readable; do not upload private files. Unused uploads are not automatically deleted.
- **Categories/Tags:** Create, rename, and delete. Renaming updates the corresponding article labels. Used topics cannot be deleted until their articles are reassigned. Labels typed in the article editor are added to the topic directory automatically.
- **Quotes:** Enter exact text, scholar name, and reference; optionally add a source URL. Confirm that you checked the source before publishing. Never invent quotations. The seeded placeholder cannot be published.
- **Comments:** New comments are pending. Approve, hide, or delete them in the dashboard. There are no threaded replies.
- **Users:** View accounts and suspend/reactivate readers. Only super administrators can change staff roles. Your own access cannot be changed here.
- **Homepage:** Edit welcome/newsletter copy and optionally set a published article slug as the featured override. Otherwise the latest featured article is used, then the latest published article.
- **Site Settings:** Change the site name, default SEO description, contact email, and footer copy.
- **Newsletter / Contact Messages:** View and manage stored records. Newsletter captures subscriptions; automatic email campaigns are not included.

## Reader features

Register, log in, log out, edit name/bio, bookmark/unbookmark, see saved published articles, like/unlike, and submit comments. Interactions are persisted in MongoDB with unique bookmark/like indexes. Suspended accounts and changed roles are checked against the database on each authenticated request.

Search matches article title, excerpt, body, categories, and tags using escaped case-insensitive queries. This supports Bangla and English without depending on MongoDB's English stemming. It is intentionally simple; large collections may benefit from a dedicated search index later.

Popular articles use stored view counts with a lightweight per-process/IP rate limit. Counts are approximate, not analytics.

## Project structure

- `app/`: App Router pages, admin/account pages, API handlers, metadata/sitemap.
- `components/`: Small reader, form, navigation, and admin components.
- `lib/blog.ts`: Public MongoDB queries and default settings.
- `lib/auth.ts`, `lib/api.ts`, `lib/validation.ts`: Sessions, access checks, input validation.
- `models/`: Existing User, Article, Taxonomy, Site, Communication models; new Interaction and Quote schemas.
- `data/demo.ts`: Safe bilingual demonstration articles.
- `scripts/`: Seed, first-admin creation, and isolated integration test.
- `public/fonts/`: Self-hosted Noto Serif Bengali and its OFL license.
- `public/images/blog-books.png`: Original generated editorial photograph.

Article language is stored as `locale`, avoiding MongoDB's legacy text-index `language` override field. The existing category/tag strings and Taxonomy collection are retained.

Old Quran, Hadith, prayer, and course **public routes and navigation were removed**. Their legacy model files and existing MongoDB records were retained; no database migration or deletion was run against your data.

## Checks

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:integration
```

After deleting routes, run `node node_modules/next/dist/bin/next typegen` if stale generated route types cause typecheck errors.

Integration tests require `mongod` installed locally and an existing successful production build. Windows defaults to MongoDB 8.0's standard installation path; override with `MONGOD_BINARY` if needed. Tests launch a separate temporary database on port 27129 and a server on port 3210. They **never use your app's MONGODB_URI**. The temporary test folder is retained in the OS temp directory for inspection. Use `npm run test:integration -- --keep` to retain the test preview for browser QA.

## Production

Use a Node.js-compatible Next.js host with MongoDB access. This project is not a static export and has not been migrated to a Workers/D1 platform.

1. Configure production `MONGODB_URI`, a strong `AUTH_SECRET`, and the exact HTTPS `NEXT_PUBLIC_SITE_URL`.
2. Run `npm run build`, then `npm start` (or the host's normal Next.js deployment flow).
3. Create the first admin with `npm run admin:create` if needed. Do not include demo seed data.
4. Verify HTTPS, database backups/access controls, registration/login, uploads, and form delivery/storage on the real domain.
5. Configure a trusted reverse proxy. Current rate limiting is process-local and depends on a trustworthy forwarded IP header; multi-instance or high-traffic deployments should add shared rate limiting.

Password recovery, email verification, email campaigns, and OAuth are outside this simplified blog's scope. Do not advertise those capabilities.

## Image source

The featured photograph was generated with the built-in image tool and saved to `public/images/blog-books.png`. Prompt: a photorealistic portrait still life of green and muted gold clothbound books beside a leafy plant on pale wood, warm natural light and Islamic geometric window shadows, neutral white interior, no people, writing, calligraphy, logos, watermark, or UI. The full generation prompt is recorded in `ASSETS.md`.

# islamic-blog-site
