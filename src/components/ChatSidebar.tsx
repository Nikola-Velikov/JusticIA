
import { MessageSquare, Plus, MoreHorizontal, Trash2, Edit3, PanelLeftClose, PanelLeftOpen, LogIn, UserPlus, Search } from "lucide-react";
import React, { useMemo, useState } from 'react';
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

export function ChatSidebar({ onNewChat, onSelectChat, onDeleteChat, activeChat, chats = [], user, onLogin, onRegister, onLogout }: ChatSidebarProps) {
  const [query, setQuery] = useState("");
  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(c => c.title.toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q));
  }, [chats, query]);

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

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold text-lg ${isCollapsed ? 'hidden' : 'block'}`}>Justic<span className="text-primary">IA</span></h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
          
          {!isCollapsed && (
            <div className="mb-4">
              <Button
                onClick={onNewChat}
                className="w-full justify-start gap-3 bg-primary hover:bg-primary-hover text-primary-foreground"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                Нов Чат
              </Button>
            </div>
          )}

          {isCollapsed && (
            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={onNewChat}
                className="w-8 h-8 p-0 bg-primary hover:bg-primary-hover text-primary-foreground"
                size="sm"
              >
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
                  placeholder="Търсене в чатове..."
                  className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
              </div>
              <SidebarGroup>
                <SidebarGroupLabel className="text-sm font-medium text-muted-foreground mb-2">
                  Скорошни Чатове
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {filteredChats.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-3">Няма намерени чатове</div>
                    ) : filteredChats.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <div className="group relative">
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
                                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background border border-border z-50">
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
                <Button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  variant="ghost"
                  size="sm"
                  className={`w-8 h-8 p-0 ${activeChat === chat.id ? 'bg-accent' : ''}`}
                >
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
                <Button
                  onClick={onLogin}
                  variant="outline"
                  className="w-full justify-start gap-3"
                  size="sm"
                >
                  <LogIn className="h-4 w-4" />
                  Вход
                </Button>
                <Button
                  onClick={onRegister}
                  className="w-full justify-start gap-3 bg-primary hover:bg-primary-hover text-primary-foreground"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4" />
                  Регистрация
                </Button>
              </div>
            )}
            
            {isCollapsed && (
              <div className="flex flex-col items-center space-y-2">
                <Button
                  onClick={onLogin}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  <LogIn className="h-4 w-4" />
                </Button>
                <Button
                  onClick={onRegister}
                  size="sm"
                  className="w-8 h-8 p-0 bg-primary hover:bg-primary-hover text-primary-foreground"
                >
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
                  <Button size="sm" variant="outline" onClick={onLogout}>
                    Изход
                  </Button>
                )}
              </div>
            ) : (
              onLogout && (
                <div className="flex items-center justify-center">
                  <Button size="sm" variant="outline" onClick={onLogout} className="w-8 h-8 p-0">⎋</Button>
                </div>
              )
            )}
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
