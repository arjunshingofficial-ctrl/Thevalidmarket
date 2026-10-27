export interface ParsedBlogReview {
  id: string;
  authorName: string;
  authorEmail?: string | null;
  rating: number; // 1 to 5
  title: string;
  content: string;
  cleanText: string;
  isReply: boolean;
  parentId?: string;
  parentAuthor?: string;
  createdAt: string | Date;
  status?: string;
}

export function parseBlogReviewContent(raw: string): {
  rating: number;
  title: string;
  isReply: boolean;
  parentId?: string;
  parentAuthor?: string;
  cleanText: string;
} {
  let content = raw || "";
  let isReply = false;
  let parentId: string | undefined;
  let parentAuthor: string | undefined;
  let rating = 5;
  let title = "";

  // 1. Check for reply prefix: [reply:id:@author]
  const replyMatch = content.match(/^\[reply:([^:]+):@([^\]]+)\]\s*\n*/);
  if (replyMatch) {
    isReply = true;
    parentId = replyMatch[1];
    parentAuthor = replyMatch[2];
    content = content.slice(replyMatch[0].length);
  }

  // 2. Check for rating prefix: [rating:N]
  const ratingMatch = content.match(/\[rating:([1-5])\]/);
  if (ratingMatch) {
    rating = parseInt(ratingMatch[1], 10);
    content = content.replace(/\[rating:[1-5]\]\s*/g, "");
  }

  // 3. Check for title prefix: [title:...]
  const titleMatch = content.match(/\[title:([^\]]*)\]/);
  if (titleMatch) {
    title = titleMatch[1].trim();
    content = content.replace(/\[title:[^\]]*\]\s*/g, "");
  }

  return {
    rating,
    title,
    isReply,
    parentId,
    parentAuthor,
    cleanText: content.trim(),
  };
}
