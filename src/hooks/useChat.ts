import { useState, useEffect, useCallback } from "react";
import { apiDelete, apiGet, apiPost, userError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Message {
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

export interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
}

export function useChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const [loadingChatId, setLoadingChatId] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const [controller, setController] = useState<AbortController | null>(null);

  const loadChats = useCallback(async () => {
    const data = await apiGet<Array<{ id: string; title: string; createdAt: string }>>('/chats');
    setChats(
      data.map((c) => ({ id: c.id, title: c.title, timestamp: new Date(c.createdAt) }))
    );
  }, []);

  const loadMessages = useCallback(async (chatId: string) => {
    const data = await apiGet<Array<{ id: string; role: 'user' | 'assistant'; content: string; createdAt: string; metadata?: any }>>(`/chats/${chatId}/messages`);
    setMessages(
      data.map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: new Date(m.createdAt), metadata: m.metadata }))
    );
  }, []);

  const createNewChat = useCallback(async () => {
    // Reuse current empty chat if present
    if (currentChatId && messages.length === 0) {
      try { localStorage.setItem('lastChatId', currentChatId); } catch {}
      return currentChatId;
    }
    const chat = await apiPost<{ id: string; title: string; createdAt: string }>(`/chats`, {});
    await loadChats();
    setCurrentChatId(chat.id);
    setMessages([]);
    try { localStorage.setItem('lastChatId', chat.id); } catch {}
    return chat.id;
  }, [loadChats, currentChatId, messages.length]);

  const sendMessage = useCallback(
    async (content: string, chatId?: string) => {
      if (loadingChatId) return; // prevent concurrent sends unless stopped
      let activeChatId = chatId || currentChatId;
      setLoadingChatId(activeChatId);
      try {
        if (!activeChatId) {
          activeChatId = await createNewChat();
          if (!activeChatId) return;
        }

        // Add user message immediately (placeholder)
        const tempId = `temp-${Date.now()}`;
        const userMsg = { id: tempId, content, role: "user" as const, timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);

        const ac = new AbortController();
        setController(ac);

        const result = await apiPost<{ userMessage: any; assistantMessage: any }>(`/chats/${activeChatId}/messages/send`, { content }, { signal: ac.signal });

        // Replace placeholder user message with persisted one
        setMessages((prev) => prev.map(m => m.id === tempId ? {
          id: result.userMessage.id,
          content: result.userMessage.content,
          role: 'user',
          timestamp: new Date(result.userMessage.createdAt),
        } : m));

        // Append assistant message
        setMessages((prev) => [...prev, {
          id: result.assistantMessage.id,
          content: result.assistantMessage.content,
          role: 'assistant',
          timestamp: new Date(result.assistantMessage.createdAt),
          metadata: result.assistantMessage.metadata,
        }]);

        // Update title if first message
        if (messages.length === 0) {
          await loadChats();
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          // request cancelled by user
        } else {
          console.error(e);
          toast({ title: "Грешка", description: userError(e, 'Неуспешно изпращане на съобщение'), variant: 'destructive' });
        }
      } finally {
        setLoadingChatId(undefined);
        setController(null);
      }
    },
    [currentChatId, messages.length, createNewChat, loadChats, toast, loadingChatId]
  );

  const stopSending = useCallback(() => {
    if (controller) {
      controller.abort();
    }
    setLoadingChatId(undefined);
  }, [controller]);

  const editLastMessage = useCallback(async (messageId: string, content: string) => {
    if (!currentChatId) return;
    // Optimistically remove the last pair if it starts with this user message
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;
    const next = messages[idx + 1];
    const optimistic = [...messages];
    optimistic.splice(idx, next && next.role === 'assistant' ? 2 : 1);

    // If temp/non-ObjectId id, stop current request and send as new message instead of editing
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(messageId);
    if (!isObjectId) {
      if (controller) controller.abort();
      setMessages(optimistic);
      setLoadingChatId(undefined);
      await sendMessage(content, currentChatId);
      return;
    }

    // Normal edit flow with placeholder
    const tempId = `temp-edit-${Date.now()}`;
    const tempUser = { id: tempId, content, role: 'user' as const, timestamp: new Date() };
    setMessages([...optimistic, tempUser]);

    const ac = new AbortController();
    setController(ac);
    setLoadingChatId(currentChatId);
    try {
      const result = await apiPost<{ userMessage: any; assistantMessage: any }>(`/chats/${currentChatId}/messages/edit`, { messageId, content }, { signal: ac.signal });
      setMessages(prev => (
        prev.map(m => m.id === tempId ? {
          id: result.userMessage.id,
          content: result.userMessage.content,
          role: 'user' as const,
          timestamp: new Date(result.userMessage.createdAt),
        } : m).concat([
          {
            id: result.assistantMessage.id,
            content: result.assistantMessage.content,
            role: 'assistant' as const,
            timestamp: new Date(result.assistantMessage.createdAt),
            metadata: result.assistantMessage.metadata,
          }
        ])
      ));
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        toast({ title: 'Грешка', description: userError(e, 'Неуспешна редакция'), variant: 'destructive' });
      }
    } finally {
      setLoadingChatId(undefined);
      setController(null);
    }
  }, [currentChatId, messages, toast, controller, sendMessage]);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await apiDelete(`/chats/${chatId}`);
      if (currentChatId === chatId) {
        setCurrentChatId(undefined);
        setMessages([]);
      }
      await loadChats();
    } catch (e: any) {
      toast({ title: 'Грешка', description: userError(e, 'Неуспешно изтриване на чат'), variant: 'destructive' });
    }
  }, [currentChatId, loadChats, toast]);

  const selectChat = useCallback(async (chatId: string) => {
    // Before switching away, delete current empty chat if any
    if (currentChatId && currentChatId !== chatId && messages.length === 0) {
      try { await apiDelete(`/chats/${currentChatId}`); } catch {}
      await loadChats();
    }
    setCurrentChatId(chatId);
    try {
      await loadMessages(chatId);
      try { localStorage.setItem('lastChatId', chatId); } catch {}
    } catch (e: any) {
      setMessages([]);
      toast({ title: 'Грешка', description: 'Чатът не е намерен.', variant: 'destructive' });
      await loadChats();
    }
  }, [loadMessages, loadChats, toast, currentChatId, messages.length]);

  const discardMessage = useCallback(async (messageId: string, chatId?: string) => {
    const cid = chatId || currentChatId;
    if (!cid) return;

    // Stop any ongoing request before deleting
    if (controller) {
      try { controller.abort(); } catch {}
      setLoadingChatId(undefined);
    }

    // Optimistic local removal (remove selected and its pair neighbor if present)
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === messageId);
      if (idx === -1) return prev;
      const next = [...prev];
      // Determine neighbor pair: user -> next assistant; assistant -> previous user
      if (next[idx].role === 'user') {
        next.splice(idx, 1);
        if (idx < next.length && next[idx]?.role === 'assistant') {
          next.splice(idx, 1);
        }
      } else {
        // assistant
        next.splice(idx, 1);
        const prevIdx = idx - 1;
        if (prevIdx >= 0 && next[prevIdx]?.role === 'user') {
          next.splice(prevIdx, 1);
        }
      }
      return next;
    });

    const isObjectId = /^[a-fA-F0-9]{24}$/.test(messageId);
    if (!isObjectId) {
      // Optimistic/local cleanup for temp ids
      // If now empty, delete chat on server as well
      try {
        const data = await apiGet<Array<{ id: string; role: 'user' | 'assistant'; content: string; createdAt: string; metadata?: any }>>(`/chats/${cid}/messages`);
        const msgs = data.map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: new Date(m.createdAt), metadata: m.metadata }));
        if (msgs.length === 0) {
          await apiDelete(`/chats/${cid}`);
          await loadChats();
          if (currentChatId === cid) {
            // Open a fresh chat automatically
            await createNewChat();
          }
        } else {
          setMessages(msgs);
        }
      } catch {}
      return;
    }

    try {
      await apiDelete(`/chats/${cid}/messages/${messageId}`);
      // After deletion, reload messages; if none, also remove chat locally
      try {
        const data = await apiGet<Array<{ id: string; role: 'user' | 'assistant'; content: string; createdAt: string; metadata?: any }>>(`/chats/${cid}/messages`);
        const msgs = data.map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: new Date(m.createdAt), metadata: m.metadata }));
        setMessages(msgs);
        if (msgs.length === 0) {
          await apiDelete(`/chats/${cid}`);
          await loadChats();
          if (currentChatId === cid) {
            await createNewChat();
          }
        }
      } catch {}
    } catch (e) {
      // ignore
    }
  }, [currentChatId, loadChats, createNewChat, controller]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const isLoading = loadingChatId === currentChatId;
  return { chats, messages, currentChatId, isLoading, sendMessage, stopSending, editLastMessage, deleteChat, selectChat, createNewChat };
}
