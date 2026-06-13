import { NextRequest } from 'next/server';
import { z } from 'zod';
import { serverSupabase, writeAuditLog } from '@/lib/server-auth';

const MOCK_RESPONSES: Record<string, string> = {
  planting: 'For optimal planting, prepare your soil 2-3 weeks before the rainy season. Ensure the soil temperature reaches 18-22°C for most cereal crops. Plant at a depth of 3-5cm depending on seed size. Maintain proper spacing to allow adequate air circulation and nutrient uptake. Consider using certified disease-free seeds for better germination rates.',
  fertilizer: 'Soil testing is recommended before fertilizer application. For general crop production, apply a balanced NPK fertilizer at a rate appropriate for your specific crop. Organic options include well-decomposed manure at 10 tons per hectare applied 2 weeks before planting. Split nitrogen application improves efficiency and reduces environmental impact.',
  pest: 'Integrated Pest Management (IPM) is the most sustainable approach. Start with preventive measures like crop rotation and resistant varieties. Monitor regularly using traps and visual inspection. Only apply pesticides when thresholds are exceeded, and prefer biological controls such as beneficial insects and neem-based products.',
  disease: 'Early detection is critical for disease management. Remove and destroy infected plant material immediately. Improve air circulation through proper spacing and pruning. Apply appropriate fungicides or bactericides as needed. Practice crop rotation with non-host crops for at least 2-3 seasons.',
  weather: 'Based on current weather patterns, expect variable conditions in the coming days. Monitor local forecasts regularly. Prepare drainage systems if heavy rain is expected. Increase irrigation frequency during dry spells. Consider mulching to retain soil moisture and regulate temperature.',
  sustain: 'Improve your sustainability score by implementing these practices: 1) Rotate crops to maintain soil health and break pest cycles. 2) Use drip irrigation to reduce water consumption by up to 60%. 3) Plant cover crops to prevent erosion and fix nitrogen. 4) Compost crop residues to enrich soil organic matter. 5) Maintain buffer zones near water bodies to protect water quality.',
  general: 'Thank you for your question. I recommend consulting with your local agricultural extension officer for site-specific advice. You can also visit the AgriPride AI Market page for current crop prices, or use the Disease Diagnosis tool for plant health issues. What specific area would you like more information about?',
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('plant') || lower.includes('sow') || lower.includes('seed')) return MOCK_RESPONSES.planting;
  if (lower.includes('fertilizer') || lower.includes('manure') || lower.includes('nutrient')) return MOCK_RESPONSES.fertilizer;
  if (lower.includes('pest') || lower.includes('insect') || lower.includes('bug') || lower.includes('weed')) return MOCK_RESPONSES.pest;
  if (lower.includes('disease') || lower.includes('symptom') || lower.includes('blight') || lower.includes('rust') || lower.includes('mold')) return MOCK_RESPONSES.disease;
  if (lower.includes('weather') || lower.includes('rain') || lower.includes('temperature') || lower.includes('drought') || lower.includes('climate')) return MOCK_RESPONSES.weather;
  if (lower.includes('sustain') || lower.includes('soil') || lower.includes('carbon') || lower.includes('water') || lower.includes('environment')) return MOCK_RESPONSES.sustain;
  return MOCK_RESPONSES.general;
}

const ChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({
      error: parsed.error.issues.map(e => e.message).join(', '),
    }, { status: 400 });
  }

  const { message, userId } = parsed.data;

  if (serverSupabase) {
    const { data: { session } } = await serverSupabase.auth.getSession();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: consent } = await serverSupabase
      .from('consent_records')
      .select('granted')
      .eq('user_id', session.user.id)
      .eq('type', 'ai_processing')
      .single();
    if (consent && !consent.granted) {
      return Response.json({ error: 'AI processing not consented' }, { status: 403 });
    }
  }

  writeAuditLog({
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
                { role: 'system', content: 'You are AgriPride AI, a helpful agricultural assistant for small-scale farmers in East Africa. Provide practical, actionable advice about crop farming, pest management, soil health, weather, and sustainable agriculture. Keep responses concise and practical.' },
                { role: 'user', content: message },
              ],
              stream: true,
            }),
          });

          if (!response.ok) throw new Error('OpenAI API error');

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
                } catch {}
              }
            }
          }
        } else {
          const fullResponse = getMockResponse(message);
          const words = fullResponse.split(' ');

          for (const word of words) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`));
            await new Promise((r) => setTimeout(r, 40 + Math.random() * 30));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: 'I apologize, but I encountered an error processing your request. Please try again.' })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
