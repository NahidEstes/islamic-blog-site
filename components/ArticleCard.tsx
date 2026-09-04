import Image from "next/image";
import Link from "next/link";
import type { ArticleCardData } from "@/types";
import { formatDate } from "@/lib/utils";

export function ArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <article className="article-card" lang={article.language ?? "en"}>
      <Link href={`/articles/${article.slug}`}>
        <div className="article-image">
          <Image
            src={article.featuredImage}
            alt=""
            fill
            sizes="(max-width: 560px) 100vw, (max-width: 1000px) 50vw, 25vw"
          />
          <span className="article-category">{article.category}</span>
        </div>
        <div className="article-body">
          <h3>{article.title}</h3>
          <p>{article.excerpt}</p>
          <div className="article-meta">
            {formatDate(article.publishedAt)} · {article.readingTime} min read
          </div>
        </div>
      </Link>
    </article>
  );
}
