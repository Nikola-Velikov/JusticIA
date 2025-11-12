import { FileText, ChevronRight, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  metadata?: {
    term?: string;
    indices?: string[];
    sources?: Array<{ index: string; title: string }>;
    matches?: string[];
    results_count?: number;
  };
}

interface SourcesPanelProps {
  onClose: () => void;
  messages: Message[];
}

export function SourcesPanel({ onClose, messages }: SourcesPanelProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{
    title: string;
    index: string;
    matches: string[];
    timestamp: Date;
  } | null>(null);
  const { toast } = useToast();

  const sourcesData = messages
    .filter((msg) => msg.role === "assistant" && msg.metadata?.sources)
    .map((msg) => {
      const sources = msg.metadata!.sources || [];
      const matches = msg.metadata!.matches || [];
      const count = Math.max(1, sources.length);
      const base = Math.floor(matches.length / count);
      const extra = matches.length % count;
      let idx = 0;
      const chunks = new Array(count).fill(0).map((_, i) => {
        const size = base + (i < extra ? 1 : 0);
        const arr = matches.slice(idx, idx + size);
        idx += size;
        return arr;
      });
      const withMatches = sources.map((s, i) => ({ ...s, matches: chunks[i] || [] }));
      return { id: msg.id, sources: withMatches, timestamp: msg.timestamp };
    });

  const hasAssistant = messages.some((m) => m.role === "assistant");

  const isUrl = (value: string) => {
    try {
      const u = new URL(value);
      return !!u.protocol && !!u.host;
    } catch {
      return /^https?:\/\//i.test(value);
    }
  };

  const openDetails = (
    source: { title: string; index: string; matches?: string[] },
    context: { timestamp: Date }
  ) => {
    setSelected({
      title: source.title,
      index: source.index,
      matches: source.matches || [],
      timestamp: context.timestamp,
    });
    setOpen(true);
  };

  const copyToClipboard = async (text?: string) => {
    if (!text) {
      toast({ title: "Нищо за копиране", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Копирано", description: "Съдържанието е копирано." });
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast({ title: "Копирано", description: "rules е копирано." });
      } catch (e) {
        toast({ title: "Грешка при копиране", variant: "destructive" });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border w-full min-w-0">
      <div className="border-b border-border bg-white p-6 flex items-center justify-start w-full shadow-sm min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">Източници</h3>
        </div>
      </div>

      <ScrollArea className="flex-1 p-0 w-full min-w-0">
        <div className="space-y-4 p-4 w-full min-w-0">
          {sourcesData.map((data) => (
            <Card key={data.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Свързани източници</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {data.sources.map((source, idx) => (
                  <button
                    key={idx}
                    onClick={() => openDetails(source as any, { timestamp: data.timestamp })}
                    className="w-full text-left flex items-center gap-2 p-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{source.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{source.index}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100" />
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {sourcesData.length === 0 && (
          hasAssistant ? (
            <div className="p-4">
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Свързани източници</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Няма намерени източници за този отговор.
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-sm font-medium text-foreground mb-2">Все още няма източници</h4>
              <p className="text-sm text-muted-foreground">Задайте въпрос, за да видите източници.</p>
            </div>
          )
        )}
      </ScrollArea>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(92vw,48rem)] max-w-3xl max-h-[80vh] bg-card border border-border shadow-2xl sm:rounded-xl grid-rows-[auto,1fr,auto]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              {selected?.title || "Детайли за източника"}
            </DialogTitle>
            <DialogDescription>
              {selected?.timestamp ? new Date(selected.timestamp).toLocaleString("bg-BG") : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-auto max-h-[60vh] pr-1">
            <div className="flex items-start justify-start gap-3">
              
              <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                {selected?.index && isUrl(selected.index) && (
                  <a
                    href={selected.index}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Отвори <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {selected?.index && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selected?.matches.join(" "))}
                  >
                    <Copy className="h-4 w-4 mr-1" /> Копирай
                  </Button>
                )}
              </div>
            </div>

            {selected && selected.matches && selected.matches.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Свързани откъси</p>
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {selected.matches.map((m, i) => (
                    <div key={i} className="p-3 bg-muted/40 rounded-lg border border-border">
                      <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="secondary">Затвори</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

