export type UserRole = "super-admin" | "admin" | "editor" | "author" | "user";
export type ContentStatus =
  | "draft"
  | "pending-verification"
  | "verified"
  | "published"
  | "archived"
  | "rejected";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface ArticleCardData {
  id?: string;
  language?: "en" | "bn";
  tags?: string[];
  content?: string;
  contentFormat?: "plain" | "rich-html";
  viewCount?: number;
  likeCount?: number;
  authorName?: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readingTime: number;
  featuredImage: string;
  featured?: boolean;
}
