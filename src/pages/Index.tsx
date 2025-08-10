import { useEffect, useMemo, useRef, useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar, Project as SidebarProject } from "@/components/AppSidebar";
import { PromptBar } from "@/components/PromptBar";
import { ResultsTable, MetricRow } from "@/components/ResultsTable";
import { ChatPanel } from "@/components/ChatPanel";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "comps_projects_v1";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
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
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [chatLoading, setChatLoading] = useState(false);

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
    setQuery("");
  };

  const selectProject = (id: string) => {
    setSelectedId(id);
    const p = projects.find((x) => x.id === id);
    setQuery(p?.lastQuery || "");
  };

  const updateProjectData = (id: string, update: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...update } : p)));
  };

  const analyzeMock = async (text: string, files: File[]): Promise<MetricRow[]> => {
    // Simulate backend latency and build deterministic numbers from ticker
    const tickers = (text || "")
      .split(/[^A-Za-z0-9]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 10);
    await new Promise((r) => setTimeout(r, 1500));
    const rows: MetricRow[] = tickers.map((t) => mockRow(t));
    return rows;
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

  const onSubmit = async ({ text, files }: { text: string; files: File[] }) => {
    if (!selectedId) {
      createProject();
    }
    const pid = selectedId || (projects[0]?.id ?? null);
    if (!pid) return;

    setLoading(true);
    try {
      // Replace with real API POST /api/analyze
      const data = await analyzeMock(text, files);
      updateProjectData(pid, { data, lastQuery: text });
      toast({ title: "Analysis complete", description: `${data.length} tickers processed.` });
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e?.message || "Unknown error", variant: "destructive" as any });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (text: string) => {
    const pid = selectedId || (projects[0]?.id ?? null);
    if (!pid) return;
    const tickers = (text || "")
      .split(/[^A-Za-z0-9]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (tickers.length === 0) return;
    const current = projects.find((p) => p.id === pid)?.data ?? [];
    const existing = new Set(current.map((r) => r.ticker));
    const added = tickers.filter((t) => !existing.has(t)).map((t) => mockRow(t));
    if (added.length === 0) return;
    updateProjectData(pid, { data: [...current, ...added] });
    toast({ title: "Ticker(s) added", description: `${added.length} added.` });
  };

  const handleTableChange = (rows: MetricRow[]) => {
    const pid = selectedId || (projects[0]?.id ?? null);
    if (!pid) return;
    updateProjectData(pid, { data: rows });
  };

  const handleChatSend = async (text: string) => {
    const pid = selectedId || (projects[0]?.id ?? null);
    if (!pid) return;
    const proj = projects.find((p) => p.id === pid);
    if (!proj) return;
    const userMsg: ChatMessage = { id: `${Date.now()}-u`, role: "user", content: text, createdAt: new Date().toISOString() };
    const baseChat = [...(proj.chat || []), userMsg];
    updateProjectData(pid, { chat: baseChat });
    setChatLoading(true);
    try {
      const reply = await performChat(text, proj.data);
      const aiMsg: ChatMessage = { id: `${Date.now()}-a`, role: "assistant", content: reply, createdAt: new Date().toISOString() };
      updateProjectData(pid, { chat: [...baseChat, aiMsg] });
    } catch (e: any) {
      toast({ title: "Chat failed", description: e?.message || "Unknown error", variant: "destructive" as any });
    } finally {
      setChatLoading(false);
    }
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
        setQuery((q) => (q ? `${q} ${transcript}` : transcript));
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
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 backdrop-blur px-4">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">AI-Powered</div>
            <div className="font-semibold">Comps Spreader</div>
          </header>
          <main className="container mx-auto py-6 px-4">
            <h1 className="text-2xl font-bold mb-4">AI-Powered Comps Spreader</h1>
            <PromptBar
              value={query}
              onChange={setQuery}
              onSubmit={onSubmit}
              loading={loading}
              listening={listening}
              onStartVoice={startVoice}
              onStopVoice={stopVoice}
              onQuickAdd={handleQuickAdd}
            />

            {loading && (
              <div className="mt-6 text-sm text-muted-foreground">Fetching results…</div>
            )}

            {selectedProject && selectedProject.data.length > 0 && (
              <ResultsTable data={selectedProject.data} onChange={handleTableChange} />
            )}

            <section className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Document-derived metrics (coming soon)</h2>
              <p className="text-sm text-muted-foreground">This section will surface metrics extracted from uploaded PDF/DOCX files.</p>
            </section>

            {selectedProject && (
              <ChatPanel messages={selectedProject.chat || []} onSend={handleChatSend} loading={chatLoading} />
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

function mockRow(ticker: string): MetricRow {
  // Simple deterministic generator based on ticker string
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) seed += ticker.charCodeAt(i);
  const rand = (min: number, max: number) => {
    const x = Math.abs(Math.sin(seed++)) % 1;
    return min + x * (max - min);
  };

  const revenue = rand(1000, 300000); // $m
  const ebitda = revenue * rand(0.1, 0.35);
  const eps = rand(0.5, 12);
  const marketCap = rand(1000, 2500000);
  const debt = rand(0, 500000);
  const cash = rand(0, 300000);
  const ev = marketCap + debt - cash;
  const evRevenueLTM = ev / revenue;
  const evEbitdaLTM = ev / Math.max(ebitda, 1);
  const evEbitdaNTM = evEbitdaLTM * rand(0.8, 1.2);
  const peLTM = rand(5, 40);
  const peNTM = peLTM * rand(0.8, 1.2);
  const sharesOutstanding = marketCap / (eps * 100); // rough

  return {
    ticker,
    marketCap,
    sharesOutstanding,
    debt,
    cash,
    revenue,
    ebitda,
    eps,
    ev,
    evRevenueLTM,
    evEbitdaLTM,
    evEbitdaNTM,
    peLTM,
    peNTM,
  };
}

export default Index;
