import { FileText, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  // Extract sources and matches from assistant messages with metadata
  const sourcesData = messages
    .filter((msg) => msg.role === "assistant" && msg.metadata?.sources)
    .map((msg) => ({
      id: msg.id,
      sources: msg.metadata!.sources || [],
      matches: msg.metadata!.matches || [],
      timestamp: msg.timestamp,
    }));

  const hasAssistant = messages.some(m => m.role === 'assistant');

  return (
    <div className="flex flex-col h-full bg-background border-l border-border w-full min-w-0">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-background to-muted/30 p-6 flex items-center justify-between w-full shadow-sm backdrop-blur-sm min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">Източници</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Sources List */}
      <ScrollArea className="flex-1 p-0 w-full min-w-0">
        <div className="space-y-4 p-4 w-full min-w-0">
          {sourcesData.map((data) => (
            <Card key={data.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Намерени източници
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-3">
                {/* Sources */}
                {data.sources.map((source, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{source.title}</p>
                      <p className="text-xs text-muted-foreground">{source.index}</p>
                    </div>
                  </div>
                ))}

                {/* Matches Accordion */}
                {data.matches.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="matches" className="border-none">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            {data.matches.length} съвпадения
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 mt-2">
                          {data.matches.map((match, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-muted/30 rounded-lg border border-border"
                            >
                              <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                                {match}
                              </p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {sourcesData.length === 0 && (
          hasAssistant ? (
            <div className="p-4">
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Намерени източници</CardTitle>
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
              <p className="text-sm text-muted-foreground">Източниците ще се показват тук докато разговаряте.</p>
            </div>
          )
        )}
      </ScrollArea>
    </div>
  );
}
