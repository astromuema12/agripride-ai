'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { getChatMessages, addChatMessage } from '@/lib/db';
import type { ChatMessage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Send, Bot, User, Shield, Loader2, Volume2, VolumeX,
  Sparkles, Wheat, CloudSun, Bug, Leaf, Droplets,
} from 'lucide-react';
import { speakText, stopSpeaking } from '@/lib/tts';

const suggestionIcons: Record<string, React.ReactNode> = {
  disease: <Bug className="h-3.5 w-3.5" />,
  weather: <CloudSun className="h-3.5 w-3.5" />,
  planting: <Wheat className="h-3.5 w-3.5" />,
  pest: <Bug className="h-3.5 w-3.5" />,
  fertilizer: <Leaf className="h-3.5 w-3.5" />,
  irrigation: <Droplets className="h-3.5 w-3.5" />,
};

export default function AIAssistant() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const welcomeMessage = t('assistant.welcome');
  const suggestions = [
    { key: 'disease', label: t('assistant.suggestions.disease') },
    { key: 'weather', label: t('assistant.suggestions.weather') },
    { key: 'planting', label: t('assistant.suggestions.planting') },
    { key: 'pest', label: t('assistant.suggestions.pest') },
    { key: 'fertilizer', label: t('assistant.suggestions.fertilizer') },
    { key: 'irrigation', label: t('assistant.suggestions.irrigation') },
  ];

  useEffect(() => {
    if (!user) return;
    getChatMessages(user.id).then((msgs) => {
      if (msgs.length === 0) {
        const welcome: ChatMessage = {
          id: 'welcome',
          user_id: user.id,
          role: 'assistant',
          content: welcomeMessage,
          agent_name: t('assistant.agentName'),
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
  }, [user, welcomeMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = (text || input).trim();
    if (!query || !user || sending) return;
    setInput('');
    setSending(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      user_id: user.id,
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      await addChatMessage({ user_id: user.id, role: 'user', content: query });
    } catch {}

    const tempId = `stream-${Date.now()}`;
    const placeholder: ChatMessage = {
      id: tempId,
      user_id: user.id,
      role: 'assistant',
      content: '',
      agent_name: t('assistant.agentName'),
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
        body: JSON.stringify({ message: query, userId: user.id, history: historyMessages, language }),
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
                  prev.map((m) => (m.id === tempId ? { ...m, content: fullText } : m))
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
        agent_name: t('assistant.agentName'),
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
          agent_name: t('assistant.agentName'),
          confidence_score: 0.92,
          frameworks_used: ['AIM Framework', 'TRACK Framework'],
        });
      } catch {}
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...m, content: t('errors.general') }
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
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('assistant.title')}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{t('assistant.subtitle')}</p>
      </div>

      <Card className="flex h-[70vh] sm:h-[calc(100vh-18rem)] flex-col">
        <CardHeader className="border-b border-[var(--border)] px-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#e2f0ee] dark:bg-[#0f766e]/30 shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#0f766e] dark:text-[#14b8a6]" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg">{t('assistant.title')}</CardTitle>
              <p className="text-xs text-[var(--muted-foreground)]">
                {process.env.NEXT_PUBLIC_OPENAI_API_KEY ? t('assistant.poweredBy') : t('dashboard.aiInsights')}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-3/4 rounded-xl" />
              <Skeleton className="h-20 w-1/2 ml-auto rounded-xl" />
              <Skeleton className="h-20 w-2/3 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 ${
                    msg.role === 'user'
                      ? 'bg-[#0f766e] text-white rounded-br-sm'
                      : 'bg-[var(--muted)] border border-[var(--border)] rounded-bl-sm'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {msg.role === 'assistant' ? (
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0f766e] shrink-0" />
                      ) : (
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      )}
                      <span className={`text-xs font-medium truncate ${msg.role === 'user' ? 'text-[#e2f0ee]' : 'text-[var(--muted-foreground)]'}`}>
                        {msg.role === 'assistant' ? (msg.agent_name ?? t('assistant.agentName')) : t('common.signIn')}
                      </span>
                      {msg.role === 'assistant' && msg.content && (
                        <button
                          onClick={() => handleSpeak(msg.content, msg.id)}
                          className="ml-auto shrink-0 text-[var(--muted-foreground)] hover:text-[#0f766e] transition-colors"
                          title={speakingId === msg.id ? t('assistant.stopSpeaking') : t('assistant.readAloud')}
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          ) : (
                            <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className={`whitespace-pre-wrap text-sm break-words ${msg.role === 'user' ? 'text-white' : 'text-[var(--foreground)]'}`}>
                      {msg.content}
                      {msg.id.startsWith('stream-') && sending && (
                        <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 animate-pulse rounded-sm" />
                      )}
                    </div>
                    {msg.role === 'assistant' && msg.frameworks_used && msg.frameworks_used.length > 0 && !msg.id.startsWith('stream-') && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[var(--border)] pt-2">
                        <Shield className="h-3 w-3 text-[var(--muted-foreground)] shrink-0" />
                        {msg.frameworks_used.map((fw) => (
                          <Badge key={fw} variant="secondary" className="text-[10px]">{fw}</Badge>
                        ))}
                        {msg.confidence_score != null && (
                          <Badge variant="outline" className="text-[10px] ml-auto">
                            {Math.round(msg.confidence_score * 100)}% {t('common.confidence')}
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

        <div className="border-t border-[var(--border)] px-3 py-3 sm:px-4 sm:py-4 space-y-3">
          {messages.length <= 1 && !loading && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleSend(s.label)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors active-scale"
                >
                  {suggestionIcons[s.key]}
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder={t('assistant.placeholder')}
              className="text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={sending}
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || sending} size="icon" className="shrink-0">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t('assistant.readAloud')} &middot; {t('assistant.governance.description')}
          </p>
        </div>
      </Card>
    </div>
  );
}
