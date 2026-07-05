import {
  containsHtmlTags,
  plainTextToParagraphHtml,
  sanitizeRichTextHtml,
} from "@/lib/richtext/sanitize";

function TextParagraphs({ text = "", className = "" }) {
  const paragraphs = String(text)
    .trim()
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (!paragraphs.length) return null;

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => {
        const lines = paragraph.split("\n");

        return (
          <p key={index}>
            {lines.map((line, lineIndex) => (
              <span key={`${index}-${lineIndex}`}>
                {line}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default function RichTextContent({
  content,
  className = "text-base leading-8 text-white/80 md:text-lg md:leading-9",
  richTextClassName = "space-y-4 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-white [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_p]:text-base [&_p]:leading-8 md:[&_p]:text-lg md:[&_p]:leading-9 [&_strong]:font-bold [&_a]:underline [&_a]:decoration-red-400 [&_a]:underline-offset-4 hover:[&_a]:text-red-300",
}) {
  const source = typeof content === "string" ? content : "";

  if (!source.trim()) {
    return null;
  }

  if (!containsHtmlTags(source)) {
    return <TextParagraphs text={source} className={className} />;
  }

  const sanitizedHtml = sanitizeRichTextHtml(source);

  if (!sanitizedHtml.trim()) {
    return <TextParagraphs text={source} className={className} />;
  }

  if (!containsHtmlTags(sanitizedHtml)) {
    const fallbackHtml = plainTextToParagraphHtml(sanitizedHtml);
    return (
      <div
        className={`${className} ${richTextClassName}`.trim()}
        dangerouslySetInnerHTML={{ __html: fallbackHtml }}
      />
    );
  }

  return (
    <div
      className={`${className} ${richTextClassName}`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
