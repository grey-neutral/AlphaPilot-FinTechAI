import React, { useEffect, useRef, useState } from "react";
import { ChatMessage, ChatMessage as ChatMessageComponent } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { MessageSquare, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernChatProps {
  messages: ChatMessage[];
  onSend: (message: string, files?: File[]) => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  welcomeMessage?: string;
  suggestedQuestions?: string[];
  onClear?: () => void;
  onRetry?: (messageId: string) => void;
  onFeedback?: (messageId: string, type: "like" | "dislike") => void;
  showSuggestedActions?: boolean;
  maxHeight?: string;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isListening?: boolean;
  voiceTranscript?: string;
  onVoiceTranscriptClear?: () => void;
}

export function ModernChat({
  messages,
  onSend,
  loading = false,
  disabled = false,
  className,
  welcomeMessage = "Ask me anything about the data above.",
  suggestedQuestions = [
    "What are the key insights from this data?",
    "Which companies are performing best?",
    "Show me trends and patterns",
    "Compare the top performers"
  ],
  onClear,
  onRetry,
  onFeedback,
  showSuggestedActions = true,
  maxHeight = "600px",
  onVoiceStart,
  onVoiceStop,
  isListening = false,
  voiceTranscript = "",
  onVoiceTranscriptClear
}: ModernChatProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Update input value when voice transcript changes
  useEffect(() => {
    if (voiceTranscript && voiceTranscript.trim()) {
      setInputValue(voiceTranscript);
      onVoiceTranscriptClear?.();
    }
  }, [voiceTranscript, onVoiceTranscriptClear]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (message: string, files?: File[]) => {
    if (!message.trim() && (!files || files.length === 0)) return;
    
    try {
      await onSend(message, files);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    handleSend(question);
  };

  const handleCopy = (content: string) => {
    // Optional: Show toast notification
    console.log("Copied to clipboard:", content);
  };

  const isEmpty = messages.length === 0;
  const lastMessage = messages[messages.length - 1];
  const isLastMessageFromAssistant = lastMessage?.role === "assistant";

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Chat</h3>
        </div>
        {messages.length > 0 && onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 px-2"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight }}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">            
            {showSuggestedActions && suggestedQuestions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full max-w-4xl">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2 px-3 whitespace-normal text-xs"
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={loading || disabled}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message, index) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
                onCopy={handleCopy}
                onFeedback={onFeedback}
                showActions={!loading || index !== messages.length - 1}
              />
            ))}
            
            {loading && (
              <div className="flex gap-3 px-4 py-6">
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm bg-muted">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="bg-muted rounded-2xl px-4 py-3 max-w-full">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggested Actions */}
      {showSuggestedActions && !isEmpty && !loading && isLastMessageFromAssistant && suggestedQuestions.length > 0 && (
        <div className="border-t px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.slice(0, 3).map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuestion(question)}
                disabled={disabled}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        loading={loading}
        disabled={disabled}
        placeholder="Ask a follow-up question..."
        onVoiceStart={onVoiceStart}
        onVoiceStop={onVoiceStop}
        isListening={isListening}
      />
    </div>
  );
}

export type { ChatMessage };