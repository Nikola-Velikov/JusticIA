import { useState } from "react";
import { ChevronRight, Copy, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  groupCitationSources,
  type ChatMatchInput,
  type ChatSourceRef,
  type GroupedCitationSource,
  type NormalizedChatMatch,
} from "@/lib/chat-citations";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  metadata?: {
    term?: string;
    indices?: string[];
    sources?: ChatSourceRef[];
    matches?: ChatMatchInput[];
    results_count?: number;
  };
}

interface SourcesPanelProps {
  onClose: () => void;
  messages: Message[];
}

interface SelectedSource {
  title: string;
  index: string;
  matches: NormalizedChatMatch[];
  timestamp: Date;
}

export function SourcesPanel({ onClose: _onClose, messages }: SourcesPanelProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedSource | null>(null);
  const { toast } = useToast();

  const sourcesData = messages
    .filter(
      (message) =>
        message.role === "assistant" &&
        ((message.metadata?.matches?.length ?? 0) > 0 || (message.metadata?.sources?.length ?? 0) > 0),
    )
    .map((message) => ({
      id: message.id,
      timestamp: message.timestamp,
      sources: groupCitationSources(message.metadata),
    }))
    .filter((message) => message.sources.length > 0);

  const hasAssistant = messages.some((message) => message.role === "assistant");

  const isUrl = (value: string) => {
    try {
      const url = new URL(value);
      return Boolean(url.protocol && url.host);
    } catch {
      return /^https?:\/\//i.test(value);
    }
  };

  const openDetails = (source: GroupedCitationSource, timestamp: Date) => {
    setSelected({
      title: source.title,
      index: source.index,
      matches: source.matches,
      timestamp,
    });
    setOpen(true);
  };

  const copyToClipboard = async (text?: string) => {
    if (!text) {
      toast({ title: "Няма съдържание за копиране", variant: "destructive" });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Копирано", description: "Текстът е копиран." });
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast({ title: "Копирано", description: "Текстът е копиран." });
      } catch {
        toast({ title: "Грешка при копиране", variant: "destructive" });
      }
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-col border-l border-border bg-background">
      <div className="flex items-center justify-start border-b border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Източници</h3>
        </div>
      </div>

      <ScrollArea className="flex-1 p-0">
        <div className="space-y-4 p-4">
          {sourcesData.map((message) => (
            <Card key={message.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Свързани източници</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {message.sources.map((source) => (
                  <button
                    key={source.key}
                    type="button"
                    onClick={() => openDetails(source, message.timestamp)}
                    className="group flex w-full items-center gap-3 rounded-lg bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{source.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {source.index ? (
                          <p className="truncate text-xs text-muted-foreground">{source.index}</p>
                        ) : null}
                        <Badge variant="secondary" className="text-[10px]">
                          {source.matches.length} {source.matches.length === 1 ? "откъс" : "откъса"}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}

          {sourcesData.length === 0 &&
            (hasAssistant ? (
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Свързани източници</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Няма налични източници за този отговор.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h4 className="mb-2 text-sm font-medium text-foreground">Все още няма източници</h4>
                <p className="text-sm text-muted-foreground">
                  Задайте въпрос, за да видите използваните правни откъси.
                </p>
              </div>
            ))}
        </div>
      </ScrollArea>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSelected(null);
          }
        }}
      >
        <DialogContent className="grid max-h-[80vh] w-[min(92vw,48rem)] max-w-3xl grid-rows-[auto,1fr,auto] border border-border bg-card shadow-2xl sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              {selected?.title || "Детайли за източника"}
            </DialogTitle>
            <DialogDescription className="space-y-1">
              {selected?.index ? <span className="block">{selected.index}</span> : null}
              {selected?.timestamp ? (
                <span className="block">{new Date(selected.timestamp).toLocaleString("bg-BG")}</span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-auto pr-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {selected ? (
                  <Badge variant="secondary">
                    {selected.matches.length} {selected.matches.length === 1 ? "откъс" : "откъса"}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selected?.index && isUrl(selected.index) ? (
                  <a
                    href={selected.index}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Отвори <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
                {selected?.matches?.length ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(selected.matches.map((match) => match.content).join("\n\n"))
                    }
                  >
                    <Copy className="mr-1 h-4 w-4" /> Копирай
                  </Button>
                ) : null}
              </div>
            </div>

            {selected?.matches?.length ? (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Свързани откъси</p>
                <div className="space-y-3">
                  {selected.matches.map((match, index) => (
                    <div key={`${match.docId || match.title}-${index}`} className="rounded-lg border border-border bg-muted/40 p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Откъс {index + 1}</Badge>
                        {match.article ? <Badge variant="secondary">{match.article}</Badge> : null}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {match.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Няма налични откъси за този източник.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="secondary">
              Затвори
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
