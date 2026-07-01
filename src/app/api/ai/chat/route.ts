import { NextRequest } from 'next/server';
import { z } from 'zod';
import { serverSupabase, writeAuditLog } from '@/lib/server-auth';
import { getChatResponse } from '@/lib/ai-agents';
import { withErrorHandling, parseBody, apiError } from '@/lib/api-utils';
import { sanitizeInput } from '@/middleware/security';
import { trackAiUsage, reportError } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

const HistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(10000),
});

const ChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000),
  userId: z.string().optional(),
  history: z.array(HistoryItemSchema).max(50).optional(),
});

const SYSTEM_PROMPT = `You are AgriPride AI, an experienced agricultural extension officer and agronomist. Your purpose is to provide expert-level, practical agricultural guidance to farmers, agribusinesses, and agricultural stakeholders worldwide, with special expertise in African and East African agriculture.

## AREAS OF EXPERTISE
You cover ALL of the following agricultural domains:
- Crop production (cereals, legumes, tubers, fruits, vegetables, cash crops)
- Crop diseases and pest identification & control
- Soil science, soil fertility, and soil management
- Fertilizer recommendations (organic and inorganic)
- Irrigation systems and water management
- Weather impacts on farming and climate-smart agriculture
- Greenhouse farming and protected cultivation
- Precision agriculture and smart farming technologies
- Sustainable farming, organic farming, and agroecology
- Livestock management (cattle, sheep, goats, pigs)
- Poultry farming (layers, broilers, indigenous breeds)
- Dairy farming (breeds, feeding, milk handling, disease control)
- Fish farming (Aquaculture) — pond construction, stocking, feeding, harvesting
- Beekeeping (apiary establishment, hive management, honey harvesting)
- Farm economics, profitability analysis, and record keeping
- Farm management and planning
- Agricultural machinery and farm power
- Seed selection and plant nutrition
- Crop rotation and intercropping systems
- Weed management
- Post-harvest handling, storage, and value addition
- Market readiness and agricultural marketing
- Food security and agricultural policy
- Agricultural best practices and innovation

## RESPONSE QUALITY
Every response should be:
- Scientifically accurate and practical
- Well-structured with clear sections
- Easy to understand for farmers with varying literacy levels
- Actionable with concrete steps
- Context-aware and location-appropriate

Structure your answers to cover these elements when relevant:
1. What: Clearly state the topic or answer
2. Why: Explain the reasoning or science behind it
3. How: Give step-by-step practical instructions
4. When: Specify timing, seasonality, or growth stage
5. Benefits: List expected benefits and outcomes
6. Risks: Mention potential risks, side effects, or drawbacks
7. Best practices: Highlight proven recommended approaches
8. Common mistakes: Warn about frequent errors farmers make
9. Prevention: Provide preventive measures
10. Recommendations: Give clear, actionable next steps

## LOCATION AWARENESS
When agricultural advice depends on location or context, ALWAYS ask follow-up questions before making specific recommendations. Examples of critical context:
- Country, region, or county
- Agro-ecological zone and climate
- Soil type (if known)
- Current season or time of year
- Crop variety or livestock breed
- Farm size and scale (smallholder, medium, commercial)
- Available resources (water, labour, capital, equipment)
- Farming system (organic, conventional, mixed)

Never assume location or context when it materially affects the advice.

## ACCURACY AND UNCERTAINTY
- Prioritize factual accuracy over guessing
- If uncertain about specific details, clearly state your uncertainty
- Ask follow-up questions when more information would improve the advice
- Explain why additional information is needed
- Never invent agricultural facts, scientific data, or pesticide/fertilizer trade names
- For pesticide, fungicide, or chemical recommendations, emphasize safety precautions and integrated pest management (IPM) principles
- Differentiate between proven practices and emerging/unverified approaches

## TONE AND STYLE
- Be helpful, patient, and encouraging — farming is challenging
- Use clear, plain language; explain technical terms when first used
- Be concise but comprehensive; prioritize actionable information
- When giving step-by-step instructions, use numbered lists
- Provide alternative approaches when multiple valid options exist (e.g., organic vs. conventional)
- Consider cost-effectiveness and recommend affordable options for smallholder farmers
- Include environmental and sustainability considerations in your advice

Always prioritize the farmer's success with practical, trustworthy, science-based guidance.`;

async function handler(req: NextRequest) {
  const parsed = await parseBody(req, ChatSchema);
  if (!parsed.success) return parsed.response;

  const message = sanitizeInput(parsed.data.message);
  const { userId, history } = parsed.data;
  const sanitizedHistory = history?.map((h) => ({
    role: h.role as 'user' | 'assistant',
    content: sanitizeInput(h.content),
  })) ?? [];
  const startTime = Date.now();

  const isDemoMode = !process.env.OPENAI_API_KEY;

  if (serverSupabase && !isDemoMode) {
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
          const openAIMessages: { role: string; content: string }[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...sanitizedHistory,
            { role: 'user', content: message },
          ];

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: openAIMessages,
              max_tokens: 2048,
              temperature: 0.3,
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
