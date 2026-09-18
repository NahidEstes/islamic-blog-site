import { z } from "zod";
import { slugify } from "./utils";
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8)
    .max(72)
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Password must be at most 72 UTF-8 bytes."
    )
});
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(80)
});
export const imageSourceSchema = z
  .string()
  .max(1000)
  .refine(
    (v) =>
      !v ||
      /^\/images\/[\w./-]+$/.test(v) ||
      /^\/api\/media\/[a-f0-9]{24}$/.test(v) ||
      /^https:\/\/res\.cloudinary\.com\//.test(v),
    "Use an uploaded image, /images/ path, or HTTPS Cloudinary URL."
  );
const plainMetadata = (limit: number) =>
  z
    .string()
    .max(limit)
    .refine(
      (value) => !/<\/?[a-z][^>]*>/i.test(value),
      "Use plain text here; HTML is only allowed in the article body."
    );
export const articleSlugSchema = z
  .string()
  .trim()
  .min(1, "Enter an article slug.")
  .max(180)
  .transform(slugify)
  .pipe(
    z.string().min(1, "Use letters or numbers in the article slug.").max(180)
  );
export const articleSchema = z.object({
  title: plainMetadata(180)
    .transform((value) => value.trim())
    .pipe(z.string().min(5)),
  slug: articleSlugSchema.optional(),
  excerpt: plainMetadata(400)
    .transform((value) => value.trim())
    .pipe(z.string().min(20)),
  content: z.string().trim().min(50).max(250000),
  contentFormat: z.enum(["plain", "rich-html"]).default("plain"),
  category: z.string().trim().min(2).max(80),
  tags: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  language: z.enum(["en", "bn"]).default("en"),
  featuredImage: imageSourceSchema.default(""),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  seoTitle: plainMetadata(70).optional(),
  metaDescription: plainMetadata(170).optional()
});
// Zod defaults must not run for omitted fields during a partial update.
export const articleUpdateSchema = articleSchema.partial().extend({
  tags: articleSchema.shape.tags.removeDefault().optional(),
  language: articleSchema.shape.language.removeDefault().optional(),
  contentFormat: articleSchema.shape.contentFormat.removeDefault().optional(),
  featuredImage: articleSchema.shape.featuredImage.removeDefault().optional(),
  status: articleSchema.shape.status.removeDefault().optional(),
  featured: articleSchema.shape.featured.removeDefault().optional()
});
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(140),
  message: z.string().trim().min(20).max(5000)
});
export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase())
});
export const quoteSchema = z
  .object({
    quote: z.string().trim().min(10).max(3000),
    scholar: z.string().trim().min(2).max(150),
    source: z.string().trim().min(3).max(500),
    sourceUrl: z
      .union([z.literal(""), z.url().refine((v) => /^https?:\/\//.test(v))])
      .default(""),
    published: z.boolean().default(false),
    featured: z.boolean().default(false),
    verified: z.boolean().default(false)
  })
  .refine(
    (v) => !v.published || v.verified,
    "Verify the quotation and its source before publishing."
  );
export const taxonomySchema = z.object({
  type: z.enum(["category", "tag"]),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).default("")
});
export const siteSettingsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300),
  contactEmail: z.union([z.literal(""), z.email()]),
  footerText: z.string().max(500)
});
export const homepageSettingsSchema = z.object({
  introHeading: z.string().min(2).max(180),
  introText: z.string().max(500),
  newsletterHeading: z.string().max(150),
  newsletterText: z.string().max(300),
  featuredSlug: z.string().max(200).default("")
});

const optionalHttpUrl = z.union([
  z.literal(""),
  z
    .url()
    .refine(
      (value) => /^https?:[/][/]/.test(value),
      "Use an HTTP or HTTPS URL."
    )
]);
export const duaSegmentSchema = z.object({
  arabicPhrase: z.string().trim().min(1).max(500),
  transliteration: z.string().trim().max(500).default(""),
  banglaMeaning: z.string().trim().min(1).max(1000),
  order: z.coerce.number().int().min(1).max(100)
});
export const duaSchema = z
  .object({
    title: z.string().trim().min(3).max(180),
    arabicText: z.string().trim().min(1).max(10000),
    banglaMeaning: z.string().trim().min(1).max(10000),
    transliteration: z.string().trim().max(10000).default(""),
    category: z.string().trim().min(2).max(80),
    source: z.string().trim().min(2).max(500),
    reference: z.string().trim().min(1).max(500),
    sourceUrl: optionalHttpUrl.default(""),
    audioUrl: optionalHttpUrl.default(""),
    segments: z.array(duaSegmentSchema).max(100).default([]),
    featured: z.boolean().default(false),
    verified: z.boolean().default(false),
    status: z.enum(["draft", "published", "archived"]).default("draft")
  })
  .superRefine((value, context) => {
    if (value.status === "published" && !value.verified)
      context.addIssue({
        code: "custom",
        path: ["verified"],
        message: "Verify the dua and its source before publishing."
      });
    if (
      new Set(value.segments.map((segment) => segment.order)).size !==
      value.segments.length
    )
      context.addIssue({
        code: "custom",
        path: ["segments"],
        message: "Each meaning segment needs a unique order."
      });
  });
export const duaProgressSchema = z.object({
  action: z.enum(["start", "progress", "complete", "favorite"]),
  currentStep: z.coerce.number().int().min(0).max(100).optional(),
  favorite: z.boolean().optional()
});
export const learnCategorySchema = z.object({
  module: z.enum([
    "duas",
    "quran",
    "hadith",
    "arabic-stories",
    "vocabulary",
    "practice"
  ]),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(""),
  order: z.coerce.number().int().min(0).max(10000).default(0),
  published: z.boolean().default(true)
});
