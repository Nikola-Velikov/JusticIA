import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Paperclip, Square, Copy, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type ChatMatchInput, type ChatSourceRef, getCitationMatchByNumber } from "@/lib/chat-citations";
import { SourceOption } from "@/types/generator";
import ReactMarkdown from "react-markdown";

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
    options?: SourceOption;
    [key: string]: unknown;
  };
}

interface CitationPreview {
  number: number;
  title: string;
  index: string;
  article?: string;
  excerpt: string;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string, options: SourceOption) => void;
  onStop?: () => void;
  onEditMessage?: (messageId: string, content: string, options: SourceOption) => void;
  user?: { name: string; email: string };
  onLogout: () => void;
  onEditingChange?: (state: { id: string; active: boolean } | null) => void;
}


const SOURCE_OPTIONS: Array<{ value: SourceOption; label: string; description: string; badge: string }> = [
  {
    value: "all",
    label: "Комбинирано покритие (БГ + ЕС, на български)",
    description: "Смесва българско законодателство с европейски регламенти и директиви на български език за по-богат контекст.",
    badge: "БГ + ЕС",
  },
  {
    value: "bg",
    label: "Европейско право (регламенти и директиви на български)",
    description: "Фокус върху европейски регламенти и директиви в български превод.",
    badge: "EU BG",
  },
  {
    value: "en",
    label: "Европейско право (регламенти и директиви на английски)",
    description: "Използва официалните текстове на английски за сравнения и детайли.",
    badge: "EU EN",
  },
  {
    value: "old",
    label: "Българско законодателство",
    description: "Търси само в националното законодателство на България.",
    badge: "БГ Закон",
  },
];

function formatStandaloneCitationGroup(group: string) {
  const numbers = Array.from(
    new Set(Array.from(group.matchAll(/SOURCE\s+(\d+)/gi)).map((match) => match[1])),
  );
  if (!numbers.length) return group;
  return numbers.map((number) => `[${number}](#cite-${number})`).join(" ");
}

function formatAssistantContent(content: string) {
  return content
    .replace(/\(((?:\s*SOURCE\s+\d+\s*(?:[,;]\s*SOURCE\s+\d+\s*)*))\)/gi, (_, group: string) =>
      formatStandaloneCitationGroup(group)
    )
    .replace(/\bSOURCE\s+(\d+)\b/gi, (_match, number: string) => `[${number}](#cite-${number})`);
}


export function ChatArea({ messages, isLoading, onSendMessage, onStop, onEditMessage, user, onLogout, onEditingChange }: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<{ id: string, active: boolean } | null>(null);
  const [typedMap, setTypedMap] = useState<Record<string, string>>({});
  const typingTimer = useRef<number | null>(null);
  const [sourceOption, setSourceOption] = useState<SourceOption>("all");
  const [sourceCollapsed, setSourceCollapsed] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<CitationPreview | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const messageText = input.trim();
    if (editing?.active && editing.id) {
      if (isLoading) onStop?.();
      onEditMessage?.(editing.id, messageText, sourceOption);
      setEditing(null);
      onEditingChange?.(null);
      setInput("");
      return;
    }
    if (isLoading) return;
    setInput("");
    onSendMessage(messageText, sourceOption);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Typing animation for the latest assistant message (works for cache and generate)
  useEffect(() => {
    // Clear previous timer
    if (typingTimer.current) {
      window.clearInterval(typingTimer.current);
      typingTimer.current = null;
    }

    // Find latest assistant message
    const assistants = messages.filter(m => m.role === 'assistant');
    const last = assistants.length > 0 ? assistants[assistants.length - 1] : undefined;
    if (!last) return;

    const full = last.content || '';
    const already = typedMap[last.id] ?? '';
    if (already === full) return; // already fully typed

    // Initialize if new
    if (!typedMap[last.id]) {
      setTypedMap(prev => ({ ...prev, [last.id]: '' }));
    }

    // Step typing
    const step = () => {
      setTypedMap(prev => {
        const current = prev[last.id] ?? '';
        if (current.length >= full.length) {
          // Done
          if (typingTimer.current) {
            window.clearInterval(typingTimer.current);
            typingTimer.current = null;
          }
          return { ...prev, [last.id]: full };
        }
        const increment = Math.max(1, Math.floor(full.length / 80)); // around 80 steps (slower)
        const nextLen = Math.min(full.length, current.length + increment);
        return { ...prev, [last.id]: full.slice(0, nextLen) };
      });
    };

    typingTimer.current = window.setInterval(step, 28); // smooth ~28ms steps (slower)

    return () => {
      if (typingTimer.current) {
        window.clearInterval(typingTimer.current);
        typingTimer.current = null;
      }
    };
  }, [messages]);

  // No animation for assistant text (immediate render)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const openCitation = (message: Message, citationNumber: number) => {
    const match = getCitationMatchByNumber(message.metadata, citationNumber);

    setSelectedCitation({
      number: citationNumber,
      title: match?.title || `Източник ${citationNumber}`,
      index: match?.index || "",
      article: match?.article,
      excerpt: match?.content || "Няма наличен откъс за този цитат.",
    });
  };

  const selectedSource = SOURCE_OPTIONS.find((option) => option.value === sourceOption) || SOURCE_OPTIONS[0];

  return (
    <div className="flex flex-col h-full bg-background w-full min-w-0">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-0 w-full" ref={scrollAreaRef}>
        <div className="space-y-6 w-full p-4">
          {messages.length === 0 && !isLoading ? (
            <div className="h-[70vh] flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                  <Bot className="h-3 w-3" /> AI Юридически асистент
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Започнете разговора</h3>
                <p className="text-sm text-muted-foreground mb-6">Задайте правен въпрос или изберете някой от примерите:</p>
                <div className="grid gap-3">
                  <Button variant="outline" className="justify-start text-left border-primary/20 hover:bg-primary/10" onClick={() => onSendMessage("Какво гласи Конституцията на България?", "old")}>Какво гласи Конституцията на България?</Button>
                  <Button variant="outline" className="justify-start text-left border-primary/20 hover:bg-primary/10" onClick={() => onSendMessage("Как се използва платения годишен отпуск?", 'old')}>Как се използва платения годишен отпуск?</Button>
                  <Button variant="outline" className="justify-start text-left border-primary/20 hover:bg-primary/10" onClick={() => onSendMessage("Как се сключва трудов договор?", 'old')}>Как се сключва трудов договор?</Button>
                </div>
              </div>
            </div>
          ) : null}

          {messages.map((message, idx) => {
            let thoughtSecs: number | null = null;
            if (message.role === 'assistant') {
              for (let i = idx - 1; i >= 0; i--) {
                const prev = messages[i];
                if (prev.role === 'user') {
                  const dt = (new Date(message.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
                  thoughtSecs = Math.max(1, Math.floor(isFinite(dt) ? dt : 1));
                  break;
                }
              }
            }
            return (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 bg-primary shadow-sm">
                  <AvatarFallback className="bg-primary">
                    <Bot className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-chat-bubble-user text-primary-foreground"
                    : "bg-chat-bubble-assistant text-foreground border border-border animate-in fade-in slide-in-from-bottom-1"
                }`}
              >
                {message.role === 'assistant' && thoughtSecs !== null && (
                  <div className="text-[11px] font-bold text-muted-foreground mb-1">
                    Търсенето приключи за {thoughtSecs} сек
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => {
                            if (href?.startsWith("#cite-")) {
                              const citationNumber = Number(href.slice("#cite-".length));
                              return (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    openCitation(message, citationNumber);
                                  }}
                                  className="not-prose mx-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-border/70 bg-muted/40 px-2 text-[11px] font-semibold text-foreground align-middle transition-colors hover:border-primary/20 hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  aria-label={`Отвори източник ${citationNumber}`}
                                >
                                  <span className="hidden">
                                    Източник
                                  </span>
                                  <span className="inline-flex min-w-4 items-center justify-center leading-none">
                                    {children}
                                  </span>
                                </button>
                              );
                            }

                            return (
                              <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {formatAssistantContent(typedMap[message.id] ?? message.content)}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className={`text-xs ${
                    message.role === "user" 
                      ? "text-primary-foreground/70" 
                      : "text-muted-foreground"
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="flex items-center gap-2">
                    {message.role === 'user' ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(message.content)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { onStop?.(); const st = { id: message.id, active: true }; setEditing(st); onEditingChange?.(st); setInput(message.content); setSourceOption(message.metadata?.options ?? "all"); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-100" onClick={() => copyToClipboard(message.content)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {message.role === "user" && user && (
                <Avatar className="h-8 w-8 bg-secondary shadow-sm">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              )}
              
              {message.role === "user" && !user && (
                <Avatar className="h-8 w-8 bg-secondary">
                  <AvatarFallback>
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            );
          })}
          
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <Avatar className="h-8 w-8 bg-primary shadow-sm">
                <AvatarFallback className="bg-primary">
                  <Bot className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-chat-bubble-assistant border border-border rounded-2xl px-4 py-3 animate-pulse">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4 w-full min-w-0">
        <div className="w-full min-w-0">
          <div className="mb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span>Източник на съдържание</span>
                </div>
                <div className="flex items-center gap-2">
               
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-primary hover:text-primary"
                    onClick={() => setSourceCollapsed((v) => !v)}
                  >
                    {sourceCollapsed ? "Покажи" : "Скрий"}
                  </Button>
                </div>
            </div>
            {!sourceCollapsed && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-border/70 bg-card/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] tracking-wide uppercase bg-primary/10 text-primary border-primary/30 whitespace-nowrap flex-shrink-0">
                      {selectedSource.badge}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground break-words">{selectedSource.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug break-words">{selectedSource.description}</p>
                </div>
                <Select value={sourceOption} onValueChange={(value) => setSourceOption(value as SourceOption)}>
                  <SelectTrigger className="w-full sm:w-[520px] max-w-full min-h-[72px] bg-primary/5 border-primary/30 hover:border-primary/50 focus:ring-2 focus:ring-primary/40 whitespace-normal text-left items-start py-3">
                    <div className="flex flex-col gap-1 text-left whitespace-normal leading-snug w-full pr-6">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] tracking-wide uppercase bg-primary/10 text-primary border-primary/30 whitespace-nowrap flex-shrink-0">
                          {selectedSource.badge}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground break-words">{selectedSource.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground block break-words">{selectedSource.description}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="w-[520px] max-w-full">
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-3">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] tracking-wide uppercase bg-primary/10 text-primary border-primary/30 whitespace-nowrap flex-shrink-0">
                              {option.badge}
                            </Badge>
                            <span className="text-sm font-semibold text-foreground break-words">{option.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground break-words">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <TooltipProvider>
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напишете съобщението си тук..."
                className="min-h-[60px] max-h-40 pr-24 resize-none bg-chat-input border-border focus:ring-primary w-full min-w-0"
              />
              
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                {/* File Upload Icon (Disabled) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="h-8 w-8 p-0 opacity-50 cursor-not-allowed"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Качване на файлове - Очаквайте скоро!</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Stop Button when loading */}
                {isLoading && (
                  <Button onClick={onStop} variant="outline" className="h-8 px-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                    <Square className="h-4 w-4" />
                  </Button>
                )}
                {/* Send Button */}
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || (isLoading && !(editing?.active))}
                  className="h-8 w-8 p-0 bg-primary hover:bg-primary-hover"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TooltipProvider>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Натиснете Enter за изпращане, Shift+Enter за нов ред
          </div>
        </div>
      </div>

      <Dialog open={Boolean(selectedCitation)} onOpenChange={(open) => { if (!open) setSelectedCitation(null); }}>
        <DialogContent className="max-w-3xl overflow-hidden border-border bg-card p-0 shadow-2xl">
          <DialogHeader className="border-b border-border bg-muted/30 px-6 py-5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-primary hover:bg-primary/10">
                Източник {selectedCitation?.number}
              </Badge>
              {selectedCitation?.article ? (
                <Badge variant="secondary" className="rounded-full px-2.5 py-1">
                  {selectedCitation.article}
                </Badge>
              ) : null}
            </div>
            <DialogTitle className="text-left text-lg leading-snug">
              {selectedCitation?.title}
            </DialogTitle>
            <DialogDescription className="text-left">
              {selectedCitation?.index || "Откъс от използвания правен източник"}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Точен откъс
              </p>
              <ScrollArea className="mt-3 max-h-[55vh] pr-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                  {selectedCitation?.excerpt}
                </p>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
