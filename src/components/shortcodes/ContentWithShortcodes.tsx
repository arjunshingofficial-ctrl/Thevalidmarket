"use client";

import React, { useMemo } from "react";
import CCProductsShortcode from "./CCProductsShortcode";

interface ContentWithShortcodesProps {
  content: string;
  className?: string;
}

interface ParsedChunk {
  type: "html" | "cc_shortcode";
  content?: string;
  props?: {
    limit?: number;
    title?: string;
    showSearch?: boolean;
    showFilters?: boolean;
    initialCountry?: string;
  };
}

// Helper to parse key="value" or key='value' attributes from a shortcode string
function parseShortcodeAttributes(rawAttrs: string = ""): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!rawAttrs) return attrs;

  // Regex matches: key="value" | key='value' | key=value
  const attrRegex = /([a-zA-Z0-9_-]+)=(?:["']([^"']*)["']|(\S+))/g;
  let match;
  while ((match = attrRegex.exec(rawAttrs)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2] !== undefined ? match[2] : match[3];
    attrs[key] = value;
  }
  return attrs;
}

export default function ContentWithShortcodes({
  content,
  className = "",
}: ContentWithShortcodesProps) {
  const chunks = useMemo<ParsedChunk[]>(() => {
    if (!content) return [];

    // Regex that catches:
    // [cc_products ...]
    // [cc_page ...]
    // [cc_table ...]
    // [cc ...]
    // [products category="cc" ...]
    // Also gracefully consumes wrapping <p>...</p> tags injected by WYSIWYG editors
    const shortcodeRegex =
      /(?:<p\b[^>]*>\s*)?\[(cc_products|cc_page|cc_table|cc|products)(?:\s+([^\]]+))?\](?:\s*<\/p>)?/gi;

    const result: ParsedChunk[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = shortcodeRegex.exec(content)) !== null) {
      const matchStart = match.index;
      const matchEnd = shortcodeRegex.lastIndex;
      const tag = match[1].toLowerCase();
      const rawAttrs = match[2] || "";

      const attrs = parseShortcodeAttributes(rawAttrs);

      // If the shortcode was [products ...], ensure category="cc" is specified or implied
      if (tag === "products" && attrs.category && attrs.category.toLowerCase() !== "cc") {
        // Not a CC products shortcode, skip replacing
        continue;
      }

      // Add preceding HTML if any
      if (matchStart > lastIndex) {
        const htmlPart = content.slice(lastIndex, matchStart);
        if (htmlPart.trim()) {
          result.push({ type: "html", content: htmlPart });
        }
      }

      // Construct shortcode props
      const limit = attrs.limit ? parseInt(attrs.limit, 10) : undefined;
      const title = attrs.title || undefined;
      const showSearch = attrs.search !== undefined ? attrs.search === "true" || attrs.search === "1" : undefined;
      const showFilters = attrs.filters !== undefined ? attrs.filters === "true" || attrs.filters === "1" : undefined;
      const initialCountry = attrs.country || attrs.initialcountry || undefined;

      result.push({
        type: "cc_shortcode",
        props: {
          limit,
          title,
          showSearch,
          showFilters,
          initialCountry,
        },
      });

      lastIndex = matchEnd;
    }

    // Add trailing HTML if any
    if (lastIndex < content.length) {
      const htmlPart = content.slice(lastIndex);
      if (htmlPart.trim()) {
        result.push({ type: "html", content: htmlPart });
      }
    }

    // If no shortcode matched at all, return full content as single html chunk
    if (result.length === 0 && content) {
      result.push({ type: "html", content });
    }

    return result;
  }, [content]);

  // Fast path: if no shortcodes were present, render directly
  if (chunks.length === 1 && chunks[0].type === "html") {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: chunks[0].content || "" }}
      />
    );
  }

  return (
    <div className={className}>
      {chunks.map((chunk, index) => {
        if (chunk.type === "html") {
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{ __html: chunk.content || "" }}
            />
          );
        }

        if (chunk.type === "cc_shortcode") {
          return (
            <div key={index} className="my-8 not-prose">
              <CCProductsShortcode {...chunk.props} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
