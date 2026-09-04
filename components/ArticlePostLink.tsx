import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { ArticleCardData } from "@/types";

export function ArticlePostLink({ article }: { article: ArticleCardData }) {
  return (
    <Link
      className="article-post-link"
      href={"/articles/" + encodeURIComponent(article.slug)}
    >
      <span className="post-thumbnail">
        <Image src={article.featuredImage} alt="" fill sizes="90px" />
      </span>
      <span>
        <h3 lang={article.language}>{article.title}</h3>
        <span className="post-meta">
          {formatDate(article.publishedAt)} · {article.readingTime} min read
        </span>
      </span>
    </Link>
  );
}
