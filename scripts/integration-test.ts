/**
 * Uses an isolated, temporary MongoDB process. Never reads the app's MONGODB_URI.
 * Requires a successful npm run build and mongod installed locally.
 * Run: npx tsx scripts/integration-test.ts [--keep]
 */
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Article } from "../models/Article";
import { Bookmark } from "../models/Site";
import { ArticleLike, Comment } from "../models/Interaction";
import { Quote } from "../models/Quote";
import { NewsletterSubscriber, ContactMessage } from "../models/Communication";
import { Dua, DuaProgress, LearnCategory } from "../models/Learn";

const port = 3210;
const mongoPort = 27129;
const base = "http://127.0.0.1:" + port;
const uri = "mongodb://127.0.0.1:" + mongoPort + "/blog_integration_test";
const password = "IntegrationOnlyPassword123!";
const keep = process.argv.includes("--keep");
let mongo: ChildProcess;
let server: ChildProcess;
let serverLog = "";
let passed = 0;
let adminCookie = "";
let readerCookie = "";
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function child(command: string, args: string[], env = process.env) {
  const p = spawn(command, args, {
    cwd: process.cwd(),
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  });
  p.stdout?.on("data", (data) => {
    if (!command.includes("mongod")) serverLog += String(data);
  });
  p.stderr?.on("data", (data) => {
    serverLog += String(data);
    if (args[1] === "start") process.stderr.write(data);
  });
  return p;
}
async function waitFor(check: () => Promise<boolean>, label: string) {
  for (let i = 0; i < 120; i++) {
    try {
      if (await check()) return;
    } catch {}
    await pause(500);
  }
  throw new Error("Timed out waiting for " + label);
}
async function call(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    cookie?: string;
    expected?: number | number[];
    origin?: string;
  } = {}
) {
  const response = await fetch(base + path, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      origin: options.origin ?? base,
      ...(options.cookie ? { cookie: options.cookie } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    redirect: "manual"
  });
  const text = await response.text();
  const expected = options.expected ?? 200;
  if (
    expected === 200 &&
    response.headers.get("content-type")?.includes("text/html")
  ) {
    assert.ok(
      !/<template[^>]+data-dgst=/.test(text),
      "Server rendering failed for " + path
    );
  }
  assert.ok(
    Array.isArray(expected)
      ? expected.includes(response.status)
      : response.status === expected,
    path +
      ": expected " +
      expected +
      ", received " +
      response.status +
      ": " +
      text.slice(0, 250)
  );
  passed++;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { data, response, text };
}
async function missingPage(path: string, privateTitle?: string) {
  // Next.js loading boundaries may already have streamed HTTP 200 before
  // notFound() resolves. Verify the not-found UI + noindex and no private title.
  const result = await call(path, { expected: [200, 404] });
  assert.ok(result.text.includes("Page not found"), "Missing not-found UI");
  assert.match(result.text, /name="robots" content="[^"]*noindex/);
  if (privateTitle)
    assert.ok(!result.text.includes(privateTitle), "Draft title was exposed");
  passed += privateTitle ? 3 : 2;
}
async function main() {
  const directory = await mkdtemp(join(tmpdir(), "islamic-blog-test-"));
  const mongod =
    process.env.MONGOD_BINARY ??
    (process.platform === "win32"
      ? "C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe"
      : "mongod");
  mongo = child(mongod, [
    "--dbpath",
    directory,
    "--port",
    String(mongoPort),
    "--bind_ip",
    "127.0.0.1",
    "--quiet"
  ]);
  await waitFor(async () => {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 400 });
    return true;
  }, "temporary MongoDB");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "production",
    MONGODB_URI: uri,
    AUTH_SECRET: "integration-only-secret-at-least-32-characters",
    SITE_URL: base,
    NEXT_PUBLIC_SITE_URL: base
  };
  server = child(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "-p",
      String(port),
      "-H",
      "127.0.0.1"
    ],
    env
  );
  await waitFor(async () => {
    const response = await fetch(base + "/login");
    return response.ok;
  }, "production server");
  // Seed only the isolated fixture database; the seed command also stays insert-only.
  const seed = child(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "scripts/seed.ts"],
    {
      ...env,
      NODE_ENV: "development",
      SUPER_ADMIN_EMAIL: "test-admin@example.com",
      SUPER_ADMIN_PASSWORD: password
    }
  );
  assert.equal((await once(seed, "exit"))[0], 0, "Seed command failed");
  await Promise.all([
    Article.init(),
    Bookmark.init(),
    ArticleLike.init(),
    Comment.init(),
    User.init(),
    Quote.init(),
    Dua.init(),
    DuaProgress.init(),
    LearnCategory.init()
  ]);
  let result = await call("/api/auth/login", {
    method: "POST",
    body: { email: "test-admin@example.com", password }
  });
  adminCookie = result.response.headers.get("set-cookie")!.split(";")[0];
  await call("/api/auth/register", {
    method: "POST",
    body: {
      name: "Integration Reader",
      email: "integration-reader@example.com",
      password
    },
    expected: 201
  }).then((r) => {
    readerCookie = r.response.headers.get("set-cookie")!.split(";")[0];
  });
  await call("/api/auth/register", {
    method: "POST",
    body: {
      name: "Duplicate",
      email: "integration-reader@example.com",
      password
    },
    expected: 409
  });
  await call("/api/auth/login", {
    method: "POST",
    body: {
      email: "integration-reader@example.com",
      password: "wrong-password"
    },
    expected: 401
  });
  await call("/api/articles?status=draft", { expected: 403 });
  await call("/api/articles?status=all", {
    cookie: readerCookie,
    expected: 403
  });
  await call("/api/articles", {
    method: "POST",
    body: {},
    cookie: readerCookie,
    expected: 403
  });
  await call("/api/articles", {
    method: "POST",
    body: {},
    cookie: adminCookie,
    origin: "https://wrong.example",
    expected: 403
  });
  const article = {
    title: "বাংলা পরীক্ষামূলক সম্পাদকীয় লেখা",
    excerpt:
      "এটি শুধুমাত্র পরীক্ষার জন্য তৈরি একটি নিরাপদ সম্পাদকীয় নমুনা লেখা।",
    content:
      "এটি কেবল সফটওয়্যার পরীক্ষার জন্য ব্যবহৃত লেখা। কোনো ধর্মীয় উদ্ধৃতি বা বিধান এখানে অন্তর্ভুক্ত করা হয়নি।\n\n## দ্বিতীয় অনুচ্ছেদ\n\nপড়ার নোট এবং উৎস আলাদা করে রাখুন।\n\n> Test-only reference block; this is not religious content.\n> Source: Integration fixture",
    category: "Knowledge",
    tags: ["পাঠাভ্যাস", "Integration"],
    language: "bn",
    featured: true,
    status: "draft",
    featuredImage: "/images/blog-books.png",
    seoTitle: "বাংলা সম্পাদকীয় পরীক্ষা",
    metaDescription: "Bilingual article integration test."
  };
  result = await call("/api/articles", {
    method: "POST",
    body: article,
    cookie: adminCookie,
    expected: 201
  });
  const id = result.data.article._id;
  const slug = result.data.article.slug;
  await call("/api/articles", {
    method: "POST",
    body: {
      ...article,
      title: "A second article requesting the same slug",
      slug
    },
    cookie: adminCookie,
    expected: 409
  });
  await missingPage("/articles/" + encodeURIComponent(slug), article.title);
  const publishedResult = await call("/api/articles/" + id, {
    method: "PATCH",
    body: { status: "published" },
    cookie: adminCookie
  });
  assert.equal(
    publishedResult.data.article.locale,
    "bn",
    "Publishing must preserve Bangla locale"
  );
  assert.deepEqual(
    publishedResult.data.article.tags,
    article.tags,
    "Publishing must preserve tags"
  );
  result = await call("/articles/" + encodeURIComponent(slug));
  assert.ok(
    result.text.includes('lang="bn"'),
    "Missing Bangla article markup: " + result.text.slice(-2000)
  );
  assert.ok(result.text.includes(article.title));
  assert.ok(result.text.includes(article.seoTitle));
  assert.ok(result.text.includes("Article interactions"));
  assert.ok(result.text.includes("Popular Posts"));
  assert.ok(result.text.includes("Categories"));
  assert.ok(result.text.includes("You May Also Like"));
  assert.ok(result.text.includes("Related Posts"));
  assert.ok(result.text.includes("Integration fixture"));
  assert.ok(result.text.includes("Site Administrator"));
  assert.ok(!result.text.includes("A little knowledge, in your inbox."));
  passed += 11;
  const richArticle = {
    ...article,
    title: "Rich editor integration article",
    excerpt:
      "A plain-text excerpt for the isolated rich article integration test.",
    contentFormat: "rich-html",
    content:
      '<h2 style="color:red" onclick="bad()">Rich integration heading</h2><p>Visible searchable wording for the isolated rich editor workflow and reading-time test. <a href="javascript:bad()">Unsafe link label</a></p><table><tbody><tr><th scope="col">Field</th><td>Value</td></tr></tbody></table><script>bad()</script>',
    language: "en",
    featured: false,
    seoTitle: "Rich editor integration test",
    metaDescription: "Safe rich article rendering integration test."
  };
  result = await call("/api/articles", {
    method: "POST",
    body: richArticle,
    cookie: adminCookie,
    expected: 201
  });
  const richId = result.data.article._id;
  const richSlug = result.data.article.slug;
  const storedRich = await Article.findById(richId).lean();
  assert.equal(storedRich?.contentFormat, "rich-html");
  assert.ok(
    !/script|onclick|style=|javascript:/i.test(storedRich?.content ?? "")
  );
  assert.ok(storedRich?.searchText.includes("Visible searchable wording"));
  assert.ok(Number(storedRich?.readingTime) >= 1);
  passed += 4;
  await call("/api/articles/" + richId, {
    method: "PATCH",
    body: { status: "published" },
    cookie: adminCookie
  });
  result = await call("/articles/" + richSlug);
  assert.ok(result.text.includes("Rich integration heading"));
  assert.ok(result.text.includes("<table>"));
  assert.ok(!result.text.includes('onclick="bad()"'));
  assert.ok(!result.text.includes('style="color:red"'));
  assert.ok(!result.text.includes("javascript:bad()"));
  passed += 3;
  result = await call("/search?q=Visible%20searchable%20wording");
  assert.ok(result.text.includes(richArticle.title));
  passed++;
  await call("/api/articles/" + richId, {
    method: "DELETE",
    cookie: adminCookie
  });
  assert.equal(await Article.countDocuments({ _id: richId }), 0);
  passed++;
  await call("/api/articles/invalid", {
    method: "PATCH",
    body: { status: "draft" },
    cookie: adminCookie,
    expected: 400
  });
  await call("/api/articles/" + id + "/interactions", {
    method: "PUT",
    body: { action: "bookmark" },
    expected: 401
  });
  await call("/api/articles/" + id + "/interactions", {
    method: "PUT",
    body: { action: "bookmark" },
    cookie: readerCookie
  });
  await call("/api/articles/" + id + "/interactions", {
    method: "PUT",
    body: { action: "bookmark" },
    cookie: readerCookie
  });
  await call("/api/articles/" + id + "/interactions", {
    method: "PUT",
    body: { action: "like" },
    cookie: readerCookie
  });
  await call("/api/articles/" + id + "/interactions", {
    method: "PUT",
    body: { action: "like" },
    cookie: readerCookie
  });
  const reader = await User.findOne({
    email: "integration-reader@example.com"
  });
  assert.equal(
    await Bookmark.countDocuments({ user: reader._id, contentId: id }),
    1
  );
  assert.equal(
    await ArticleLike.countDocuments({ user: reader._id, article: id }),
    1
  );
  passed += 2;
  result = await call("/account", { cookie: readerCookie });
  assert.ok(result.text.includes(article.title));
  passed++;
  await call("/api/account", {
    method: "PATCH",
    body: { name: "Updated Reader", bio: "নিয়মিত পড়ার অনুশীলন।" },
    cookie: readerCookie
  });
  result = await call("/api/auth/me", { cookie: readerCookie });
  assert.ok(result.text.includes("Updated Reader"));
  passed++;
  await call("/api/articles/" + id + "/interactions", {
    method: "POST",
    body: { body: "নমুনা মন্তব্য — পরীক্ষামূলক লেখা।" },
    cookie: readerCookie,
    expected: 201
  });
  const comment = await Comment.findOne({ article: id, user: reader._id });
  result = await call("/api/articles/" + id + "/interactions");
  assert.equal(result.data.comments.length, 0);
  passed++;
  await call("/api/admin/comments/" + comment._id, {
    method: "PATCH",
    body: { status: "approved" },
    cookie: readerCookie,
    expected: 403
  });
  await call("/api/admin/comments/" + comment._id, {
    method: "PATCH",
    body: { status: "approved" },
    cookie: adminCookie
  });
  result = await call("/api/articles/" + id + "/interactions");
  assert.equal(result.data.comments.length, 1);
  passed++;
  await call("/api/admin/comments/" + comment._id, {
    method: "PATCH",
    body: { status: "hidden" },
    cookie: adminCookie
  });
  result = await call("/api/articles/" + id + "/interactions");
  assert.equal(result.data.comments.length, 0);
  passed++;
  await call("/api/admin/comments/" + comment._id, {
    method: "DELETE",
    cookie: adminCookie
  });
  // Explicit test wording; never an authentic-looking religious quotation.
  const quote = {
    quote: "Integration test fixture only — this is not a religious quotation.",
    scholar: "Test fixture author",
    source: "Local automated test fixture",
    sourceUrl: "",
    published: false,
    featured: true,
    verified: false
  };
  result = await call("/api/admin/quotes", {
    method: "POST",
    body: quote,
    cookie: adminCookie,
    expected: 201
  });
  const quoteId = result.data.item._id;
  await call("/api/admin/quotes/" + quoteId, {
    method: "PATCH",
    body: { ...quote, published: true },
    cookie: adminCookie,
    expected: 400
  });
  await call("/api/admin/quotes/" + quoteId, {
    method: "PATCH",
    body: { ...quote, published: true, verified: true },
    cookie: adminCookie
  });
  result = await call("/quotes");
  assert.ok(result.text.includes(quote.quote));
  passed++;
  await call("/api/admin/quotes/" + quoteId, {
    method: "PATCH",
    body: { ...quote, verified: true, published: false },
    cookie: adminCookie
  });
  await call("/api/admin/quotes/" + quoteId, {
    method: "DELETE",
    cookie: adminCookie
  });
  const demoQuote = await Quote.findOne({ isDemo: true });
  await call("/api/admin/quotes/" + demoQuote._id, {
    method: "PATCH",
    body: { ...quote, published: true, verified: true },
    cookie: adminCookie,
    expected: 400
  });
  for (const q of ["পরীক্ষামূলক", "Integration", "Knowledge"]) {
    result = await call("/search?q=" + encodeURIComponent(q));
    assert.ok(result.text.includes(article.title));
    passed++;
  }
  await call("/search?q=" + encodeURIComponent(".* [")); // Escaped query must not throw.
  await call("/api/newsletter", {
    method: "POST",
    body: { email: "newsletter-test@example.com" },
    expected: 201
  });
  await call("/api/newsletter", {
    method: "POST",
    body: { email: "NEWSLETTER-TEST@example.com" },
    expected: 201
  });
  assert.equal(
    await NewsletterSubscriber.countDocuments({
      email: "newsletter-test@example.com"
    }),
    1
  );
  passed++;
  await call("/api/contact", {
    method: "POST",
    body: {
      name: "Test Reader",
      email: "test-contact@example.com",
      subject: "Test feedback",
      message: "This is a test contact message with enough detail."
    },
    expected: 201
  });
  assert.equal(
    await ContactMessage.countDocuments({ email: "test-contact@example.com" }),
    1
  );
  passed++;
  result = await call("/api/admin/taxonomies", {
    method: "POST",
    body: {
      type: "category",
      name: "Test category",
      description: "Temporary test topic"
    },
    cookie: adminCookie,
    expected: 201
  });
  const taxonomyId = result.data.item._id;
  await call("/api/admin/taxonomies/" + taxonomyId, {
    method: "PATCH",
    body: {
      type: "category",
      name: "Renamed test category",
      description: "Updated"
    },
    cookie: adminCookie
  });
  await call("/api/admin/taxonomies/" + taxonomyId, {
    method: "DELETE",
    cookie: adminCookie
  });
  const site = {
    name: "Ilm Bangla",
    description: "Thoughtful Islamic articles in Bangla and English.",
    contactEmail: "editor@example.com",
    footerText: "Carefully sourced reading."
  };
  await call("/api/admin/settings", {
    method: "PUT",
    body: { key: "site", value: site },
    cookie: adminCookie
  });
  await call("/api/admin/settings", {
    method: "PUT",
    body: {
      key: "homepage",
      value: {
        introHeading: "Assalamu alaikum wa rahmatullah.",
        introText: "Thoughtful reading for a life rooted in faith.",
        newsletterHeading: "A little knowledge, in your inbox.",
        newsletterText: "New articles and thoughtful reading.",
        featuredSlug: "নিয়মিত-পাঠের-অভ্যাস"
      }
    },
    cookie: adminCookie
  });
  const image = await readFile("public/images/blog-books.png");
  const upload = new FormData();
  upload.set("file", new Blob([image], { type: "image/png" }), "test.png");
  const uploadResponse = await fetch(base + "/api/admin/media", {
    method: "POST",
    headers: { cookie: adminCookie, origin: base },
    body: upload
  });
  assert.equal(uploadResponse.status, 201);
  const media = await uploadResponse.json();
  const downloaded = await fetch(base + media.url);
  assert.equal(downloaded.status, 200);
  assert.equal(downloaded.headers.get("content-type"), "image/png");
  passed += 3;
  await call("/api/articles/" + id, {
    method: "PATCH",
    body: { featuredImage: media.url },
    cookie: adminCookie
  });

  result = await call("/api/admin/learn-categories", {
    method: "POST",
    cookie: adminCookie,
    body: {
      module: "duas",
      name: "Test Learning Topic",
      description: "Software test category only.",
      order: 1,
      published: true
    },
    expected: 201
  });
  const learnCategoryId = result.data.item._id;
  const duaFixture = {
    title: "TEST PLACEHOLDER Dua Learning Record",
    arabicText: "[ADMIN MUST REPLACE — TEST PLACEHOLDER]",
    banglaMeaning:
      "পরীক্ষার প্লেসহোল্ডার—প্রকাশের আগে প্রশাসককে প্রতিস্থাপন করতে হবে।",
    transliteration: "TEST PLACEHOLDER",
    category: "Test Learning Topic",
    source: "Automated integration test fixture",
    reference: "TEST-ONLY-REFERENCE",
    sourceUrl: "",
    audioUrl: "",
    segments: [
      {
        arabicPhrase: "[TEST PHRASE ONE]",
        transliteration: "test phrase one",
        banglaMeaning: "পরীক্ষার প্রথম অংশ",
        order: 1
      },
      {
        arabicPhrase: "[TEST PHRASE TWO]",
        transliteration: "test phrase two",
        banglaMeaning: "পরীক্ষার দ্বিতীয় অংশ",
        order: 2
      }
    ],
    featured: true,
    verified: false,
    status: "draft"
  };
  result = await call("/api/admin/duas", {
    method: "POST",
    cookie: adminCookie,
    body: duaFixture,
    expected: 201
  });
  const duaId = result.data.item._id;
  const duaSlug = result.data.item.slug;
  await missingPage(
    "/learn/duas/" + encodeURIComponent(duaSlug),
    duaFixture.title
  );
  await call("/api/admin/duas/" + duaId, {
    method: "PATCH",
    cookie: adminCookie,
    body: { ...duaFixture, status: "published" },
    expected: 400
  });
  await call("/api/admin/learn-categories/" + learnCategoryId, {
    method: "PATCH",
    cookie: adminCookie,
    body: {
      module: "duas",
      name: "Renamed Learning Topic",
      description: "Software test category only.",
      order: 1,
      published: true
    }
  });
  assert.equal((await Dua.findById(duaId))?.category, "Renamed Learning Topic");
  passed++;
  const publishedDua = {
    ...duaFixture,
    category: "Renamed Learning Topic",
    verified: true,
    status: "published"
  };
  await call("/api/admin/duas/" + duaId, {
    method: "PATCH",
    cookie: adminCookie,
    body: publishedDua
  });
  result = await call("/learn/duas/" + encodeURIComponent(duaSlug));
  assert.ok(result.text.includes(duaFixture.title));
  assert.ok(result.text.includes("TEST-ONLY-REFERENCE"));
  assert.ok(result.text.includes("Learn word by word"));
  passed += 3;
  await call("/api/learn/duas/" + duaId + "/progress", {
    method: "PUT",
    body: { action: "start" },
    expected: 401
  });
  await call("/api/learn/duas/" + duaId + "/progress", {
    method: "PUT",
    cookie: readerCookie,
    body: { action: "start" }
  });
  await call("/api/learn/duas/" + duaId + "/progress", {
    method: "PUT",
    cookie: readerCookie,
    body: { action: "favorite", favorite: true }
  });
  await call("/api/learn/duas/" + duaId + "/progress", {
    method: "PUT",
    cookie: readerCookie,
    body: { action: "progress", currentStep: 1 }
  });
  result = await call("/api/auth/login", {
    method: "POST",
    body: { email: "integration-reader@example.com", password }
  });
  const freshReaderCookie = result.response.headers
    .get("set-cookie")!
    .split(";")[0];
  result = await call("/api/learn/duas/" + duaId + "/progress", {
    cookie: freshReaderCookie
  });
  assert.equal(result.data.currentStep, 1);
  assert.equal(result.data.status, "in-progress");
  assert.equal(result.data.favorite, true);
  passed += 3;
  result = await call("/learn/duas", { cookie: freshReaderCookie });
  assert.ok(result.text.includes(duaFixture.title));
  result = await call("/account", { cookie: freshReaderCookie });
  assert.ok(result.text.includes(duaFixture.title));
  passed += 2;
  await call("/api/learn/duas/" + duaId + "/progress", {
    method: "PUT",
    cookie: freshReaderCookie,
    body: { action: "complete" }
  });
  assert.equal(
    (await DuaProgress.findOne({ user: reader._id, dua: duaId }))?.status,
    "completed"
  );
  passed++;
  await call("/api/admin/learn-categories/" + learnCategoryId, {
    method: "DELETE",
    cookie: adminCookie,
    expected: 409
  });
  result = await call("/");
  assert.ok(result.text.includes('data-theme="dark"'));
  assert.ok(result.text.includes("noor-theme"));
  assert.ok(result.text.includes("Switch to light mode"));
  passed += 3;
  for (const route of [
    "/articles",
    "/learn",
    "/learn/duas",
    "/categories",
    "/tags",
    "/quotes",
    "/about",
    "/contact",
    "/login",
    "/register",
    "/articles/consistent-habit-beneficial-learning",
    "/sitemap.xml"
  ]) {
    await call(route);
  }
  for (const route of ["/quran", "/hadith", "/prayer-times", "/courses"]) {
    await missingPage(route);
  }
  for (const section of [
    "",
    "/articles",
    "/learn",
    "/duas",
    "/categories",
    "/tags",
    "/quotes",
    "/comments",
    "/users",
    "/newsletter",
    "/messages",
    "/homepage",
    "/settings",
    "/articles/new",
    "/articles/" + id + "/edit"
  ]) {
    await call("/admin" + section, { cookie: adminCookie });
  }
  await call("/admin/duas/" + duaId + "/edit", { cookie: adminCookie });
  await call("/admin/duas/" + duaId + "/preview", { cookie: adminCookie });
  await call("/api/admin/duas/" + duaId, {
    method: "PATCH",
    cookie: adminCookie,
    body: { ...publishedDua, status: "archived" }
  });
  await missingPage(
    "/learn/duas/" + encodeURIComponent(duaSlug),
    duaFixture.title
  );
  await call("/api/admin/duas/" + duaId, {
    method: "DELETE",
    cookie: adminCookie
  });
  assert.equal(await DuaProgress.countDocuments({ dua: duaId }), 0);
  passed++;
  await call("/api/admin/learn-categories/" + learnCategoryId, {
    method: "DELETE",
    cookie: adminCookie
  });
  await call("/api/articles/" + id + "/interactions", {
    method: "DELETE",
    body: { action: "bookmark" },
    cookie: readerCookie
  });
  await call("/api/articles/" + id + "/interactions", {
    method: "DELETE",
    body: { action: "like" },
    cookie: readerCookie
  });
  assert.equal(
    await Bookmark.countDocuments({ user: reader._id, contentId: id }),
    0
  );
  assert.equal(
    await ArticleLike.countDocuments({ user: reader._id, article: id }),
    0
  );
  passed += 2;
  await call("/api/articles/" + id, {
    method: "PATCH",
    body: { status: "archived" },
    cookie: adminCookie
  });
  await missingPage("/articles/" + encodeURIComponent(slug), article.title);
  await call("/api/articles/" + id, { method: "DELETE", cookie: adminCookie });
  assert.equal(await Article.countDocuments({ _id: id }), 0);
  passed++;
  await call("/api/admin/users/" + reader._id, {
    method: "PATCH",
    body: { role: "user", status: "suspended" },
    cookie: adminCookie
  });
  await call("/api/account", {
    method: "PATCH",
    body: { name: "Blocked", bio: "" },
    cookie: readerCookie,
    expected: 401
  });
  await call("/api/admin/users/" + reader._id, {
    method: "PATCH",
    body: { role: "user", status: "active" },
    cookie: adminCookie
  });
  const logout = await call("/api/auth/logout", {
    method: "POST",
    cookie: readerCookie,
    expected: 303
  });
  assert.equal(logout.response.headers.get("location"), "/");
  assert.ok(
    logout.response.headers.get("set-cookie")?.includes("noor_session=")
  );
  passed++;
  if (keep) {
    const previewAdmin = await User.findOne({ role: "super-admin" });
    assert.ok(previewAdmin);
    const previewCategory = await LearnCategory.create({
      module: "duas",
      name: "TEST PLACEHOLDER",
      slug: "test-placeholder",
      description: "Isolated browser QA content only.",
      order: 1,
      published: true
    });
    const previewDua = await Dua.create({
      ...duaFixture,
      slug: "test-placeholder-dua-preview",
      category: previewCategory.name,
      featured: true,
      verified: true,
      status: "published",
      author: previewAdmin._id,
      publishedAt: new Date()
    });
    await DuaProgress.create({
      user: reader._id,
      dua: previewDua._id,
      currentStep: 1,
      status: "in-progress",
      favorite: true,
      lastAccessedAt: new Date()
    });
  }
  console.info("PASS: " + passed + " production HTTP and MongoDB checks.");
  console.info("Test database is isolated from the existing app database.");
  await mongoose.disconnect();
  if (keep) {
    console.info(
      "QA preview: " +
        base +
        "; server PID " +
        server.pid +
        "; Mongo PID " +
        mongo.pid
    );
    await new Promise(() => {});
  }
}
main()
  .catch(async (error) => {
    console.error(error);
    console.error(serverLog.slice(-5000));
    process.exitCode = 1;
    if (process.argv.includes("--debug")) {
      console.info(
        "Debug preview kept at " +
          base +
          "; server PID " +
          server.pid +
          "; Mongo PID " +
          mongo.pid
      );
      await new Promise(() => {});
    }
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
    server?.kill();
    mongo?.kill();
  });
