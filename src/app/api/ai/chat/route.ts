import { NextRequest } from 'next/server';
import { z } from 'zod';
import { serverSupabase, writeAuditLog } from '@/lib/server-auth';
import { getChatResponse, diagnoseDisease, getCropAdvisorAdvice } from '@/lib/ai-agents';
import { withErrorHandling, parseBody, apiError, apiSuccess } from '@/lib/api-utils';
import { sanitizeInput } from '@/middleware/security';
import { trackAiUsage, reportError } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

const ChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000),
  userId: z.string().optional(),
});

async function handler(req: NextRequest) {
  const parsed = await parseBody(req, ChatSchema);
  if (!parsed.success) return parsed.response;

  const message = sanitizeInput(parsed.data.message);
  const { userId } = parsed.data;
  const startTime = Date.now();

  if (serverSupabase) {
    const { data: { session } } = await serverSupabase.auth.getSession();
    if (!session?.user) {
      return apiError(401, 'Unauthorized');
    }

    const { data: consent } = await serverSupabase
      .from('consent_records')
      .select('granted')
      .eq('user_id', session.user.id)
      .eq('type', 'ai_processing')
      .single();
    if (consent && !consent.granted) {
      return apiError(403, 'AI processing not consented');
    }
  }

  await writeAuditLog({
    user_id: userId || 'anonymous',
    action: 'ai_chat',
    resource: 'ai_chat',
    details: { messageLength: message.length },
    ip_address: req.headers.get('x-forwarded-for') || undefined,
  });

  const hasRealAI = !!process.env.OPENAI_API_KEY;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (hasRealAI) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'You are AgriPride AI, a helpful agricultural assistant for small-scale farmers in East Africa. Provide practical, actionable advice about crop farming, pest management, soil health, weather, and sustainable agriculture. Keep responses concise and practical.',
                },
                { role: 'user', content: message },
              ],
              stream: true,
              stream_options: { include_usage: true },
            }),
          });

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            logger.error('OpenAI streaming error', {
              component: 'ai',
              metadata: { status: response.status, error: errorText },
            });
            throw new Error(`OpenAI API error: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response stream');

          const decoder = new TextDecoder();
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
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                  }
                } catch {
                  // skip malformed SSE lines
                }
              }
            }
          }

          const duration = Date.now() - startTime;
          trackAiUsage('chat', duration, true, 'gpt-4o-mini', userId);
        } else {
          const agentResponse = getChatResponse(message);
          const fullResponse = agentResponse.success && agentResponse.data
            ? (agentResponse.data as { response: string }).response
            : 'I am your AgriPride AI assistant for Kenyan agriculture. I can help with planting advice, fertilizer recommendations, pest and disease management, weather information, and sustainability practices for all crops grown in Kenya. What would you like to know?';
          const words = fullResponse.split(' ');

          for (const word of words) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`));
            await new Promise((r) => setTimeout(r, 20 + Math.random() * 20));
          }

          trackAiUsage('chat', Date.now() - startTime, true, 'local-agent', userId);
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        trackAiUsage('chat', Date.now() - startTime, false, hasRealAI ? 'gpt-4o-mini' : 'local-agent', userId);
        await reportError(error, { userId, endpoint: 'ai/chat' });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: 'I apologize, but I encountered an error processing your request. Please try again.' })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Request-Id': crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      'X-Accel-Buffering': 'no',
    },
  });
}

export const POST = withErrorHandling(handler);
