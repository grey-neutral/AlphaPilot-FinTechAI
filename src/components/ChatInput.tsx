import React, { useCallback, useRef } from "react";
import { Send, Paperclip, X, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, files?: File[]) => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  allowFiles?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: Record<string, string[]>;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isListening?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  loading = false,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 4000,
  allowFiles = true,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "text/plain": [".txt"],
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"]
  },
  onVoiceStart,
  onVoiceStop,
  isListening = false
}: ChatInputProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles
      .filter(file => file.size <= maxFileSize)
      .slice(0, maxFiles - files.length);
    
    setFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
  }, [files.length, maxFiles, maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: true,
    maxSize: maxFileSize,
    disabled: disabled || loading,
    noClick: true,
    noKeyboard: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const trimmedValue = value.trim();
    if (!trimmedValue && files.length === 0) return;
    
    onSend(trimmedValue, files.length > 0 ? files : undefined);
    onChange("");
    setFiles([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && !disabled) {
        handleSubmit();
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
      
      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const canSend = (value.trim() || files.length > 0) && !loading && !disabled;

  return (
    <div className="border-t bg-background p-4">
      {/* File Attachments */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm"
            >
              <span className="truncate max-w-32">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeFile(index)}
                disabled={loading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-xl border bg-background transition-colors",
          isDragActive && "border-primary bg-primary/5",
          disabled && "opacity-50"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex items-end gap-2 p-3">
          {/* File Upload Button */}
          {allowFiles && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              disabled={disabled || loading || files.length >= maxFiles}
              onClick={(e) => {
                e.stopPropagation();
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = Object.values(acceptedFileTypes).flat().join(',');
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) {
                    onDrop(Array.from(target.files));
                  }
                };
                input.click();
              }}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          )}

          {/* Text Input */}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm"
            style={{ height: "40px" }}
          />

          {/* Voice Button */}
          {(onVoiceStart || onVoiceStop) && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 shrink-0",
                isListening && "text-red-500 hover:text-red-600"
              )}
              disabled={disabled || loading}
              onClick={isListening ? onVoiceStop : onVoiceStart}
            >
              {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          {/* Send Button */}
          <Button
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            disabled={!canSend}
            onClick={handleSubmit}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Drag & Drop Overlay */}
        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-primary/10 border-2 border-dashed border-primary">
            <div className="text-center">
              <Paperclip className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="text-sm text-primary font-medium">Drop files here</p>
            </div>
          </div>
        )}
      </div>

      {/* Character Count */}
      {maxLength && (
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span></span>
          <span className={cn(value.length > maxLength * 0.9 && "text-yellow-600")}>
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
}