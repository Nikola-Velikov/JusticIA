import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Paperclip, Square, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onStop?: () => void;
  onEditMessage?: (messageId: string, content: string) => void;
  user?: { name: string; email: string };
  onLogout: () => void;
  onEditingChange?: (state: { id: string; active: boolean } | null) => void;
}

export function ChatArea({ messages, isLoading, onSendMessage, onStop, onEditMessage, user, onLogout, onEditingChange }: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<{ id: string, active: boolean } | null>(null);
  const [typedMap, setTypedMap] = useState<Record<string, string>>({});
  const typingTimer = useRef<number | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const messageText = input.trim();
    if (editing?.active && editing.id) {
      if (isLoading) onStop?.();
      onEditMessage?.(editing.id, messageText);
      setEditing(null);
      onEditingChange?.(null);
      setInput("");
      return;
    }
    if (isLoading) return;
    setInput("");
    onSendMessage(messageText);
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
                  <Button variant="outline" className="justify-start text-left border-primary/20 hover:bg-primary/10" onClick={() => onSendMessage("Какво гласи Конституцията на България?")}>Какво гласи Конституцията на България?</Button>
                  <Button variant="outline" className="justify-start text-left border-primary/20 hover:bg-primary/10" onClick={() => onSendMessage("Как се използва платения годишен отпуск?")}>Как се използва платения годишен отпуск?</Button>
                  <Button variant="outline" className="justify-start text-left border-primary/20 hover:bg-primary/10" onClick={() => onSendMessage("Как се сключва трудов договор?")}>Как се сключва трудов договор?</Button>
                </div>
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
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
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                      <ReactMarkdown>
                        {typedMap[message.id] ?? message.content}
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
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { onStop?.(); const st = { id: message.id, active: true }; setEditing(st); onEditingChange?.(st); setInput(message.content); }}>
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
          ))}
          
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
    </div>
  );
}
