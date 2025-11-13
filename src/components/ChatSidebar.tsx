import { MessageSquare, Plus, MoreHorizontal, Trash2, Edit3, PanelLeftClose, PanelLeftOpen, LogIn, UserPlus, Search, Folder, FolderPlus, Link2 } from "lucide-react";
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet, apiPost, apiDelete, apiPatch } from "@/lib/api";

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  activeChat?: string;
  chats?: Chat[];
  user?: { name: string; email: string };
  onLogin: () => void;
  onRegister: () => void;
  onLogout?: () => void;
}

type Case = { id: string; name: string; chatIds: string[]; createdAt: string };

export function ChatSidebar({ onNewChat, onSelectChat, onDeleteChat, activeChat, chats = [], user, onLogin, onRegister, onLogout }: ChatSidebarProps) {
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<Case[]>([]);
  const [openCases, setOpenCases] = useState<Record<string, boolean>>({});
  const [showCases, setShowCases] = useState(true);

  // Dialog state
  const [nameOpen, setNameOpen] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [editingCaseId, setEditingCaseId] = useState<string | undefined>(undefined);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignChatId, setAssignChatId] = useState<string | undefined>(undefined);
  const [assignCaseId, setAssignCaseId] = useState<string | undefined>(undefined);

  const [addOpen, setAddOpen] = useState(false);
  const [addCaseId, setAddCaseId] = useState<string | undefined>(undefined);
  const [addChatId, setAddChatId] = useState<string | undefined>(undefined);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setRowRef = (id: string) => (el: HTMLDivElement | null) => { rowRefs.current[id] = el; };

  // Load cases from API
  const loadCases = async () => {
    try { const data = await apiGet<Case[]>(`/cases`); setCases(data); } catch {}
  };
  useEffect(() => { loadCases(); }, []);

  // Derived chat lists
  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(c => c.title.toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q));
  }, [chats, query]);
  const chatsInAnyCase = useMemo(() => new Set(cases.flatMap(c => c.chatIds)), [cases]);
  const unclassifiedChats = useMemo(() => filteredChats.filter(c => !chatsInAnyCase.has(c.id)), [filteredChats, chatsInAnyCase]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  useEffect(() => {
    if (!activeChat) return;
    const el = rowRefs.current[activeChat];
    if (el && typeof (el as any).scrollIntoView === "function") {
      try { el.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch {}
    }
  }, [activeChat]);

  // Case ops
  const openCreateCase = () => { setEditingCaseId(undefined); setNameValue(""); setNameOpen(true); };
  const openRenameCase = (id: string) => { const c = cases.find(x=>x.id===id); setEditingCaseId(id); setNameValue(c?.name || ""); setNameOpen(true); };
  const submitCaseName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) { setNameOpen(false); return; }
    try {
      if (editingCaseId) { await apiPatch(`/cases/${editingCaseId}`, { name: trimmed }); }
      else { await apiPost(`/cases`, { name: trimmed }); }
      await loadCases();
    } finally {
      setNameOpen(false);
    }
  };
  const deleteCase = async (id: string) => { try { await apiDelete(`/cases/${id}`); await loadCases(); } catch {} };
  const addChatToCase = async (caseId: string, chatId: string) => { try { await apiPost(`/cases/${caseId}/chats`, { chatId }); await loadCases(); } catch {} };
  const removeChatFromCase = async (caseId: string, chatId: string) => { try { await apiDelete(`/cases/${caseId}/chats/${chatId}`); await loadCases(); } catch {} };

  // Assign dialogs
  const openAssignForChat = (chatId: string) => { setAssignChatId(chatId); setAssignCaseId(undefined); setAssignOpen(true); };
  const submitAssign = async () => { if (!assignChatId || !assignCaseId) { setAssignOpen(false); return; } await addChatToCase(assignCaseId, assignChatId); setAssignOpen(false); };
  const openAddExistingToCase = (caseId: string) => { setAddCaseId(caseId); setAddChatId(undefined); setAddOpen(true); };
  const submitAddExisting = async () => { if (!addCaseId || !addChatId) { setAddOpen(false); return; } await addChatToCase(addCaseId, addChatId); setAddOpen(false); };

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold text-lg ${isCollapsed ? 'hidden' : 'block'}`}>Justic<span className="text-primary">IA</span></h2>
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="h-8 w-8 p-0">
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {!isCollapsed && (
            <div className="mb-4">
              <Button onClick={onNewChat} className="w-full justify-start gap-3 bg-primary hover:bg-primary-hover text-primary-foreground" size="lg">
                <Plus className="h-4 w-4" />
                Нов чат
              </Button>
            </div>
          )}

          {isCollapsed && (
            <div className="flex flex-col items-center space-y-4">
              <Button onClick={onNewChat} className="w-8 h-8 p-0 bg-primary hover:bg-primary-hover text-primary-foreground" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-4">
              <div className="relative mb-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Търси чатове..."
                  className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
              </div>

              {/* Cases (folders) */}
              <SidebarGroup>
                <SidebarGroupLabel className="text-sm font-medium text-muted-foreground mb-2 flex items-center justify-between">
                  <button className="inline-flex items-center gap-2" onClick={() => setShowCases(v=>!v)}>
                    <Folder className="h-4 w-4" /> Папки
                  </button>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={openCreateCase}>
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </SidebarGroupLabel>
                {showCases && (
                  <SidebarGroupContent>
                     <SidebarMenu className="space-y-2">
                      {cases.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-3">Няма папки</div>
                      ) : cases.map((c) => {
                        const isOpen = !!openCases[c.id];
                        const toggle = () => setOpenCases(prev => ({...prev, [c.id]: !prev[c.id]}));
                        const chatsInCase = filteredChats.filter(ch => c.chatIds.includes(ch.id));
                        const displayName = c.name.length > 8 ? c.name.slice(0,8) + '…' : c.name;
                        return (
                          <SidebarMenuItem key={c.id}>
                            <div className="w-full rounded-md border border-border bg-white relative">
                              <div className="flex items-center gap-2 px-2 py-2 rounded-t-md relative z-30">
                                <Button variant="ghost" size="sm" className="h-6 px-2" onClick={toggle}>
                                  <Folder className="h-4 w-4 mr-2" /> {displayName}
                                </Button>
                                <div className="ml-auto flex items-center gap-1 relative z-30">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="bg-white border border-border z-[1000]">
                                      <DropdownMenuItem onClick={() => openAddExistingToCase(c.id)}>
                                        <Link2 className="h-3 w-3 mr-2" /> Добави чат
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openRenameCase(c.id)}>
                                        <Edit3 className="h-3 w-3 mr-2" /> Преименувай папката
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => deleteCase(c.id)} className="text-destructive">
                                        <Trash2 className="h-3 w-3 mr-2" /> Изтрий папката
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              {isOpen && (
                                <div className="pl-6 py-2 space-y-1">
                                  {chatsInCase.length === 0 ? (
                                    <div className="text-xs text-muted-foreground px-2 py-1">Няма чатове</div>
                                  ) : chatsInCase.map(chat => (
                                    <div key={chat.id} data-chat-row={chat.id} className={`group relative flex items-center gap-2 px-2 py-1 rounded-md ${activeChat===chat.id?'bg-accent':''}`}>
                                      <Button variant="ghost" size="sm" className="h-8 px-2 flex-1 justify-start min-w-0" onClick={() => onSelectChat(chat.id)}>
                                        <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                        <span className="truncate text-sm">{chat.title}</span>
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                                          >
                                            <MoreHorizontal className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="bg-white border border-border z-[1000]">
                                          <DropdownMenuItem onClick={() => removeChatFromCase(c.id, chat.id)}>
                                            Премахни от папката
                                          </DropdownMenuItem>
                                          {onDeleteChat && (
                                            <DropdownMenuItem onClick={() => onDeleteChat(chat.id)} className="text-destructive">
                                              <Trash2 className="h-3 w-3 mr-2" />
                                              Изтрий чата
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>

              {/* Other chats (unclassified) */}
              <SidebarGroup>
                <SidebarGroupLabel className="text-sm font-medium text-muted-foreground mb-2">
                  Други чатове
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-2">
                    {unclassifiedChats.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-3">Няма чатове</div>
                    ) : unclassifiedChats.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <div className="group relative rounded-md border border-border bg-white">
                          <SidebarMenuButton
                            onClick={() => onSelectChat(chat.id)}
                            className={`w-full justify-start p-3 h-auto hover:bg-accent ${
                              activeChat === chat.id ? 'bg-accent' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">
                                  {chat.title}
                                </div>
                                {chat.lastMessage && (
                                  <div className="text-xs text-muted-foreground truncate mt-1">
                                    {chat.lastMessage}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  {formatTime(chat.timestamp)}
                                </div>
                              </div>
                            </div>
                          </SidebarMenuButton>

                          {onDeleteChat && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-2 top-2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="bg-white border border-border z-[1000]">
                                {cases.length > 0 && (
                                  <DropdownMenuItem onClick={() => openAssignForChat(chat.id)}>
                                    Добави в папка
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => onDeleteChat(chat.id)} className="text-destructive">
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Изтрий
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          )}

          {isCollapsed && (
            <div className="flex flex-col items-center space-y-2 px-2">
              {chats.slice(0, 3).map((chat) => (
                <Button key={chat.id} onClick={() => onSelectChat(chat.id)} variant="ghost" size="sm" className={`w-8 h-8 p-0 ${activeChat === chat.id ? 'bg-accent' : ''}`}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom section */}
        {!user ? (
          <div className="p-4 border-t border-border">
            {!isCollapsed && (
              <div className="space-y-2">
                <Button onClick={onLogin} variant="outline" className="w-full justify-start gap-3" size="sm">
                  <LogIn className="h-4 w-4" />
                  Вход
                </Button>
                <Button onClick={onRegister} className="w-full justify-start gap-3 bg-primary hover:bg-primary-hover text-primary-foreground" size="sm">
                  <UserPlus className="h-4 w-4" />
                  Регистрация
                </Button>
              </div>
            )}

            {isCollapsed && (
              <div className="flex flex-col items-center space-y-2">
                <Button onClick={onLogin} variant="outline" size="sm" className="w-8 h-8 p-0">
                  <LogIn className="h-4 w-4" />
                </Button>
                <Button onClick={onRegister} size="sm" className="w-8 h-8 p-0 bg-primary hover:bg-primary-hover text-primary-foreground">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 border-t border-border">
            {!isCollapsed ? (
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground truncate max-w-[10rem]">{user.email}</div>
                </div>
                {onLogout && (
                  <Button size="sm" variant="outline" onClick={onLogout}>Изход</Button>
                )}
              </div>
            ) : (
              onLogout && (
                <div className="flex items-center justify-center">
                  <Button size="sm" variant="outline" onClick={onLogout} className="w-8 h-8 p-0">↩</Button>
                </div>
              )
            )}
          </div>
        )}
      </SidebarContent>

      {/* Name dialog */}
      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-border">
          <DialogHeader>
            <DialogTitle>{editingCaseId ? 'Преименувай папката' : 'Създай папка'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Label htmlFor="case-name">Име на папка</Label>
            <Input id="case-name" value={nameValue} onChange={(e) => setNameValue(e.target.value)} placeholder="напр. Моите дела" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameOpen(false)}>Отказ</Button>
            <Button onClick={submitCaseName}>Запази</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign chat to case */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-border">
          <DialogHeader>
            <DialogTitle>Добави в папка</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Label>Избери папка</Label>
            <Select value={assignCaseId} onValueChange={setAssignCaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Избери" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border">
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Отказ</Button>
            <Button onClick={submitAssign} disabled={!assignCaseId}>Добави</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add existing chat to specific case */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-border">
          <DialogHeader>
            <DialogTitle>Добави чат към папка</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Label>Избери чат</Label>
            <Select value={addChatId} onValueChange={setAddChatId}>
              <SelectTrigger>
                <SelectValue placeholder="Избери" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border">
                {unclassifiedChats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Отказ</Button>
            <Button onClick={submitAddExisting} disabled={!addChatId}>Добави</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
