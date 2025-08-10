import React from "react";
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  attachments?: { name: string; url: string; type: string }[];
}

interface ChatMessageProps {
  message: ChatMessage;
  onCopy?: (content: string) => void;
  onFeedback?: (messageId: string, type: "like" | "dislike") => void;
  showActions?: boolean;
}

export function ChatMessage({ message, onCopy, onFeedback, showActions = true }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<"like" | "dislike" | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      onCopy?.(message.content);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleFeedback = (type: "like" | "dislike") => {
    setFeedback(type);
    onFeedback?.(message.id, type);
  };

  const isUser = message.role === "user";

  return (
    <div className={cn("group flex gap-3 px-4 py-6", isUser ? "flex-row-reverse" : "")}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      
      <div className={cn("flex flex-col space-y-2 min-w-0 max-w-[85%]", isUser ? "items-end" : "items-start")}>
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm shadow-sm break-words",
          isUser 
            ? "bg-primary text-primary-foreground max-w-[280px] sm:max-w-[400px]" 
            : "bg-muted text-muted-foreground max-w-full"
        )}>
          <MessageContent content={message.content} />
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs">
                <span className="truncate max-w-32">{attachment.name}</span>
              </div>
            ))}
          </div>
        )}

        {!isUser && showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2", feedback === "like" && "text-green-600")}
              onClick={() => handleFeedback("like")}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2", feedback === "dislike" && "text-red-600")}
              onClick={() => handleFeedback("dislike")}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </div>
        )}

        {message.createdAt && (
          <span className="text-xs text-muted-foreground opacity-70">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground">
      <MarkdownRenderer content={content} />
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  // First handle code blocks to avoid them being processed by other rules
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let processedContent = content;
  const codeBlocks: { placeholder: string; content: string; language: string }[] = [];
  
  // Extract code blocks
  let match: RegExpExecArray | null;
  let codeIndex = 0;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const placeholder = `__CODEBLOCK_${codeIndex}__`;
    const language = match[1] || 'text';
    const code = match[2];
    codeBlocks.push({ placeholder, content: code, language });
    processedContent = processedContent.replace(match[0], placeholder);
    codeIndex++;
  }
  
  // Split content into lines for processing
  const lines = processedContent.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let currentListType: 'ul' | 'ol' | null = null;
  
  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        currentListType === 'ul' ? (
          <ul key={elements.length} className="list-disc list-inside space-y-1 mb-4">
            {currentList.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(item) }} />
            ))}
          </ul>
        ) : (
          <ol key={elements.length} className="list-decimal list-inside space-y-1 mb-4">
            {currentList.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(item) }} />
            ))}
          </ol>
        )
      );
      currentList = [];
      currentListType = null;
    }
  };
  
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    // Handle code block placeholders
    const codeBlock = codeBlocks.find(cb => trimmedLine === cb.placeholder);
    if (codeBlock) {
      flushList();
      elements.push(
        <div key={elements.length} className="relative mb-4">
          <div className="flex items-center justify-between rounded-t-md bg-muted/50 px-3 py-2 text-xs">
            <span className="text-muted-foreground">{codeBlock.language}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => navigator.clipboard.writeText(codeBlock.content)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <pre className="rounded-b-md bg-muted/30 p-3 text-sm overflow-x-auto">
            <code>{codeBlock.content}</code>
          </pre>
        </div>
      );
      return;
    }
    
    // Headers
    if (trimmedLine.match(/^#{1,6}\s/)) {
      flushList();
      const level = trimmedLine.match(/^#+/)?.[0].length || 1;
      const text = trimmedLine.replace(/^#+\s/, '');
      const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
      
      elements.push(
        <HeaderTag key={elements.length} className={`font-semibold mb-3 mt-4 ${
          level === 1 ? 'text-xl' : 
          level === 2 ? 'text-lg' : 
          level === 3 ? 'text-base' : 'text-sm'
        }`}>
          {text}
        </HeaderTag>
      );
      return;
    }
    
    // Bullet lists
    if (trimmedLine.match(/^[-*+]\s/)) {
      if (currentListType !== 'ul') {
        flushList();
        currentListType = 'ul';
      }
      currentList.push(trimmedLine.replace(/^[-*+]\s/, ''));
      return;
    }
    
    // Numbered lists
    if (trimmedLine.match(/^\d+\.\s/)) {
      if (currentListType !== 'ol') {
        flushList();
        currentListType = 'ol';
      }
      currentList.push(trimmedLine.replace(/^\d+\.\s/, ''));
      return;
    }
    
    // Regular paragraphs
    if (trimmedLine) {
      flushList();
      elements.push(
        <p key={elements.length} className="mb-3" dangerouslySetInnerHTML={{ 
          __html: processInlineMarkdown(trimmedLine) 
        }} />
      );
    } else if (elements.length > 0 && !trimmedLine) {
      // Empty line - add spacing
      flushList();
    }
  });
  
  // Flush any remaining list
  flushList();
  
  return <>{elements}</>;
}

function processInlineMarkdown(text: string): string {
  return text
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text  
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted/30 px-1.5 py-0.5 text-sm font-mono">$1</code>');
}

export type { ChatMessage as ChatMessageType };