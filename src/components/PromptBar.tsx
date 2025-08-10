import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload, Mic, Square, Loader2 } from "lucide-react";

interface PromptBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (payload: { text: string; files: File[] }) => void;
  loading?: boolean;
  listening?: boolean;
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  onQuickAdd?: (text: string) => void;
}

export function PromptBar({ value, onChange, onSubmit, loading, listening, onStartVoice, onStopVoice, onQuickAdd }: PromptBarProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const valid = acceptedFiles.filter((f) => f.size <= 20 * 1024 * 1024);
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    multiple: true,
    maxSize: 20 * 1024 * 1024,
  });

  return (
    <section aria-label="Prompt input" className="rounded-lg border bg-card">
      <div className="p-4 grid gap-3">
        <label htmlFor="ticker-input" className="text-sm font-medium">Tickers and instructions</label>
        <Textarea
          id="ticker-input"
          placeholder="e.g., AAPL, MSFT, GOOGL — include any instructions here"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onQuickAdd?.(value);
              onChange("");
            }
          }}
          className="min-h-28"
        />
        <div className="flex flex-wrap items-center gap-2">
          <div
            {...getRootProps()}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${isDragActive ? "bg-accent" : "bg-background hover:bg-accent"}`}
            aria-label="Upload files"
          >
            <Input {...getInputProps()} />
            <Upload />
            <span className="text-sm">Upload PDF/DOCX (max 20MB each)</span>
          </div>

          <Button
            type="button"
            variant={listening ? "destructive" : "secondary"}
            onClick={listening ? onStopVoice : onStartVoice}
            aria-pressed={!!listening}
          >
            {listening ? <Square /> : <Mic />}
            {listening ? "Stop" : "Voice"}
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              onClick={() => onSubmit({ text: value, files })}
              disabled={loading}
            >
              {loading && <Loader2 className="animate-spin" />}
              Submit
            </Button>
          </div>
        </div>

        {files.length > 0 && (
          <div className="rounded-md border bg-background p-2">
            <div className="text-xs text-muted-foreground mb-1">Attached files</div>
            <ul className="text-sm space-y-1">
              {files.map((f, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span className="truncate mr-2">{f.name}</span>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:underline"
                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                    aria-label={`Remove ${f.name}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
