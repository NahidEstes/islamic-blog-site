import { parseArticleContent } from "@/lib/article-content";

export function ArticleBody({ content }: { content: string }) {
  return (
    <div className="article-prose">
      {parseArticleContent(content).map((block, index) => {
        if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
        if (block.type === "quote")
          return (
            <blockquote className="article-reference" key={index}>
              <span className="reference-mark" aria-hidden="true">
                “
              </span>
              <div>
                <p>{block.text}</p>
                {block.source && <cite>— {block.source}</cite>}
              </div>
            </blockquote>
          );
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}
