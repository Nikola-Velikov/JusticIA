import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatArea } from "@/components/ChatArea";
import { SourcesPanel } from "@/components/SourcesPanel";
import { Header } from "@/components/Header";
import { useChat } from "@/hooks/useChat";
import { apiGet } from "@/lib/api";

const Index = () => {
  const [showSources, setShowSources] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | undefined>(undefined);
  const navigate = useNavigate();

  const {
    chats,
    messages,
    currentChatId,
    isLoading,
    sendMessage,
    editLastMessage,
    stopSending,
    deleteChat,
    selectChat,
    createNewChat,
    discardMessage
  } = useChat();
  const [editingState, setEditingState] = useState<{ id: string; active: boolean } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Load current user info
    (async () => {
      try {
        const me = await apiGet<{ user: { id: string; email: string } }>(`/auth/me`);
        setUser({ name: me.user.email.split('@')[0], email: me.user.email });
      } catch {
        // Invalid token; force logout
        localStorage.removeItem('token');
        navigate('/login');
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);
  // If coming from guards/login, create a fresh chat but reuse existing empty chat if present
  useEffect(() => {
    if (loading) return;
    try {
      const wantsNew = sessionStorage.getItem('newChatOnNextVisit');
      if (wantsNew) {
        sessionStorage.removeItem('newChatOnNextVisit');
        // Prefer existing empty chat if we have recorded one
        try {
          const emptyId = localStorage.getItem('emptyChatId');
          if (emptyId && chats.some(c => c.id === emptyId)) {
            selectChat(emptyId);
            return;
          }
        } catch {}
        createNewChat();
      }
    } catch {}
  }, [loading, chats, selectChat, createNewChat]);


  // Auto-select last opened chat (from localStorage) or the most recent one
  useEffect(() => {
    if (loading) return;
    if (currentChatId) return;
    if (!chats || chats.length === 0) return;
    try {
      const last = localStorage.getItem('lastChatId');
      const exists = last && chats.some(c => c.id === last);
      if (exists) {
        selectChat(last as string);
        return;
      }
    } catch {}
    // Fallback to first (most recent) chat
    selectChat(chats[0].id);
  }, [loading, currentChatId, chats, selectChat]);

  const handleLogout = async () => {
    localStorage.removeItem('token');
    navigate("/login");
  };

  const handleNewChat = async () => {
    await createNewChat();
  };

  const switchChat = async (chatId: string) => {
    // If editing, delete that message before switching
    if (editingState?.active && editingState.id && currentChatId) {
      try {
        await discardMessage(editingState.id, currentChatId);
      } catch {}
      setEditingState(null);
    }
    await selectChat(chatId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            Justic<span className="text-primary">IA</span>
          </h1>
          <p className="text-muted-foreground">Зареждане...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="h-screen bg-background flex flex-col w-full">
        <Header
          onToggleSources={() => setShowSources(!showSources)}
          showSources={showSources}
          showSourcesToggle={true}
          showSidebarTrigger={true}
          user={user}
          onLogout={handleLogout}
        />

        <div className="flex flex-1 min-h-0 w-full">
          <ChatSidebar
            onNewChat={handleNewChat}
            onSelectChat={switchChat}
            activeChat={currentChatId}
            chats={chats}
            onDeleteChat={deleteChat}
            user={user}
            onLogout={handleLogout}
            onLogin={() => navigate('/login')}
            onRegister={() => navigate('/signup')}
          />

          <div className="flex-1 min-h-0 transition-all duration-200 ease-linear peer-data-[state=collapsed]:ml-[3rem] peer-data-[state=expanded]:ml-[16rem] w-full min-w-0">
            <ResizablePanelGroup direction="horizontal" className="h-full w-full min-w-0">
              <ResizablePanel defaultSize={showSources ? 70 : 100} minSize={30}>
                <ChatArea 
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={sendMessage}
                  onEditMessage={(id, content) => editLastMessage(id, content)}
                  onStop={stopSending}
                  user={user}
                  onLogout={handleLogout}
                  onEditingChange={setEditingState}
                />
              </ResizablePanel>

              {showSources && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                    <SourcesPanel 
                      onClose={() => setShowSources(false)}
                      messages={messages}
                    />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;

