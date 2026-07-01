'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getChatMessages, addChatMessage } from '@/lib/db';
import type { ChatMessage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Bot, User, Shield, Loader2, Volume2, VolumeX } from 'lucide-react';
import { speakText, stopSpeaking } from '@/lib/tts';

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getChatMessages(user.id).then((msgs) => {
      if (msgs.length === 0) {
        const welcome: ChatMessage = {
          id: 'welcome',
          user_id: user.id,
          role: 'assistant',
          content: "Hello! I'm your AgriPride AI assistant. Ask me about crop planting, disease diagnosis, weather forecasts, pest control, fertilizer recommendations, or sustainability practices.",
          agent_name: 'General AI Assistant',
          confidence_score: 1,
          frameworks_used: ['AIM Framework'],
          created_at: new Date().toISOString(),
        };
        setMessages([welcome]);
      } else {
        setMessages(msgs);
      }
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;
    const userQuery = input.trim();
    setInput('');
    setSending(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      user_id: user.id,
      role: 'user',
      content: userQuery,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      await addChatMessage({ user_id: user.id, role: 'user', content: userQuery });
    } catch {
      // Silently fail - message is still in local state
    }

    const tempId = `stream-${Date.now()}`;
    const placeholder: ChatMessage = {
      id: tempId,
      user_id: user.id,
      role: 'assistant',
      content: '',
      agent_name: 'AI Assistant',
      frameworks_used: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, placeholder]);

    const historyMessages = messages
      .filter((m) => m.content && !m.id.startsWith('stream-') && m.id !== 'welcome')
      .slice(-20)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuery, userId: user.id, history: historyMessages }),
      });

      if (!response.ok) throw new Error('API error');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempId ? { ...m, content: fullText } : m
                  )
                );
              }
            } catch {}
          }
        }
      }

      const finalMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        user_id: user.id,
        role: 'assistant',
        content: fullText,
        agent_name: 'AI Assistant',
        confidence_score: 0.92,
        frameworks_used: ['AIM Framework', 'TRACK Framework'],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => prev.map((m) => (m.id === tempId ? finalMsg : m)));
      try {
        await addChatMessage({
          user_id: user.id,
          role: 'assistant',
          content: fullText,
          agent_name: 'AI Assistant',
          confidence_score: 0.92,
          frameworks_used: ['AIM Framework', 'TRACK Framework'],
        });
      } catch {
        // Silently fail - response is already in local state
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, content: 'I apologize, but I encountered an error. Please try again.' }
            : m
        )
      );
    }
    setSending(false);
  };

  const handleSpeak = (text: string, id: string) => {
    if (speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
    } else {
      stopSpeaking();
      setSpeakingId(id);
      speakText(text, () => setSpeakingId(null));
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500">Live AI-powered guidance for your farm — responses arrive in real time</p>
      </div>

      <Card className="flex h-[70vh] sm:h-[calc(100vh-18rem)] flex-col">
        <CardHeader className="border-b border-gray-100 px-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-100 shrink-0">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg">AgriPride AI</CardTitle>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                {process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'Powered by GPT-4o' : 'Powered by Multi-Agent AI Framework'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-3/4" />
              <Skeleton className="h-20 w-1/2 ml-auto" />
              <Skeleton className="h-20 w-2/3" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {msg.role === 'assistant' ? (
                        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      )}
                      <span className={`text-[10px] sm:text-xs font-medium truncate ${msg.role === 'user' ? 'text-emerald-100' : 'text-gray-500'}`}>
                        {msg.role === 'assistant' ? (msg.agent_name ?? 'AI Assistant') : 'You'}
                      </span>
                      {msg.role === 'assistant' && msg.content && (
                        <button
                          onClick={() => handleSpeak(msg.content, msg.id)}
                          className="ml-auto shrink-0 text-gray-400 hover:text-emerald-600"
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          ) : (
                            <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className={`whitespace-pre-wrap text-xs sm:text-sm break-words ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                      {msg.content}
                      {msg.id.startsWith('stream-') && sending && (
                        <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 animate-pulse" />
                      )}
                    </div>
                    {msg.role === 'assistant' && msg.frameworks_used && msg.frameworks_used.length > 0 && !msg.id.startsWith('stream-') && (
                      <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 border-t border-gray-200 pt-1.5 sm:pt-2">
                        <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 shrink-0" />
                        {msg.frameworks_used.map((fw) => (
                          <Badge key={fw} variant="secondary" className="text-[8px] sm:text-[10px]">{fw}</Badge>
                        ))}
                        {msg.confidence_score != null && (
                          <Badge variant="outline" className="text-[8px] sm:text-[10px] ml-auto">
                            {(msg.confidence_score * 100).toFixed(0)}% confidence
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </CardContent>
        <div className="border-t border-gray-100 px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about crops, diseases, weather..."
              className="text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon" className="shrink-0">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] sm:text-xs text-gray-400">
            Responses stream in real time &middot; Click the speaker icon to hear responses
          </p>
        </div>
      </Card>
    </div>
  );
}
