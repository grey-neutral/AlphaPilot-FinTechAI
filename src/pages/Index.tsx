import { useEffect, useMemo, useRef, useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar, Project as SidebarProject } from "@/components/AppSidebar";
import { ResultsTable, MetricRow } from "@/components/ResultsTable";
import { ModernChat } from "@/components/ModernChat";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "comps_projects_v1";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  attachments?: { name: string; url: string; type: string }[];
}

interface Project extends SidebarProject {
  lastQuery?: string;
  data: MetricRow[];
  chat: ChatMessage[];
}

const Index = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(projects[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  // Ensure at least one project exists on first load
  useEffect(() => {
    if (projects.length === 0) {
      const id = `${Date.now()}`;
      const newProj: Project = { id, name: "Untitled 1", createdAt: new Date().toISOString(), data: [], lastQuery: "", chat: [] };
      setProjects([newProj]);
      setSelectedId(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // SEO
  useEffect(() => {
    const title = "AI Comps Spreader – Financial Metrics Table";
    const desc = "Analyze tickers and export Excel-like comps with EV/EBITDA, P/E, and more.";
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = window.location.href;
      document.head.appendChild(link);
    }
  }, []);

  const createProject = () => {
    const id = `${Date.now()}`;
    const name = `Untitled ${projects.length + 1}`;
    const newProj: Project = { id, name, createdAt: new Date().toISOString(), data: [], lastQuery: "", chat: [] };
    setProjects([newProj, ...projects]);
    setSelectedId(id);
  };

  const selectProject = (id: string) => {
    setSelectedId(id);
  };

  const updateProjectData = (id: string, update: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...update } : p)));
  };

  const analyzeWithAPI = async (text: string, _files?: File[]): Promise<MetricRow[]> => {
    const API_BASE_URL = "http://localhost:8000";
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          files: [] // File upload to be implemented in Phase 3
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
      
    } catch (error: any) {
      console.error('API call failed:', error);
      throw new Error(error.message || 'Failed to analyze tickers');
    }
  };

  const chatMock = async (text: string, rows: MetricRow[]): Promise<string> => {
    await new Promise((r) => setTimeout(r, 800));
    const tickers = rows.map((r) => r.ticker).join(", ");
    return `Placeholder response: You asked "${text}". Dataset has ${rows.length} tickers: ${tickers}.`;
  };

  const performChat = async (text: string, rows: MetricRow[]): Promise<string> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context: rows }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.reply === "string") return data.reply;
      }
    } catch {}
    return chatMock(text, rows);
  };


  const handleTableChange = (rows: MetricRow[]) => {
    const pid = selectedId || (projects[0]?.id ?? null);
    if (!pid) return;
    updateProjectData(pid, { data: rows });
  };

  const handleMainChatSend = async (text: string, files?: File[]) => {
    const pid = selectedId || (projects[0]?.id ?? null);
    if (!pid) return;
    const proj = projects.find((p) => p.id === pid);
    if (!proj) return;
    
    const userMsg: ChatMessage = { 
      id: `${Date.now()}-u`, 
      role: "user", 
      content: text, 
      createdAt: new Date().toISOString(),
      attachments: files?.map(file => ({ 
        name: file.name, 
        url: URL.createObjectURL(file), 
        type: file.type 
      }))
    };
    const baseChat = [...(proj.chat || []), userMsg];
    updateProjectData(pid, { chat: baseChat });

    // Check if this looks like a ticker analysis request
    const tickerPattern = /\b[A-Z]{1,5}\b/g;
    const tickers = text.match(tickerPattern);
    const hasAnalysisKeywords = /analyze|compare|show|find|data|stock|ticker|financial/i.test(text);
    
    if ((tickers && tickers.length > 0 && hasAnalysisKeywords) || proj.data.length === 0) {
      // This looks like a request for financial data analysis
      setLoading(true);
      try {
        const data = await analyzeWithAPI(text, files);
        updateProjectData(pid, { data, lastQuery: text });
        
        // Add analysis completion message
        const analysisMsg: ChatMessage = { 
          id: `${Date.now()}-analysis`, 
          role: "assistant", 
          content: `I've analyzed ${data.length} companies and generated the financial data table below. You can now ask me follow-up questions about the data, trends, or comparisons.`, 
          createdAt: new Date().toISOString() 
        };
        updateProjectData(pid, { chat: [...baseChat, analysisMsg] });
        
        toast({ 
          title: "Analysis complete", 
          description: `${data.length} tickers processed with real financial data.` 
        });
      } catch (e: any) {
        const errorMsg: ChatMessage = { 
          id: `${Date.now()}-error`, 
          role: "assistant", 
          content: `I encountered an error while fetching financial data: ${e?.message || "Unknown error"}. Please try again or rephrase your request.`, 
          createdAt: new Date().toISOString() 
        };
        updateProjectData(pid, { chat: [...baseChat, errorMsg] });
        
        toast({ 
          title: "Analysis failed", 
          description: e?.message || "Unknown error", 
          variant: "destructive" as any 
        });
      } finally {
        setLoading(false);
      }
    } else {
      // This is a regular chat question about existing data
      setChatLoading(true);
      try {
        const reply = await performChat(text, proj.data);
        const aiMsg: ChatMessage = { 
          id: `${Date.now()}-a`, 
          role: "assistant", 
          content: reply, 
          createdAt: new Date().toISOString() 
        };
        updateProjectData(pid, { chat: [...baseChat, aiMsg] });
      } catch (e: any) {
        const errorMsg: ChatMessage = { 
          id: `${Date.now()}-chat-error`, 
          role: "assistant", 
          content: `I encountered an error while processing your question: ${e?.message || "Unknown error"}. Please try again.`, 
          createdAt: new Date().toISOString() 
        };
        updateProjectData(pid, { chat: [...baseChat, errorMsg] });
        
        toast({ title: "Chat failed", description: e?.message || "Unknown error", variant: "destructive" as any });
      } finally {
        setChatLoading(false);
      }
    }
  };

  const handleChatClear = () => {
    const pid = selectedId || (projects[0]?.id ?? null);
    if (!pid) return;
    updateProjectData(pid, { chat: [] });
  };

  const handleChatFeedback = (messageId: string, type: "like" | "dislike") => {
    console.log(`Message ${messageId} received ${type} feedback`);
    // Implement feedback storage/API call here
  };

  const startVoice = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Voice not supported", description: "Your browser doesn't support Speech Recognition." });
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.lang = "en-US";
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((r: any) => r[0].transcript)
          .join(" ");
        setVoiceTranscript(transcript);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      toast({ title: "Voice error", description: "Failed to start recognition.", variant: "destructive" as any });
    }
  };

  const stopVoice = () => {
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.stop(); } catch {}
    }
    setListening(false);
  };

  const handleVoiceTranscriptUpdate = (transcript: string) => {
    setVoiceTranscript(transcript);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          projects={projects}
          selectedId={selectedId}
          onSelect={selectProject}
          onNew={createProject}
          onRename={(id, name) => setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))}
        />
        <SidebarInset className="overflow-hidden">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 backdrop-blur px-4">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">AI-Powered</div>
            <div className="font-semibold">Comps Spreader</div>
          </header>
          <main className="py-6 px-4 min-w-0 overflow-hidden">
            
            {selectedProject && (
              <div className="mb-6">
                <ModernChat 
                  messages={selectedProject.chat || []} 
                  onSend={handleMainChatSend} 
                  loading={loading || chatLoading}
                  onClear={handleChatClear}
                  onFeedback={handleChatFeedback}
                  onVoiceStart={startVoice}
                  onVoiceStop={stopVoice}
                  isListening={listening}
                  voiceTranscript={voiceTranscript}
                  onVoiceTranscriptClear={() => setVoiceTranscript("")}
                  welcomeMessage="Enter tickers (e.g., AAPL, MSFT, GOOGL) or ask me to analyze financial data. I can fetch real-time data and provide insights."
                  suggestedQuestions={[
                    "Analyze NVDA and AMD",
                    "Compare AAPL, MSFT, GOOGL", 
                    "Show me top tech stocks performance",
                    "Find undervalued companies"
                  ]}
                  maxHeight="400px"
                />
              </div>
            )}

            {loading && (
              <div className="mb-6 text-sm text-muted-foreground">Fetching real financial data from Yahoo Finance…</div>
            )}

            {selectedProject && selectedProject.data.length > 0 && (
              <ResultsTable data={selectedProject.data} onChange={handleTableChange} />
            )}

            <section className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Document-derived metrics (coming soon)</h2>
              <p className="text-sm text-muted-foreground">This section will surface metrics extracted from uploaded PDF/DOCX files.</p>
            </section>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};


export default Index;
