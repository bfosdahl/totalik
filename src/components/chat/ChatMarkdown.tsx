import ReactMarkdown, { type Components } from "react-markdown";
import { cn } from "@/lib/utils";

/**
 * Renders assistant chat text as markdown.
 *
 * Uses react-markdown with no rehype-raw / no raw HTML, so AI replies can never
 * inject HTML or scripts. Links always open in a new tab.
 */
const markdownComponents: Components = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" />
  ),
};

/**
 * A single "\n" is not a line break in markdown, so plain "\n" replies from the AI
 * would be glued together. Turn them into markdown hard breaks (two trailing spaces).
 */
function withHardBreaks(content: string): string {
  return content.replace(/([^\n])\n(?!\n)/g, "$1  \n");
}

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  if (!content || !content.trim()) return null;

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none break-words text-inherit [&_*]:text-inherit",
        "[&>p]:mb-2 [&>p:last-child]:mb-0 [&_p:first-child]:mt-0",
        "[&>ul]:my-1 [&>ol]:my-1 [&_li]:my-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4",
        "[&_h1]:my-1 [&_h1]:text-base [&_h2]:my-1 [&_h2]:text-base [&_h3]:my-1 [&_h3]:text-sm [&_h4]:my-1 [&_h4]:text-sm [&_h5]:my-1 [&_h5]:text-sm [&_h6]:my-1 [&_h6]:text-sm",
        className,
      )}
    >
      <ReactMarkdown components={markdownComponents}>{withHardBreaks(content)}</ReactMarkdown>
    </div>
  );
}

export default ChatMarkdown;
