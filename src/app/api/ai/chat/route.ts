import { NextRequest } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
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

const GEMINI_MODEL = 'gemini-2.0-flash';

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
- Crop variety
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

  const isDemoMode = !process.env.GEMINI_API_KEY;

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

  const hasRealAI = !!process.env.GEMINI_API_KEY;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (hasRealAI) {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

          const geminiContents: { role: string; parts: { text: string }[] }[] = [];
          for (const h of sanitizedHistory) {
            geminiContents.push({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.content }],
            });
          }
          geminiContents.push({
            role: 'user',
            parts: [{ text: message }],
          });

          const response = await ai.models.generateContentStream({
            model: GEMINI_MODEL,
            contents: geminiContents,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              maxOutputTokens: 2048,
              temperature: 0.3,
            },
          });

          for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }

          const duration = Date.now() - startTime;
          trackAiUsage('chat', duration, true, GEMINI_MODEL, userId);
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
        trackAiUsage('chat', Date.now() - startTime, false, hasRealAI ? GEMINI_MODEL : 'local-agent', userId);
        await reportError(error, { userId, endpoint: 'ai/chat' });
        const errDetail = error as { status?: number; message?: string; name?: string };
        const httpStatus = errDetail.status ?? 0;
        const errorName = errDetail.name ?? 'UnknownError';
        const msg = errDetail.message ?? String(error);
        logger.error('[ai/chat] Gemini streaming error', {
          component: 'ai',
          metadata: {
            httpStatus,
            errorName,
            message: msg.substring(0, 300),
            model: GEMINI_MODEL,
          },
        });
        let userMessage = 'I apologize, but I encountered an error processing your request. Please try again.';
        if (httpStatus === 429) {
          userMessage = 'The AI service is temporarily busy. Please wait a moment and try again.';
        } else if (httpStatus === 401 || httpStatus === 403) {
          userMessage = 'The AI service is not properly configured. Please contact support.';
        } else if (errorName === 'AbortError' || msg.includes('timeout')) {
          userMessage = 'The AI service took too long to respond. Please try again.';
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: userMessage })}\n\n`));
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
