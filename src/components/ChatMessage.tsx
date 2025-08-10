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
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const inlineCodeRegex = /`([^`]+)`/g;
  
  const parts: Array<{ type: 'text' | 'code' | 'inline-code'; content: string; language?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    parts.push({ 
      type: 'code', 
      content: match[2], 
      language: match[1] || 'text' 
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <div key={index} className="relative">
              <div className="flex items-center justify-between rounded-t-md bg-muted/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">{part.language}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => navigator.clipboard.writeText(part.content)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <pre className="rounded-b-md bg-muted/30 p-3 text-sm overflow-x-auto">
                <code>{part.content}</code>
              </pre>
            </div>
          );
        } else if (part.type === 'inline-code') {
          return (
            <code key={index} className="rounded bg-muted/30 px-1.5 py-0.5 text-sm font-mono">
              {part.content}
            </code>
          );
        } else {
          const textWithInlineCode = part.content.split(inlineCodeRegex).map((segment, segIndex) => {
            if (segIndex % 2 === 1) {
              return (
                <code key={segIndex} className="rounded bg-muted/30 px-1.5 py-0.5 text-sm font-mono">
                  {segment}
                </code>
              );
            }
            return segment;
          });
          
          return (
            <div key={index} className="whitespace-pre-wrap">
              {textWithInlineCode}
            </div>
          );
        }
      })}
    </div>
  );
}

export type { ChatMessage };